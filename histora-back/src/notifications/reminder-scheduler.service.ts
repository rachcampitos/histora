import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment } from '../appointments/schema/appointment.schema';
import { NotificationsService } from './notifications.service';
import { NotificationType, NotificationChannel } from './schema/notification.schema';

@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Runs every hour to send 24-hour reminders
   * Checks for appointments between 23-25 hours from now
   */
  @Cron(CronExpression.EVERY_HOUR)
  async send24HourReminders(): Promise<void> {
    this.logger.log('Running 24-hour reminder job...');

    const now = new Date();
    const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    try {
      const appointments = await this.appointmentModel
        .find({
          scheduledDate: { $gte: in23Hours, $lte: in25Hours },
          status: { $in: ['scheduled', 'confirmed'] },
          'reminders.sent24h': { $ne: true },
        })
        .populate('patientId', 'firstName lastName email phone')
        .populate('doctorId', 'firstName lastName specialty')
        .exec();

      this.logger.log(`Found ${appointments.length} appointments for 24h reminder`);

      for (const appointment of appointments) {
        try {
          await this.sendAppointmentReminder(appointment, '24h');

          // Mark as sent
          await this.appointmentModel.updateOne(
            { _id: appointment._id },
            { $set: { 'reminders.sent24h': true, 'reminders.sent24hAt': new Date() } },
          );
        } catch (error) {
          this.logger.error(`Failed to send 24h reminder for appointment ${appointment._id}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error in 24-hour reminder job:', error);
    }
  }

  /**
   * Runs every 15 minutes to send 1-hour reminders
   * Checks for appointments between 45-75 minutes from now
   */
  @Cron('*/15 * * * *') // Every 15 minutes
  async send1HourReminders(): Promise<void> {
    this.logger.log('Running 1-hour reminder job...');

    const now = new Date();
    const in45Minutes = new Date(now.getTime() + 45 * 60 * 1000);
    const in75Minutes = new Date(now.getTime() + 75 * 60 * 1000);

    try {
      const appointments = await this.appointmentModel
        .find({
          scheduledDate: { $gte: in45Minutes, $lte: in75Minutes },
          status: { $in: ['scheduled', 'confirmed'] },
          'reminders.sent1h': { $ne: true },
        })
        .populate('patientId', 'firstName lastName email phone')
        .populate('doctorId', 'firstName lastName specialty')
        .exec();

      this.logger.log(`Found ${appointments.length} appointments for 1h reminder`);

      for (const appointment of appointments) {
        try {
          await this.sendAppointmentReminder(appointment, '1h');

          // Mark as sent
          await this.appointmentModel.updateOne(
            { _id: appointment._id },
            { $set: { 'reminders.sent1h': true, 'reminders.sent1hAt': new Date() } },
          );
        } catch (error) {
          this.logger.error(`Failed to send 1h reminder for appointment ${appointment._id}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error in 1-hour reminder job:', error);
    }
  }

  /**
   * Send appointment reminder to patient
   */
  private async sendAppointmentReminder(appointment: any, type: '24h' | '1h'): Promise<void> {
    const patient = appointment.patientId;
    const doctor = appointment.doctorId;

    if (!patient || !doctor) {
      this.logger.warn(`Missing patient or doctor for appointment ${appointment._id}`);
      return;
    }

    const scheduledDate = new Date(appointment.scheduledDate);
    const dateStr = scheduledDate.toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const timeUntil = type === '24h' ? 'mañana' : 'en 1 hora';
    const title = `Recordatorio de Cita - ${timeUntil}`;

    const message = `
Hola ${patient.firstName},

Te recordamos que tienes una cita médica programada:

📅 Fecha: ${dateStr}
⏰ Hora: ${appointment.startTime}
👨‍⚕️ Médico: Dr. ${doctor.firstName} ${doctor.lastName}
📋 Especialidad: ${doctor.specialty || 'Medicina General'}
${appointment.reasonForVisit ? `📝 Motivo: ${appointment.reasonForVisit}` : ''}

Por favor, llega 10 minutos antes de tu cita.

Si necesitas cancelar o reprogramar, hazlo con al menos 2 horas de anticipación.

Saludos,
Equipo Histora
    `.trim();

    // Send email notification
    if (patient.email) {
      await this.notificationsService.send({
        userId: patient.userId || patient._id,
        type: NotificationType.APPOINTMENT_REMINDER,
        title,
        message,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        data: {
          appointmentId: appointment._id,
          reminderType: type,
        },
      });
    }

    // Send WhatsApp notification (if configured and patient has phone)
    if (patient.phone) {
      try {
        await this.notificationsService.send({
          userId: patient.userId || patient._id,
          type: NotificationType.APPOINTMENT_REMINDER,
          title,
          message: this.formatWhatsAppMessage(patient, doctor, appointment, type),
          channels: [NotificationChannel.WHATSAPP],
          data: {
            appointmentId: appointment._id,
            reminderType: type,
            phone: patient.phone,
          },
        });
      } catch (error) {
        // WhatsApp might not be configured, log but don't fail
        this.logger.warn(`WhatsApp reminder failed for ${patient.phone}:`, error);
      }
    }

    this.logger.log(`Sent ${type} reminder for appointment ${appointment._id} to ${patient.email || patient.phone}`);
  }

  /**
   * Format message for WhatsApp (shorter, with emojis)
   */
  private formatWhatsAppMessage(patient: any, doctor: any, appointment: any, type: '24h' | '1h'): string {
    const scheduledDate = new Date(appointment.scheduledDate);
    const dateStr = scheduledDate.toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const timeUntil = type === '24h' ? '⏰ *Mañana*' : '⚠️ *En 1 hora*';

    return `
${timeUntil}

Hola ${patient.firstName}, te recordamos tu cita:

📅 ${dateStr}
🕐 ${appointment.startTime}
👨‍⚕️ Dr. ${doctor.firstName} ${doctor.lastName}
📋 ${doctor.specialty || 'Medicina General'}

Por favor, llega 10 minutos antes.

_Responde "menu" para más opciones._
    `.trim();
  }
}
