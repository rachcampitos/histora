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
import { mailOutline, lockClosedOutline, personOutline, businessOutline, callOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
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
        <ion-card-title>Crear Cuenta</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <ion-item>
            <ion-icon name="person-outline" slot="start"></ion-icon>
            <ion-input
              type="text"
              formControlName="firstName"
              label="Nombre"
              labelPlacement="floating"
              placeholder="Tu nombre"
            ></ion-input>
          </ion-item>
          @if (form.get('firstName')?.touched && form.get('firstName')?.errors?.['required']) {
            <ion-text color="danger" class="error-text">El nombre es requerido</ion-text>
          }

          <ion-item>
            <ion-icon name="person-outline" slot="start"></ion-icon>
            <ion-input
              type="text"
              formControlName="lastName"
              label="Apellido"
              labelPlacement="floating"
              placeholder="Tu apellido"
            ></ion-input>
          </ion-item>
          @if (form.get('lastName')?.touched && form.get('lastName')?.errors?.['required']) {
            <ion-text color="danger" class="error-text">El apellido es requerido</ion-text>
          }

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

          <ion-item>
            <ion-icon name="call-outline" slot="start"></ion-icon>
            <ion-input
              type="tel"
              formControlName="phone"
              label="Teléfono (opcional)"
              labelPlacement="floating"
              placeholder="+52 555 123 4567"
            ></ion-input>
          </ion-item>

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
            <ion-text color="danger" class="error-text">La contraseña es requerida</ion-text>
          }
          @if (form.get('password')?.touched && form.get('password')?.errors?.['minlength']) {
            <ion-text color="danger" class="error-text">Mínimo 8 caracteres</ion-text>
          }

          <ion-item>
            <ion-icon name="business-outline" slot="start"></ion-icon>
            <ion-input
              type="text"
              formControlName="clinicName"
              label="Nombre del Consultorio"
              labelPlacement="floating"
              placeholder="Mi Consultorio Médico"
            ></ion-input>
          </ion-item>
          @if (form.get('clinicName')?.touched && form.get('clinicName')?.errors?.['required']) {
            <ion-text color="danger" class="error-text">El nombre del consultorio es requerido</ion-text>
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
              Crear Cuenta
            }
          </ion-button>

          <div class="links">
            <p>
              ¿Ya tienes cuenta?
              <a routerLink="/auth/login">Inicia sesión</a>
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
        color: var(--ion-color-medium);
      }
    `,
  ],
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form: FormGroup;
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    addIcons({ mailOutline, lockClosedOutline, personOutline, businessOutline, callOutline });

    this.form = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      clinicName: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.auth.register(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.message || 'Error al crear la cuenta');
      },
    });
  }
}
