import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { UploadProfilePhotoDto, UploadDocumentDto, FileType } from './dto/upload-file.dto';

// Optional: Create a File schema to track uploads
interface FileMetadata {
  publicId: string;
  url: string;
  thumbnailUrl?: string;
  type: FileType;
  originalFilename?: string;
  mimeType?: string;
  size?: number;
  uploadedBy: Types.ObjectId;
  clinicId: Types.ObjectId;
  patientId?: Types.ObjectId;
  consultationId?: Types.ObjectId;
  createdAt: Date;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private readonly allowedDocumentTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  private readonly allowedCvTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  private readonly maxImageSize = 5 * 1024 * 1024; // 5MB
  private readonly maxDocumentSize = 10 * 1024 * 1024; // 10MB
  private readonly maxCvSize = 10 * 1024 * 1024; // 10MB

  constructor(private cloudinaryProvider: CloudinaryProvider) {}

  // Upload profile photo for user/doctor/patient
  async uploadProfilePhoto(
    dto: UploadProfilePhotoDto,
    userId: string,
    clinicId?: string,
    targetType: 'user' | 'doctor' | 'patient' = 'user',
    targetId?: string
  ): Promise<{ url: string; thumbnailUrl: string; publicId: string }> {
    // Validate image data
    const base64Data = this.extractBase64Data(dto.imageData);
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > this.maxImageSize) {
      throw new BadRequestException('Image size exceeds 5MB limit');
    }

    // Determine MIME type from base64 or use provided
    const mimeType = dto.mimeType || this.detectMimeType(dto.imageData);
    if (!this.allowedImageTypes.includes(mimeType)) {
      throw new BadRequestException('Invalid image format. Allowed: JPEG, PNG, WebP, GIF');
    }

    // Generate unique filename
    const ext = mimeType.split('/')[1];
    const filename = `${targetType}_${targetId || userId}_${Date.now()}.${ext}`;
    const folder = clinicId ? `histora/${clinicId}/profiles` : 'histora/profiles';

    // Upload to Cloudinary with face-focused crop
    const result = await this.cloudinaryProvider.uploadBase64(base64Data, filename, {
      folder,
      transformation: {
        width: 400,
        height: 400,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto',
        format: 'auto',
      },
    });

    if (!result.success) {
      throw new BadRequestException(`Upload failed: ${result.error}`);
    }

    // Generate thumbnail URL
    const thumbnailUrl = this.cloudinaryProvider.getThumbnailUrl(result.publicId!, 100);

    this.logger.log(`Profile photo uploaded for ${targetType} ${targetId || userId}`);

