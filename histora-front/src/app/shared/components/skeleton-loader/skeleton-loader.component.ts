import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonType = 'text' | 'title' | 'avatar' | 'thumbnail' | 'button' | 'card' | 'table-row';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper" [attr.aria-busy]="true" [attr.aria-label]="ariaLabel">
      <span class="sr-only">{{ ariaLabel }}</span>

      @switch (type) {
        @case ('text') {
          <div class="skeleton skeleton-text" [style.width]="width"></div>
        }
        @case ('title') {
          <div class="skeleton skeleton-title" [style.width]="width"></div>
        }
        @case ('avatar') {
          <div class="skeleton skeleton-avatar" [style.width]="size" [style.height]="size"></div>
        }
        @case ('thumbnail') {
          <div class="skeleton skeleton-thumbnail" [style.width]="width" [style.height]="height"></div>
        }
        @case ('button') {
          <div class="skeleton skeleton-button" [style.width]="width"></div>
        }
        @case ('card') {
          <div class="skeleton-card">
            <div class="skeleton skeleton-thumbnail"></div>
            <div class="skeleton-card-content">
              <div class="skeleton skeleton-title"></div>
              <div class="skeleton skeleton-text"></div>
              <div class="skeleton skeleton-text" style="width: 60%"></div>
            </div>
          </div>
        }
        @case ('table-row') {
          <div class="skeleton-table-row">
            @for (col of columns; track col; let i = $index) {
              <div class="skeleton skeleton-cell" [style.width]="col"></div>
            }
          </div>
        }
        @default {
          <div class="skeleton skeleton-text" [style.width]="width"></div>
        }
      }
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      display: block;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    .skeleton {
      background: linear-gradient(
        90deg,
        #e2e8f0 25%,
        #f1f5f9 50%,
        #e2e8f0 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      border-radius: 4px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton {
        animation: none;
        background: #e2e8f0;
      }
    }

    // Skeleton types
    .skeleton-text {
      height: 14px;
      width: 100%;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .skeleton-title {
      height: 24px;
      width: 60%;
      margin-bottom: 12px;
    }

    .skeleton-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .skeleton-thumbnail {
      width: 100%;
      height: 120px;
      border-radius: 8px;
    }

    .skeleton-button {
      height: 40px;
      width: 120px;
      border-radius: 8px;
    }

    // Card skeleton
    .skeleton-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .skeleton-card-content {
      padding: 16px;
    }

    // Table row skeleton
    .skeleton-table-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .skeleton-cell {
      height: 16px;
      flex-shrink: 0;
    }

    // Dark mode
    :host-context(body.dark) {
      .skeleton {
        background: linear-gradient(
          90deg,
          #232b3e 25%,
          #2a3347 50%,
          #232b3e 75%
        );
        background-size: 200% 100%;
      }

      @media (prefers-reduced-motion: reduce) {
        .skeleton {
          background: #232b3e;
        }
      }

      .skeleton-card {
        background: #1a202e;
      }

      .skeleton-table-row {
        border-bottom-color: #2a3347;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonLoaderComponent {
  @Input() type: SkeletonType = 'text';
  @Input() width = '100%';
  @Input() height = '120px';
  @Input() size = '40px';
  @Input() columns: string[] = ['40px', '30%', '20%', '15%', '10%'];
  @Input() ariaLabel = 'Cargando contenido...';
}
