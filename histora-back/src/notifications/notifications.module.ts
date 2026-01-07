import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { Notification, NotificationSchema } from './schema/notification.schema';
import { NotificationPreferences, NotificationPreferencesSchema } from './schema/notification-preferences.schema';
import { Appointment, AppointmentSchema } from '../appointments/schema/appointment.schema';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { PushProvider } from './providers/push.provider';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationPreferences.name, schema: NotificationPreferencesSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ReminderSchedulerService,
    EmailProvider,
    SmsProvider,
    WhatsAppProvider,
    PushProvider,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
