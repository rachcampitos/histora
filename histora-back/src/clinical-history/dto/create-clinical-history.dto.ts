// dto/create-clinical-history.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreateClinicalHistoryDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  reasonForVisit: string;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsString()
  @IsOptional()
  treatment?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;
}
