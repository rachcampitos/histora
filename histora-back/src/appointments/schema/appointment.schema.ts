import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AppointmentDocument = Appointment & Document;

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum BookedBy {
  CLINIC = 'clinic',
  PATIENT = 'patient',
}

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
  clinicId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;

  @Prop({ required: true })
  scheduledDate: Date;

  @Prop({ required: true })
  startTime: string; // "HH:MM" format

  @Prop({ required: true })
  endTime: string; // "HH:MM" format

  @Prop({ type: String, required: true, enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus;

  @Prop()
  reasonForVisit?: string;

  @Prop()
  notes?: string;

  @Prop({ type: String, required: true, enum: BookedBy, default: BookedBy.CLINIC })
  bookedBy: BookedBy;

  @Prop({ type: Types.ObjectId, ref: 'Consultation' })
  consultationId?: Types.ObjectId;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

// Indexes
AppointmentSchema.index({ clinicId: 1, scheduledDate: 1 });
AppointmentSchema.index({ clinicId: 1, doctorId: 1, scheduledDate: 1 });
AppointmentSchema.index({ clinicId: 1, patientId: 1 });
AppointmentSchema.index({ clinicId: 1, status: 1 });
