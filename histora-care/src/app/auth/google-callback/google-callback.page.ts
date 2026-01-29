import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthUser } from '../../core/models';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-google-callback',
  templateUrl: './google-callback.page.html',
  styleUrls: ['./google-callback.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleCallbackPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private alertController = inject(AlertController);

  message = 'Procesando autenticacion...';
  isError = false;

  ngOnInit() {
    this.processCallback();
  }

  private async processCallback() {
    try {
      // Get query parameters from URL
      const accessToken = this.route.snapshot.queryParamMap.get('access_token');
      const refreshToken = this.route.snapshot.queryParamMap.get('refresh_token');
      const userJson = this.route.snapshot.queryParamMap.get('user');
      const isNewUser = this.route.snapshot.queryParamMap.get('is_new_user') === 'true';
      const error = this.route.snapshot.queryParamMap.get('error');

      // Check for error
      if (error) {
        this.isError = true;
        this.message = 'Error en la autenticacion con Google';
        await this.showAlert('Error', 'No se pudo completar la autenticacion con Google. Por favor intente de nuevo.');
        this.router.navigate(['/auth/login']);
        return;
      }

      // Validate tokens
      if (!accessToken || !refreshToken || !userJson) {
        this.isError = true;
        this.message = 'Datos de autenticacion incompletos';
        await this.showAlert('Error', 'No se recibieron los datos de autenticacion necesarios.');
        this.router.navigate(['/auth/login']);
        return;
      }

      // Parse user data
      let user: AuthUser;
      try {
        user = JSON.parse(userJson);
      } catch {
        this.isError = true;
        this.message = 'Error al procesar datos del usuario';
        this.router.navigate(['/auth/login']);
        return;
      }

      // Store auth data using AuthService
      await this.authService.handleOAuthSuccess(accessToken, refreshToken, user, isNewUser);

      // Update message
      this.message = 'Autenticacion exitosa! Redirigiendo...';

      // Redirect based on user type and whether it's a new user
      setTimeout(() => {
        if (isNewUser || !user.role) {
          // New user needs to complete registration (select type: nurse or patient)
          this.router.navigate(['/auth/complete-registration']);
        } else {
          // Existing user - redirect based on role
          this.redirectByRole(user.role);
        }
      }, 1000);

    } catch (error) {
      console.error('Error processing OAuth callback:', error);
      this.isError = true;
      this.message = 'Error procesando la autenticacion';
      await this.showAlert('Error', 'Ocurrio un error al procesar la autenticacion. Por favor intente de nuevo.');
      this.router.navigate(['/auth/login']);
    }
  }

  private redirectByRole(role: string) {
    switch (role) {
      case 'nurse':
        this.router.navigate(['/nurse/dashboard']);
        break;
      case 'patient':
        this.router.navigate(['/patient/tabs/home']);
        break;
      case 'admin':
        this.router.navigate(['/admin/verifications']);
        break;
      default:
        // Unknown role - might be new user who needs to select type
        this.router.navigate(['/auth/complete-registration']);
    }
  }

  private async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
