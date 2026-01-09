import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
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
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private authService = inject(AuthService);

  loginForm: FormGroup;
  showPassword = false;

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
          this.router.navigate(['/patient/map']);
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

  async forgotPassword() {
    const alert = await this.alertCtrl.create({
      header: 'Recuperar Contraseña',
      message: 'Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'correo@ejemplo.com'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar',
          handler: (data) => {
            if (data.email) {
              this.sendPasswordReset(data.email);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async sendPasswordReset(email: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Enviando correo...',
      spinner: 'crescent'
    });
    await loading.present();

    // TODO: Implement forgot password API call
    setTimeout(async () => {
      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: 'Si el correo existe, recibirás un enlace de recuperación.',
        duration: 4000,
        position: 'bottom',
        color: 'success',
        icon: 'mail-outline'
      });
      await toast.present();
    }, 1500);
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
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
