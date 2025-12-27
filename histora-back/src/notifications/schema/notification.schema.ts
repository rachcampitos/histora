import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CONFIRMATION = 'appointment_confirmation',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  CONSULTATION_COMPLETED = 'consultation_completed',
  PRESCRIPTION_READY = 'prescription_ready',
  LAB_RESULTS_READY = 'lab_results_ready',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_REMINDER = 'payment_reminder',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  GENERAL = 'general',
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
  @Prop({ type: Types.ObjectId, ref: 'Clinic' })
  clinicId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient' })
  patientId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor' })
  doctorId?: Types.ObjectId;

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

  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  appointmentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Consultation' })
  consultationId?: Types.ObjectId;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ clinicId: 1, createdAt: -1 });
NotificationSchema.index({ scheduledFor: 1, status: 1 });
NotificationSchema.index({ type: 1, channel: 1 });
