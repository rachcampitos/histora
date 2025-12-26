import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonText,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
    IonText,
    IonIcon,
  ],
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-title>Recuperar Contraseña</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        @if (success()) {
          <div class="success-message">
            <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
            <p>Se ha enviado un enlace de recuperación a tu correo electrónico.</p>
            <ion-button routerLink="/auth/login" expand="block" fill="outline">
              Volver al Login
            </ion-button>
          </div>
        } @else {
          <p class="description">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <ion-item>
              <ion-icon name="mail-outline" slot="start"></ion-icon>
              <ion-input
                type="email"
                formControlName="email"
                label="Correo electrónico"
                labelPlacement="floating"
                placeholder="correo@ejemplo.com"
              ></ion-input>
            </ion-item>
            @if (form.get('email')?.touched && form.get('email')?.errors?.['required']) {
              <ion-text color="danger" class="error-text">El correo es requerido</ion-text>
            }
            @if (form.get('email')?.touched && form.get('email')?.errors?.['email']) {
              <ion-text color="danger" class="error-text">Ingresa un correo válido</ion-text>
            }

            @if (error()) {
              <ion-text color="danger" class="error-message">
                {{ error() }}
              </ion-text>
            }

            <ion-button
              type="submit"
              expand="block"
              [disabled]="form.invalid || isLoading()"
            >
              @if (isLoading()) {
                <ion-spinner name="crescent"></ion-spinner>
              } @else {
                Enviar Enlace
              }
            </ion-button>

            <div class="links">
              <a routerLink="/auth/login">Volver al Login</a>
            </div>
          </form>
        }
      </ion-card-content>
    </ion-card>
  `,
  styles: [
    `
      ion-card {
        max-width: 400px;
        margin: 0 auto;
        border-radius: 16px;
      }

      ion-card-header {
        text-align: center;
        padding-bottom: 0;
      }

      ion-card-title {
        font-size: 1.5rem;
        font-weight: 600;
      }

      .description {
        text-align: center;
        color: var(--ion-color-medium);
        margin-bottom: 24px;
      }

      ion-item {
        --padding-start: 0;
        --inner-padding-end: 0;
        margin-bottom: 8px;
      }

      ion-item ion-icon {
        color: var(--ion-color-medium);
      }

      .error-text {
        display: block;
        font-size: 12px;
        padding-left: 28px;
        margin-bottom: 8px;
      }

      .error-message {
        display: block;
        text-align: center;
        margin: 16px 0;
        padding: 8px;
        background: var(--ion-color-danger-tint);
        border-radius: 8px;
      }

      .success-message {
        text-align: center;
      }

      .success-message ion-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      .success-message p {
        color: var(--ion-color-medium);
        margin-bottom: 24px;
      }

      ion-button {
        margin-top: 24px;
        --border-radius: 8px;
      }

      .links {
        text-align: center;
        margin-top: 24px;
      }

      .links a {
        color: var(--ion-color-primary);
        text-decoration: none;
      }
    `,
  ],
})
export class ForgotPasswordPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  form: FormGroup;
  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  constructor() {
    addIcons({ mailOutline, checkmarkCircleOutline });

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.auth.forgotPassword(this.form.value.email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.message || 'Error al enviar el enlace');
      },
    });
  }
}
