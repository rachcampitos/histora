import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/service/auth.service';
import { environment } from '../../../environments/environment';

type UserType = 'doctor' | 'patient' | null;

interface GoogleRegistrationResponse {
  access_token: string;
  refresh_token: string;
  user: {
    _id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

@Component({
  selector: 'app-google-select-type',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="select-type-container">
      <mat-card class="select-card">
        <!-- Header -->
        <div class="card-header">
          <div class="logo-icon">
            <mat-icon>local_hospital</mat-icon>
          </div>
          <h1>Bienvenido a Histora</h1>
          <p class="welcome-name">Hola, {{ userName }}!</p>
          <p class="subtitle">Selecciona tu tipo de cuenta para continuar</p>
        </div>

        <!-- Selection Cards (when no type selected) -->
        @if (!selectedType()) {
          <div class="type-cards">
            <div class="type-card doctor-card" (click)="selectType('doctor')">
              <div class="card-icon doctor-icon">
                <mat-icon>medical_services</mat-icon>
              </div>
              <div class="card-content">
                <h3>Soy Médico</h3>
                <p>Quiero registrar mi consultorio y gestionar pacientes</p>
              </div>
              <mat-icon class="arrow-icon">chevron_right</mat-icon>
            </div>

            <div class="type-card patient-card" (click)="selectType('patient')">
              <div class="card-icon patient-icon">
                <mat-icon>person</mat-icon>
              </div>
              <div class="card-content">
                <h3>Soy Paciente</h3>
                <p>Quiero acceder a mi portal de paciente</p>
              </div>
              <mat-icon class="arrow-icon">chevron_right</mat-icon>
            </div>
          </div>
        }

        <!-- Doctor Form (when doctor selected) -->
        @if (selectedType() === 'doctor') {
          <div class="doctor-form">
            <button mat-button class="back-btn" (click)="selectedType.set(null)">
              <mat-icon>arrow_back</mat-icon>
              Volver
            </button>

            <h2>Datos de tu consultorio</h2>
            <p class="form-subtitle">Estos datos podrás editarlos después</p>

            <form [formGroup]="clinicForm" (ngSubmit)="submitDoctor()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nombre del consultorio</mat-label>
                <mat-icon matPrefix>business</mat-icon>
                <input matInput formControlName="clinicName" placeholder="Ej: Consultorio Dr. García" />
                @if (clinicForm.get('clinicName')?.hasError('required')) {
                  <mat-error>El nombre del consultorio es requerido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Teléfono del consultorio (opcional)</mat-label>
                <mat-icon matPrefix>phone</mat-icon>
                <input matInput formControlName="clinicPhone" placeholder="Ej: +51 999 999 999" />
              </mat-form-field>

              @if (error()) {
                <div class="error-message">
                  <mat-icon>error_outline</mat-icon>
                  {{ error() }}
                </div>
              }

              <button mat-raised-button type="submit" class="submit-btn" [disabled]="loading() || clinicForm.invalid">
                @if (loading()) {
                  <mat-spinner diameter="22"></mat-spinner>
                } @else {
                  <mat-icon>check</mat-icon>
                  Crear mi consultorio
                }
              </button>
            </form>
          </div>
        }

        <!-- Patient Confirmation (when patient selected) -->
        @if (selectedType() === 'patient') {
          <div class="patient-confirm">
            <button mat-button class="back-btn" (click)="selectedType.set(null)">
              <mat-icon>arrow_back</mat-icon>
              Volver
            </button>

            <div class="confirm-icon">
              <mat-icon>person_outline</mat-icon>
            </div>
            <h2>Confirmar cuenta de paciente</h2>
            <p>Tu cuenta será configurada como paciente. Podrás acceder a tu portal de paciente para ver tus citas e historial médico.</p>

            @if (error()) {
              <div class="error-message">
                <mat-icon>error_outline</mat-icon>
                {{ error() }}
              </div>
            }

            <button mat-raised-button class="submit-btn patient-btn" (click)="submitPatient()" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="22"></mat-spinner>
              } @else {
                <mat-icon>check</mat-icon>
                Confirmar y continuar
              }
            </button>
          </div>
        }

        <!-- Footer -->
        <div class="card-footer">
          <p>¿Necesitas ayuda? <a href="mailto:soporte&#64;historahealth.com">Contáctanos</a></p>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .select-type-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .select-card {
      max-width: 480px;
      width: 100%;
      padding: 32px;
      border-radius: 16px;
    }

    .card-header {
      text-align: center;
      margin-bottom: 32px;

      .logo-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: white;
        }
      }

      h1 {
        font-size: 24px;
        font-weight: 600;
        color: #2d3748;
        margin: 0 0 8px;
      }

      .welcome-name {
        font-size: 16px;
        color: #667eea;
        font-weight: 500;
        margin: 0 0 4px;
      }

      .subtitle {
        font-size: 14px;
        color: #718096;
        margin: 0;
      }
    }

    .type-cards {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .type-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: #667eea;
        background: #f8faff;
      }

      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          color: white;
        }

