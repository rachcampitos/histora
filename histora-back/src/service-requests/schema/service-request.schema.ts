import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { phiEncryptionPlugin } from '../../common/encryption';

export type ServiceRequestDocument = ServiceRequest & Document;

// Status change history sub-schema
@Schema({ _id: false })
export class StatusChange {
  @Prop({ required: true })
  status: string;

  @Prop({ required: true, default: () => new Date() })
  changedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  changedBy: Types.ObjectId;

  @Prop()
  note?: string;
}

export const StatusChangeSchema = SchemaFactory.createForClass(StatusChange);

// Service details sub-schema
@Schema({ _id: false })
export class RequestedService {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 'PEN' })
  currency: string;

  @Prop({ default: 60 })
  durationMinutes: number;
}

export const RequestedServiceSchema =
  SchemaFactory.createForClass(RequestedService);

// Location sub-schema (GeoJSON)
@Schema({ _id: false })
export class RequestLocation {
  @Prop({ default: 'Point', enum: ['Point'] })
  type: string;

  @Prop({ type: [Number], required: true }) // [longitude, latitude]
  coordinates: number[];

  @Prop({ required: true })
  address: string;

  @Prop()
  reference?: string; // Additional reference for finding the place

  @Prop({ required: true })
  district: string;

  @Prop({ required: true })
  city: string;
}

export const RequestLocationSchema =
  SchemaFactory.createForClass(RequestLocation);

@Schema({ timestamps: true })
export class ServiceRequest extends Document {
  // Participants
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Nurse' })
  nurseId: Types.ObjectId;

  // Service details
  @Prop({ type: RequestedServiceSchema, required: true })
  service: RequestedService;

  // Location
  @Prop({ type: RequestLocationSchema, required: true, index: '2dsphere' })
  location: RequestLocation;

  // Scheduling
  @Prop({ required: true })
  requestedDate: Date;

  @Prop({
    required: true,
    enum: ['morning', 'afternoon', 'evening', 'asap'],
  })
  requestedTimeSlot: string;

  @Prop()
  scheduledAt?: Date;

  // Status
  @Prop({
    required: true,
    default: 'pending',
    enum: [
      'pending',
      'accepted',
      'on_the_way',
      'arrived',
      'in_progress',
      'completed',
      'cancelled',
      'rejected',
    ],
  })
  status: string;

  @Prop({ type: [StatusChangeSchema], default: [] })
  statusHistory: StatusChange[];

  // Notes
  @Prop()
  patientNotes?: string;

  @Prop()
  nurseNotes?: string;

  // Payment
  @Prop({
    default: 'pending',
    enum: ['pending', 'paid', 'refunded', 'failed'],
  })
  paymentStatus: string;

  @Prop()
  paymentMethod?: string;

  @Prop()
  paymentId?: string;

  // Rating (after completion)
  @Prop({ min: 1, max: 5 })
  rating: number;

  @Prop()
  review?: string;

  @Prop()
  reviewedAt?: Date;

  // Completion/cancellation
  @Prop()
  completedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  // Security codes (generated on accept)
  @Prop()
  patientCode?: string;

  @Prop()
  nurseCode?: string;

  @Prop()
  codeVerifiedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const ServiceRequestSchema =
  SchemaFactory.createForClass(ServiceRequest);

// PHI encryption for HIPAA compliance
ServiceRequestSchema.plugin(phiEncryptionPlugin, {
  fields: [
    'patientNotes',
    'nurseNotes',
    'cancellationReason',
    'review',
  ],
});

// Create indexes
// Note: location already has 2dsphere index via @Prop decorator
ServiceRequestSchema.index({ patientId: 1, status: 1 });
ServiceRequestSchema.index({ nurseId: 1, status: 1 });
ServiceRequestSchema.index({ status: 1, createdAt: -1 });

// Virtuals for populating
ServiceRequestSchema.virtual('patient', {
  ref: 'User',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true,
});

ServiceRequestSchema.virtual('nurse', {
  ref: 'Nurse',
  localField: 'nurseId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included
ServiceRequestSchema.set('toJSON', { virtuals: true });
ServiceRequestSchema.set('toObject', { virtuals: true });
