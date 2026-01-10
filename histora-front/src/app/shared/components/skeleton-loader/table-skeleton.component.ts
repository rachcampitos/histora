import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-skeleton" [attr.aria-busy]="true" aria-label="Cargando tabla...">
      <span class="sr-only">Cargando datos de la tabla...</span>

      <!-- Header skeleton -->
      <div class="skeleton-header">
        @for (col of columnWidths; track col; let i = $index) {
          <div class="skeleton skeleton-header-cell" [style.width]="col"></div>
        }
      </div>

      <!-- Row skeletons -->
      @for (row of rowArray; track row) {
        <div class="skeleton-row">
          @for (col of columnWidths; track col; let i = $index; let first = $first) {
            @if (first && showAvatar) {
              <div class="skeleton-cell-wrapper">
                <div class="skeleton skeleton-avatar"></div>
                <div class="skeleton skeleton-text" [style.width]="'60%'"></div>
              </div>
            } @else {
              <div class="skeleton skeleton-cell" [style.width]="col"></div>
            }
          }
          @if (showActions) {
            <div class="skeleton skeleton-action"></div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .table-skeleton {
      width: 100%;
      background: white;
      border-radius: 8px;
      overflow: hidden;
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

    .skeleton-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .skeleton-header-cell {
      height: 12px;
      flex-shrink: 0;
    }

    .skeleton-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }
    }

    .skeleton-cell-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .skeleton-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .skeleton-cell {
      height: 14px;
      flex-shrink: 0;
    }

    .skeleton-text {
      height: 14px;
    }

    .skeleton-action {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      margin-left: auto;
    }

    // Dark mode
    :host-context(body.dark) {
      .table-skeleton {
        background: #1a202e;
      }

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

      .skeleton-header {
        background: #232b3e;
        border-bottom-color: #2a3347;
      }

      .skeleton-row {
        border-bottom-color: #232b3e;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableSkeletonComponent {
  @Input() rows = 5;
  @Input() columnWidths: string[] = ['25%', '20%', '15%', '15%', '10%'];
  @Input() showAvatar = true;
  @Input() showActions = true;

  get rowArray(): number[] {
    return Array(this.rows).fill(0).map((_, i) => i);
  }
}
