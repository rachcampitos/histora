// clinical-history.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClinicalHistoryDocument = ClinicalHistory & Document;

@Schema()
export class ClinicalHistory {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  reasonForVisit: string;

  @Prop()
  diagnosis: string;

  @Prop()
  treatment: string;

  @Prop()
  notes: string;

  @Prop({ type: Object }) // Campos personalizados por país o clínica
  customFields?: Record<string, any>;

  @Prop({ default: false }) // Campo para soft delete
  isDeleted: boolean;
}

export const ClinicalHistorySchema =
  SchemaFactory.createForClass(ClinicalHistory);
