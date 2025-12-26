import {
  IsString,
  IsOptional,
  IsMongoId,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConsultationStatus, DiagnosisType } from '../schema/consultation.schema';

export class DiagnosisDto {
  @IsString()
  code: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(DiagnosisType)
  type?: DiagnosisType;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PrescriptionDto {
  @IsString()
  medication: string;

  @IsString()
  dosage: string;

  @IsString()
  frequency: string;

  @IsString()
  duration: string;

  @IsOptional()
  @IsString()
  route?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsBoolean()
  isControlled?: boolean;
}

export class OrderedExamDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;
}

export class PhysicalExaminationDto {
  @IsOptional()
  @IsString()
  generalAppearance?: string;

  @IsOptional()
  @IsString()
  head?: string;

  @IsOptional()
  @IsString()
  eyes?: string;

  @IsOptional()
  @IsString()
  ears?: string;

  @IsOptional()
  @IsString()
  nose?: string;

  @IsOptional()
  @IsString()
  throat?: string;

  @IsOptional()
  @IsString()
  neck?: string;

  @IsOptional()
  @IsString()
  chest?: string;

  @IsOptional()
  @IsString()
  lungs?: string;

  @IsOptional()
  @IsString()
  heart?: string;

  @IsOptional()
  @IsString()
  abdomen?: string;

  @IsOptional()
  @IsString()
  extremities?: string;

  @IsOptional()
  @IsString()
  skin?: string;

  @IsOptional()
  @IsString()
  neurological?: string;

  @IsOptional()
  @IsString()
  musculoskeletal?: string;

  @IsOptional()
  @IsString()
  other?: string;
}

export class CreateConsultationDto {
  @IsMongoId()
  patientId: string;

  @IsMongoId()
  doctorId: string;

  @IsOptional()
  @IsMongoId()
  appointmentId?: string;

  @IsOptional()
  @IsMongoId()
  vitalsId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;

  @IsString()
  chiefComplaint: string;

  @IsOptional()
  @IsString()
  historyOfPresentIllness?: string;

  @IsOptional()
  @IsString()
  pastMedicalHistory?: string;

  @IsOptional()
  @IsString()
  familyHistory?: string;

  @IsOptional()
  @IsString()
  socialHistory?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  currentMedications?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PhysicalExaminationDto)
  physicalExamination?: PhysicalExaminationDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisDto)
  diagnoses?: DiagnosisDto[];

  @IsOptional()
  @IsString()
  treatmentPlan?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionDto)
  prescriptions?: PrescriptionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderedExamDto)
  orderedExams?: OrderedExamDto[];

  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsString()
  followUpInstructions?: string;
}
