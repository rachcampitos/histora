import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  standalone: false,
  styleUrls: ['./reset-password.page.scss'],
})
export class ResetPasswordPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private authService = inject(AuthService);

  resetForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  token: string | null = null;
  isValidToken = true;
  isSuccess = false;

  constructor() {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    // Get token from URL query params
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.isValidToken = false;
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async onSubmit() {
    if (this.resetForm.invalid || !this.token) {
      this.markFormTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Actualizando contraseña...',
      spinner: 'crescent'
    });
    await loading.present();

    const { password } = this.resetForm.value;

    this.authService.resetPassword(this.token, password).subscribe({
      next: async (response) => {
        await loading.dismiss();
        this.isSuccess = true;

        const toast = await this.toastCtrl.create({
          message: response.message || 'Tu contraseña ha sido actualizada exitosamente',
          duration: 4000,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle-outline'
        });
        await toast.present();
      },
      error: async (error) => {
        await loading.dismiss();

        let message = 'Error al actualizar la contraseña';
        if (error.status === 401) {
          message = 'El enlace de recuperación es inválido o ha expirado';
          this.isValidToken = false;
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
    });
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  private markFormTouched() {
    Object.keys(this.resetForm.controls).forEach(key => {
      this.resetForm.get(key)?.markAsTouched();
    });
  }

  // Getters for template
  get password() { return this.resetForm.get('password'); }
  get confirmPassword() { return this.resetForm.get('confirmPassword'); }
}
