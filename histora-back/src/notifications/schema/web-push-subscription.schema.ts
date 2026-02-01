import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WebPushSubscriptionDocument = WebPushSubscription & Document;

/**
 * Web Push Subscription Schema
 * Stores PWA push subscriptions using the Web Push protocol (VAPID)
 * Different from FCM tokens - contains endpoint, keys, etc.
 */
@Schema({ timestamps: true })
export class WebPushSubscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  endpoint: string;

  @Prop({ type: Object, required: true })
  keys: {
    p256dh: string;
    auth: string;
  };

  @Prop({ default: 'web' })
  platform: string;

  @Prop({ type: Object })
  deviceInfo?: {
    userAgent?: string;
    language?: string;
    timezone?: string;
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastUsedAt?: Date;

  @Prop()
  lastFailedAt?: Date;

  @Prop({ default: 0 })
  failureCount: number;
}

export const WebPushSubscriptionSchema = SchemaFactory.createForClass(WebPushSubscription);

// Index for unique subscription per user endpoint
WebPushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

// Index for finding active subscriptions
WebPushSubscriptionSchema.index({ userId: 1, isActive: 1 });
