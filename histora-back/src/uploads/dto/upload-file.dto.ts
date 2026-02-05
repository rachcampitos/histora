import { IsString, IsOptional, IsEnum, IsMongoId, IsBase64, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FileType {
  PROFILE_PHOTO = 'profile_photo',
  PATIENT_DOCUMENT = 'patient_document',
  LAB_RESULT = 'lab_result',
  PRESCRIPTION = 'prescription',
  CLINIC_LOGO = 'clinic_logo',
  CONSULTATION_ATTACHMENT = 'consultation_attachment',
}

export class UploadProfilePhotoDto {
  @ApiProperty({ description: 'Base64 encoded image data' })
  @IsString()
  @MaxLength(5 * 1024 * 1024) // ~5MB base64
  imageData: string;

  @ApiPropertyOptional({ description: 'Image MIME type (image/jpeg, image/png)' })
  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class UploadDocumentDto {
  @ApiProperty({ description: 'Base64 encoded file data' })
  @IsString()
  @MaxLength(10 * 1024 * 1024) // ~10MB base64
  fileData: string;

  @ApiProperty({ description: 'Original filename' })
  @IsString()
  @MaxLength(255)
  filename: string;

  @ApiProperty({ enum: FileType, description: 'Type of document' })
  @IsEnum(FileType)
  type: FileType;

  @ApiPropertyOptional({ description: 'Patient ID if patient document' })
  @IsOptional()
  @IsMongoId()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Consultation ID if consultation attachment' })
  @IsOptional()
  @IsMongoId()
  consultationId?: string;

  @ApiPropertyOptional({ description: 'Document description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UploadCvDto {
  @ApiProperty({ description: 'Base64 encoded CV data (PDF or DOCX)' })
  @IsString()
  @MaxLength(15 * 1024 * 1024) // ~15MB base64 (to account for encoding overhead)
  fileData: string;

  @ApiProperty({ description: 'MIME type (application/pdf or application/vnd.openxmlformats-officedocument.wordprocessingml.document)' })
  @IsString()
  mimeType: string;
}

export class UploadSelfieDto {
  @ApiProperty({ description: 'Base64 encoded selfie image data' })
  @IsString()
  @MaxLength(5 * 1024 * 1024) // ~5MB base64
  imageData: string;

  @ApiPropertyOptional({ description: 'Image MIME type (image/jpeg, image/png)' })
  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class UploadDniPhotoDto {
  @ApiProperty({ description: 'Base64 encoded DNI photo data' })
  @IsString()
  @MaxLength(5 * 1024 * 1024) // ~5MB base64
  imageData: string;

  @ApiPropertyOptional({ description: 'Image MIME type (image/jpeg, image/png)' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty({ description: 'Side of the DNI (front or back)', enum: ['front', 'back'] })
  @IsString()
  side: 'front' | 'back';
}

export class DeleteFileDto {
  @ApiProperty({ description: 'Public ID of the file to delete' })
  @IsString()
  publicId: string;
}

export class FileResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  url?: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  publicId?: string;

  @ApiPropertyOptional()
  error?: string;
}