    return {
      url: result.secureUrl!,
      thumbnailUrl,
      publicId: result.publicId!,
    };
  }

  // Upload patient document (lab results, prescriptions, etc.)
  async uploadDocument(
    dto: UploadDocumentDto,
    userId: string,
    clinicId: string
  ): Promise<{ url: string; publicId: string }> {
    const base64Data = this.extractBase64Data(dto.fileData);
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > this.maxDocumentSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Determine folder based on document type
    const folderMap: Record<FileType, string> = {
      [FileType.PROFILE_PHOTO]: `histora/${clinicId}/profiles`,
      [FileType.PATIENT_DOCUMENT]: `histora/${clinicId}/patients/${dto.patientId}/documents`,
      [FileType.LAB_RESULT]: `histora/${clinicId}/patients/${dto.patientId}/lab-results`,
      [FileType.PRESCRIPTION]: `histora/${clinicId}/patients/${dto.patientId}/prescriptions`,
      [FileType.CLINIC_LOGO]: `histora/${clinicId}/branding`,
      [FileType.CONSULTATION_ATTACHMENT]: `histora/${clinicId}/consultations/${dto.consultationId}`,
    };

    const folder = folderMap[dto.type] || `histora/${clinicId}/documents`;
    const filename = `${Date.now()}_${dto.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const result = await this.cloudinaryProvider.uploadBase64(base64Data, filename, {
      folder,
      resourceType: dto.type === FileType.LAB_RESULT ? 'raw' : 'image',
    });

    if (!result.success) {
      throw new BadRequestException(`Upload failed: ${result.error}`);
    }

    this.logger.log(`Document uploaded: ${dto.type} for clinic ${clinicId}`);

    return {
      url: result.secureUrl!,
      publicId: result.publicId!,
    };
  }

  // Upload clinic logo
  async uploadClinicLogo(
    dto: UploadProfilePhotoDto,
    clinicId: string,
    userId: string
  ): Promise<{ url: string; thumbnailUrl: string; publicId: string }> {
    const base64Data = this.extractBase64Data(dto.imageData);
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > this.maxImageSize) {
      throw new BadRequestException('Image size exceeds 5MB limit');
    }

    const mimeType = dto.mimeType || this.detectMimeType(dto.imageData);
    if (!this.allowedImageTypes.includes(mimeType)) {
      throw new BadRequestException('Invalid image format. Allowed: JPEG, PNG, WebP, GIF');
    }

    const ext = mimeType.split('/')[1];
    const filename = `logo_${clinicId}_${Date.now()}.${ext}`;
    const folder = `histora/${clinicId}/branding`;

    const result = await this.cloudinaryProvider.uploadBase64(base64Data, filename, {
      folder,
      transformation: {
        width: 300,
        height: 300,
        crop: 'fit',
        quality: 'auto',
        format: 'auto',
      },
    });

    if (!result.success) {
      throw new BadRequestException(`Upload failed: ${result.error}`);
    }

    const thumbnailUrl = this.cloudinaryProvider.getThumbnailUrl(result.publicId!, 60);

    this.logger.log(`Clinic logo uploaded for clinic ${clinicId}`);

    return {
      url: result.secureUrl!,
      thumbnailUrl,
      publicId: result.publicId!,
    };
  }

  // Upload nurse selfie for verification
  async uploadNurseSelfie(
    imageData: string,
    mimeType: string,
    nurseId: string,
    userId: string
  ): Promise<{ url: string; thumbnailUrl: string; publicId: string }> {
    const base64Data = this.extractBase64Data(imageData);
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > this.maxImageSize) {
      throw new BadRequestException('Image size exceeds 5MB limit');
    }

    const detectedMimeType = mimeType || this.detectMimeType(imageData);
    if (!this.allowedImageTypes.includes(detectedMimeType)) {
      throw new BadRequestException('Invalid image format. Allowed: JPEG, PNG, WebP');
    }

    const ext = detectedMimeType.split('/')[1];
    const filename = `selfie_${nurseId}_${Date.now()}.${ext}`;
    const folder = `histora/nurses/${nurseId}/verification`;

    // Upload with face detection for better cropping
    const result = await this.cloudinaryProvider.uploadBase64(base64Data, filename, {
      folder,
      transformation: {
        width: 600,
        height: 600,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto',
        format: 'auto',
      },
    });

    if (!result.success) {
      throw new BadRequestException(`Upload failed: ${result.error}`);
    }

    const thumbnailUrl = this.cloudinaryProvider.getThumbnailUrl(result.publicId!, 150);

    this.logger.log(`Selfie uploaded for nurse ${nurseId}`);

    return {
      url: result.secureUrl!,
      thumbnailUrl,
      publicId: result.publicId!,
    };
  }

  // Upload doctor CV (PDF or DOCX)
  async uploadDoctorCv(
    fileData: string,
    mimeType: string,
    doctorId: string,
    clinicId?: string
  ): Promise<{ url: string; publicId: string; format: string }> {
    const base64Data = this.extractBase64Data(fileData);
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > this.maxCvSize) {
      throw new BadRequestException('CV file size exceeds 10MB limit');
    }

    if (!this.allowedCvTypes.includes(mimeType)) {
      throw new BadRequestException('Invalid CV format. Allowed: PDF, DOCX');
    }

    // Determine format
    const format = mimeType === 'application/pdf' ? 'pdf' : 'docx';
    const filename = `cv_${doctorId}_${Date.now()}.${format}`;
    const folder = clinicId ? `histora/${clinicId}/doctors/${doctorId}/cv` : `histora/doctors/${doctorId}/cv`;

    const result = await this.cloudinaryProvider.uploadBase64(base64Data, filename, {
      folder,
      resourceType: 'raw', // For non-image files
    });

    if (!result.success) {
      throw new BadRequestException(`Upload failed: ${result.error}`);
    }

    this.logger.log(`CV uploaded for doctor ${doctorId}`);

    return {
      url: result.secureUrl!,
      publicId: result.publicId!,
      format,
    };
  }

  // Delete file
  async deleteFile(publicId: string): Promise<{ success: boolean }> {
    const result = await this.cloudinaryProvider.delete(publicId);

    if (!result.success) {
      throw new BadRequestException(`Delete failed: ${result.error}`);
    }

    return { success: true };
  }

  // Delete all files for a nurse (avatar, verification documents, etc.)
  async deleteNurseFiles(nurseId: string): Promise<{ success: boolean; deletedCount: number }> {
    try {
      // Delete all files in the nurse's verification folder
      const verificationResult = await this.cloudinaryProvider.deleteByPrefix(
        `histora/nurses/${nurseId}`
      );

      this.logger.log(`Deleted ${verificationResult.deletedCount || 0} files for nurse ${nurseId}`);

      return {
        success: true,
        deletedCount: verificationResult.deletedCount || 0,
      };
    } catch (error) {
      this.logger.error(`Error deleting nurse files: ${error.message}`);
      return { success: false, deletedCount: 0 };
    }
  }

  // Delete user avatar
  async deleteUserAvatar(avatarUrl: string): Promise<{ success: boolean }> {
    try {
      // Extract public ID from Cloudinary URL
      // URL format: https://res.cloudinary.com/{cloud}/image/upload/{version}/{public_id}.{format}
      const match = avatarUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
      if (match && match[1]) {
        const publicId = match[1];
        await this.cloudinaryProvider.delete(publicId);
        this.logger.log(`Deleted user avatar: ${publicId}`);
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      this.logger.error(`Error deleting user avatar: ${error.message}`);
      return { success: false };
    }
  }

  // Get optimized URL for a file
  getOptimizedUrl(publicId: string, width?: number, height?: number): string {
    return this.cloudinaryProvider.getOptimizedUrl(publicId, {
      width: width || 400,
      height: height || 400,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
    });
  }

  // Helper: Extract base64 data from data URL
  private extractBase64Data(data: string): string {
    if (data.includes('base64,')) {
      return data.split('base64,')[1];
    }
    return data;
  }

  // Helper: Detect MIME type from base64 data URL
  private detectMimeType(data: string): string {
    if (data.startsWith('data:')) {
      const match = data.match(/data:([^;]+);/);
      if (match) {
        return match[1];
      }
    }
    // Default to JPEG if can't detect
    return 'image/jpeg';
  }

  // Check if service is configured
  isConfigured(): boolean {
    return this.cloudinaryProvider.isConfigured();
  }
}
