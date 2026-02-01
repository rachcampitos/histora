import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationQueueService } from './notification-queue.service';
import { Notification, NotificationSchema } from './schema/notification.schema';
import { NotificationPreferences, NotificationPreferencesSchema } from './schema/notification-preferences.schema';
import { DeviceToken, DeviceTokenSchema } from './schema/device-token.schema';
import { WebPushSubscription, WebPushSubscriptionSchema } from './schema/web-push-subscription.schema';
import { User, UserSchema } from '../users/schema/user.schema';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { PushProvider } from './providers/push.provider';
import { WebPushProvider } from './providers/web-push.provider';
import { WebPushService } from './web-push.service';
import { WebPushController } from './web-push.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationPreferences.name, schema: NotificationPreferencesSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
      { name: WebPushSubscription.name, schema: WebPushSubscriptionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [NotificationsController, WebPushController],
  providers: [
    NotificationsService,
    NotificationQueueService,
    EmailProvider,
    SmsProvider,
    WhatsAppProvider,
    PushProvider,
    WebPushProvider,
    WebPushService,
  ],
  exports: [NotificationsService, NotificationQueueService, WebPushService],
})
export class NotificationsModule {}
