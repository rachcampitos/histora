import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsObject,
  IsArray,
  ValidateNested,
  IsMongoId,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AllergyDto {
  @IsString()
  @IsNotEmpty()
  allergen: string;

  @IsOptional()
  @IsString()
  reaction?: string;

  @IsOptional()
  @IsEnum(['mild', 'moderate', 'severe'])
  severity?: 'mild' | 'moderate' | 'severe';

  @IsOptional()
  @IsDateString()
  diagnosedDate?: string;
}

export class ChronicConditionDto {
  @IsString()
  @IsNotEmpty()
  condition: string;

  @IsOptional()
  @IsString()
  icdCode?: string;

  @IsOptional()
  @IsDateString()
  diagnosedDate?: string;

  @IsOptional()
  @IsEnum(['active', 'controlled', 'resolved'])
  status?: 'active' | 'controlled' | 'resolved';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SurgeryDto {
  @IsString()
  @IsNotEmpty()
  procedure: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  hospital?: string;

  @IsOptional()
  @IsString()
  surgeon?: string;

  @IsOptional()
  @IsString()
  complications?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FamilyHistoryDto {
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @IsString()
  @IsNotEmpty()
  condition: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  ageAtOnset?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CurrentMedicationDto {
  @IsString()
  @IsNotEmpty()
  medication: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  prescribedBy?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class VaccinationDto {
  @IsString()
  @IsNotEmpty()
  vaccine: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  doseNumber?: number;

  @IsOptional()
  @IsString()
  lot?: string;

  @IsOptional()
  @IsString()
  administeredBy?: string;

  @IsOptional()
  @IsDateString()
  nextDoseDate?: string;
}

export class CreateClinicalHistoryDto {
  @IsMongoId()
  patientId: string;

  @IsMongoId()
  doctorId: string;

  @IsOptional()
  @IsMongoId()
  consultationId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsString()
  @IsNotEmpty()
  reasonForVisit: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  treatment?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Medical background
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllergyDto)
  allergies?: AllergyDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChronicConditionDto)
  chronicConditions?: ChronicConditionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurgeryDto)
  surgicalHistory?: SurgeryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyHistoryDto)
  familyHistory?: FamilyHistoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurrentMedicationDto)
  currentMedications?: CurrentMedicationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VaccinationDto)
  vaccinations?: VaccinationDto[];

  // Lifestyle
  @IsOptional()
  @IsEnum(['never', 'former', 'current'])
  smokingStatus?: 'never' | 'former' | 'current';

  @IsOptional()
  @IsEnum(['none', 'occasional', 'moderate', 'heavy'])
  alcoholUse?: 'none' | 'occasional' | 'moderate' | 'heavy';

  @IsOptional()
  @IsEnum(['sedentary', 'light', 'moderate', 'active'])
  exerciseFrequency?: 'sedentary' | 'light' | 'moderate' | 'active';

  @IsOptional()
  @IsString()
  diet?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  // Gynecological history
  @IsOptional()
  @IsNumber()
  @Min(0)
  pregnancies?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  liveChildren?: number;

  @IsOptional()
  @IsDateString()
  lastMenstrualPeriod?: string;

  @IsOptional()
  @IsString()
  contraceptiveMethod?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}
