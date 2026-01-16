import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '../../nurses/schema/nurse-verification.schema';

export class NurseQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, email, or CEP number' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by verification status', enum: VerificationStatus })
  @IsEnum(VerificationStatus)
  @IsOptional()
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsString()
  @IsOptional()
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({ description: 'Filter by availability' })
  @IsString()
  @IsOptional()
  availability?: 'available' | 'unavailable';

  @ApiPropertyOptional({ description: 'Filter by district' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  limit?: number;
}

export class UpdateNurseDto {
  @ApiPropertyOptional({ description: 'Nurse specialties' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialties?: string[];

  @ApiPropertyOptional({ description: 'Nurse bio' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ description: 'Years of experience' })
  @IsNumber()
  @Min(0)
  @Max(50)
  @IsOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ description: 'Service radius in km' })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  serviceRadius?: number;

  @ApiPropertyOptional({ description: 'Extra charge per km beyond radius' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  extraChargePerKm?: number;

  @ApiPropertyOptional({ description: 'Minimum service fee' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumServiceFee?: number;

  @ApiPropertyOptional({ description: 'Is nurse active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is nurse available for new services' })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}

export class NurseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  cepNumber: string;

  @ApiProperty()
  cepVerified: boolean;

  @ApiPropertyOptional()
  cepVerifiedAt?: Date;

  @ApiProperty()
  verificationStatus: VerificationStatus;

  @ApiProperty()
  specialties: string[];

  @ApiPropertyOptional()
  bio?: string;

  @ApiProperty()
  yearsOfExperience: number;

  @ApiProperty()
  serviceRadius: number;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty()
  totalServicesCompleted: number;

  @ApiProperty()
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };

  @ApiPropertyOptional()
  location?: {
    address?: string;
    district?: string;
    city?: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PatientQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsString()
  @IsOptional()
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  limit?: number;
}

export class PatientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isEmailVerified: boolean;

  @ApiProperty()
  authProvider: string;

  @ApiProperty()
  totalServicesRequested: number;

  @ApiProperty()
  totalServicesCompleted: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  lastServiceAt?: Date;
}
