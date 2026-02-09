import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NurseReviewDocument = NurseReview & Document;

@Schema({ timestamps: true })
export class NurseReview {
  @Prop({ type: Types.ObjectId, ref: 'Nurse', required: true })
  nurseId: Types.ObjectId; // Index covered by compound index below

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ServiceRequest' })
  serviceRequestId?: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ default: '' })
  comment: string;

  @Prop({ default: false })
  isVerified: boolean; // True if linked to a completed service

  @Prop({ default: false })
  isAnonymous: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  // Response from nurse (optional)
  @Prop({
    type: {
      content: String,
      respondedAt: Date,
    },
  })
  response?: {
    content: string;
    respondedAt: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

export const NurseReviewSchema = SchemaFactory.createForClass(NurseReview);

// Index for faster queries
NurseReviewSchema.index({ nurseId: 1, createdAt: -1 });
NurseReviewSchema.index(
  { serviceRequestId: 1 },
  { unique: true, sparse: true },
); // One review per service request

// Virtual for populating patient name
NurseReviewSchema.virtual('patient', {
  ref: 'User',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true,
});

NurseReviewSchema.set('toJSON', { virtuals: true });
NurseReviewSchema.set('toObject', { virtuals: true });
