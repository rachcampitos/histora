import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { VerificationStatus } from './nurse-verification.schema';

// Sub-schema for nurse services
@Schema({ _id: true })
export class NurseService {
  _id?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({
    required: true,
    enum: [
      'injection',
      'wound_care',
      'catheter',
      'vital_signs',
      'iv_therapy',
      'blood_draw',
      'medication',
      'elderly_care',
      'post_surgery',
      'other',
    ],
  })
  category: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 'PEN' })
  currency: string;

  @Prop({ default: 60 })
  durationMinutes: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const NurseServiceSchema = SchemaFactory.createForClass(NurseService);

// GeoJSON Point sub-schema
@Schema({ _id: false })
export class GeoPoint {
  @Prop({ default: 'Point', enum: ['Point'] })
  type: string;

  @Prop({ type: [Number], required: true }) // [longitude, latitude]
  coordinates: number[];

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  district?: string;
}

export const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);

@Schema({ timestamps: true })
export class Nurse extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // Professional identification
  @Prop({ required: true, unique: true })
  cepNumber: string; // Colegio de Enfermeros del Peru

  @Prop({ default: false })
  cepVerified: boolean;

  @Prop()
  cepVerifiedAt?: Date;

  // Official CEP photo from the registry (used as verified avatar)
  @Prop()
  officialCepPhotoUrl?: string;

  // Full name as registered in CEP
  @Prop()
  cepRegisteredName?: string;

  // Selfie URL uploaded during registration (for identity verification)
  @Prop()
  selfieUrl?: string;

  // Selfie public ID for Cloudinary deletion
  @Prop()
  selfiePublicId?: string;

  // Verification status for the nurse profile
  @Prop({
    type: String,
    enum: Object.values(VerificationStatus),
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @Prop({ type: [String], default: [] })
  specialties: string[];

  @Prop()
  bio?: string;

  @Prop({ default: 0 })
  yearsOfExperience: number;

  // Services offered
  @Prop({ type: [NurseServiceSchema], default: [] })
  services: NurseService[];

  // Location (GeoJSON for geospatial queries)
  @Prop({ type: GeoPointSchema, index: '2dsphere' })
  location: GeoPoint;

  @Prop({ default: 10 }) // Default 10km radius
  serviceRadius: number;

  // Extra charge per km beyond service radius
  @Prop({ default: 0 })
  extraChargePerKm: number;

  // Minimum service fee
  @Prop({ default: 0 })
  minimumServiceFee: number;

  // Availability
  @Prop({ default: false })
  isAvailable: boolean;

  @Prop() // HH:mm format
  availableFrom?: string;

  @Prop()
  availableTo?: string;

  @Prop({ type: [Number], default: [1, 2, 3, 4, 5] }) // Monday-Friday by default
  availableDays: number[];

  // Stats
  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ default: 0 })
  totalServicesCompleted: number;

  // Payment Methods (P2P)
  @Prop()
  yapeNumber?: string;

  @Prop()
  plinNumber?: string;

  @Prop({ default: true })
  acceptsCash: boolean;

  // Status
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  // Timestamps added by mongoose
  createdAt: Date;
  updatedAt: Date;
}

export const NurseSchema = SchemaFactory.createForClass(Nurse);

// Create 2dsphere index for geospatial queries
NurseSchema.index({ location: '2dsphere' });

// Virtual for populating user
NurseSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included in JSON
NurseSchema.set('toJSON', { virtuals: true });
NurseSchema.set('toObject', { virtuals: true });
