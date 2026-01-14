import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeoPointDto {
  @ApiProperty({ example: 'Point' })
  @IsString()
  type: string = 'Point';

  @ApiProperty({ example: [-77.0428, -12.0464], description: '[longitude, latitude]' })
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;
}

export class NurseServiceDto {
  @ApiProperty({ example: 'Inyección intramuscular' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Aplicación de medicamentos vía intramuscular' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: [
      'injection',
      'wound_care',
      'catheter',
      'vital_signs',
      'iv_therapy',
      'blood_draw',
      'medication',
      'elderly_care',
      'post_surgery',
      'other',
    ],
  })
  @IsEnum([
    'injection',
    'wound_care',
    'catheter',
    'vital_signs',
    'iv_therapy',
    'blood_draw',
    'medication',
    'elderly_care',
    'post_surgery',
    'other',
  ])
  category: string;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(1)
  price: number;

  @ApiPropertyOptional({ example: 'PEN', default: 'PEN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 30, default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(15)
  durationMinutes?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateNurseDto {
  @ApiProperty({ example: 'CEP-12345' })
  @IsString()
  @IsNotEmpty()
  cepNumber: string;

  @ApiPropertyOptional({ example: ['Cuidados intensivos', 'Geriatría'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ example: 'Enfermera con 5 años de experiencia...' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ type: [NurseServiceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NurseServiceDto)
  services?: NurseServiceDto[];

  @ApiPropertyOptional({ type: GeoPointDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  location?: GeoPointDto;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  serviceRadius?: number;

  // CEP Verification fields (set during registration)
  @ApiPropertyOptional({ description: 'Whether CEP has been verified with official registry' })
  @IsOptional()
  @IsBoolean()
  cepVerified?: boolean;

  @ApiPropertyOptional({ description: 'Official photo URL from CEP registry' })
  @IsOptional()
  @IsString()
  officialCepPhotoUrl?: string;

  @ApiPropertyOptional({ description: 'Full name as registered in CEP' })
  @IsOptional()
  @IsString()
  cepRegisteredName?: string;

  @ApiPropertyOptional({ description: 'Selfie URL uploaded during registration' })
  @IsOptional()
  @IsString()
  selfieUrl?: string;

  @ApiPropertyOptional({
    description: 'Verification status',
    enum: ['pending', 'selfie_required', 'under_review', 'approved', 'rejected'],
  })
  @IsOptional()
  @IsString()
  verificationStatus?: string;
}
