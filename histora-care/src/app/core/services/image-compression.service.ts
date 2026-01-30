import { Injectable } from '@angular/core';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  maxSizeKB?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface CompressionResult {
  base64: string;
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
  format: string;
}

/**
 * ImageCompressionService
 *
 * Provides client-side image compression before upload to reduce:
 * - Upload time (especially on slow mobile connections)
 * - Server bandwidth
 * - Storage costs
 *
 * Features:
 * - Resize images to max dimensions while maintaining aspect ratio
 * - Compress quality while maintaining acceptable visual fidelity
 * - Convert to efficient formats (WebP when supported)
 * - Auto-retry with lower quality if size target not met
 */
@Injectable({
  providedIn: 'root',
})
export class ImageCompressionService {
  private readonly defaultOptions: CompressionOptions = {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8,
    maxSizeKB: 500,
    format: 'jpeg',
  };

  /**
   * Compress an image file
   * @param file The image file to compress
   * @param options Compression options
   * @returns Promise with compression result
   */
  async compressFile(
    file: File,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const opts = { ...this.defaultOptions, ...options };
    const originalSize = file.size;

    // Create image from file
    const image = await this.loadImage(file);

    // Calculate new dimensions
    const { width, height } = this.calculateDimensions(
      image.width,
      image.height,
      opts.maxWidth!,
      opts.maxHeight!
    );

    // Compress the image
    let result = await this.compressImage(image, width, height, opts.quality!, opts.format!);

    // If still too large, retry with lower quality
    if (opts.maxSizeKB && result.blob.size > opts.maxSizeKB * 1024) {
      const qualities = [0.7, 0.6, 0.5, 0.4];
      for (const q of qualities) {
        result = await this.compressImage(image, width, height, q, opts.format!);
        if (result.blob.size <= opts.maxSizeKB * 1024) break;
      }
    }

    return {
      ...result,
      originalSize,
      compressedSize: result.blob.size,
      compressionRatio: Math.round((1 - result.blob.size / originalSize) * 100),
    };
  }

  /**
   * Compress a base64 image string
   * @param base64 The base64 image data
   * @param options Compression options
   * @returns Promise with compression result
   */
  async compressBase64(
    base64: string,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const opts = { ...this.defaultOptions, ...options };

    // Extract pure base64 if it has data URL prefix
    const pureBase64 = base64.includes('base64,')
      ? base64.split('base64,')[1]
      : base64;

    const originalSize = Math.round((pureBase64.length * 3) / 4);

    // Create image from base64
    const image = await this.loadImageFromBase64(base64);

    // Calculate new dimensions
    const { width, height } = this.calculateDimensions(
      image.width,
      image.height,
      opts.maxWidth!,
      opts.maxHeight!
    );

    // Compress the image
    let result = await this.compressImage(image, width, height, opts.quality!, opts.format!);

    // If still too large, retry with lower quality
    if (opts.maxSizeKB && result.blob.size > opts.maxSizeKB * 1024) {
      const qualities = [0.7, 0.6, 0.5, 0.4];
      for (const q of qualities) {
        result = await this.compressImage(image, width, height, q, opts.format!);
        if (result.blob.size <= opts.maxSizeKB * 1024) break;
      }
    }

    return {
      ...result,
      originalSize,
      compressedSize: result.blob.size,
      compressionRatio: Math.round((1 - result.blob.size / originalSize) * 100),
    };
  }

  /**
   * Check if WebP is supported in the browser
   */
  isWebPSupported(): boolean {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Get optimal format for the current browser
   */
  getOptimalFormat(): 'webp' | 'jpeg' {
    return this.isWebPSupported() ? 'webp' : 'jpeg';
  }

  /**
   * Compress for profile photo (optimized settings)
   */
  async compressForProfile(
    file: File | string
  ): Promise<CompressionResult> {
    const options: CompressionOptions = {
      maxWidth: 600,
      maxHeight: 600,
      quality: 0.85,
      maxSizeKB: 200,
      format: this.getOptimalFormat(),
    };

    if (typeof file === 'string') {
      return this.compressBase64(file, options);
    }
    return this.compressFile(file, options);
  }

  /**
   * Compress for verification documents (higher quality)
   */
  async compressForDocument(
    file: File | string
  ): Promise<CompressionResult> {
    const options: CompressionOptions = {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.9,
      maxSizeKB: 1000,
      format: 'jpeg', // JPEG for documents to ensure compatibility
    };

    if (typeof file === 'string') {
      return this.compressBase64(file, options);
    }
    return this.compressFile(file, options);
  }

  /**
   * Compress for thumbnails (small size)
   */
  async compressForThumbnail(
    file: File | string
  ): Promise<CompressionResult> {
    const options: CompressionOptions = {
      maxWidth: 150,
      maxHeight: 150,
      quality: 0.8,
      maxSizeKB: 30,
      format: this.getOptimalFormat(),
    };

    if (typeof file === 'string') {
      return this.compressBase64(file, options);
    }
    return this.compressFile(file, options);
  }

  // Private helper methods

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private loadImageFromBase64(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      // Ensure proper data URL format
      if (!base64.startsWith('data:')) {
        base64 = `data:image/jpeg;base64,${base64}`;
      }
      img.src = base64;
    });
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    // Scale down if larger than max dimensions
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  private compressImage(
    image: HTMLImageElement,
    width: number,
    height: number,
    quality: number,
    format: string
  ): Promise<{ base64: string; blob: Blob; width: number; height: number; format: string }> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d')!;

      // Use better image smoothing for downscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw image
      ctx.drawImage(image, 0, 0, width, height);

      // Get mime type
      const mimeType = format === 'webp' ? 'image/webp' : format === 'png' ? 'image/png' : 'image/jpeg';

      // Get base64
      const base64 = canvas.toDataURL(mimeType, quality);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          resolve({
            base64,
            blob: blob!,
            width,
            height,
            format: mimeType,
          });
        },
        mimeType,
        quality
      );
    });
  }
}
