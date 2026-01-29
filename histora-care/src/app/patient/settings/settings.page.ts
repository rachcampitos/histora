import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { UploadsService } from '../../core/services/uploads.service';
import { ProductTourService } from '../../core/services/product-tour.service';
import { AuthUser } from '../../core/models/user.model';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  standalone: false,
  styleUrls: ['./settings.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage implements OnInit {
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private actionSheetCtrl = inject(ActionSheetController);
  private toastCtrl = inject(ToastController);
  private authService = inject(AuthService);
  private uploadsService = inject(UploadsService);
  private productTourService = inject(ProductTourService);
  themeService = inject(ThemeService);

  user = signal<AuthUser | null>(null);
  isUploadingAvatar = signal(false);

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    const currentUser = this.authService.user();
    this.user.set(currentUser);
  }

  async openThemeSelector() {
    const currentTheme = this.themeService.currentTheme();

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar Tema',
      buttons: [
        {
          text: 'Claro',
          icon: 'sunny-outline',
          cssClass: currentTheme === 'light' ? 'selected-theme' : '',
          handler: () => {
            this.themeService.setTheme('light');
          }
        },
        {
          text: 'Oscuro',
          icon: 'moon-outline',
          cssClass: currentTheme === 'dark' ? 'selected-theme' : '',
          handler: () => {
            this.themeService.setTheme('dark');
          }
        },
        {
          text: 'Automático (según dispositivo)',
          icon: 'phone-portrait-outline',
          cssClass: currentTheme === 'auto' ? 'selected-theme' : '',
          handler: () => {
            this.themeService.setTheme('auto');
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close-outline'
        }
      ]
    });

    await actionSheet.present();
  }

  editProfile() {
    this.router.navigate(['/patient/profile']);
  }

  async changeAvatar(event: Event) {
    event.stopPropagation();

    if (this.isUploadingAvatar()) return;

    try {
      const photo = await this.uploadsService.promptAndGetPhoto();

      if (photo) {
        this.isUploadingAvatar.set(true);

        this.uploadsService.uploadProfilePhoto(photo.base64, photo.mimeType).subscribe({
          next: async (response) => {
            if (response.success && response.url) {
              await this.authService.updateUserAvatar(response.url);
              this.loadUserProfile();
              this.showToast('Foto actualizada correctamente', 'success');
            } else {
              this.showToast('Error al subir la foto', 'danger');
            }
            this.isUploadingAvatar.set(false);
          },
          error: (err) => {
            console.error('Error uploading avatar:', err);
            this.showToast('Error al subir la foto', 'danger');
            this.isUploadingAvatar.set(false);
          }
        });
      }
    } catch (error) {
      console.error('Error changing avatar:', error);
      this.showToast('Error al cambiar la foto', 'danger');
      this.isUploadingAvatar.set(false);
    }
  }

  viewServiceHistory() {
    this.router.navigate(['/patient/tabs/history']);
  }

  openPaymentMethods() {
    this.showToast('Próximamente: Métodos de pago', 'primary');
  }

  openNotificationSettings() {
    this.router.navigate(['/notifications/settings']);
  }

  openPrivacy() {
    this.router.navigate(['/legal/privacy']);
  }

  openHelp() {
    this.router.navigate(['/legal/help']);
  }

  openTerms() {
    this.router.navigate(['/legal/terms']);
  }

  async replayTour() {
    // Reset the tour and set it as pending for the home page
    await this.productTourService.resetTour('patient_home');
    await this.productTourService.setPendingTour('patient_home');
    this.router.navigate(['/patient/tabs/home']);
    this.showToast('El tutorial comenzará en la pantalla de inicio', 'primary');
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-danger',
      header: 'Cerrar Sesión',
      message: '¿Estás seguro que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          role: 'destructive',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          },
        },
      ],
    });

    await alert.present();
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
