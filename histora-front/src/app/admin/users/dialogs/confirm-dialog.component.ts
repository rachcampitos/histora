import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText: string;
  confirmColor: 'primary' | 'warn' | 'accent';
  icon?: string;
}

@Component({
  standalone: true,
  selector: 'app-confirm-dialog',
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        <div class="icon-container" [class.warn]="data.confirmColor === 'warn'">
          <mat-icon>{{ data.icon || getDefaultIcon() }}</mat-icon>
        </div>
        <h2>{{ data.title }}</h2>
      </div>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button class="cancel-btn" (click)="onCancel()">Cancelar</button>
        <button
          class="confirm-btn"
          [class.warn]="data.confirmColor === 'warn'"
          [class.primary]="data.confirmColor === 'primary'"
          (click)="onConfirm()">
          {{ data.confirmText }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 12px 12px 4px;
    }

    .dialog-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      padding: 8px 8px 0;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        text-align: center;
      }
    }

    .icon-container {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #4a9d9a 0%, #2d5f8a 100%);

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #ffffff;
      }

      &.warn {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }
    }

    mat-dialog-content {
      padding: 8px 8px 12px !important;

      p {
        margin: 0;
        font-size: 15px;
        color: #64748b;
        line-height: 1.5;
        text-align: center;
      }
    }

    mat-dialog-actions {
      padding: 8px !important;
      margin-bottom: 0 !important;
      display: flex;
      gap: 10px;
      justify-content: center;

      button {
        flex: 1;
        min-height: 48px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 15px;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .cancel-btn {
        background: #f1f5f9;
        color: #475569;

        &:hover {
          background: #e2e8f0;
        }
      }

      .confirm-btn {
        color: #ffffff;

        &.primary {
          background: linear-gradient(135deg, #4a9d9a 0%, #2d5f8a 100%);

          &:hover {
            box-shadow: 0 4px 12px rgba(74, 157, 154, 0.4);
          }
        }

        &.warn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);

          &:hover {
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
          }
        }
      }
    }

    /* Dark mode */
    :host-context(body.dark) {
      .dialog-header h2 {
        color: #f1f5f9;
      }

      mat-dialog-content p {
        color: #94a3b8;
      }

      .cancel-btn {
        background: #334155;
        color: #f1f5f9;

        &:hover {
          background: #475569;
        }
      }
    }
  `],
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  getDefaultIcon(): string {
    return this.data.confirmColor === 'warn' ? 'warning' : 'help_outline';
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
