import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ComplaintDocument = Complaint & Document;

export enum ComplaintType {
  RECLAMO = 'reclamo',
  QUEJA = 'queja',
}

export enum ComplaintStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
}

@Schema({ timestamps: true })
export class Complaint {
  @Prop({ required: true, enum: Object.values(ComplaintType) })
  type: ComplaintType;

  @Prop({ required: true, unique: true })
  claimNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['patient', 'nurse'] })
  userRole: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, trim: true })
  dni: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, maxlength: 2000 })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'ServiceRequest' })
  relatedServiceId?: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(ComplaintStatus),
    default: ComplaintStatus.PENDING,
  })
  status: ComplaintStatus;

  @Prop()
  response?: string;

  @Prop()
  respondedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ComplaintSchema = SchemaFactory.createForClass(Complaint);

ComplaintSchema.index({ userId: 1, createdAt: -1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ claimNumber: 1 }, { unique: true });
ComplaintSchema.index({ createdAt: -1 });
