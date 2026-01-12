import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FeatherModule } from 'angular-feather';
import { AdminService } from '@core/service/admin.service';

interface NurseVerificationDetail {
  id: string;
  nurseId: string;
  userId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  dniNumber?: string;
  fullNameOnDni?: string;
  documents: Array<{ url: string; type: string; uploadedAt: Date }>;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;
  attemptNumber: number;
  createdAt: Date;
  nurse?: {
    cepNumber: string;
    specialties: string[];
    bio?: string;
    yearsOfExperience?: number;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      avatar?: string;
    };
  };
}

@Component({
  selector: 'app-verification-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatSnackBarModule,
    FeatherModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>Verificacion de Enfermera</h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      @if (isLoading) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (verification) {
        <div class="dialog-content">
          <!-- Nurse Info Header -->
          <div class="nurse-header">
            @if (verification.nurse?.user?.avatar) {
              <img [src]="verification.nurse?.user?.avatar" class="nurse-avatar" alt="Avatar">
            } @else {
              <div class="nurse-initials">
                {{ getInitials(verification.nurse?.user?.firstName, verification.nurse?.user?.lastName) }}
              </div>
            }
            <div class="nurse-details">
              <h3>{{ verification.nurse?.user?.firstName }} {{ verification.nurse?.user?.lastName }}</h3>
              <p>{{ verification.nurse?.user?.email }}</p>
              @if (verification.nurse?.user?.phone) {
                <p class="phone">{{ verification.nurse?.user?.phone }}</p>
              }
            </div>
            <span class="status-badge" [ngClass]="getStatusClass(verification.status)">
              {{ getStatusLabel(verification.status) }}
            </span>
          </div>

          <!-- Info Cards -->
          <div class="info-cards">
            <div class="info-card">
              <span class="label">Numero CEP</span>
              <span class="value">{{ verification.nurse?.cepNumber || '-' }}</span>
            </div>
            <div class="info-card">
              <span class="label">Numero DNI</span>
              <span class="value">{{ verification.dniNumber || '-' }}</span>
            </div>
            <div class="info-card">
              <span class="label">Nombre en DNI</span>
              <span class="value">{{ verification.fullNameOnDni || '-' }}</span>
            </div>
            <div class="info-card">
              <span class="label">Intento #</span>
              <span class="value">{{ verification.attemptNumber }}</span>
            </div>
          </div>

          <!-- Specialties -->
          @if (verification.nurse?.specialties?.length) {
            <div class="specialties-section">
              <h4>Especialidades</h4>
              <mat-chip-set>
                @for (specialty of verification.nurse?.specialties; track specialty) {
                  <mat-chip>{{ specialty }}</mat-chip>
                }
              </mat-chip-set>
            </div>
          }

          <!-- Documents Tabs -->
          <mat-tab-group class="documents-tabs">
            @for (doc of verification.documents; track doc.type) {
              <mat-tab [label]="getDocumentLabel(doc.type)">
                <div class="document-viewer">
                  <img [src]="doc.url" [alt]="getDocumentLabel(doc.type)">
                  <a [href]="doc.url" target="_blank" class="open-link">
                    <i-feather name="external-link"></i-feather>
                    Abrir en nueva pestana
                  </a>
                </div>
              </mat-tab>
            }
          </mat-tab-group>

          <!-- Review Section -->
          @if (verification.status === 'pending' || verification.status === 'under_review') {
            <div class="review-section">
              <h4>Revision</h4>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Notas de revision (opcional)</mat-label>
                <textarea matInput [(ngModel)]="reviewNotes" rows="3"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width" *ngIf="showRejectionReason">
                <mat-label>Motivo de rechazo</mat-label>
                <textarea matInput [(ngModel)]="rejectionReason" rows="2" required></textarea>
                <mat-hint>Requerido para rechazar</mat-hint>
              </mat-form-field>

              <div class="action-buttons">
                <button
                  mat-raised-button
                  color="warn"
                  (click)="toggleRejectionReason()"
                  [disabled]="isSubmitting">
                  <mat-icon>cancel</mat-icon>
                  {{ showRejectionReason ? 'Cancelar' : 'Rechazar' }}
                </button>

                @if (showRejectionReason) {
                  <button
                    mat-raised-button
                    color="warn"
                    (click)="reject()"
                    [disabled]="isSubmitting || !rejectionReason">
                    @if (isSubmitting) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      <mat-icon>send</mat-icon>
                      Confirmar Rechazo
                    }
                  </button>
                } @else {
                  <button
                    mat-raised-button
                    color="primary"
                    (click)="approve()"
                    [disabled]="isSubmitting">
                    @if (isSubmitting) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      <mat-icon>check_circle</mat-icon>
                      Aprobar
                    }
                  </button>
                }
              </div>
            </div>
          }

          <!-- Previous Review Info -->
          @if (verification.reviewedAt) {
            <div class="previous-review">
              <h4>Revision Anterior</h4>
              <p><strong>Fecha:</strong> {{ verification.reviewedAt | date:'dd/MM/yyyy HH:mm' }}</p>
              @if (verification.reviewNotes) {
                <p><strong>Notas:</strong> {{ verification.reviewNotes }}</p>
              }
              @if (verification.rejectionReason) {
                <p><strong>Motivo de rechazo:</strong> {{ verification.rejectionReason }}</p>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .dialog-container {
        width: 100%;
        max-width: 800px;
      }

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid #e2e8f0;

        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 48px;
      }

      .dialog-content {
        padding: 24px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .nurse-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
        padding-bottom: 24px;
        border-bottom: 1px solid #e2e8f0;

        .nurse-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
        }

        .nurse-initials {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 24px;
        }

        .nurse-details {
          flex: 1;

          h3 {
            margin: 0 0 4px;
            font-size: 18px;
            font-weight: 600;
          }

          p {
            margin: 0;
            color: #718096;
            font-size: 14px;

            &.phone {
              margin-top: 4px;
            }
          }
        }

        .status-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;

          &.status-pending {
            background: #fef3c7;
            color: #92400e;
          }

          &.status-review {
            background: #dbeafe;
            color: #1e40af;
          }

          &.status-approved {
            background: #d1fae5;
            color: #065f46;
          }

          &.status-rejected {
            background: #fee2e2;
            color: #991b1b;
          }
        }
      }

      .info-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
        margin-bottom: 24px;

        .info-card {
          background: #f7fafc;
          padding: 16px;
          border-radius: 8px;

          .label {
            display: block;
            font-size: 12px;
            color: #718096;
            margin-bottom: 4px;
          }

          .value {
            font-size: 16px;
            font-weight: 600;
            color: #2d3748;
          }
        }
      }

      .specialties-section {
        margin-bottom: 24px;

        h4 {
          margin: 0 0 12px;
          font-size: 14px;
          font-weight: 600;
          color: #4a5568;
        }
      }

      .documents-tabs {
        margin-bottom: 24px;

        .document-viewer {
          padding: 16px;
          text-align: center;

          img {
            max-width: 100%;
            max-height: 300px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .open-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 12px;
            color: #667eea;
            text-decoration: none;
            font-size: 14px;

            i-feather {
              width: 16px;
              height: 16px;
            }

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }

      .review-section {
        background: #f7fafc;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 24px;

        h4 {
          margin: 0 0 16px;
          font-size: 16px;
          font-weight: 600;
        }

        .full-width {
          width: 100%;
          margin-bottom: 16px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;

          button {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }
      }

      .previous-review {
        background: #fef3c7;
        padding: 16px;
        border-radius: 8px;

        h4 {
          margin: 0 0 12px;
          font-size: 14px;
          font-weight: 600;
          color: #92400e;
        }

        p {
          margin: 0 0 8px;
          font-size: 14px;
          color: #78350f;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      :host-context(.dark) {
        .dialog-header {
          border-color: #4a5568;

          h2 {
            color: white;
          }
        }

        .nurse-header {
          border-color: #4a5568;

          .nurse-details {
            h3 {
              color: white;
            }

            p {
              color: #a0aec0;
            }
          }
        }

        .info-cards .info-card {
          background: #2d3748;

          .label {
            color: #a0aec0;
          }

          .value {
            color: white;
          }
        }

        .review-section {
          background: #2d3748;

          h4 {
            color: white;
          }
        }
      }
    `,
  ],
})
export class VerificationDetailDialogComponent implements OnInit {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);

  verification: NurseVerificationDetail | null = null;
  isLoading = true;
  isSubmitting = false;
  reviewNotes = '';
  rejectionReason = '';
  showRejectionReason = false;

  constructor(
    public dialogRef: MatDialogRef<VerificationDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { verificationId: string }
  ) {}

  ngOnInit(): void {
    this.loadVerification();
  }

  async loadVerification(): Promise<void> {
    try {
      this.verification = (await this.adminService
        .getNurseVerificationDetail(this.data.verificationId)
        .toPromise()) as NurseVerificationDetail;
    } catch (error) {
      console.error('Error loading verification:', error);
      this.snackBar.open('Error al cargar la verificacion', 'Cerrar', {
        duration: 3000,
      });
    } finally {
      this.isLoading = false;
    }
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '??';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'status-pending',
      under_review: 'status-review',
      approved: 'status-approved',
      rejected: 'status-rejected',
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      under_review: 'En Revision',
      approved: 'Aprobado',
      rejected: 'Rechazado',
    };
    return labels[status] || status;
  }

  getDocumentLabel(type: string): string {
    const labels: Record<string, string> = {
      cep_front: 'CEP (Frente)',
      cep_back: 'CEP (Dorso)',
      dni_front: 'DNI (Frente)',
      dni_back: 'DNI (Dorso)',
      selfie_with_dni: 'Selfie con DNI',
    };
    return labels[type] || type;
  }

  toggleRejectionReason(): void {
    this.showRejectionReason = !this.showRejectionReason;
    if (!this.showRejectionReason) {
      this.rejectionReason = '';
    }
  }

  async approve(): Promise<void> {
    this.isSubmitting = true;
    try {
      await this.adminService
        .reviewNurseVerification(this.data.verificationId, {
          status: 'approved',
          reviewNotes: this.reviewNotes || undefined,
        })
        .toPromise();

      this.snackBar.open('Verificacion aprobada', 'Cerrar', { duration: 2000 });
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error approving:', error);
      this.snackBar.open('Error al aprobar', 'Cerrar', { duration: 3000 });
    } finally {
      this.isSubmitting = false;
    }
  }

  async reject(): Promise<void> {
    if (!this.rejectionReason) {
      this.snackBar.open('El motivo de rechazo es requerido', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    this.isSubmitting = true;
    try {
      await this.adminService
        .reviewNurseVerification(this.data.verificationId, {
          status: 'rejected',
          reviewNotes: this.reviewNotes || undefined,
          rejectionReason: this.rejectionReason,
        })
        .toPromise();

      this.snackBar.open('Verificacion rechazada', 'Cerrar', { duration: 2000 });
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error rejecting:', error);
      this.snackBar.open('Error al rechazar', 'Cerrar', { duration: 3000 });
    } finally {
      this.isSubmitting = false;
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
