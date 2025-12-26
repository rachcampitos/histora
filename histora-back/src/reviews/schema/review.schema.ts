import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ _id: false })
export class DoctorResponse {
  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  respondedAt: Date;
}

export const DoctorResponseSchema = SchemaFactory.createForClass(DoctorResponse);

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true, index: true })
  doctorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true, index: true })
  clinicId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Consultation' })
  consultationId?: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ maxlength: 100 })
  title?: string;

  @Prop({ maxlength: 1000 })
  comment?: string;

  @Prop({ default: false })
  isAnonymous: boolean;

  @Prop({ default: false })
  isVerified: boolean; // True if patient had a real consultation

  @Prop({ default: true })
  isApproved: boolean; // For moderation

  @Prop({ default: false })
  isFlagged: boolean; // Reported as inappropriate

  @Prop()
  flagReason?: string;

  @Prop({ type: DoctorResponseSchema })
  response?: DoctorResponse;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes
ReviewSchema.index({ doctorId: 1, rating: 1 });
ReviewSchema.index({ doctorId: 1, createdAt: -1 });
ReviewSchema.index({ patientId: 1, doctorId: 1 }, { unique: true }); // One review per patient per doctor
