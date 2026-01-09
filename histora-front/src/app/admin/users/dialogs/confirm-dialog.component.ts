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
      <div class="dialog-header" [class.warn]="data.confirmColor === 'warn'">
        <div class="icon-container" [class.warn]="data.confirmColor === 'warn'">
          <mat-icon>{{ data.icon || getDefaultIcon() }}</mat-icon>
        </div>
        <h2>{{ data.title }}</h2>
      </div>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-stroked-button (click)="onCancel()">Cancelar</button>
        <button
          mat-flat-button
          [color]="data.confirmColor"
          (click)="onConfirm()"
          [class.delete-btn]="data.confirmColor === 'warn'">
          {{ data.confirmText }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 8px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
        color: #2c3e50;
      }

      &.warn h2 {
        color: #c62828;
      }
    }

    .icon-container {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e3f2fd;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #1976d2;
      }

      &.warn {
        background: #ffebee;

        mat-icon {
          color: #c62828;
        }
      }
    }

    mat-dialog-content {
      min-width: 320px;
      padding: 0 !important;

      p {
        margin: 0;
        font-size: 14px;
        color: #666;
        line-height: 1.5;
      }
    }

    mat-dialog-actions {
      padding: 24px 0 0 0 !important;
      margin-bottom: 0 !important;
      gap: 12px;

      button {
        min-width: 100px;
        height: 40px;
        border-radius: 8px;
        font-weight: 500;
      }

      .delete-btn {
        background-color: #c62828 !important;
        color: white !important;

        &:hover {
          background-color: #b71c1c !important;
        }
      }
    }

    :host-context(body.dark) {
      .dialog-header h2 {
        color: #ffffff;
      }

      .dialog-header.warn h2 {
        color: #ef5350;
      }

      .icon-container {
        background: rgba(25, 118, 210, 0.15);

        mat-icon {
          color: #64b5f6;
        }

        &.warn {
          background: rgba(198, 40, 40, 0.15);

          mat-icon {
            color: #ef5350;
          }
        }
      }

      mat-dialog-content p {
        color: #b0b0b0;
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
