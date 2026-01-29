import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationChannel, NotificationType } from './notification.schema';

export type NotificationPreferencesDocument = NotificationPreferences & Document;

@Schema({ _id: false })
export class ChannelPreference {
  @Prop({ type: Boolean, default: true })
  enabled: boolean;

  @Prop()
  value?: string; // email address, phone number, or device token
}

@Schema({ _id: false })
export class TypePreference {
  @Prop({ type: Boolean, default: true })
  enabled: boolean;

  @Prop({ type: [String], enum: NotificationChannel, default: ['email', 'in_app'] })
  channels: NotificationChannel[];
}

@Schema({ timestamps: true })
export class NotificationPreferences {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // Channel preferences
  @Prop({ type: Object, default: { enabled: true } })
  email: ChannelPreference;

  @Prop({ type: Object, default: { enabled: false } })
  sms: ChannelPreference;

  @Prop({ type: Object, default: { enabled: false } })
  whatsapp: ChannelPreference;

  @Prop({ type: Object, default: { enabled: true } })
  push: ChannelPreference;

  @Prop({ type: Object, default: { enabled: true } })
  inApp: ChannelPreference;

  // Notification type preferences (Histora Care)
  @Prop({ type: Object, default: { enabled: true, channels: ['push', 'in_app'] } })
  serviceNotifications: TypePreference;

  @Prop({ type: Object, default: { enabled: true, channels: ['email', 'in_app'] } })
  paymentNotifications: TypePreference;

  @Prop({ type: Object, default: { enabled: true, channels: ['email'] } })
  marketingEmails: TypePreference;

  // Quiet hours
  @Prop({ type: Boolean, default: false })
  quietHoursEnabled: boolean;

  @Prop({ type: String, default: '22:00' })
  quietHoursStart: string;

  @Prop({ type: String, default: '08:00' })
  quietHoursEnd: string;

  @Prop({ type: String, default: 'America/Lima' })
  timezone: string;
}

export const NotificationPreferencesSchema = SchemaFactory.createForClass(NotificationPreferences);

// userId index is automatically created via unique: true in @Prop decorator
