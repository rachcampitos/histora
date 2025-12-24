import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientDocument = Patient & Document;

@Schema({ timestamps: true })
export class Patient {
  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
  clinicId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId; // Si el paciente tiene cuenta en el sistema

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ trim: true })
  lastName?: string;

  @Prop()
  birthDate?: Date;

  @Prop({ enum: ['male', 'female', 'other'] })
  gender?: string;

  @Prop({ trim: true })
  documentType?: string; // DNI, Passport, etc.

  @Prop({ trim: true })
  documentNumber?: string;

  @Prop({ lowercase: true, trim: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({
    type: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
  })
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };

  @Prop({ trim: true })
  occupation?: string;

  @Prop({ trim: true })
  emergencyContactName?: string;

  @Prop({ trim: true })
  emergencyContactPhone?: string;

  @Prop({ trim: true })
  emergencyContactRelation?: string;

  @Prop({ type: [String], default: [] })
  allergies: string[];

  @Prop({ type: [String], default: [] })
  chronicConditions: string[];

  @Prop({ trim: true })
  bloodType?: string;

  @Prop()
  notes?: string;

  @Prop({ type: Object })
  customFields?: Record<string, any>;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);

// Indexes
PatientSchema.index({ clinicId: 1 });
PatientSchema.index({ clinicId: 1, email: 1 });
PatientSchema.index({ clinicId: 1, documentNumber: 1 });
PatientSchema.index({ clinicId: 1, lastName: 1, firstName: 1 });
