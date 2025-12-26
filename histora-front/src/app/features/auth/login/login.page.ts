import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
  IonText,
  IonIcon,
  IonInputPasswordToggle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
    IonText,
    IonIcon,
    IonInputPasswordToggle,
  ],
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-title>Iniciar Sesión</ion-card-title>
      </ion-card-header>
      <ion-card-content>
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
            <ion-text color="danger" class="error-text">
              El correo es requerido
            </ion-text>
          }
          @if (form.get('email')?.touched && form.get('email')?.errors?.['email']) {
            <ion-text color="danger" class="error-text">
              Ingresa un correo válido
            </ion-text>
          }

          <ion-item>
            <ion-icon name="lock-closed-outline" slot="start"></ion-icon>
            <ion-input
              type="password"
              formControlName="password"
              label="Contraseña"
              labelPlacement="floating"
              placeholder="••••••••"
            >
              <ion-input-password-toggle slot="end"></ion-input-password-toggle>
            </ion-input>
          </ion-item>
          @if (form.get('password')?.touched && form.get('password')?.errors?.['required']) {
            <ion-text color="danger" class="error-text">
              La contraseña es requerida
            </ion-text>
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
              Iniciar Sesión
            }
          </ion-button>

          <div class="links">
            <a routerLink="/auth/forgot-password">¿Olvidaste tu contraseña?</a>
            <p>
              ¿No tienes cuenta?
              <a routerLink="/auth/register">Regístrate</a>
            </p>
          </div>
        </form>
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

      .links p {
        margin-top: 12px;
        color: var(--ion-color-medium);
      }
    `,
  ],
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form: FormGroup;
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    addIcons({ mailOutline, lockClosedOutline });

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.auth.login(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.message || 'Error al iniciar sesión');
      },
    });
  }
}
