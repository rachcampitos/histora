import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsEnum, IsNumber, Min, Max, IsBoolean, Matches, Length, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== Phone Verification ====================

export class SendPhoneCodeDto {
  @ApiProperty({ example: '+51987654321', description: 'Phone number with country code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Phone number must be in E.164 format' })
  phone: string;
}

export class VerifyPhoneCodeDto {
  @ApiProperty({ example: '+51987654321' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456', description: '6-digit verification code' })
  @IsString()
  @Length(6, 6)
  code: string;
}

// ==================== Email Verification ====================

export class SendEmailCodeDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: 'Juan', description: 'User name for email template' })
  @IsString()
  @IsOptional()
  userName?: string;
}

export class VerifyEmailCodeDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit verification code' })
  @IsString()
  @Length(6, 6)
  code: string;
}

// ==================== DNI Verification ====================

export class UploadDniDto {
  @ApiProperty({ example: '12345678', description: 'DNI number (8 digits)' })
  @IsString()
  @Length(8, 8)
  @Matches(/^\d{8}$/, { message: 'DNI must be exactly 8 digits' })
  dniNumber: string;

  @ApiProperty({ description: 'Front photo URL (from Cloudinary)' })
  @IsString()
  @IsNotEmpty()
  frontPhotoUrl: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frontPhotoPublicId?: string;

  @ApiProperty({ description: 'Back photo URL (from Cloudinary)' })
  @IsString()
  @IsNotEmpty()
  backPhotoUrl: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  backPhotoPublicId?: string;
}

// ==================== Selfie Verification ====================

export class UploadSelfieDto {
  @ApiProperty({ description: 'Selfie photo URL (from Cloudinary)' })
  @IsString()
  @IsNotEmpty()
  selfiePhotoUrl: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  selfiePhotoPublicId?: string;
}

// ==================== Payment Verification ====================

export class VerifyPaymentMethodDto {
  @ApiProperty({ enum: ['card', 'yape', 'plin', 'other'] })
  @IsEnum(['card', 'yape', 'plin', 'other'])
  type: string;

  @ApiPropertyOptional({ example: '4242', description: 'Last 4 digits of card' })
  @IsString()
  @IsOptional()
  @Length(4, 4)
  last4?: string;

  @ApiPropertyOptional({ description: 'Payment method token/reference' })
  @IsString()
  @IsOptional()
  paymentReference?: string;
}

// ==================== Emergency Contacts ====================

export class EmergencyContactDto {
  @ApiProperty({ example: 'María García' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+51987654321' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Phone number must be in E.164 format' })
  phone: string;

  @ApiProperty({ example: 'Madre', description: 'Relationship to patient' })
  @IsString()
  @IsNotEmpty()
  relationship: string;
}

export class SetEmergencyContactsDto {
  @ApiProperty({ type: [EmergencyContactDto], description: 'Minimum 2 emergency contacts' })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  contacts: EmergencyContactDto[];
}

// ==================== Flag Management ====================

export class AddFlagDto {
  @ApiProperty({ enum: ['yellow', 'red'] })
  @IsEnum(['yellow', 'red'])
  type: string;

  @ApiProperty({ example: 'Patient was verbally aggressive' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Service request ID related to the incident' })
  @IsString()
  @IsOptional()
  serviceRequestId?: string;
}

// ==================== Trust Score ====================

export class UpdateTrustScoreDto {
  @ApiProperty({ example: 5, description: 'Points to add (positive) or subtract (negative)' })
  @IsNumber()
  @Min(-100)
  @Max(100)
  points: number;

  @ApiProperty({ example: 'Service completed with 5 stars' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

// ==================== Admin Actions ====================

export class SuspendPatientDto {
  @ApiProperty({ example: 'Multiple red flags reported' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Duration in days. If not provided, indefinite.' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  durationDays?: number;
}

export class ReactivatePatientDto {
  @ApiProperty({ example: 'Investigation completed, patient cleared' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'New trust score to set (0-100)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  newTrustScore?: number;
}

// ==================== Video Call Verification ====================

export class CompleteVideoCallDto {
  @ApiProperty({ example: 'Identity confirmed, patient verified' })
  @IsString()
  @IsNotEmpty()
  notes: string;

  @ApiProperty({ description: 'Whether the verification was successful' })
  @IsBoolean()
  verified: boolean;
}

// ==================== Response DTOs ====================

export class VerificationStatusDto {
  @ApiProperty()
  verificationLevel: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  trustScore: number;

  @ApiProperty()
  phoneVerified: boolean;

  @ApiProperty()
  dniVerified: boolean;

  @ApiProperty()
  selfieVerified: boolean;

  @ApiProperty()
  paymentVerified: boolean;

  @ApiProperty()
  emergencyContactsCount: number;

  @ApiProperty()
  totalServices: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  flagsCount: { yellow: number; red: number };

  @ApiProperty({ required: false })
  verifiedAt?: Date;
}

export class PatientProfileForNurseDto {
  @ApiProperty()
  patientId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  gender: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  verificationLevel: number;

  @ApiProperty()
  trustScore: number;

  @ApiProperty()
  totalServices: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  badges: string[];

  @ApiProperty()
  recentTags: string[];

  @ApiProperty()
  recentComments: string[];

  @ApiProperty()
  hasYellowFlags: boolean;

  @ApiProperty()
  memberSince: Date;
}
