import {
  IsNumber,
  IsOptional,
  IsString,
  IsMongoId,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class CreateVitalsDto {
  @IsMongoId()
  patientId: string;

  @IsMongoId()
  @IsOptional()
  consultationId?: string;

  @IsDateString()
  @IsOptional()
  recordedAt?: string;

  @IsNumber()
  @IsOptional()
  @Min(30)
  @Max(45)
  temperature?: number;

  @IsNumber()
  @IsOptional()
  @Min(30)
  @Max(250)
  heartRate?: number;

  @IsNumber()
  @IsOptional()
  @Min(5)
  @Max(60)
  respiratoryRate?: number;

  @IsNumber()
  @IsOptional()
  @Min(50)
  @Max(300)
  systolicBP?: number;

  @IsNumber()
  @IsOptional()
  @Min(30)
  @Max(200)
  diastolicBP?: number;

  @IsNumber()
  @IsOptional()
  @Min(50)
  @Max(100)
  oxygenSaturation?: number;

  @IsNumber()
  @IsOptional()
  @Min(0.5)
  @Max(500)
  weight?: number;

  @IsNumber()
  @IsOptional()
  @Min(20)
  @Max(300)
  height?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  painLevel?: number;

  @IsNumber()
  @IsOptional()
  @Min(20)
  @Max(600)
  bloodGlucose?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
