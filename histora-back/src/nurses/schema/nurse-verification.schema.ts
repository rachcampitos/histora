import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum VerificationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Sub-schema for verification documents
@Schema({ _id: false })
export class VerificationDocument {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  publicId: string;

  @Prop({ required: true, enum: ['cep_front', 'cep_back', 'dni_front', 'dni_back', 'selfie_with_dni'] })
  type: string;

  @Prop()
  uploadedAt: Date;
}

export const VerificationDocumentSchema = SchemaFactory.createForClass(VerificationDocument);

@Schema({ timestamps: true })
export class NurseVerification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Nurse', required: true, unique: true })
  nurseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // Documents uploaded for verification
  @Prop({ type: [VerificationDocumentSchema], default: [] })
  documents: VerificationDocument[];

  // Verification status
  @Prop({
    type: String,
    enum: Object.values(VerificationStatus),
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  // DNI information (to cross-reference with documents)
  @Prop()
  dniNumber?: string;

  @Prop()
  fullNameOnDni?: string;

  // Admin review information
  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  reviewNotes?: string;

  @Prop()
  rejectionReason?: string;

  // Tracks how many times verification has been attempted
  @Prop({ default: 1 })
  attemptNumber: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const NurseVerificationSchema = SchemaFactory.createForClass(NurseVerification);

// Index for efficient queries
NurseVerificationSchema.index({ status: 1, createdAt: -1 });
NurseVerificationSchema.index({ nurseId: 1 });
NurseVerificationSchema.index({ userId: 1 });
