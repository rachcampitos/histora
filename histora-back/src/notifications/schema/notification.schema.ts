import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  // Patient notifications
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
  // Service request notifications (Histora Care)
  SERVICE_REQUEST_ACCEPTED = 'service_request_accepted',
  SERVICE_REQUEST_REJECTED = 'service_request_rejected',
  SERVICE_REQUEST_CANCELLED = 'service_request_cancelled',
  SERVICE_STARTED = 'service_started',
  SERVICE_COMPLETED = 'service_completed',
  NURSE_ON_THE_WAY = 'nurse_on_the_way',
  NURSE_ARRIVED = 'nurse_arrived',
  // Doctor notifications
  NEW_APPOINTMENT_BOOKED = 'new_appointment_booked',
  APPOINTMENT_CANCELLED_BY_PATIENT = 'appointment_cancelled_by_patient',
  NEW_PATIENT_REVIEW = 'new_patient_review',
  UPCOMING_APPOINTMENT_REMINDER = 'upcoming_appointment_reminder',
  PATIENT_MESSAGE = 'patient_message',
  // Admin notifications
  NEW_DOCTOR_REGISTERED = 'new_doctor_registered',
  NEW_PATIENT_REGISTERED = 'new_patient_registered',
  NEW_NURSE_REGISTERED = 'new_nurse_registered',
  // Nurse notifications (Histora Care)
  NEW_NURSE_REVIEW = 'new_nurse_review',
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
