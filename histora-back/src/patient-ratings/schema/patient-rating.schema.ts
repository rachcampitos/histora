import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientRatingDocument = PatientRating & Document;

@Schema({ _id: false })
export class RatingBreakdown {
  @Prop({ required: true, min: 1, max: 5 })
  safety: number; // How safe did the nurse feel?

  @Prop({ required: true, min: 1, max: 5 })
  respect: number; // Was the patient respectful?

  @Prop({ required: true, min: 1, max: 5 })
  environment: number; // Was the environment clean and adequate?

  @Prop({ required: true, min: 1, max: 5 })
  compliance: number; // Did the patient follow instructions?
}

@Schema({ timestamps: true })
export class PatientRating {
  @Prop({ type: Types.ObjectId, ref: 'ServiceRequest', required: true })
  serviceRequestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  nurseId: Types.ObjectId;

  @Prop({ type: RatingBreakdown, required: true })
  ratings: RatingBreakdown;

  @Prop({ required: true, min: 1, max: 5 })
  overallRating: number;

  @Prop({ type: [String], default: [] })
  positiveTags: string[]; // ['respectful', 'clean', 'safe_environment', 'punctual', 'collaborative']

  @Prop({ type: [String], default: [] })
  negativeTags: string[]; // ['disrespectful', 'unsafe', 'dirty', 'aggressive', 'intoxicated']

  @Prop({ maxlength: 500 })
  privateComment: string; // Only visible to Histora Care staff

  @Prop({ default: false })
  hasIncident: boolean;

  @Prop({ type: Types.ObjectId, ref: 'SafetyIncident' })
  incidentId: Types.ObjectId;

  @Prop({ default: false })
  isAnonymous: boolean; // Nurse can choose to rate anonymously
}

export const PatientRatingSchema = SchemaFactory.createForClass(PatientRating);

// Indexes
PatientRatingSchema.index({ patientId: 1 });
PatientRatingSchema.index({ nurseId: 1 });
PatientRatingSchema.index({ serviceRequestId: 1 }, { unique: true });
PatientRatingSchema.index({ patientId: 1, createdAt: -1 });
PatientRatingSchema.index({ overallRating: 1 });

// Predefined tags for consistency
export const POSITIVE_TAGS = [
  'respectful',
  'clean_environment',
  'safe_environment',
  'punctual',
  'collaborative',
  'friendly',
  'clear_communication',
  'proper_preparation',
];

export const NEGATIVE_TAGS = [
  'disrespectful',
  'unsafe_environment',
  'dirty_environment',
  'aggressive',
  'intoxicated',
  'harassment',
  'poor_communication',
  'unprepared',
  'late_cancellation',
];
