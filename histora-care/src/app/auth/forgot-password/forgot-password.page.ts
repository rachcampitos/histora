import { Component, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

type Step = 'email' | 'otp' | 'password';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  standalone: false,
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage implements AfterViewInit {
  @ViewChild('otpInput1') otpInput1!: ElementRef<HTMLInputElement>;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private authService = inject(AuthService);

  currentStep: Step = 'email';
  email = '';
  otp = ['', '', '', '', '', ''];
  showPassword = false;
  showConfirmPassword = false;
  canResendOtp = false;
  resendCountdown = 60;
  private resendTimer: ReturnType<typeof setInterval> | null = null;

  emailForm: FormGroup;
  passwordForm: FormGroup;

  constructor() {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngAfterViewInit() {
    // Focus first OTP input when step changes to OTP
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirm = form.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  async requestOtp() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Enviando codigo...',
      spinner: 'crescent'
    });
    await loading.present();

    this.email = this.emailForm.value.email;

    this.authService.requestPasswordOtp(this.email).subscribe({
      next: async () => {
        await loading.dismiss();
        this.currentStep = 'otp';
        this.startResendTimer();

        const toast = await this.toastCtrl.create({
          message: 'Hemos enviado un codigo de 6 digitos a tu correo',
          duration: 4000,
          position: 'bottom',
          color: 'success',
          icon: 'mail-outline'
        });
        await toast.present();

        // Focus first OTP input
        setTimeout(() => {
          const firstInput = document.getElementById('otp-0') as HTMLInputElement;
          if (firstInput) firstInput.focus();
        }, 300);
      },
      error: async (error) => {
        await loading.dismiss();
        let message = 'Error al enviar el codigo';
        if (error.status === 404) {
          message = 'No existe una cuenta con este correo';
        } else if (error.status === 0) {
          message = 'Error de conexion. Verifica tu internet.';
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
    });
  }

  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Only allow digits
    if (!/^\d*$/.test(value)) {
      input.value = '';
      this.otp[index] = '';
      return;
    }

    // Take only the last character
    if (value.length > 1) {
      input.value = value.slice(-1);
    }

    this.otp[index] = input.value;

    // Move to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }

    // Auto-submit when all digits entered
    if (this.isOtpComplete()) {
      this.verifyOtp();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.value = '';
        this.otp[index - 1] = '';
      }
    }
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits.length === 6) {
      for (let i = 0; i < 6; i++) {
        this.otp[i] = digits[i];
        const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
        if (input) input.value = digits[i];
      }
      // Auto-submit
      this.verifyOtp();
    }
  }

  isOtpComplete(): boolean {
    return this.otp.every(digit => digit !== '');
  }

  getOtpCode(): string {
    return this.otp.join('');
  }

  async verifyOtp() {
    if (!this.isOtpComplete()) {
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Verificando codigo...',
      spinner: 'crescent'
    });
    await loading.present();

    this.authService.verifyPasswordOtp(this.email, this.getOtpCode()).subscribe({
      next: async () => {
        await loading.dismiss();
        this.currentStep = 'password';
        this.stopResendTimer();
      },
      error: async (error) => {
        await loading.dismiss();
        const message = error.error?.message || 'Codigo invalido o expirado';
        const toast = await this.toastCtrl.create({
          message,
          duration: 4000,
          position: 'bottom',
          color: 'danger',
          icon: 'alert-circle-outline'
        });
        await toast.present();

        // Clear OTP inputs
        this.otp = ['', '', '', '', '', ''];
        for (let i = 0; i < 6; i++) {
          const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
          if (input) input.value = '';
        }
        const firstInput = document.getElementById('otp-0') as HTMLInputElement;
        if (firstInput) firstInput.focus();
      }
    });
  }

  async resetPassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Actualizando contrasena...',
      spinner: 'crescent'
    });
    await loading.present();

    this.authService.resetPasswordWithOtp(
      this.email,
      this.getOtpCode(),
      this.passwordForm.value.password
    ).subscribe({
      next: async () => {
        await loading.dismiss();
        const toast = await this.toastCtrl.create({
          message: 'Contrasena actualizada exitosamente',
          duration: 4000,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle-outline'
        });
        await toast.present();
        this.router.navigate(['/auth/login']);
      },
      error: async (error) => {
        await loading.dismiss();
        const message = error.error?.message || 'Error al actualizar la contrasena';
        const toast = await this.toastCtrl.create({
          message,
          duration: 4000,
          position: 'bottom',
          color: 'danger',
          icon: 'alert-circle-outline'
        });
        await toast.present();
      }
    });
  }

  async resendOtp() {
    if (!this.canResendOtp) return;

    const loading = await this.loadingCtrl.create({
      message: 'Reenviando codigo...',
      spinner: 'crescent'
    });
    await loading.present();

    this.authService.requestPasswordOtp(this.email).subscribe({
      next: async () => {
        await loading.dismiss();
        this.startResendTimer();

        const toast = await this.toastCtrl.create({
          message: 'Nuevo codigo enviado a tu correo',
          duration: 3000,
          position: 'bottom',
          color: 'success',
          icon: 'mail-outline'
        });
        await toast.present();
      },
      error: async (error) => {
        await loading.dismiss();
        const message = error.error?.message || 'Error al reenviar el codigo';
        const toast = await this.toastCtrl.create({
          message,
          duration: 3000,
          position: 'bottom',
          color: 'danger',
          icon: 'alert-circle-outline'
        });
        await toast.present();
      }
    });
  }

  private startResendTimer() {
    this.canResendOtp = false;
    this.resendCountdown = 60;

    this.resendTimer = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        this.canResendOtp = true;
        this.stopResendTimer();
      }
    }, 1000);
  }

  private stopResendTimer() {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }

  goBack() {
    if (this.currentStep === 'otp') {
      this.currentStep = 'email';
      this.otp = ['', '', '', '', '', ''];
      this.stopResendTimer();
    } else if (this.currentStep === 'password') {
      // For security, go back to email step
      this.currentStep = 'email';
      this.otp = ['', '', '', '', '', ''];
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Getters for template
  get emailCtrl() { return this.emailForm.get('email'); }
  get passwordCtrl() { return this.passwordForm.get('password'); }
  get confirmPasswordCtrl() { return this.passwordForm.get('confirmPassword'); }
}
