import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

/**
 * OptimizedImageComponent
 *
 * A reusable image component with:
 * - Native lazy loading
 * - Skeleton loader while loading
 * - Cloudinary URL transformations for size optimization
 * - WebP format support (automatic via Cloudinary f_auto)
 * - Fallback image support
 * - Error handling
 */
@Component({
  selector: 'app-optimized-image',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <!-- Skeleton loader -->
    @if (isLoading() && showSkeleton) {
      <div
        class="skeleton-loader"
        [style.width.px]="width"
        [style.height.px]="height"
        [style.border-radius]="borderRadius"
        role="progressbar"
        aria-label="Cargando imagen">
        <ion-skeleton-text [animated]="true"></ion-skeleton-text>
      </div>
    }

    <!-- Actual image -->
    <img
      [src]="optimizedSrc()"
      [alt]="alt"
      [width]="width"
      [height]="height"
      [style.border-radius]="borderRadius"
      [style.object-fit]="objectFit"
      [class.loaded]="!isLoading()"
      [class.hidden]="isLoading() && showSkeleton"
      [loading]="loading"
      (load)="onImageLoad()"
      (error)="onImageError()"
    />
  `,
  styles: [`
    :host {
      display: inline-block;
      position: relative;
      overflow: hidden;
    }

    .skeleton-loader {
      position: absolute;
      top: 0;
      left: 0;
      overflow: hidden;
      background: var(--ion-color-light, #f4f4f4);

      ion-skeleton-text {
        width: 100%;
        height: 100%;
        margin: 0;
      }
    }

    img {
      display: block;
      transition: opacity 0.3s ease;

      &.hidden {
        opacity: 0;
        position: absolute;
      }

      &.loaded {
        opacity: 1;
        position: relative;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptimizedImageComponent implements OnChanges {
  /** Source URL of the image */
  @Input() src: string | null | undefined = '';

  /** Alt text for accessibility */
  @Input() alt = '';

  /** Width in pixels */
  @Input() width = 100;

  /** Height in pixels */
  @Input() height = 100;

  /** Border radius (CSS value) */
  @Input() borderRadius = '0';

  /** Object fit CSS property */
  @Input() objectFit: 'cover' | 'contain' | 'fill' | 'none' = 'cover';

  /** Fallback image URL */
  @Input() fallback = 'assets/img/default-avatar.png';

  /** Show skeleton loader while loading */
  @Input() showSkeleton = true;

  /** Native loading attribute: 'lazy' | 'eager' */
  @Input() loading: 'lazy' | 'eager' = 'lazy';

  /** Cloudinary crop mode */
  @Input() crop: 'fill' | 'fit' | 'scale' | 'thumb' | 'face' = 'fill';

  /** Image quality (auto for Cloudinary optimization) */
  @Input() quality: 'auto' | number = 'auto';

  /** Output event when image loads */
  @Output() loaded = new EventEmitter<void>();

  /** Output event when image fails to load */
  @Output() error = new EventEmitter<void>();

  isLoading = signal(true);
  private hasError = signal(false);
  private currentSrc = signal<string>('');

  /**
   * Computed optimized source URL
   * Applies Cloudinary transformations if applicable
   */
  optimizedSrc = computed(() => {
    const src = this.currentSrc();

    if (!src || this.hasError()) {
      return this.fallback;
    }

    // Check if it's a Cloudinary URL
    if (this.isCloudinaryUrl(src)) {
      return this.getCloudinaryOptimizedUrl(src);
    }

    return src;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src']) {
      this.currentSrc.set(this.src || '');
      this.hasError.set(false);
      this.isLoading.set(true);
    }
  }

  onImageLoad(): void {
    this.isLoading.set(false);
    this.loaded.emit();
  }

  onImageError(): void {
    this.hasError.set(true);
    this.isLoading.set(false);
    this.error.emit();
  }

  /**
   * Check if URL is a Cloudinary URL
   */
  private isCloudinaryUrl(url: string): boolean {
    return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
  }

  /**
   * Transform Cloudinary URL to add optimizations
   * Adds width, height, crop, quality, and format transformations
   */
  private getCloudinaryOptimizedUrl(url: string): string {
    try {
      // Parse existing transformations from URL
      // Format: https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{public_id}
      const uploadIndex = url.indexOf('/upload/');
      if (uploadIndex === -1) return url;

      const baseUrl = url.substring(0, uploadIndex + 8); // Include '/upload/'
      const restUrl = url.substring(uploadIndex + 8);

      // Build transformation string
      const transformations: string[] = [];

      // Size transformations
      if (this.width) transformations.push(`w_${this.width}`);
      if (this.height) transformations.push(`h_${this.height}`);

      // Crop mode
      if (this.crop === 'face') {
        transformations.push('c_fill', 'g_face');
      } else {
        transformations.push(`c_${this.crop}`);
      }

      // Quality (auto = automatic optimization)
      if (this.quality === 'auto') {
        transformations.push('q_auto');
      } else {
        transformations.push(`q_${this.quality}`);
      }

      // Format: auto delivers WebP/AVIF when supported
      transformations.push('f_auto');

      // Check if URL already has transformations
      const hasExistingTransformations = /^[a-z]_/.test(restUrl.split('/')[0]);

      if (hasExistingTransformations) {
        // Replace existing transformations
        const publicIdStart = restUrl.indexOf('/') + 1;
        const publicId = restUrl.substring(publicIdStart);
        return `${baseUrl}${transformations.join(',')}/${publicId}`;
      } else {
        // Add transformations before public ID
        return `${baseUrl}${transformations.join(',')}/${restUrl}`;
      }
    } catch {
      return url;
    }
  }
}
