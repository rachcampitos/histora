import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DoctorDocument = Doctor & Document;

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

  @Prop({ default: false })
  isDeleted: boolean;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);

// Indexes
DoctorSchema.index({ clinicId: 1 });
DoctorSchema.index({ userId: 1 }, { unique: true });
DoctorSchema.index({ clinicId: 1, specialty: 1 });
DoctorSchema.index({ isPublicProfile: 1, specialty: 1 });
