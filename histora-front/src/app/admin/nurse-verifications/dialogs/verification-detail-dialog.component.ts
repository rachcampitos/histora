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

interface CepValidationResult {
  isValid?: boolean;
  region?: string;
  isHabil?: boolean;
  status?: string;
  validatedAt?: Date;
}

interface NurseVerificationDetail {
  id: string;
  nurseId: string;
  userId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  dniNumber?: string;
  fullNameOnDni?: string;
  documents: Array<{ url: string; type: string; uploadedAt: Date }>;
  officialCepPhotoUrl?: string;
  cepIdentityConfirmed?: boolean;
  cepIdentityConfirmedAt?: Date;
  cepValidation?: CepValidationResult;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;
  attemptNumber: number;
  createdAt: Date;
  nurse?: {
    cepNumber: string;
    specialties: string[];
    officialCepPhotoUrl?: string;
    selfieUrl?: string;
    cepRegisteredName?: string;
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
        <h2>Verificación de Enfermera</h2>
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
              <span class="label">Número CEP</span>
              <span class="value">{{ verification.nurse?.cepNumber || '-' }}</span>
            </div>
            <div class="info-card">
              <span class="label">Número DNI</span>
              <span class="value">{{ verification.dniNumber || '-' }}</span>
            </div>
            <div class="info-card">
              <span class="label">Nombre en CEP</span>
              <span class="value">{{ verification.nurse?.cepRegisteredName || verification.fullNameOnDni || '-' }}</span>
            </div>
            <div class="info-card">
              <span class="label">Intento #</span>
              <span class="value">{{ verification.attemptNumber }}</span>
            </div>
          </div>

          <!-- CEP Validation Status -->
          @if (verification.cepValidation) {
            <div class="cep-validation-section">
              <h4>
                <mat-icon>verified_user</mat-icon>
                Validación CEP Oficial
              </h4>
              <div class="cep-validation-badges">
                <div class="cep-badge" [ngClass]="verification.cepValidation.isHabil ? 'habil' : 'inhabilitado'">
                  <mat-icon>{{ verification.cepValidation.isHabil ? 'check_circle' : 'cancel' }}</mat-icon>
                  <span>{{ verification.cepValidation.status || (verification.cepValidation.isHabil ? 'HÁBIL' : 'INHABILITADO') }}</span>
                </div>
                @if (verification.cepValidation.region) {
                  <div class="cep-badge region">
                    <mat-icon>location_on</mat-icon>
                    <span>{{ verification.cepValidation.region }}</span>
                  </div>
                }
              </div>
              @if (verification.cepValidation.validatedAt) {
                <small class="validation-date">
                  Verificado el {{ verification.cepValidation.validatedAt | date:'dd/MM/yyyy HH:mm' }}
                </small>
              }
            </div>
          }

          <!-- Identity Confirmation Badge -->
          @if (verification.cepIdentityConfirmed) {
            <div class="identity-confirmed-badge">
              <mat-icon>verified_user</mat-icon>
              <span>Identidad confirmada por el usuario</span>
              @if (verification.cepIdentityConfirmedAt) {
                <small>{{ verification.cepIdentityConfirmedAt | date:'dd/MM/yyyy HH:mm' }}</small>
              }
            </div>
          }

          <!-- Photo Comparison Section -->
          <div class="photo-comparison-section">
            <h4>
              <mat-icon>compare</mat-icon>
              Comparación de Fotos
            </h4>
            <p class="comparison-hint">Verifica que la persona en las tres fotos sea la misma antes de aprobar</p>

            <div class="photo-grid">
              <!-- Official CEP Photo -->
              <div class="photo-card">
                <div class="photo-label">
                  <mat-icon>badge</mat-icon>
                  Foto Oficial CEP
                </div>
                @if (getCepPhotoUrl()) {
                  <img [src]="getCepPhotoUrl()" alt="Foto oficial CEP" class="verification-photo">
                  <div class="photo-badge verified">
                    <mat-icon>verified</mat-icon>
                    Registro Oficial
                  </div>
                } @else {
                  <div class="no-photo">
                    <mat-icon>photo_camera</mat-icon>
                    <span>Sin foto en CEP</span>
                  </div>
                }
              </div>

              <!-- Selfie Photo -->
              <div class="photo-card">
                <div class="photo-label">
                  <mat-icon>selfie</mat-icon>
                  Selfie de Verificación
                </div>
                @if (verification.nurse?.selfieUrl) {
                  <img [src]="verification.nurse?.selfieUrl" alt="Selfie de verificación" class="verification-photo">
                  <div class="photo-badge selfie">
                    <mat-icon>camera_alt</mat-icon>
                    Tomada por Usuario
                  </div>
                } @else {
                  <div class="no-photo">
                    <mat-icon>no_photography</mat-icon>
                    <span>Sin selfie</span>
                  </div>
                }
              </div>

              <!-- Profile Avatar -->
              <div class="photo-card">
                <div class="photo-label">
                  <mat-icon>account_circle</mat-icon>
                  Avatar de Perfil
                </div>
                @if (verification.nurse?.user?.avatar) {
                  <img [src]="verification.nurse?.user?.avatar" alt="Avatar de perfil" class="verification-photo">
                  <div class="photo-badge avatar">
                    <mat-icon>person</mat-icon>
                    Foto de Perfil
                  </div>
                } @else {
                  <div class="no-photo initials">
                    {{ getInitials(verification.nurse?.user?.firstName, verification.nurse?.user?.lastName) }}
                  </div>
                }
              </div>
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

          <!-- Documents Tabs (for legacy document uploads) -->
          @if (verification.documents?.length) {
            <mat-tab-group class="documents-tabs">
              @for (doc of verification.documents; track doc.type) {
                <mat-tab [label]="getDocumentLabel(doc.type)">
                  <div class="document-viewer">
                    <img [src]="doc.url" [alt]="getDocumentLabel(doc.type)">
                    <a [href]="doc.url" target="_blank" class="open-link">
                      <i-feather name="external-link"></i-feather>
                      Abrir en nueva pestaña
                    </a>
                  </div>
                </mat-tab>
              }
            </mat-tab-group>
          }

          <!-- Review Section -->
          @if (verification.status === 'pending' || verification.status === 'under_review') {
            <div class="review-section">
              <h4>Revisión</h4>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Notas internas (opcional)</mat-label>
                <textarea matInput [(ngModel)]="reviewNotes" rows="3"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width" *ngIf="showRejectionReason">
                <mat-label>Motivo de rechazo (la enfermera verá este mensaje)</mat-label>
                <textarea matInput [(ngModel)]="rejectionReason" rows="2" required></textarea>
                <mat-hint>Sé específico para ayudarla a corregir su solicitud</mat-hint>
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
              <h4>Revisión Anterior</h4>
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

      .cep-validation-section {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 24px;

        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px;
          font-size: 14px;
          font-weight: 600;
          color: #166534;

          mat-icon {
            color: #22c55e;
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }

        .cep-validation-badges {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cep-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 600;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }

          &.habil {
            background: #dcfce7;
            color: #166534;

            mat-icon {
              color: #22c55e;
            }
          }

          &.inhabilitado {
            background: #fee2e2;
            color: #991b1b;

            mat-icon {
              color: #ef4444;
            }
          }

          &.region {
            background: #dbeafe;
            color: #1e40af;

            mat-icon {
              color: #3b82f6;
            }
          }
        }

        .validation-date {
          display: block;
          margin-top: 12px;
          font-size: 12px;
          color: #16a34a;
        }
      }

      .identity-confirmed-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        border-radius: 8px;
        margin-bottom: 24px;
        color: #065f46;
        font-weight: 500;

        mat-icon {
          color: #059669;
        }

        small {
          margin-left: auto;
          font-size: 12px;
          color: #047857;
        }
      }

