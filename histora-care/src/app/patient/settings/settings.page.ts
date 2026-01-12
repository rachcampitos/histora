import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  standalone: false,
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private actionSheetCtrl = inject(ActionSheetController);
  private toastCtrl = inject(ToastController);
  private authService = inject(AuthService);
  themeService = inject(ThemeService);

  user = signal<any>(null);

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

  viewServiceHistory() {
    this.router.navigate(['/patient/tabs/history']);
  }

  openPaymentMethods() {
    this.showToast('Próximamente: Métodos de pago', 'primary');
  }

  openNotificationSettings() {
    this.showToast('Próximamente: Configuración de notificaciones', 'primary');
  }

  openPrivacy() {
    this.showToast('Próximamente: Configuración de privacidad', 'primary');
  }

  openHelp() {
    this.showToast('Próximamente: Centro de ayuda', 'primary');
  }

  openTerms() {
    this.showToast('Próximamente: Términos y condiciones', 'primary');
  }

  async logout() {
    const alert = await this.alertCtrl.create({
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
