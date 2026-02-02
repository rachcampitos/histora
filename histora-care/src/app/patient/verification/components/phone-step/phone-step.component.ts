import { Component, EventEmitter, Output, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { PatientVerificationService } from '../../../../core/services/patient-verification.service';

type PhoneSubStep = 'enter-phone' | 'enter-code';

@Component({
  selector: 'app-phone-step',
  templateUrl: './phone-step.component.html',
  standalone: false,
  styleUrls: ['./phone-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneStepComponent {
  @Output() completed = new EventEmitter<void>();
  @Output() skip = new EventEmitter<void>();

  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private verificationService = inject(PatientVerificationService);

  // State
  subStep = signal<PhoneSubStep>('enter-phone');
  phoneNumber = signal('');
  verificationCode = signal('');
  isLoading = signal(false);
  error = signal<string | null>(null);
  codeDigits = signal<string[]>(['', '', '', '', '', '']);

  // Timer for resend
  resendTimer = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  get formattedPhone(): string {
    const phone = this.phoneNumber();
    if (phone.length >= 9) {
      return `+51 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
    }
    return phone;
  }

  get isPhoneValid(): boolean {
    const phone = this.phoneNumber().replace(/\D/g, '');
    return phone.length === 9 && phone.startsWith('9');
  }

  get isCodeComplete(): boolean {
    return this.codeDigits().every(d => d !== '');
  }

  onPhoneInput(event: any) {
    const value = event.target.value.replace(/\D/g, '');
    this.phoneNumber.set(value.slice(0, 9));
    this.error.set(null);
  }

  onCodeInput(index: number, event: any) {
    const value = event.target.value;
    const digits = [...this.codeDigits()];

    if (value.length === 1 && /\d/.test(value)) {
      digits[index] = value;
      this.codeDigits.set(digits);

      // Auto-focus next input
      if (index < 5) {
        const nextInput = document.querySelector(`#code-input-${index + 1}`) as HTMLInputElement;
        nextInput?.focus();
      }
    } else if (value === '') {
      digits[index] = '';
      this.codeDigits.set(digits);
    }

    // Build verification code
    this.verificationCode.set(digits.join(''));
    this.error.set(null);
  }

  onCodeKeydown(index: number, event: KeyboardEvent) {
    const digits = this.codeDigits();

    if (event.key === 'Backspace' && digits[index] === '' && index > 0) {
      const prevInput = document.querySelector(`#code-input-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    }
  }

  onCodePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text') || '';
    const digits = pasteData.replace(/\D/g, '').slice(0, 6).split('');

    const newDigits = [...this.codeDigits()];
    digits.forEach((d, i) => {
      if (i < 6) newDigits[i] = d;
    });
    this.codeDigits.set(newDigits);
    this.verificationCode.set(newDigits.join(''));

    // Focus last filled or next empty
    const lastFilledIndex = newDigits.findIndex(d => d === '') - 1;
    const focusIndex = lastFilledIndex >= 0 ? lastFilledIndex : 5;
    const input = document.querySelector(`#code-input-${focusIndex}`) as HTMLInputElement;
    input?.focus();
  }

  async sendCode() {
    if (!this.isPhoneValid) {
      this.error.set('Ingresa un numero de celular valido');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const loading = await this.loadingCtrl.create({
      message: 'Enviando codigo...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const formattedPhone = this.verificationService.formatPhoneNumber(this.phoneNumber());

      await this.verificationService.sendPhoneCode({ phone: formattedPhone }).toPromise();

      this.subStep.set('enter-code');
      this.startResendTimer();

      await this.showToast('Codigo enviado a tu celular', 'success');
    } catch (err: any) {
      console.error('Error sending code:', err);
      this.error.set(err?.error?.message || 'Error al enviar el codigo');
    } finally {
      this.isLoading.set(false);
      await loading.dismiss();
    }
  }

  async verifyCode() {
    if (!this.isCodeComplete) {
      this.error.set('Ingresa el codigo completo');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const loading = await this.loadingCtrl.create({
      message: 'Verificando...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const formattedPhone = this.verificationService.formatPhoneNumber(this.phoneNumber());

      await this.verificationService.verifyPhoneCode({
        phone: formattedPhone,
        code: this.verificationCode()
      }).toPromise();

      await this.showToast('Telefono verificado correctamente', 'success');
      this.stopResendTimer();
      this.completed.emit();
    } catch (err: any) {
      console.error('Error verifying code:', err);
      this.error.set(err?.error?.message || 'Codigo incorrecto');
      // Clear code inputs
      this.codeDigits.set(['', '', '', '', '', '']);
      this.verificationCode.set('');
    } finally {
      this.isLoading.set(false);
      await loading.dismiss();
    }
  }

  async resendCode() {
    if (this.resendTimer() > 0) return;
    await this.sendCode();
  }

  changePhone() {
    this.subStep.set('enter-phone');
    this.codeDigits.set(['', '', '', '', '', '']);
    this.verificationCode.set('');
    this.error.set(null);
    this.stopResendTimer();
  }

  private startResendTimer() {
    this.resendTimer.set(60);
    this.timerInterval = setInterval(() => {
      const current = this.resendTimer();
      if (current > 0) {
        this.resendTimer.set(current - 1);
      } else {
        this.stopResendTimer();
      }
    }, 1000);
  }

  private stopResendTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.resendTimer.set(0);
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  ngOnDestroy() {
    this.stopResendTimer();
  }
}
