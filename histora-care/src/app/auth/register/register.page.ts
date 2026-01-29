import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { exhaustMap, takeUntil, take } from 'rxjs/operators';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  // Prevent double submission
  isSubmitting = signal(false);

  // RxJS subjects for controlled submission
  private submitNurse$ = new Subject<void>();
  private submitPatient$ = new Subject<void>();
  private destroy$ = new Subject<void>();

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
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['type'] === 'nurse') {
        this.selectUserType('nurse');
      } else if (params['type'] === 'patient') {
        this.selectUserType('patient');
      }
      // If no type specified, show type selector (don't redirect to landing)
      // This allows users coming from login page to select their type here
    });

    // Set up nurse registration handler - exhaustMap ignores new requests while one is in progress
    this.setupNurseRegistrationHandler();
    this.setupPatientRegistrationHandler();
  }

  ngOnDestroy() {
    this.stopCepLoadingMessages();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupNurseRegistrationHandler() {
    this.submitNurse$.pipe(
      takeUntil(this.destroy$),
      exhaustMap(() => {
        const { firstName, lastName, email, phone, password, cepNumber, specialties, acceptTerms, acceptProfessionalDisclaimer } = this.registerForm.value;

        this.startCepLoadingMessages();
        this.registeredUserName.set(firstName);

        return this.authService.registerNurse({
          firstName,
          lastName,
          email,
          phone,
          password,
          cepNumber,
          specialties: specialties || [],
          termsAccepted: acceptTerms,
          professionalDisclaimerAccepted: acceptProfessionalDisclaimer
        }).pipe(take(1)); // Ensure only one emission per request
      })
    ).subscribe({
      next: async () => {
        this.stopCepLoadingMessages();
        this.showSuccessTransition.set(true);
      },
      error: async (error) => {
        this.stopCepLoadingMessages();
        this.isSubmitting.set(false);
        await this.showError(error);
      }
    });
  }

  private setupPatientRegistrationHandler() {
    let loadingRef: HTMLIonLoadingElement | null = null;

    this.submitPatient$.pipe(
      takeUntil(this.destroy$),
      exhaustMap(async () => {
        const { firstName, lastName, email, phone, password, acceptTerms } = this.registerForm.value;

        console.log('[REGISTER] Starting patient registration...');

        loadingRef = await this.loadingCtrl.create({
          message: 'Creando cuenta...',
          spinner: 'crescent'
        });
        await loadingRef.present();

        return { firstName, lastName, email, phone, password, termsAccepted: acceptTerms };
      }),
      exhaustMap((data) => {
        console.log('[REGISTER] Calling API with data:', { ...data, password: '***' });
        return this.authService.registerPatient(data).pipe(
          take(1),
          takeUntil(this.destroy$)
        );
      })
    ).subscribe({
      next: async (response) => {
        console.log('[REGISTER] Registration successful, user:', response?.user?.email);
        await loadingRef?.dismiss();
        loadingRef = null;

        const toast = await this.toastCtrl.create({
          message: 'Cuenta creada exitosamente',
          duration: 3000,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle-outline'
        });
        await toast.present();

        console.log('[REGISTER] Navigating to /patient/tabs/home...');
        this.router.navigate(['/patient/tabs/home']);
      },
      error: async (error) => {
        console.error('[REGISTER] Registration failed:', error);
        console.error('[REGISTER] Error status:', error?.status);
        console.error('[REGISTER] Error message:', error?.error?.message || error?.message);

        await loadingRef?.dismiss();
        loadingRef = null;

        this.isSubmitting.set(false);
        await this.showError(error);
      }
    });
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
    // If user has selected a type and is in the form, go back to type selection
    if (this.selectedUserType) {
      this.selectedUserType = null;
      // Clear any nurse-specific validators
      this.registerForm.get('cepNumber')?.clearValidators();
      this.registerForm.get('acceptProfessionalDisclaimer')?.clearValidators();
      this.registerForm.get('cepNumber')?.updateValueAndValidity();
      this.registerForm.get('acceptProfessionalDisclaimer')?.updateValueAndValidity();
    } else {
      // If at type selection, go back to login
      this.router.navigate(['/auth/login']);
    }
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

  onSubmit() {
    // Prevent double submission
    if (this.isSubmitting()) {
      return;
    }

    if (this.registerForm.invalid) {
      this.markFormTouched();
      return;
    }

    // Mark as submitting immediately
    this.isSubmitting.set(true);

    // Trigger the appropriate subject - exhaustMap will handle the rest
    if (this.selectedUserType === 'nurse') {
      this.submitNurse$.next();
    } else {
      this.submitPatient$.next();
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
    const errorMessage = error.error?.message || error.message || '';

    console.log('[REGISTER] showError called with:', {
      status: error?.status,
      errorMessage,
      fullError: error
    });

    if (error.status === 409) {
      // Check specific 409 error types
      if (errorMessage.includes('CEP')) {
        message = 'Este número CEP ya está registrado';
      } else {
        message = 'Este correo ya está registrado';
      }
    } else if (error.status === 0) {
      message = 'Error de conexión. Verifica tu internet.';
    } else if (error.status === 400) {
      // Validation error - show the actual message if available
      message = errorMessage || 'Datos inválidos. Verifica la información ingresada.';
    } else if (error.status >= 500) {
      message = 'Error del servidor. Intenta de nuevo más tarde.';
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

  /**
   * Transform input to title case for name fields (first letter uppercase)
   */
  toTitleCase(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const titleCaseValue = input.value
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    this.registerForm.get(controlName)?.setValue(titleCaseValue, { emitEvent: false });
  }
}
