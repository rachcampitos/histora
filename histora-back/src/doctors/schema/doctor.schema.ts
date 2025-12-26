import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DoctorDocument = Doctor & Document;

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

@Schema({ _id: false })
export class TimeSlot {
  @Prop({ required: true })
  start: string; // HH:MM format

  @Prop({ required: true })
  end: string; // HH:MM format
}

@Schema({ _id: false })
export class DaySchedule {
  @Prop({ required: true, enum: DayOfWeek })
  day: DayOfWeek;

  @Prop({ default: true })
  isWorking: boolean;

  @Prop({ type: [TimeSlot], default: [] })
  slots: TimeSlot[]; // Multiple slots per day (morning/afternoon)

  @Prop({ type: [TimeSlot], default: [] })
  breaks: TimeSlot[]; // Lunch breaks, etc.
}

@Schema({ _id: false })
export class Education {
  @Prop({ required: true })
  institution: string;

  @Prop({ required: true })
  degree: string;

  @Prop()
  year?: number;

  @Prop()
  country?: string;
}

@Schema({ timestamps: true })
export class Doctor {
  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
  clinicId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, trim: true })
  specialty: string;

  @Prop({ type: [String], default: [] })
  subspecialties: string[];

  @Prop({ trim: true })
  licenseNumber?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ lowercase: true, trim: true })
  email?: string;

  @Prop()
  bio?: string;

  @Prop({ type: [Education], default: [] })
  education: Education[];

  @Prop()
  profileImage?: string;

  @Prop({ default: false })
  isPublicProfile: boolean;

  @Prop({ default: 0, min: 0, max: 5 })
  averageRating: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ type: [DaySchedule], default: [] })
  workingHours: DaySchedule[];

  @Prop({ default: 30, min: 15, max: 120 })
  appointmentDuration: number; // Duration in minutes

  @Prop({ default: false })
  isDeleted: boolean;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);

// Indexes
DoctorSchema.index({ clinicId: 1 });
DoctorSchema.index({ userId: 1 }, { unique: true });
DoctorSchema.index({ clinicId: 1, specialty: 1 });
DoctorSchema.index({ isPublicProfile: 1, specialty: 1 });
