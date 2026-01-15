import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

type UserType = 'nurse' | 'patient' | null;

// CEP validation loading messages (rotate every 2 seconds)
const CEP_LOADING_MESSAGES = [
  { message: 'Conectando con CEP...', subtext: 'Verificamos tu colegiatura con el Colegio de Enfermeros del Perú' },
  { message: 'Verificando tu número de colegiatura...', subtext: 'Este proceso protege tu reputación profesional' },
  { message: 'Confirmando que tu colegiatura está vigente...', subtext: 'Pacientes verificados te esperan' },
  { message: 'Casi listo, obteniendo los últimos detalles...', subtext: 'Estás a un paso de empezar' },
];

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  standalone: false,
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private authService = inject(AuthService);

  selectedUserType: UserType = null;
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;

  // CEP Validation Loading State
  showCepLoading = signal(false);
  cepLoadingMessage = signal(CEP_LOADING_MESSAGES[0].message);
  cepLoadingSubtext = signal(CEP_LOADING_MESSAGES[0].subtext);
  private cepLoadingInterval: ReturnType<typeof setInterval> | null = null;
  private cepMessageIndex = 0;

  // Success Transition State
  showSuccessTransition = signal(false);
  registeredUserName = signal('');

  // CEP specialties options
  specialtiesOptions = [
    'Cuidados Generales',
    'Cuidados Intensivos',
    'Pediatría',
    'Geriatría',
    'Oncología',
    'Cardiología',
    'Heridas y Curaciones',
    'Terapia IV',
    'Diabetes',
    'Rehabilitación',
  ];

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      // Nurse specific
      cepNumber: [''],
      specialties: [[]],
      // Terms acceptance (for both)
      acceptTerms: [false, [Validators.requiredTrue]],
      // Professional disclaimer (for nurses)
      acceptProfessionalDisclaimer: [false]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Check URL parameter for user type from landing page
    this.route.queryParams.subscribe(params => {
      if (params['type'] === 'nurse') {
        this.selectUserType('nurse');
      } else if (params['type'] === 'patient') {
        this.selectUserType('patient');
      } else {
        // No type specified, redirect to landing to choose
        this.router.navigate(['/onboarding/landing']);
      }
    });
  }

  ngOnDestroy() {
    this.stopCepLoadingMessages();
  }

  // CEP Loading Message Rotation
  private startCepLoadingMessages() {
    this.cepMessageIndex = 0;
    this.cepLoadingMessage.set(CEP_LOADING_MESSAGES[0].message);
    this.cepLoadingSubtext.set(CEP_LOADING_MESSAGES[0].subtext);
    this.showCepLoading.set(true);

    this.cepLoadingInterval = setInterval(() => {
      this.cepMessageIndex = (this.cepMessageIndex + 1) % CEP_LOADING_MESSAGES.length;
      this.cepLoadingMessage.set(CEP_LOADING_MESSAGES[this.cepMessageIndex].message);
      this.cepLoadingSubtext.set(CEP_LOADING_MESSAGES[this.cepMessageIndex].subtext);
    }, 2000);
  }

  private stopCepLoadingMessages() {
    if (this.cepLoadingInterval) {
      clearInterval(this.cepLoadingInterval);
      this.cepLoadingInterval = null;
    }
    this.showCepLoading.set(false);
  }

  selectUserType(type: UserType) {
    this.selectedUserType = type;

    // Update validators based on user type
    if (type === 'nurse') {
      this.registerForm.get('cepNumber')?.setValidators([Validators.required, Validators.pattern(/^[0-9]{6}$/)]);
      this.registerForm.get('acceptProfessionalDisclaimer')?.setValidators([Validators.requiredTrue]);
    } else {
      this.registerForm.get('cepNumber')?.clearValidators();
      this.registerForm.get('acceptProfessionalDisclaimer')?.clearValidators();
    }
    this.registerForm.get('cepNumber')?.updateValueAndValidity();
    this.registerForm.get('acceptProfessionalDisclaimer')?.updateValueAndValidity();
  }

  goBack() {
    // Always go back to landing (type selection is there now)
    this.router.navigate(['/onboarding/landing']);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.markFormTouched();
      return;
    }

    const { firstName, lastName, email, phone, password, cepNumber, specialties, acceptTerms, acceptProfessionalDisclaimer } = this.registerForm.value;

    if (this.selectedUserType === 'nurse') {
      // Use custom CEP loading overlay for nurses
      this.startCepLoadingMessages();
      this.registeredUserName.set(firstName);

      this.authService.registerNurse({
        firstName,
        lastName,
        email,
        phone,
        password,
        cepNumber,
        specialties: specialties || [],
        termsAccepted: acceptTerms,
        professionalDisclaimerAccepted: acceptProfessionalDisclaimer
      }).subscribe({
        next: async () => {
          this.stopCepLoadingMessages();
          // Show success transition screen
          this.showSuccessTransition.set(true);
        },
        error: async (error) => {
          this.stopCepLoadingMessages();
          await this.showError(error);
        }
      });
    } else {
      // Use standard loading for patients
      const loading = await this.loadingCtrl.create({
        message: 'Creando cuenta...',
        spinner: 'crescent'
      });
      await loading.present();

      this.authService.registerPatient({
        firstName,
        lastName,
        email,
        phone,
        password
      }).subscribe({
        next: async () => {
          await loading.dismiss();
          const toast = await this.toastCtrl.create({
            message: 'Cuenta creada exitosamente',
            duration: 3000,
            position: 'bottom',
            color: 'success',
            icon: 'checkmark-circle-outline'
          });
          await toast.present();
          this.router.navigate(['/patient/tabs/home']);
        },
        error: async (error) => {
          await loading.dismiss();
          await this.showError(error);
        }
      });
    }
  }

  // Navigate to verification after success transition
  continueToVerification() {
    this.showSuccessTransition.set(false);
    this.router.navigate(['/nurse/verification']);
  }

  // Skip verification for now (navigate to dashboard with limited access)
  skipVerificationForNow() {
    this.showSuccessTransition.set(false);
    this.router.navigate(['/nurse/dashboard']);
  }

  private async showError(error: any) {
    let message = 'Error al crear la cuenta';
    if (error.status === 409) {
      message = 'Este correo ya está registrado';
    } else if (error.error?.message?.includes('CEP')) {
      message = 'Este número CEP ya está registrado';
    } else if (error.status === 0) {
      message = 'Error de conexión. Verifica tu internet.';
    }

    const toast = await this.toastCtrl.create({
      message,
      duration: 4000,
      position: 'bottom',
      color: 'danger',
      icon: 'alert-circle-outline'
    });
    await toast.present();
  }

  private markFormTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }

  // Getters for template
  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get phone() { return this.registerForm.get('phone'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get cepNumber() { return this.registerForm.get('cepNumber'); }
  get acceptTerms() { return this.registerForm.get('acceptTerms'); }
  get acceptProfessionalDisclaimer() { return this.registerForm.get('acceptProfessionalDisclaimer'); }
}
