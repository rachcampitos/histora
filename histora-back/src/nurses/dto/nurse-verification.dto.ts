import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '../schema/nurse-verification.schema';

export class UploadVerificationDocumentDto {
  @ApiProperty({ description: 'Base64 encoded image data' })
  @IsString()
  @IsNotEmpty()
  imageData: string;

  @ApiProperty({
    description: 'Type of document',
    enum: ['cep_front', 'cep_back', 'dni_front', 'dni_back', 'selfie_with_dni'],
  })
  @IsEnum(['cep_front', 'cep_back', 'dni_front', 'dni_back', 'selfie_with_dni'])
  documentType: 'cep_front' | 'cep_back' | 'dni_front' | 'dni_back' | 'selfie_with_dni';

  @ApiPropertyOptional({ description: 'MIME type of the image' })
  @IsString()
  @IsOptional()
  mimeType?: string;
}

export class SubmitVerificationDto {
  @ApiProperty({ description: 'DNI number of the nurse' })
  @IsString()
  @IsNotEmpty()
  dniNumber: string;

  @ApiProperty({ description: 'Full name as appears on DNI' })
  @IsString()
  @IsNotEmpty()
  fullNameOnDni: string;

  @ApiProperty({
    description: 'Array of documents to upload',
    type: [UploadVerificationDocumentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadVerificationDocumentDto)
  documents: UploadVerificationDocumentDto[];
}

export class ReviewVerificationDto {
  @ApiProperty({
    description: 'New verification status',
    enum: [VerificationStatus.APPROVED, VerificationStatus.REJECTED],
  })
  @IsEnum([VerificationStatus.APPROVED, VerificationStatus.REJECTED])
  status: VerificationStatus.APPROVED | VerificationStatus.REJECTED;

  @ApiPropertyOptional({ description: 'Notes from the reviewer' })
  @IsString()
  @IsOptional()
  reviewNotes?: string;

  @ApiPropertyOptional({ description: 'Reason for rejection (required if status is rejected)' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class VerificationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: VerificationStatus,
  })
  @IsEnum(VerificationStatus)
  @IsOptional()
  status?: VerificationStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  limit?: number;
}

export class VerificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nurseId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  status: VerificationStatus;

  @ApiProperty()
  dniNumber?: string;

  @ApiProperty()
  fullNameOnDni?: string;

  @ApiProperty()
  documents: {
    url: string;
    type: string;
    uploadedAt: Date;
  }[];

  @ApiPropertyOptional()
  reviewedAt?: Date;

  @ApiPropertyOptional()
  reviewNotes?: string;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiProperty()
  attemptNumber: number;

  @ApiProperty()
  createdAt: Date;

  // Official CEP photo from registry
  @ApiPropertyOptional()
  officialCepPhotoUrl?: string;

  // CEP identity confirmation
  @ApiPropertyOptional()
  cepIdentityConfirmed?: boolean;

  @ApiPropertyOptional()
  cepIdentityConfirmedAt?: Date;

  // CEP validation result from official registry
  @ApiPropertyOptional({
    description: 'CEP validation result from official CEP registry',
  })
  cepValidation?: {
    isValid?: boolean;
    region?: string;
    isHabil?: boolean;
    status?: string;
    validatedAt?: Date;
  };

  // Include nurse info for admin view
  @ApiPropertyOptional()
  nurse?: {
    cepNumber: string;
    specialties: string[];
    officialCepPhotoUrl?: string;
    selfieUrl?: string;
    cepRegisteredName?: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      avatar?: string;
    };
  };
}
