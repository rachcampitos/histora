import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoginService } from '@core/service/login.service';
import { AuthService } from '@core/service/auth.service';
import { TokenService } from '@core/service/token.service';
import { LocalStorageService } from '@shared/services';

interface CepValidationResult {
  isValid: boolean;
  data?: {
    cepNumber: string;
    fullName?: string;
    dni: string;
    photoUrl?: string;
    isPhotoVerified: boolean;
  };
  error?: string;
}


@Component({
  selector: 'app-signup-nurse',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  templateUrl: './signup-nurse.component.html',
  styleUrls: ['./signup-nurse.component.scss'],
})
export class SignupNurseComponent implements OnInit {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  // Forms for each step
  credentialsForm!: FormGroup;
  accountForm!: FormGroup;

  // State
  currentStep = 1;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  // CEP validation result
  cepValidation: CepValidationResult | null = null;
  identityConfirmed = false;

  // Selfie capture
  showCamera = false;
  selfieDataUrl: string | null = null;
  cameraStream: MediaStream | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private loginService: LoginService,
    private authService: AuthService,
    private tokenService: TokenService,
    private store: LocalStorageService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForms();
  }

  private initForms(): void {
    // Step 1: DNI and CEP credentials
    this.credentialsForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      cepNumber: ['', [Validators.required, Validators.pattern(/^\d{4,6}$/)]],
    });

    // Step 3: Account details
    this.accountForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      phone: [''],
      termsAccepted: [false, [Validators.requiredTrue]],
      professionalDisclaimerAccepted: [false, [Validators.requiredTrue]],
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  // Step 1: Validate CEP credentials
  validateCredentials(): void {
    if (this.credentialsForm.invalid) {
      this.credentialsForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { dni, cepNumber } = this.credentialsForm.value;

    this.loginService.validateNurseCep(dni, cepNumber).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.cepValidation = result;

        if (result.isValid) {
          this.currentStep = 2;
        } else {
          this.snackBar.open(result.error || 'No se pudo validar las credenciales', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error al conectar con el servidor', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      }
    });
  }

  // Step 2: Confirm identity
  confirmIdentity(): void {
    this.identityConfirmed = true;
    this.currentStep = 3;
  }

  rejectIdentity(): void {
    this.snackBar.open('Si los datos no coinciden, verifica tu DNI y CEP e intenta nuevamente', 'Cerrar', {
      duration: 5000,
    });
    this.currentStep = 1;
    this.cepValidation = null;
  }

  // Step 3: Camera controls for selfie
  async startCamera(): Promise<void> {
    try {
      this.showCamera = true;
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });

      setTimeout(() => {
        if (this.videoElement?.nativeElement) {
          this.videoElement.nativeElement.srcObject = this.cameraStream;
        }
      }, 100);
    } catch (err) {
      console.error('Error accessing camera:', err);
      this.snackBar.open('No se pudo acceder a la cámara. Verifica los permisos.', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      this.showCamera = false;
    }
  }

  captureSelfie(): void {
    if (!this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      this.selfieDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      this.stopCamera();
    }
  }

  retakeSelfie(): void {
    this.selfieDataUrl = null;
    this.startCamera();
  }

  stopCamera(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    this.showCamera = false;
  }

  // Step 3: Complete registration
  completeRegistration(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    if (!this.cepValidation?.data) {
      this.snackBar.open('Error: datos de validación no disponibles', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.isLoading = true;
    const { email, password, phone, termsAccepted, professionalDisclaimerAccepted } = this.accountForm.value;

    const registrationData = {
      email,
      password,
      phone: phone || undefined,
      dni: this.cepValidation.data.dni,
      cepNumber: this.cepValidation.data.cepNumber,
      fullNameFromCep: this.cepValidation.data.fullName || '',
      cepPhotoUrl: this.cepValidation.data.photoUrl,
      identityConfirmed: this.identityConfirmed,
      selfieUrl: this.selfieDataUrl || undefined,
      termsAccepted,
      professionalDisclaimerAccepted,
    };

    this.loginService.completeNurseRegistration(registrationData).subscribe({
      next: (response) => {
        this.isLoading = false;

        if ('error' in response && response.error) {
          this.snackBar.open(response.error || 'Error al completar el registro', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
          return;
        }

        if ('access_token' in response) {
          // Store tokens and user data
          this.tokenService.set({ access_token: response.access_token });
          this.store.set('refreshToken', response.refresh_token);
          this.store.set('currentUser', response.user);

          // Show success message
          const message = response.verificationStatus === 'pending'
            ? 'Registro exitoso. Tu cuenta será verificada por un administrador.'
            : 'Registro exitoso. Por favor sube una selfie para completar la verificación.';

          this.snackBar.open(message, 'Entendido', {
            duration: 8000,
            panelClass: ['success-snackbar'],
          });

          // Navigate to nurse dashboard
          this.router.navigate(['/nurse/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error al conectar con el servidor', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      }
    });
  }

  // Navigation
  goBack(): void {
    if (this.currentStep > 1) {
      if (this.currentStep === 3) {
        this.stopCamera();
      }
      this.currentStep--;
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }
}
