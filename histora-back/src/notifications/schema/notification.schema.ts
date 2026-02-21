import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  // General notifications
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  GENERAL = 'general',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_REMINDER = 'payment_reminder',
  // Service request notifications (Histora Care)
  SERVICE_REQUEST_ACCEPTED = 'service_request_accepted',
  SERVICE_REQUEST_REJECTED = 'service_request_rejected',
  SERVICE_REQUEST_CANCELLED = 'service_request_cancelled',
  SERVICE_STARTED = 'service_started',
  SERVICE_COMPLETED = 'service_completed',
  NURSE_ON_THE_WAY = 'nurse_on_the_way',
  NURSE_ARRIVED = 'nurse_arrived',
  // Admin notifications
  NEW_PATIENT_REGISTERED = 'new_patient_registered',
  NEW_NURSE_REGISTERED = 'new_nurse_registered',
  // Nurse notifications (Histora Care)
  NEW_NURSE_REVIEW = 'new_nurse_review',
  // Reminders (Histora Care)
  SERVICE_REMINDER = 'service_reminder',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ type: String, enum: NotificationChannel, required: true })
  channel: NotificationChannel;

  @Prop({ type: String, enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object })
  data?: Record<string, any>;

  @Prop()
  recipient: string; // email, phone number, or device token

  @Prop()
  sentAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  readAt?: Date;

  @Prop()
  errorMessage?: string;

  @Prop({ type: Number, default: 0 })
  retryCount: number;

  @Prop({ type: Date })
  scheduledFor?: Date;

  @Prop({ type: Types.ObjectId, ref: 'ServiceRequest' })
  serviceRequestId?: Types.ObjectId;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 }); // User's notification feed
NotificationSchema.index({ scheduledFor: 1, status: 1 });
NotificationSchema.index({ type: 1, channel: 1 });
NotificationSchema.index({ channel: 1, status: 1, scheduledFor: 1 }); // For queue processing
