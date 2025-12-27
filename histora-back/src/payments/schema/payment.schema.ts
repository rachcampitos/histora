import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentMethod {
  YAPE = 'yape',
  PLIN = 'plin',
  CARD = 'card',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  CONSULTATION = 'consultation',
  SERVICE = 'service',
}

export enum Currency {
  PEN = 'PEN', // Soles peruanos
  USD = 'USD',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
  clinicId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient' })
  patientId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subscription' })
  subscriptionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Consultation' })
  consultationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  appointmentId?: Types.ObjectId;

  @Prop({ type: String, enum: PaymentType, required: true })
  type: PaymentType;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  method: PaymentMethod;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ type: String, enum: Currency, default: Currency.PEN })
  currency: Currency;

  @Prop({ type: Number, required: true })
  amount: number; // en centavos (100 = S/ 1.00)

  @Prop({ type: Number, default: 0 })
  fee: number; // comisión del procesador

  @Prop({ type: Number, default: 0 })
  tax: number; // IGV si aplica

  @Prop({ type: Number })
  netAmount?: number; // amount - fee - tax

  @Prop()
  description: string;

  @Prop()
  reference: string; // número de operación interno

  // Provider-specific data
  @Prop()
  externalId?: string; // ID en Culqi/MercadoPago

  @Prop()
  externalReference?: string;

  @Prop({ type: Object })
  providerData?: Record<string, any>;

  // Customer data
  @Prop()
  customerEmail?: string;

  @Prop()
  customerPhone?: string;

  @Prop()
  customerName?: string;

  // For Yape/Plin
  @Prop()
  qrCodeUrl?: string;

  @Prop()
  yapeNumber?: string;

  @Prop()
  operationNumber?: string; // número de operación Yape/Plin

  // Timestamps
  @Prop()
  paidAt?: Date;

  @Prop()
  refundedAt?: Date;

  @Prop()
  failedAt?: Date;

  @Prop()
  errorMessage?: string;

  // Metadata
  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes
PaymentSchema.index({ clinicId: 1, createdAt: -1 });
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ reference: 1 }, { unique: true });
PaymentSchema.index({ externalId: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
