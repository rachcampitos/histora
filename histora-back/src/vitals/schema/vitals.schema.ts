import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VitalsDocument = Vitals & Document;

@Schema({ timestamps: true })
export class Vitals {
  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
  clinicId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Consultation' })
  consultationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  recordedBy?: Types.ObjectId;

  @Prop({ required: true, default: () => new Date() })
  recordedAt: Date;

  // Temperature in Celsius
  @Prop({ min: 30, max: 45 })
  temperature?: number;

  // Heart rate in beats per minute
  @Prop({ min: 30, max: 250 })
  heartRate?: number;

  // Respiratory rate in breaths per minute
  @Prop({ min: 5, max: 60 })
  respiratoryRate?: number;

  // Blood pressure - systolic (mmHg)
  @Prop({ min: 50, max: 300 })
  systolicBP?: number;

  // Blood pressure - diastolic (mmHg)
  @Prop({ min: 30, max: 200 })
  diastolicBP?: number;

  // Oxygen saturation (%)
  @Prop({ min: 50, max: 100 })
  oxygenSaturation?: number;

  // Weight in kg
  @Prop({ min: 0.5, max: 500 })
  weight?: number;

  // Height in cm
  @Prop({ min: 20, max: 300 })
  height?: number;

  // Body Mass Index (calculated)
  @Prop({ min: 5, max: 100 })
  bmi?: number;

  // Pain level (0-10 scale)
  @Prop({ min: 0, max: 10 })
  painLevel?: number;

  // Blood glucose in mg/dL
  @Prop({ min: 20, max: 600 })
  bloodGlucose?: number;

  @Prop()
  notes?: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const VitalsSchema = SchemaFactory.createForClass(Vitals);

// Indexes
VitalsSchema.index({ clinicId: 1, patientId: 1 });
VitalsSchema.index({ clinicId: 1, recordedAt: -1 });
VitalsSchema.index({ consultationId: 1 });

// Pre-save hook to calculate BMI
VitalsSchema.pre('save', function (next) {
  if (this.weight && this.height) {
    const heightInMeters = this.height / 100;
    this.bmi = Math.round((this.weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }
  next();
});
