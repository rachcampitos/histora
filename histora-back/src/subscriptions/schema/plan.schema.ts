import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlanDocument = Plan & Document;

export enum PlanName {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  CLINIC = 'clinic',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  SEMIANNUAL = 'semiannual',
  ANNUAL = 'annual',
}

@Schema({ timestamps: true })
export class Plan {
  @Prop({ required: true, unique: true, enum: PlanName })
  name: PlanName;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  priceMonthly: number; // En centavos

  @Prop({ required: true })
  priceSemiannual: number;

  @Prop({ required: true })
  priceAnnual: number;

  @Prop({ required: true })
  maxDoctors: number;

  @Prop({ required: true })
  maxPatients: number; // -1 = ilimitado

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
