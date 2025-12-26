import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClinicDocument = Clinic & Document;

@Schema({ timestamps: true })
export class Clinic {
  _id: any;
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({
    type: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
  })
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };

  @Prop({ trim: true })
  phone?: string;

  @Prop({ lowercase: true, trim: true })
  email?: string;

  @Prop()
  logo?: string;

  @Prop({ type: [String], default: [] })
  specialties: string[];

  @Prop({
    type: {
      monday: { open: String, close: String, isOpen: Boolean },
      tuesday: { open: String, close: String, isOpen: Boolean },
      wednesday: { open: String, close: String, isOpen: Boolean },
      thursday: { open: String, close: String, isOpen: Boolean },
      friday: { open: String, close: String, isOpen: Boolean },
      saturday: { open: String, close: String, isOpen: Boolean },
      sunday: { open: String, close: String, isOpen: Boolean },
    },
  })
  schedule?: {
    monday?: { open?: string; close?: string; isOpen?: boolean };
    tuesday?: { open?: string; close?: string; isOpen?: boolean };
    wednesday?: { open?: string; close?: string; isOpen?: boolean };
    thursday?: { open?: string; close?: string; isOpen?: boolean };
    friday?: { open?: string; close?: string; isOpen?: boolean };
    saturday?: { open?: string; close?: string; isOpen?: boolean };
    sunday?: { open?: string; close?: string; isOpen?: boolean };
  };

  @Prop({ type: Object })
  settings?: Record<string, any>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ClinicSchema = SchemaFactory.createForClass(Clinic);

// Additional indexes (slug already indexed via unique: true)
ClinicSchema.index({ ownerId: 1 });
ClinicSchema.index({ 'address.city': 1 });
ClinicSchema.index({ specialties: 1 });