      .photo-comparison-section {
        background: #f7fafc;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;

        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;

          mat-icon {
            color: #667eea;
          }
        }

        .comparison-hint {
          margin: 0 0 20px;
          font-size: 13px;
          color: #718096;
        }
      }

      .photo-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }

      .photo-card {
        background: white;
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        border: 2px solid transparent;
        transition: border-color 0.2s ease;

        &:hover {
          border-color: #667eea;
        }

        .photo-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-bottom: 12px;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }

        .verification-photo {
          width: 140px;
          height: 140px;
          object-fit: cover;
          border-radius: 50%;
          border: 3px solid #e2e8f0;
          margin-bottom: 12px;
        }

        .no-photo {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          color: #a0aec0;

          mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            margin-bottom: 8px;
          }

          span {
            font-size: 12px;
          }

          &.initials {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            font-size: 48px;
            font-weight: 600;
          }
        }

        .photo-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }

          &.verified {
            background: #d1fae5;
            color: #065f46;
          }

          &.selfie {
            background: #dbeafe;
            color: #1e40af;
          }

          &.avatar {
            background: #fef3c7;
            color: #92400e;
          }
        }
      }

      .documents-tabs {
        margin-bottom: 24px;
        background: #f8fafc;
        border-radius: 12px;
        padding: 16px;

        ::ng-deep {
          .mat-mdc-tab-labels {
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
          }

          .mat-mdc-tab {
            min-width: auto;
            padding: 0 16px;
            height: 36px;
            font-size: 13px;
            font-weight: 500;
            border-radius: 8px;
            opacity: 1;

            &.mdc-tab--active {
              background: #667eea;
              color: white;
            }
          }

          .mat-mdc-tab-body-wrapper {
            margin-top: 16px;
          }
        }

        .document-viewer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

          img {
            max-width: 100%;
            max-height: 400px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            object-fit: contain;
          }

          .open-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
            transition: all 0.2s ease;

            i-feather {
              width: 16px;
              height: 16px;
            }

            &:hover {
              background: #5a67d8;
              transform: translateY(-1px);
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
          flex-wrap: wrap;
          padding-top: 8px;

          button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-width: 140px;
            height: 44px;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;

            mat-icon {
              font-size: 20px;
              width: 20px;
              height: 20px;
            }

            mat-spinner {
              margin: 0;
            }

            &[color="warn"] {
              background: #fee2e2;
              color: #dc2626;

              &:hover:not([disabled]) {
                background: #fecaca;
              }
            }

            &[color="primary"] {
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              color: white;
              box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);

              &:hover:not([disabled]) {
                box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
              }
            }

            &[disabled] {
              opacity: 0.6;
              cursor: not-allowed;
            }
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

        .identity-confirmed-badge {
          background: linear-gradient(135deg, #065f46 0%, #047857 100%);
          color: #d1fae5;

          mat-icon {
            color: #34d399;
          }

          small {
            color: #a7f3d0;
          }
        }

        .cep-validation-section {
          background: #1e3a2f;
          border-color: #166534;

          h4 {
            color: #4ade80;

            mat-icon {
              color: #4ade80;
            }
          }

          .cep-badge {
            &.habil {
              background: #166534;
              color: #bbf7d0;

              mat-icon {
                color: #4ade80;
              }
            }

            &.inhabilitado {
              background: #991b1b;
              color: #fecaca;

              mat-icon {
                color: #f87171;
              }
            }

            &.region {
              background: #1e40af;
              color: #bfdbfe;

              mat-icon {
                color: #60a5fa;
              }
            }
          }

          .validation-date {
            color: #4ade80;
          }
        }

        .photo-comparison-section {
          background: #2d3748;

          h4 {
            color: white;
          }

          .comparison-hint {
            color: #a0aec0;
          }
        }

        .photo-card {
          background: #1a202e;

          .photo-label {
            color: #e2e8f0;
          }

          .verification-photo {
            border-color: #4a5568;
          }

          .no-photo {
            background: #4a5568;
            color: #a0aec0;
          }
        }

        .documents-tabs {
          background: #2d3748;

          ::ng-deep {
            .mat-mdc-tab {
              color: #e2e8f0;

              &.mdc-tab--active {
                background: #667eea;
                color: white;
              }
            }
          }

          .document-viewer {
            background: #1a202e;

            .open-link {
              background: #667eea;
              color: white;

              &:hover {
                background: #5a67d8;
              }
            }
          }
        }

        .action-buttons button {
          &[color="warn"] {
            background: #7f1d1d;
            color: #fecaca;

            &:hover:not([disabled]) {
              background: #991b1b;
            }
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
      const snackBarRef = this.snackBar.open(
        'No pudimos cargar los detalles. Revisa tu conexión',
        'Reintentar',
        { duration: 5000 }
      );
      snackBarRef.onAction().subscribe(() => this.loadVerification());
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
      under_review: 'En Revisión',
      approved: 'Aprobada',
      rejected: 'Rechazada',
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

  getCepPhotoUrl(): string | null {
    // First check verification record, then nurse record
    return this.verification?.officialCepPhotoUrl
      || this.verification?.nurse?.officialCepPhotoUrl
      || null;
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

      this.snackBar.open('¡Verificación aprobada! La enfermera ya puede ofrecer servicios', 'Cerrar', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error approving:', error);
      const snackBarRef = this.snackBar.open(
        'No se pudo aprobar la verificación. Intenta nuevamente',
        'Reintentar',
        { duration: 5000 }
      );
      snackBarRef.onAction().subscribe(() => this.approve());
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

      this.snackBar.open('Verificación rechazada. Se notificará a la enfermera', 'Cerrar', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error rejecting:', error);
      const snackBarRef = this.snackBar.open(
        'No se pudo rechazar la verificación. Intenta nuevamente',
        'Reintentar',
        { duration: 5000 }
      );
      snackBarRef.onAction().subscribe(() => this.reject());
    } finally {
      this.isSubmitting = false;
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
