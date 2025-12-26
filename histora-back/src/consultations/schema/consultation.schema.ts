import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConsultationDocument = Consultation & Document;

export enum ConsultationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum DiagnosisType {
  PRINCIPAL = 'principal',
  SECONDARY = 'secondary',
  DIFFERENTIAL = 'differential',
}

@Schema({ _id: false })
export class Diagnosis {
  @Prop({ required: true })
  code: string; // ICD-10 code

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: DiagnosisType, default: DiagnosisType.PRINCIPAL })
  type: DiagnosisType;

  @Prop()
  notes?: string;
}

export const DiagnosisSchema = SchemaFactory.createForClass(Diagnosis);

@Schema({ _id: false })
export class Prescription {
  @Prop({ required: true })
  medication: string;

  @Prop({ required: true })
  dosage: string;

  @Prop({ required: true })
  frequency: string;

  @Prop({ required: true })
  duration: string;

  @Prop()
  route?: string; // oral, IV, IM, topical, etc.

  @Prop()
  instructions?: string;

  @Prop({ default: false })
  isControlled: boolean;
}

export const PrescriptionSchema = SchemaFactory.createForClass(Prescription);

@Schema({ _id: false })
export class OrderedExam {
  @Prop({ required: true })
  name: string;

  @Prop()
  type?: string; // laboratory, imaging, procedure

  @Prop()
  instructions?: string;

  @Prop({ default: false })
  isUrgent: boolean;

  @Prop()
  results?: string;

  @Prop()
  resultDate?: Date;
}

export const OrderedExamSchema = SchemaFactory.createForClass(OrderedExam);

@Schema({ _id: false })
export class PhysicalExamination {
  @Prop()
  generalAppearance?: string;

  @Prop()
  head?: string;

  @Prop()
  eyes?: string;

  @Prop()
  ears?: string;

  @Prop()
  nose?: string;

  @Prop()
  throat?: string;

  @Prop()
  neck?: string;

  @Prop()
  chest?: string;

  @Prop()
  lungs?: string;

  @Prop()
  heart?: string;

  @Prop()
  abdomen?: string;

  @Prop()
  extremities?: string;

  @Prop()
  skin?: string;

  @Prop()
  neurological?: string;

  @Prop()
  musculoskeletal?: string;

  @Prop()
  other?: string;
}

export const PhysicalExaminationSchema = SchemaFactory.createForClass(PhysicalExamination);

@Schema({ timestamps: true })
export class Consultation {
  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true, index: true })
  clinicId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true, index: true })
  doctorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  appointmentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vitals' })
  vitalsId?: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: String, enum: ConsultationStatus, default: ConsultationStatus.SCHEDULED })
  status: ConsultationStatus;

  @Prop({ required: true })
  chiefComplaint: string;

  @Prop()
  historyOfPresentIllness?: string;

  @Prop()
  pastMedicalHistory?: string;

  @Prop()
  familyHistory?: string;

  @Prop()
  socialHistory?: string;

  @Prop()
  allergies?: string;

  @Prop()
  currentMedications?: string;

  @Prop({ type: PhysicalExaminationSchema })
  physicalExamination?: PhysicalExamination;

  @Prop({ type: [DiagnosisSchema], default: [] })
  diagnoses: Diagnosis[];

  @Prop()
  treatmentPlan?: string;

  @Prop({ type: [PrescriptionSchema], default: [] })
  prescriptions: Prescription[];

  @Prop({ type: [OrderedExamSchema], default: [] })
  orderedExams: OrderedExam[];

  @Prop()
  clinicalNotes?: string;

  @Prop()
  followUpDate?: Date;

  @Prop()
  followUpInstructions?: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ConsultationSchema = SchemaFactory.createForClass(Consultation);

// Indexes for common queries
ConsultationSchema.index({ clinicId: 1, patientId: 1 });
ConsultationSchema.index({ clinicId: 1, doctorId: 1 });
ConsultationSchema.index({ clinicId: 1, date: -1 });
ConsultationSchema.index({ clinicId: 1, status: 1 });