        &.doctor-icon {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        &.patient-icon {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }
      }

      .card-content {
        flex: 1;

        h3 {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 4px;
        }

        p {
          font-size: 13px;
          color: #718096;
          margin: 0;
        }
      }

      .arrow-icon {
        color: #cbd5e0;
      }
    }

    .doctor-form, .patient-confirm {
      .back-btn {
        margin-bottom: 16px;
        color: #718096;

        mat-icon {
          margin-right: 4px;
        }
      }

      h2 {
        font-size: 20px;
        font-weight: 600;
        color: #2d3748;
        margin: 0 0 8px;
        text-align: center;
      }

      .form-subtitle {
        font-size: 14px;
        color: #718096;
        text-align: center;
        margin: 0 0 24px;
      }

      .full-width {
        width: 100%;
        margin-bottom: 8px;
      }
    }

    .patient-confirm {
      text-align: center;

      .confirm-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 16px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
          color: white;
        }
      }

      p {
        font-size: 14px;
        color: #718096;
        margin: 0 0 24px;
        line-height: 1.6;
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fee2e2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .submit-btn {
      width: 100%;
      height: 48px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;

      mat-icon {
        margin-right: 8px;
      }

      &.patient-btn {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      }

      &:disabled {
        background: #cbd5e0;
      }
    }

    .card-footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      text-align: center;

      p {
        font-size: 13px;
        color: #718096;
        margin: 0;

        a {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    // Dark mode
    @media (prefers-color-scheme: dark) {
      .select-card {
        background: #2d3748;
      }

      .card-header {
        h1 {
          color: white;
        }

        .subtitle {
          color: #a0aec0;
        }
      }

      .type-card {
        border-color: #4a5568;
        background: #1a202c;

        &:hover {
          border-color: #667eea;
          background: #2d3748;
        }

        .card-content {
          h3 {
            color: white;
          }

          p {
            color: #a0aec0;
          }
        }

        .arrow-icon {
          color: #4a5568;
        }
      }

      .doctor-form, .patient-confirm {
        h2 {
          color: white;
        }

        .form-subtitle, p {
          color: #a0aec0;
        }
      }

      .card-footer {
        border-color: #4a5568;

        p {
          color: #a0aec0;
        }
      }
    }
  `]
})
export class GoogleSelectTypeComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  selectedType = signal<UserType>(null);
  loading = signal(false);
  error = signal('');
  userName = '';

  clinicForm: FormGroup = this.fb.group({
    clinicName: ['', Validators.required],
    clinicPhone: [''],
  });

  ngOnInit(): void {
    // Get user info from query params or stored data
    const params = this.route.snapshot.queryParams;
    if (params['name']) {
      this.userName = params['name'];
    } else {
      const currentUser = this.authService.currentUserValue;
      this.userName = currentUser?.firstName || 'Usuario';
    }
  }

  selectType(type: UserType): void {
    this.selectedType.set(type);
    this.error.set('');
  }

  submitDoctor(): void {
    if (this.clinicForm.invalid) return;

    this.loading.set(true);
    this.error.set('');

    const apiUrl = environment.apiUrl || 'http://localhost:3000';

    this.http.post<GoogleRegistrationResponse>(`${apiUrl}/auth/google/complete-registration`, {
      userType: 'doctor',
      clinicName: this.clinicForm.value.clinicName,
      clinicPhone: this.clinicForm.value.clinicPhone || undefined,
    }).subscribe({
      next: (response) => {
        // Update auth service with new tokens and user data
        this.authService.handleGoogleCallback(
          response.access_token,
          response.refresh_token,
          response.user
        );

        // Navigate to doctor dashboard
        this.router.navigate(['/doctor/dashboard']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al completar el registro');
      }
    });
  }

  submitPatient(): void {
    this.loading.set(true);
    this.error.set('');

    const apiUrl = environment.apiUrl || 'http://localhost:3000';

    this.http.post<GoogleRegistrationResponse>(`${apiUrl}/auth/google/complete-registration`, {
      userType: 'patient',
    }).subscribe({
      next: (response) => {
        // Update auth service with new tokens and user data
        this.authService.handleGoogleCallback(
          response.access_token,
          response.refresh_token,
          response.user
        );

        // Navigate to patient dashboard
        this.router.navigate(['/patient/dashboard']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al completar el registro');
      }
    });
  }
}
