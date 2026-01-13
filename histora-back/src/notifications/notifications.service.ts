import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from './schema/notification.schema';
import {
  NotificationPreferences,
  NotificationPreferencesDocument,
} from './schema/notification-preferences.schema';
import { User, UserDocument, UserRole } from '../users/schema/user.schema';
import { SendNotificationDto, SendBulkNotificationDto } from './dto/send-notification.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { PushProvider } from './providers/push.provider';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationPreferences.name) private preferencesModel: Model<NotificationPreferencesDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailProvider: EmailProvider,
    private smsProvider: SmsProvider,
    private whatsappProvider: WhatsAppProvider,
    private pushProvider: PushProvider,
  ) {}

  // Send notification
  async send(dto: SendNotificationDto, clinicId?: string): Promise<Notification[]> {
    const preferences = await this.getOrCreatePreferences(dto.userId);
    const channels = dto.channels || this.getDefaultChannels(dto.type, preferences);
    const notifications: Notification[] = [];

    for (const channel of channels) {
      if (!this.isChannelEnabled(channel, preferences)) {
        this.logger.log(`Channel ${channel} disabled for user ${dto.userId}`);
        continue;
      }

      const notification = await this.createNotification({
        ...dto,
        channel,
        clinicId,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      });

      notifications.push(notification);

      // Send immediately if not scheduled
      if (!dto.scheduledFor) {
        await this.processNotification(notification);
      }
    }

    return notifications;
  }

  // Send bulk notifications
  async sendBulk(dto: SendBulkNotificationDto, clinicId?: string): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of dto.userIds) {
      try {
        await this.send({ ...dto, userId }, clinicId);
        sent++;
      } catch (error) {
        this.logger.error(`Failed to send to ${userId}: ${error.message}`);
        failed++;
      }
    }

    return { sent, failed };
  }

  // Process a single notification
  private async processNotification(notification: NotificationDocument): Promise<void> {
    try {
      let result: { success: boolean; messageId?: string; error?: string };

      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          result = await this.emailProvider.send({
            to: notification.recipient,
            subject: notification.title,
            html: notification.message,
          });
          break;

        case NotificationChannel.SMS:
          result = await this.smsProvider.send({
            to: notification.recipient,
            message: `${notification.title}: ${notification.message}`,
          });
          break;

        case NotificationChannel.WHATSAPP:
          result = await this.whatsappProvider.send({
            to: this.whatsappProvider.formatPhoneNumber(notification.recipient),
            message: `*${notification.title}*\n\n${notification.message}`,
          });
          break;

        case NotificationChannel.PUSH:
          result = await this.pushProvider.send({
            token: notification.recipient,
            title: notification.title,
            body: notification.message,
            data: notification.data as Record<string, string>,
          });
          break;

        case NotificationChannel.IN_APP:
          // In-app notifications are stored in DB, no external sending
          result = { success: true, messageId: (notification._id as Types.ObjectId).toString() };
          break;

        default:
          result = { success: false, error: 'Unknown channel' };
      }

      if (result.success) {
        notification.status = NotificationStatus.SENT;
        notification.sentAt = new Date();
      } else {
        notification.status = NotificationStatus.FAILED;
        notification.errorMessage = result.error;
        notification.retryCount++;
      }

      await notification.save();
    } catch (error) {
      notification.status = NotificationStatus.FAILED;
      notification.errorMessage = error.message;
      notification.retryCount++;
      await notification.save();
    }
  }

  // Create notification record
  private async createNotification(data: {
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    message: string;
    clinicId?: string;
    data?: Record<string, any>;
    scheduledFor?: Date;
    appointmentId?: string;
    consultationId?: string;
  }): Promise<NotificationDocument> {
    const recipient = await this.getRecipientForChannel(data.userId, data.channel);

    return this.notificationModel.create({
      userId: new Types.ObjectId(data.userId),
      clinicId: data.clinicId ? new Types.ObjectId(data.clinicId) : undefined,
      type: data.type,
      channel: data.channel,
      status: data.scheduledFor ? NotificationStatus.PENDING : NotificationStatus.PENDING,
      title: data.title,
      message: data.message,
      recipient,
      data: data.data,
      scheduledFor: data.scheduledFor,
      appointmentId: data.appointmentId ? new Types.ObjectId(data.appointmentId) : undefined,
      consultationId: data.consultationId ? new Types.ObjectId(data.consultationId) : undefined,
    });
  }

  // Get recipient address for channel
  private async getRecipientForChannel(userId: string, channel: NotificationChannel): Promise<string> {
    const preferences = await this.getOrCreatePreferences(userId);

    switch (channel) {
      case NotificationChannel.EMAIL:
        return preferences.email?.value || '';
      case NotificationChannel.SMS:
        return preferences.sms?.value || '';
      case NotificationChannel.WHATSAPP:
        return preferences.whatsapp?.value || preferences.sms?.value || '';
      case NotificationChannel.PUSH:
        return preferences.push?.value || '';
      default:
        return '';
    }
  }

  // Get default channels for notification type
  private getDefaultChannels(type: NotificationType, preferences: NotificationPreferencesDocument): NotificationChannel[] {
    const typeMap: Record<string, keyof NotificationPreferencesDocument> = {
      [NotificationType.APPOINTMENT_REMINDER]: 'appointmentReminders',
      [NotificationType.APPOINTMENT_CONFIRMATION]: 'appointmentConfirmations',
      [NotificationType.APPOINTMENT_CANCELLED]: 'appointmentCancellations',
      [NotificationType.CONSULTATION_COMPLETED]: 'consultationUpdates',
      [NotificationType.LAB_RESULTS_READY]: 'labResults',
      [NotificationType.PAYMENT_RECEIVED]: 'paymentNotifications',
      [NotificationType.PAYMENT_REMINDER]: 'paymentNotifications',
    };

    const prefKey = typeMap[type];
    if (prefKey && preferences[prefKey]) {
      const pref = preferences[prefKey] as { enabled: boolean; channels: NotificationChannel[] };
      if (pref.enabled && pref.channels) {
        return pref.channels;
      }
    }

    // Default: email and in-app
    return [NotificationChannel.EMAIL, NotificationChannel.IN_APP];
  }

  // Check if channel is enabled
  private isChannelEnabled(channel: NotificationChannel, preferences: NotificationPreferencesDocument): boolean {
    const channelMap: Record<NotificationChannel, keyof NotificationPreferencesDocument> = {
      [NotificationChannel.EMAIL]: 'email',
      [NotificationChannel.SMS]: 'sms',
      [NotificationChannel.WHATSAPP]: 'whatsapp',
      [NotificationChannel.PUSH]: 'push',
      [NotificationChannel.IN_APP]: 'inApp',
    };

    const pref = preferences[channelMap[channel]] as { enabled: boolean } | undefined;
    return pref?.enabled ?? true;
  }

  // Get or create preferences
  async getOrCreatePreferences(userId: string): Promise<NotificationPreferencesDocument> {
    let preferences = await this.preferencesModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!preferences) {
      preferences = await this.preferencesModel.create({
        userId: new Types.ObjectId(userId),
      });
    }

    return preferences;
  }

  // Update preferences
  async updatePreferences(userId: string, dto: UpdateNotificationPreferencesDto): Promise<NotificationPreferences> {
    const preferences = await this.getOrCreatePreferences(userId);
    Object.assign(preferences, dto);
    return preferences.save();
  }

  // Get user notifications (in-app)
  async getUserNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ): Promise<{ data: Notification[]; total: number }> {
    const { limit = 20, offset = 0, unreadOnly = false } = options;

    const query: any = {
      userId: new Types.ObjectId(userId),
      channel: NotificationChannel.IN_APP,
    };

    if (unreadOnly) {
      query.readAt = null;
    }

    const [data, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(query),
    ]);

    return { data, total };
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();
    return notification.save();
  }

  // Mark all as read
  async markAllAsRead(userId: string): Promise<{ modified: number }> {
    const result = await this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        channel: NotificationChannel.IN_APP,
        readAt: null,
      },
      {
        $set: {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      }
    );

    return { modified: result.modifiedCount };
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      channel: NotificationChannel.IN_APP,
      readAt: null,
    });
  }

  // Register device for push notifications
  async registerDevice(userId: string, deviceToken: string, platform?: string): Promise<NotificationPreferences> {
    const preferences = await this.getOrCreatePreferences(userId);
    preferences.push = { enabled: true, value: deviceToken };
    return preferences.save();
  }

  // Send appointment reminder
  async sendAppointmentReminder(appointment: {
    id: string;
    patientId: string;
    patientName: string;
    patientUserId?: string;
    doctorName: string;
    date: string;
    time: string;
    clinicId: string;
    clinicName: string;
  }): Promise<void> {
    if (!appointment.patientUserId) {
      this.logger.warn(`Patient ${appointment.patientId} has no user account, skipping notification`);
      return;
    }

    await this.send({
      userId: appointment.patientUserId,
      type: NotificationType.APPOINTMENT_REMINDER,
      title: 'Recordatorio de Cita',
      message: this.emailProvider.getAppointmentReminderTemplate({
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        date: appointment.date,
        time: appointment.time,
        clinicName: appointment.clinicName,
      }),
      data: { appointmentId: appointment.id },
      appointmentId: appointment.id,
    }, appointment.clinicId);
  }

  // Send appointment confirmation
  async sendAppointmentConfirmation(appointment: {
    id: string;
    patientUserId: string;
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    clinicId: string;
    clinicName: string;
  }): Promise<void> {
    await this.send({
      userId: appointment.patientUserId,
      type: NotificationType.APPOINTMENT_CONFIRMATION,
      title: 'Cita Confirmada',
      message: this.emailProvider.getAppointmentConfirmationTemplate({
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        date: appointment.date,
        time: appointment.time,
        clinicName: appointment.clinicName,
      }),
      data: { appointmentId: appointment.id },
      appointmentId: appointment.id,
    }, appointment.clinicId);
  }

  // Send welcome notification
  async sendWelcomeNotification(user: {
    id: string;
    email: string;
    firstName: string;
    clinicName?: string;
  }): Promise<void> {
    await this.send({
      userId: user.id,
      type: NotificationType.WELCOME,
      title: 'Bienvenido a Histora',
      message: this.emailProvider.getWelcomeTemplate({
        userName: user.firstName,
        clinicName: user.clinicName,
      }),
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    });
  }

  // Process scheduled notifications (call this from a cron job)
  async processScheduledNotifications(): Promise<{ processed: number; failed: number }> {
    const now = new Date();
    const scheduled = await this.notificationModel.find({
      status: NotificationStatus.PENDING,
      scheduledFor: { $lte: now },
    });

    let processed = 0;
    let failed = 0;

    for (const notification of scheduled) {
      try {
        await this.processNotification(notification);
        processed++;
      } catch (error) {
        this.logger.error(`Failed to process scheduled notification ${notification._id}: ${error.message}`);
        failed++;
      }
    }

    return { processed, failed };
  }

  // =====================
  // DOCTOR NOTIFICATIONS
  // =====================

  // Notify doctor when a patient books an appointment
  async notifyDoctorNewAppointment(appointment: {
    id: string;
    doctorUserId: string;
    patientName: string;
    date: string;
    time: string;
    clinicId: string;
    reason?: string;
  }): Promise<void> {
    await this.send({
      userId: appointment.doctorUserId,
      type: NotificationType.NEW_APPOINTMENT_BOOKED,
      title: 'Nueva Cita Agendada',
      message: `${appointment.patientName} ha agendado una cita para el ${appointment.date} a las ${appointment.time}.${appointment.reason ? ` Motivo: ${appointment.reason}` : ''}`,
      data: { appointmentId: appointment.id },
      appointmentId: appointment.id,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    }, appointment.clinicId);
  }

  // Notify doctor when a patient cancels an appointment
  async notifyDoctorAppointmentCancelled(appointment: {
    id: string;
    doctorUserId: string;
    patientName: string;
    date: string;
    time: string;
    clinicId: string;
    reason?: string;
  }): Promise<void> {
    await this.send({
      userId: appointment.doctorUserId,
      type: NotificationType.APPOINTMENT_CANCELLED_BY_PATIENT,
      title: 'Cita Cancelada',
      message: `${appointment.patientName} ha cancelado la cita del ${appointment.date} a las ${appointment.time}.${appointment.reason ? ` Motivo: ${appointment.reason}` : ''}`,
      data: { appointmentId: appointment.id },
      appointmentId: appointment.id,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    }, appointment.clinicId);
  }

  // Notify doctor of upcoming appointment
  async notifyDoctorUpcomingAppointment(appointment: {
    id: string;
    doctorUserId: string;
    patientName: string;
    date: string;
    time: string;
    clinicId: string;
    minutesBefore: number;
  }): Promise<void> {
    const timeText = appointment.minutesBefore >= 60
      ? `${Math.floor(appointment.minutesBefore / 60)} hora(s)`
      : `${appointment.minutesBefore} minutos`;

    await this.send({
      userId: appointment.doctorUserId,
      type: NotificationType.UPCOMING_APPOINTMENT_REMINDER,
      title: 'Recordatorio de Cita',
      message: `Tiene una cita con ${appointment.patientName} en ${timeText} (${appointment.time}).`,
      data: { appointmentId: appointment.id },
      appointmentId: appointment.id,
      channels: [NotificationChannel.IN_APP],
    }, appointment.clinicId);
  }

  // Notify doctor when a patient leaves a review
  async notifyDoctorNewReview(review: {
    doctorUserId: string;
    patientName: string;
    rating: number;
    comment?: string;
    clinicId?: string;
  }): Promise<void> {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    await this.send({
      userId: review.doctorUserId,
      type: NotificationType.NEW_PATIENT_REVIEW,
      title: 'Nueva Reseña de Paciente',
      message: `${review.patientName} te ha dejado una reseña: ${stars}${review.comment ? ` - "${review.comment}"` : ''}`,
      channels: [NotificationChannel.IN_APP],
    }, review.clinicId);
  }

  // =====================
  // ADMIN NOTIFICATIONS
  // =====================

  // Get all platform admin users
  private async getPlatformAdmins(): Promise<UserDocument[]> {
    return this.userModel.find({
      role: UserRole.PLATFORM_ADMIN,
      isActive: true,
    });
  }

  // Notify admins when a new doctor (clinic owner) registers
  async notifyAdminNewDoctorRegistered(doctor: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    clinicName: string;
  }): Promise<void> {
    const admins = await this.getPlatformAdmins();

    for (const admin of admins) {
      await this.send({
        userId: admin._id.toString(),
        type: NotificationType.NEW_DOCTOR_REGISTERED,
        title: 'Nuevo Médico Registrado',
        message: `${doctor.firstName} ${doctor.lastName} (${doctor.email}) se ha registrado como médico y creado el consultorio "${doctor.clinicName}".`,
        data: {
          userId: doctor.id,
          email: doctor.email,
          name: `${doctor.firstName} ${doctor.lastName}`,
          clinicName: doctor.clinicName,
        },
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    }

    this.logger.log(`Notified ${admins.length} admin(s) about new doctor: ${doctor.email}`);
  }

  // Notify admins when a new patient registers
  async notifyAdminNewPatientRegistered(patient: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<void> {
    const admins = await this.getPlatformAdmins();

    for (const admin of admins) {
      await this.send({
        userId: admin._id.toString(),
        type: NotificationType.NEW_PATIENT_REGISTERED,
        title: 'Nuevo Paciente Registrado',
        message: `${patient.firstName} ${patient.lastName} (${patient.email}) se ha registrado como paciente.`,
        data: {
          userId: patient.id,
          email: patient.email,
          name: `${patient.firstName} ${patient.lastName}`,
        },
        channels: [NotificationChannel.IN_APP],
      });
    }

    this.logger.log(`Notified ${admins.length} admin(s) about new patient: ${patient.email}`);
  }

  // =====================
  // SERVICE REQUEST NOTIFICATIONS (Histora Care)
  // =====================

  // Notify patient when nurse accepts their service request
  async notifyPatientServiceAccepted(request: {
    requestId: string;
    patientUserId: string;
    patientName: string;
    nurseName: string;
    serviceName: string;
    requestedDate: string;
    requestedTime: string;
  }): Promise<void> {
    await this.send({
      userId: request.patientUserId,
      type: NotificationType.SERVICE_REQUEST_ACCEPTED,
      title: 'Solicitud Aceptada',
      message: `${request.nurseName} ha aceptado tu solicitud de ${request.serviceName} para el ${request.requestedDate} a las ${request.requestedTime}. Te contactará pronto.`,
      data: { requestId: request.requestId },
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    });
  }

  // Notify patient when nurse rejects their service request
  async notifyPatientServiceRejected(request: {
    requestId: string;
    patientUserId: string;
    patientName: string;
    nurseName: string;
    serviceName: string;
    reason?: string;
  }): Promise<void> {
    const reasonText = request.reason
      ? ` Motivo: ${request.reason}`
      : '';

    await this.send({
      userId: request.patientUserId,
      type: NotificationType.SERVICE_REQUEST_REJECTED,
      title: 'Solicitud No Disponible',
      message: `Lamentablemente, ${request.nurseName} no puede atender tu solicitud de ${request.serviceName} en este momento.${reasonText} Te invitamos a buscar otro profesional disponible.`,
      data: { requestId: request.requestId, reason: request.reason },
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    });
  }

  // Notify patient when nurse is on the way
  async notifyPatientNurseOnTheWay(request: {
    requestId: string;
    patientUserId: string;
    nurseName: string;
    estimatedMinutes?: number;
  }): Promise<void> {
    const etaText = request.estimatedMinutes
      ? ` Tiempo estimado de llegada: ${request.estimatedMinutes} minutos.`
      : '';

    await this.send({
      userId: request.patientUserId,
      type: NotificationType.NURSE_ON_THE_WAY,
      title: 'Enfermera en Camino',
      message: `${request.nurseName} está en camino a tu ubicación.${etaText}`,
      data: { requestId: request.requestId },
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    });
  }

  // Notify patient when nurse arrives
  async notifyPatientNurseArrived(request: {
    requestId: string;
    patientUserId: string;
    nurseName: string;
  }): Promise<void> {
    await this.send({
      userId: request.patientUserId,
      type: NotificationType.NURSE_ARRIVED,
      title: 'Enfermera ha Llegado',
      message: `${request.nurseName} ha llegado a tu ubicación.`,
      data: { requestId: request.requestId },
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    });
  }

  // Notify patient when service is completed
  async notifyPatientServiceCompleted(request: {
    requestId: string;
    patientUserId: string;
    nurseName: string;
    serviceName: string;
  }): Promise<void> {
    await this.send({
      userId: request.patientUserId,
      type: NotificationType.SERVICE_COMPLETED,
      title: 'Servicio Completado',
      message: `${request.nurseName} ha completado el servicio de ${request.serviceName}. ¡Gracias por confiar en nosotros! Por favor, califica tu experiencia.`,
      data: { requestId: request.requestId },
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    });
  }
}
