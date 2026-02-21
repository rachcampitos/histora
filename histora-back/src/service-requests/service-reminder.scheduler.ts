import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceRequest } from './schema/service-request.schema';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationChannel,
} from '../notifications/schema/notification.schema';

@Injectable()
export class ServiceReminderScheduler {
  private readonly logger = new Logger(ServiceReminderScheduler.name);

  constructor(
    @InjectModel(ServiceRequest.name)
    private serviceRequestModel: Model<ServiceRequest>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Run every hour - check for services scheduled in the next 24 hours
   * Send reminders for accepted services happening tomorrow
   */
  @Cron('0 * * * *') // Every hour at :00
  async sendServiceReminders(): Promise<void> {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    try {
      // Find accepted services scheduled between 23-24 hours from now
      // This ensures we send the reminder ~24h before, once per service
      const upcomingRequests = await this.serviceRequestModel
        .find({
          status: 'accepted',
          requestedDate: { $gte: in23h, $lte: in24h },
        })
        .populate('nurseId', 'user')
        .lean();

      if (upcomingRequests.length === 0) return;

      this.logger.log(
        `Found ${upcomingRequests.length} upcoming services for reminders`,
      );

      for (const request of upcomingRequests) {
        const nurseDoc = request.nurseId as any;
        const nurseName = nurseDoc?.user
          ? `${nurseDoc.user.firstName} ${nurseDoc.user.lastName}`
          : 'tu enfermera';

        const requestedDate = new Date(request.requestedDate);
        const timeStr = requestedDate.toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
        });

        // Notify patient
        await this.notificationsService
          .send({
            userId: request.patientId.toString(),
            type: NotificationType.SERVICE_REMINDER,
            channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
            title: 'Recordatorio de servicio',
            message: `Tu servicio con ${nurseName} es manana a las ${timeStr}. Recuerda tener lista la direccion y acceso.`,
            data: {
              requestId: (request as any)._id.toString(),
              nurseName,
            },
          })
          .catch((err) =>
            this.logger.error(
              `Failed to send reminder for request ${(request as any)._id}: ${err.message}`,
            ),
          );
      }

      this.logger.log(`Sent ${upcomingRequests.length} service reminders`);
    } catch (error) {
      this.logger.error(`Error sending service reminders: ${error.message}`);
    }
  }
}
