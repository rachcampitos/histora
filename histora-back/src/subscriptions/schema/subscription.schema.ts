import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PlanName, BillingCycle } from './plan.schema';

export type SubscriptionDocument = Subscription & Document;

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true, unique: true })
  clinicId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: PlanName })
  plan: PlanName;

  @Prop({ type: String, required: true, enum: BillingCycle, default: BillingCycle.MONTHLY })
  billingCycle: BillingCycle;

  @Prop({ type: String, required: true, enum: SubscriptionStatus, default: SubscriptionStatus.TRIAL })
  status: SubscriptionStatus;

  @Prop({ required: true })
  currentPeriodStart: Date;

  @Prop({ required: true })
  currentPeriodEnd: Date;

  @Prop()
  trialEndsAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  @Prop({
    type: {
      type: { type: String }, // 'card', 'paypal', etc.
      last4: String,
      brand: String,
      expiryMonth: Number,
      expiryYear: Number,
    },
  })
  paymentMethod?: {
    type?: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };

  @Prop()
  stripeCustomerId?: string;

  @Prop()
  stripeSubscriptionId?: string;

  @Prop({ type: [{ date: Date, amount: Number, status: String, invoiceId: String }] })
  paymentHistory?: Array<{
    date: Date;
    amount: number;
    status: string;
    invoiceId?: string;
  }>;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Indexes (clinicId already indexed via unique: true)
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });
