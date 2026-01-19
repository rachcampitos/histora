import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServicePaymentDocument = ServicePayment & Document;

export enum ServicePaymentMethod {
  YAPE = 'yape',
  CARD = 'card',
  CASH = 'cash',
}

export enum ServicePaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum ServicePaymentCurrency {
  PEN = 'PEN',
}

@Schema({ timestamps: true })
export class ServicePayment {
  @Prop({ type: Types.ObjectId, ref: 'ServiceRequest', required: true })
  serviceRequestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Nurse', required: true })
  nurseId: Types.ObjectId;

  // Amount breakdown (all in cents)
  @Prop({ type: Number, required: true })
  amount: number; // Total amount patient pays

  @Prop({ type: String, enum: ServicePaymentCurrency, default: ServicePaymentCurrency.PEN })
  currency: ServicePaymentCurrency;

  @Prop({ type: Number, default: 0 })
  serviceFee: number; // Platform fee

  @Prop({ type: Number, default: 0 })
  culqiFee: number; // Payment processor fee

  @Prop({ type: Number })
  nurseEarnings?: number; // amount - serviceFee - culqiFee

  // Status
  @Prop({ type: String, enum: ServicePaymentStatus, default: ServicePaymentStatus.PENDING })
  status: ServicePaymentStatus;

  @Prop({ type: String, enum: ServicePaymentMethod, required: true })
  method: ServicePaymentMethod;

  // Reference
  @Prop({ required: true, unique: true })
  reference: string; // PAY-XXXXX

  @Prop()
  description: string;

  // Culqi data
  @Prop()
  culqiChargeId?: string;

  @Prop()
  culqiToken?: string;

  @Prop()
  culqiOrderId?: string;

  // Card info (masked)
  @Prop()
  cardBrand?: string;

  @Prop()
  cardLast4?: string;

  // Yape info
  @Prop()
  yapeNumber?: string;

  @Prop()
  yapeOperationNumber?: string;

  // Customer info
  @Prop({ required: true })
  customerEmail: string;

  @Prop({ required: true })
  customerName: string;

  @Prop()
  customerPhone?: string;

  // Timestamps
  @Prop()
  paidAt?: Date;

  @Prop()
  refundedAt?: Date;

  @Prop()
  failedAt?: Date;

  @Prop()
  releasedAt?: Date; // When payment was released to nurse

  // Error handling
  @Prop()
  errorCode?: string;

  @Prop()
  errorMessage?: string;

  // Metadata
  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const ServicePaymentSchema = SchemaFactory.createForClass(ServicePayment);

// Indexes
ServicePaymentSchema.index({ serviceRequestId: 1 }, { unique: true });
ServicePaymentSchema.index({ patientId: 1, createdAt: -1 });
ServicePaymentSchema.index({ nurseId: 1, createdAt: -1 });
ServicePaymentSchema.index({ reference: 1 }, { unique: true });
ServicePaymentSchema.index({ status: 1, createdAt: -1 });
