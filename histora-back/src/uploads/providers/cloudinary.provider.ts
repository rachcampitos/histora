import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface UploadOptions {
  folder?: string;
  transformation?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    gravity?: 'face' | 'center' | 'auto';
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
  };
  resourceType?: 'image' | 'video' | 'raw';
  tags?: string[];
}

export interface UploadResult {
  success: boolean;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

@Injectable()
export class CloudinaryProvider implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryProvider.name);
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly configured: boolean;

  constructor(private configService: ConfigService) {
    this.cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME', '');
    this.apiKey = this.configService.get<string>('CLOUDINARY_API_KEY', '');
    this.apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET', '');
    this.configured = !!(this.cloudName && this.apiKey && this.apiSecret);

    if (!this.configured) {
      this.logger.warn('Cloudinary not configured - uploads will be mocked');
    }
  }

  onModuleInit() {
    if (this.configured) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
      });
      this.logger.log('Cloudinary configured successfully');
      this.logger.log(`Cloud: ${this.cloudName}, Key: ${this.apiKey.slice(0, 6)}...`);
    } else {
      this.logger.warn(`Cloud: "${this.cloudName}", Key: "${this.apiKey}", Secret length: ${this.apiSecret?.length || 0}`);
    }
  }

  // Upload file from buffer
  async uploadBuffer(buffer: Buffer, filename: string, options: UploadOptions = {}): Promise<UploadResult> {
    if (!this.configured) {
      return this.mockUpload(filename, options);
    }

    try {
      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: options.folder || 'histora',
            public_id: filename.replace(/\.[^/.]+$/, ''),
            resource_type: options.resourceType || 'image',
            transformation: options.transformation ? [options.transformation] : undefined,
            tags: options.tags,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as UploadApiResponse);
          }
        );
        uploadStream.end(buffer);
      });

      this.logger.log(`[Cloudinary] File uploaded: ${result.public_id}`);
      return {
        success: true,
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      };
    } catch (error) {
      this.logger.error(`[Cloudinary] Upload failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Upload file from base64 string
  async uploadBase64(base64Data: string, filename: string, options: UploadOptions = {}): Promise<UploadResult> {
    if (!this.configured) {
      return this.mockUpload(filename, options);
    }

    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(
        `data:image/png;base64,${base64Data}`,
        {
          folder: options.folder || 'histora',
          public_id: filename.replace(/\.[^/.]+$/, ''), // Remove extension
          transformation: options.transformation ? [options.transformation] : undefined,
          tags: options.tags,
          resource_type: options.resourceType || 'image',
        }
      );

      this.logger.log(`[Cloudinary] Base64 file uploaded: ${result.public_id}`);
      return {
        success: true,
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      };
    } catch (error) {
      this.logger.error(`[Cloudinary] Base64 upload failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Delete file by public ID
  async delete(publicId: string): Promise<DeleteResult> {
    if (!this.configured) {
      this.logger.log(`[DEV] Would delete: ${publicId}`);
      return { success: true };
    }

    try {
      await cloudinary.uploader.destroy(publicId);

      this.logger.log(`[Cloudinary] File deleted: ${publicId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`[Cloudinary] Delete failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate optimized URL with transformations
  getOptimizedUrl(publicId: string, transformations: UploadOptions['transformation'] = {}): string {
    const {
      width = 400,
      height = 400,
      crop = 'fill',
      gravity = 'face',
      quality = 'auto',
      format = 'auto',
    } = transformations;

    const transformString = `w_${width},h_${height},c_${crop},g_${gravity},q_${quality},f_${format}`;

    if (this.configured) {
      return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformString}/${publicId}`;
    }

    return `https://via.placeholder.com/${width}x${height}`;
  }

  // Generate thumbnail URL
  getThumbnailUrl(publicId: string, size: number = 100): string {
    return this.getOptimizedUrl(publicId, {
      width: size,
      height: size,
      crop: 'thumb',
      gravity: 'face',
    });
  }

  // Mock upload for development
  private mockUpload(filename: string, options: UploadOptions): UploadResult {
    const publicId = `dev_${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}`;

    this.logger.log('='.repeat(50));
    this.logger.log('[DEV CLOUDINARY UPLOAD]');
    this.logger.log(`Filename: ${filename}`);
    this.logger.log(`Folder: ${options.folder || 'histora'}`);
    this.logger.log(`Public ID: ${publicId}`);
    this.logger.log('='.repeat(50));

    return {
      success: true,
      url: `https://via.placeholder.com/400x400?text=${encodeURIComponent(filename)}`,
      secureUrl: `https://via.placeholder.com/400x400?text=${encodeURIComponent(filename)}`,
      publicId,
      format: 'jpg',
      width: 400,
      height: 400,
      bytes: 1024,
    };
  }

  // Check if Cloudinary is configured
  isConfigured(): boolean {
    return this.configured;
  }
}
