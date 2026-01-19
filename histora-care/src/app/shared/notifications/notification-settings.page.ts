import { Component, OnInit, inject } from '@angular/core';
import { Location } from '@angular/common';
import { AlertController, ToastController } from '@ionic/angular';
import { NotificationService, NotificationPreferences } from '../../core/services/notification.service';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.page.html',
  standalone: false,
  styleUrls: ['./notification-settings.page.scss'],
})
export class NotificationSettingsPage implements OnInit {
  private location = inject(Location);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  notificationService = inject(NotificationService);

  isNative = Capacitor.isNativePlatform();

  ngOnInit() {}

  goBack() {
    this.location.back();
  }

  async togglePush() {
    const prefs = this.notificationService.preferences();

    if (!prefs.pushEnabled) {
      // Enabling - check permission
      const granted = await this.notificationService.requestPermission();
      if (!granted) {
        await this.showPermissionAlert();
        return;
      }
    }

    await this.notificationService.togglePreference('pushEnabled');
    this.showToast(
      prefs.pushEnabled
        ? 'Notificaciones push desactivadas'
        : 'Notificaciones push activadas'
    );
  }

  async togglePreference(key: keyof NotificationPreferences) {
    if (key === 'pushEnabled') {
      await this.togglePush();
      return;
    }

    await this.notificationService.togglePreference(key);
  }

  private async showPermissionAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Permiso Requerido',
      message: 'Para recibir notificaciones, debes habilitar los permisos en la configuracion de tu dispositivo.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Abrir Configuracion',
          handler: () => {
            // On iOS/Android, this would open app settings
            // For now just show a message
            this.showToast('Abre la configuracion de tu dispositivo y habilita las notificaciones para NurseLite');
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}
