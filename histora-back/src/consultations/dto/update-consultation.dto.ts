import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateConsultationDto } from './create-consultation.dto';
import { IsEnum, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ConsultationStatus } from '../schema/consultation.schema';

class ExamResultDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  results?: string;

  @IsOptional()
  @IsString()
  resultDate?: string;
}

export class UpdateConsultationDto extends PartialType(
  OmitType(CreateConsultationDto, ['patientId', 'doctorId', 'appointmentId'] as const),
) {}

export class CompleteConsultationDto {
  @IsOptional()
  @IsString()
  treatmentPlan?: string;

  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @IsOptional()
  @IsString()
  followUpDate?: string;

  @IsOptional()
  @IsString()
  followUpInstructions?: string;
}

export class UpdateConsultationStatusDto {
  @IsEnum(ConsultationStatus)
  status: ConsultationStatus;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class AddExamResultsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamResultDto)
  examResults: ExamResultDto[];
}
