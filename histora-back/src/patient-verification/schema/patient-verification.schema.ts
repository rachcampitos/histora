import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientVerificationDocument = PatientVerification & Document;

// Sub-schemas
@Schema({ _id: false })
export class DniVerification {
  @Prop({ required: true })
  number: string;

  @Prop()
  frontPhotoUrl: string;

  @Prop()
  backPhotoUrl: string;

  @Prop({ default: false })
  verifiedWithReniec: boolean;

  @Prop({ type: Object })
  reniecData?: Record<string, unknown>;
}

@Schema({ _id: false })
export class SelfieVerification {
  @Prop()
  photoUrl: string;

  @Prop({ min: 0, max: 100 })
  biometricMatchScore: number;

  @Prop({ default: false })
  verified: boolean;
}

@Schema({ _id: false })
export class PaymentMethodVerification {
  @Prop({ default: false })
  verified: boolean;

  @Prop({ enum: ['card', 'yape', 'plin', 'other'] })
  type: string;

  @Prop()
  last4: string;
}

@Schema({ _id: false })
export class VideoCallVerification {
  @Prop({ default: false })
  completed: boolean;

  @Prop()
  completedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy?: Types.ObjectId;

  @Prop()
  notes?: string;
}

@Schema({ _id: false })
export class EmergencyContact {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  relationship: string;

  @Prop({ default: false })
  verified: boolean;
}

@Schema({ _id: false })
export class VerificationFlag {
  @Prop({ required: true, enum: ['yellow', 'red'] })
  type: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ServiceRequest' })
  serviceRequestId?: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;
}

// Main schema
@Schema({ timestamps: true })
export class PatientVerification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  patientId: Types.ObjectId;

  @Prop({ required: true, enum: [0, 1, 2], default: 0 })
  verificationLevel: number;

  @Prop({ type: DniVerification })
  dni: DniVerification;

  @Prop({ type: SelfieVerification })
  selfie: SelfieVerification;

  @Prop({ type: PaymentMethodVerification })
  paymentMethod: PaymentMethodVerification;

  @Prop({ type: VideoCallVerification })
  videoCallVerification: VideoCallVerification;

  @Prop({ type: [EmergencyContact], default: [] })
  emergencyContacts: EmergencyContact[];

  @Prop({ required: true, min: 0, max: 100, default: 50 })
  trustScore: number;

  @Prop({ type: [VerificationFlag], default: [] })
  flags: VerificationFlag[];

  @Prop({ required: true, enum: ['pending', 'level1', 'level2', 'suspended'], default: 'pending' })
  status: string;

  @Prop()
  verifiedAt: Date;

  @Prop({ default: false })
  phoneVerified: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ default: 0 })
  totalServices: number;

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  yellowFlagsCount: number;

  @Prop({ default: 0 })
  redFlagsCount: number;

  @Prop()
  suspendedAt?: Date;

  @Prop()
  suspensionReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  suspendedBy?: Types.ObjectId;
}

export const PatientVerificationSchema = SchemaFactory.createForClass(PatientVerification);

// Indexes
PatientVerificationSchema.index({ patientId: 1 }, { unique: true });
PatientVerificationSchema.index({ status: 1 });
PatientVerificationSchema.index({ trustScore: 1 });
PatientVerificationSchema.index({ 'dni.number': 1 });
