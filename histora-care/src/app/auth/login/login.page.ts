import { Component, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: false,
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private authService = inject(AuthService);

  loginForm: FormGroup;
  showPassword = false;
  googleAuthPending = computed(() => this.authService.googleAuthPending());

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  ngOnInit() {
    // Initialize auth service
    this.authService.initialize();

    // Check for OAuth error in query params
    const error = this.route.snapshot.queryParams['error'];
    if (error) {
      this.showOAuthError(error);
    }
  }

  private async showOAuthError(error: string) {
    let message = 'Error en la autenticacion';
    if (error === 'google_auth_failed') {
      message = 'Error en la autenticacion con Google. Por favor intenta de nuevo.';
    } else if (error === 'google_auth_cancelled') {
      message = 'Autenticacion con Google cancelada.';
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

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Iniciando sesión...',
      spinner: 'crescent'
    });
    await loading.present();

    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login({ email, password, rememberMe }).subscribe({
      next: async (response) => {
        await loading.dismiss();

        // Navigate based on user role
        if (response.user.role === 'nurse') {
          this.router.navigate(['/nurse/dashboard']);
        } else if (response.user.role === 'patient') {
          this.router.navigate(['/patient/tabs/home']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: async (error) => {
        await loading.dismiss();

        let message = 'Error al iniciar sesión';
        if (error.status === 401) {
          message = 'Credenciales incorrectas';
        } else if (error.status === 0) {
          message = 'Error de conexión. Verifica tu internet.';
        }

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

  forgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }

  async signInWithGoogle() {
    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      console.error('Error starting Google login:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al iniciar sesion con Google',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
        icon: 'alert-circle-outline'
      });
      await toast.present();
    }
  }

  private markFormTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  // Getters for template
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
