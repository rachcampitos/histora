import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClinicalHistoryDocument = ClinicalHistory & Document;

@Schema({ _id: false })
export class Allergy {
  @Prop({ required: true })
  allergen: string;

  @Prop()
  reaction?: string;

  @Prop()
  severity?: 'mild' | 'moderate' | 'severe';

  @Prop()
  diagnosedDate?: Date;
}

export const AllergySchema = SchemaFactory.createForClass(Allergy);

@Schema({ _id: false })
export class ChronicCondition {
  @Prop({ required: true })
  condition: string;

  @Prop()
  icdCode?: string;

  @Prop()
  diagnosedDate?: Date;

  @Prop()
  status?: 'active' | 'controlled' | 'resolved';

  @Prop()
  notes?: string;
}

export const ChronicConditionSchema = SchemaFactory.createForClass(ChronicCondition);

@Schema({ _id: false })
export class Surgery {
  @Prop({ required: true })
  procedure: string;

  @Prop()
  date?: Date;

  @Prop()
  hospital?: string;

  @Prop()
  surgeon?: string;

  @Prop()
  complications?: string;

  @Prop()
  notes?: string;
}

export const SurgerySchema = SchemaFactory.createForClass(Surgery);

@Schema({ _id: false })
export class FamilyHistory {
  @Prop({ required: true })
  relationship: string;

  @Prop({ required: true })
  condition: string;

  @Prop()
  ageAtOnset?: number;

  @Prop()
  notes?: string;
}

export const FamilyHistorySchema = SchemaFactory.createForClass(FamilyHistory);

@Schema({ _id: false })
export class CurrentMedication {
  @Prop({ required: true })
  medication: string;

  @Prop()
  dosage?: string;

  @Prop()
  frequency?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  prescribedBy?: string;

  @Prop()
  reason?: string;
}

export const CurrentMedicationSchema = SchemaFactory.createForClass(CurrentMedication);

@Schema({ _id: false })
export class Vaccination {
  @Prop({ required: true })
  vaccine: string;

  @Prop()
  date?: Date;

  @Prop()
  doseNumber?: number;

  @Prop()
  lot?: string;

  @Prop()
  administeredBy?: string;

  @Prop()
  nextDoseDate?: Date;
}

export const VaccinationSchema = SchemaFactory.createForClass(Vaccination);

@Schema({ timestamps: true })
export class ClinicalHistory {
  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true, index: true })
  clinicId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Consultation' })
  consultationId?: Types.ObjectId;

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

  // Medical background
  @Prop({ type: [AllergySchema], default: [] })
  allergies: Allergy[];

  @Prop({ type: [ChronicConditionSchema], default: [] })
  chronicConditions: ChronicCondition[];

  @Prop({ type: [SurgerySchema], default: [] })
  surgicalHistory: Surgery[];

  @Prop({ type: [FamilyHistorySchema], default: [] })
  familyHistory: FamilyHistory[];

  @Prop({ type: [CurrentMedicationSchema], default: [] })
  currentMedications: CurrentMedication[];

  @Prop({ type: [VaccinationSchema], default: [] })
  vaccinations: Vaccination[];

  // Lifestyle
  @Prop()
  smokingStatus?: 'never' | 'former' | 'current';

  @Prop()
  alcoholUse?: 'none' | 'occasional' | 'moderate' | 'heavy';

  @Prop()
  exerciseFrequency?: 'sedentary' | 'light' | 'moderate' | 'active';

  @Prop()
  diet?: string;

  @Prop()
  occupation?: string;

  // Gynecological history (if applicable)
  @Prop()
  pregnancies?: number;

  @Prop()
  liveChildren?: number;

  @Prop()
  lastMenstrualPeriod?: Date;

  @Prop()
  contraceptiveMethod?: string;

  // Custom fields for flexibility
  @Prop({ type: Object })
  customFields?: Record<string, any>;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ClinicalHistorySchema = SchemaFactory.createForClass(ClinicalHistory);

// Indexes
ClinicalHistorySchema.index({ clinicId: 1, patientId: 1 });
ClinicalHistorySchema.index({ clinicId: 1, date: -1 });
