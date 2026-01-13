import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientAddressDocument = PatientAddress & Document;

@Schema({ timestamps: true })
export class PatientAddress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId: Types.ObjectId;

  @Prop({ required: true, maxlength: 50 })
  alias: string; // 'Mi casa', 'Casa de mamá', 'Trabajo'

  @Prop({ required: true })
  addressLine: string;

  @Prop({ required: true })
  district: string;

  @Prop({ required: true })
  city: string;

  @Prop()
  province: string;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ required: true, enum: ['home', 'family', 'hospital', 'work', 'other'], default: 'home' })
  addressType: string;

  @Prop()
  facadePhotoUrl: string;

  @Prop()
  facadePhotoPublicId: string;

  @Prop({ required: true, enum: ['green', 'yellow', 'red'], default: 'green' })
  safetyZone: string;

  @Prop()
  references: string; // 'Frente al parque', 'Casa azul de 2 pisos'

  @Prop()
  floor: string; // '2do piso', 'Dpto 301'

  @Prop({ default: false })
  hasElevator: boolean;

  @Prop({ default: false })
  hasPets: boolean;

  @Prop()
  petDetails: string; // 'Perro pequeño, amigable'

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verifiedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isPrimary: boolean;

  @Prop({ default: 0 })
  servicesAtAddress: number;

  @Prop()
  lastServiceAt: Date;

  // Mapbox verification data
  @Prop({ type: Object })
  mapboxData: {
    placeId: string;
    placeName: string;
    relevance: number;
    matchedAddress: string;
  };
}

export const PatientAddressSchema = SchemaFactory.createForClass(PatientAddress);

// Indexes
PatientAddressSchema.index({ patientId: 1 });
PatientAddressSchema.index({ patientId: 1, isPrimary: 1 });
PatientAddressSchema.index({ patientId: 1, isActive: 1 });
PatientAddressSchema.index({ location: '2dsphere' });
PatientAddressSchema.index({ safetyZone: 1 });

// Limit 5 addresses per patient (enforced in service)
