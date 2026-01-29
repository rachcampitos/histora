import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationQueueService } from './notification-queue.service';
import { Notification, NotificationSchema } from './schema/notification.schema';
import { NotificationPreferences, NotificationPreferencesSchema } from './schema/notification-preferences.schema';
import { DeviceToken, DeviceTokenSchema } from './schema/device-token.schema';
import { User, UserSchema } from '../users/schema/user.schema';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { PushProvider } from './providers/push.provider';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationPreferences.name, schema: NotificationPreferencesSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationQueueService,
    EmailProvider,
    SmsProvider,
    WhatsAppProvider,
    PushProvider,
  ],
  exports: [NotificationsService, NotificationQueueService],
})
export class NotificationsModule {}
