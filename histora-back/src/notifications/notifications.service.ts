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
import { DeviceToken, DeviceTokenDocument } from './schema/device-token.schema';
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
    @InjectModel(DeviceToken.name) private deviceTokenModel: Model<DeviceTokenDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailProvider: EmailProvider,
    private smsProvider: SmsProvider,
    private whatsappProvider: WhatsAppProvider,
    private pushProvider: PushProvider,
  ) {}

  // Send notification
  async send(dto: SendNotificationDto): Promise<Notification[]> {
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
  async sendBulk(dto: SendBulkNotificationDto): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of dto.userIds) {
      try {
        await this.send({ ...dto, userId });
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
    data?: Record<string, any>;
    scheduledFor?: Date;
    serviceRequestId?: string;
  }): Promise<NotificationDocument> {
    const recipient = await this.getRecipientForChannel(data.userId, data.channel);

    return this.notificationModel.create({
      userId: new Types.ObjectId(data.userId),
      type: data.type,
      channel: data.channel,
      status: NotificationStatus.PENDING,
      title: data.title,
      message: data.message,
      recipient,
      data: data.data,
      scheduledFor: data.scheduledFor,
      serviceRequestId: data.serviceRequestId ? new Types.ObjectId(data.serviceRequestId) : undefined,
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
      [NotificationType.PAYMENT_RECEIVED]: 'paymentNotifications',
      [NotificationType.PAYMENT_REMINDER]: 'paymentNotifications',
      [NotificationType.SERVICE_REQUEST_ACCEPTED]: 'serviceNotifications',
      [NotificationType.SERVICE_REQUEST_REJECTED]: 'serviceNotifications',
      [NotificationType.SERVICE_COMPLETED]: 'serviceNotifications',
      [NotificationType.NURSE_ON_THE_WAY]: 'serviceNotifications',
      [NotificationType.NURSE_ARRIVED]: 'serviceNotifications',
    };

    const prefKey = typeMap[type];
    if (prefKey && preferences[prefKey]) {
      const pref = preferences[prefKey] as { enabled: boolean; channels: NotificationChannel[] };
      if (pref.enabled && pref.channels) {
        return pref.channels;
      }
    }

    // Default: in-app and push for service notifications
    return [NotificationChannel.IN_APP, NotificationChannel.PUSH];
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

  // Send welcome notification
  async sendWelcomeNotification(user: {
    id: string;
    email: string;
    firstName: string;
  }): Promise<void> {
    await this.send({
      userId: user.id,
      type: NotificationType.WELCOME,
      title: 'Bienvenido a Histora Care',
      message: this.emailProvider.getWelcomeTemplate({
        userName: user.firstName,
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
  // ADMIN NOTIFICATIONS
  // =====================

  // Get all platform admin users
  private async getPlatformAdmins(): Promise<UserDocument[]> {
    return this.userModel.find({
      role: UserRole.PLATFORM_ADMIN,
      isActive: true,
    });
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

  // Notify admins when a new nurse registers (NurseLite)
  async notifyAdminNewNurseRegistered(nurse: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    cepNumber: string;
  }): Promise<void> {
    const admins = await this.getPlatformAdmins();

    for (const admin of admins) {
      await this.send({
        userId: admin._id.toString(),
        type: NotificationType.NEW_NURSE_REGISTERED,
        title: 'Nueva Enfermera Registrada - NurseLite',
        message: `${nurse.firstName} ${nurse.lastName} (${nurse.email}) se ha registrado como enfermera con CEP: ${nurse.cepNumber}.`,
        data: {
          userId: nurse.id,
          email: nurse.email,
          name: `${nurse.firstName} ${nurse.lastName}`,
          cepNumber: nurse.cepNumber,
        },
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    }

    this.logger.log(`Notified ${admins.length} admin(s) about new nurse: ${nurse.email}`);
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

  // Notify nurse when patient cancels a service request
  async notifyNurseServiceCancelled(request: {
    requestId: string;
    nurseUserId: string;
    patientName: string;
    serviceName: string;
    reason?: string;
  }): Promise<void> {
    const reasonText = request.reason
      ? ` Motivo: ${request.reason}`
      : '';

    await this.send({
      userId: request.nurseUserId,
      type: NotificationType.SERVICE_REQUEST_CANCELLED,
      title: 'Solicitud Cancelada',
      message: `${request.patientName} ha cancelado la solicitud de ${request.serviceName}.${reasonText}`,
      data: { requestId: request.requestId, reason: request.reason },
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    });
  }

  // Notify nurse when patient leaves a review
  async notifyNurseNewReview(review: {
    requestId: string;
    nurseUserId: string;
    patientName: string;
    rating: number;
    comment?: string;
    serviceName: string;
  }): Promise<void> {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    await this.send({
      userId: review.nurseUserId,
      type: NotificationType.NEW_NURSE_REVIEW,
      title: 'Nueva Reseña de Paciente',
      message: `${review.patientName} te ha dejado una reseña por el servicio de ${review.serviceName}: ${stars}${review.comment ? ` - "${review.comment}"` : ''}`,
      data: { requestId: review.requestId, rating: review.rating },
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    });
  }

  // ==================== Device Token Management ====================

  /**
   * Register a device token for push notifications
   */
  async registerDevice(
    userId: string,
    token: string,
    platform?: string,
    deviceInfo?: Record<string, any>,
  ): Promise<DeviceToken> {
    const platformValue = (platform || 'android') as 'ios' | 'android' | 'web';

    const existing = await this.deviceTokenModel.findOne({
      userId: new Types.ObjectId(userId),
      token,
    });

    if (existing) {
      existing.isActive = true;
      existing.lastUsedAt = new Date();
      existing.platform = platformValue;
      existing.deviceInfo = deviceInfo;
      return existing.save();
    }

    return this.deviceTokenModel.create({
      userId: new Types.ObjectId(userId),
      token,
      platform: platformValue,
      deviceInfo,
      isActive: true,
      lastUsedAt: new Date(),
    });
  }

  /**
   * Unregister a device token
   */
  async unregisterDevice(userId: string, token: string): Promise<void> {
    await this.deviceTokenModel.updateOne(
      { userId: new Types.ObjectId(userId), token },
      { isActive: false },
    );
  }

  /**
   * Get active device tokens for a user
   */
  async getActiveDeviceTokens(userId: string): Promise<DeviceToken[]> {
    return this.deviceTokenModel.find({
      userId: new Types.ObjectId(userId),
      isActive: true,
    });
  }
}
