import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonMenuButton,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonToggle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  businessOutline,
  notificationsOutline,
  moonOutline,
  lockClosedOutline,
  helpCircleOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonMenuButton,
    IonButtons,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonToggle,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Ajustes</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item button detail>
          <ion-icon name="person-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h2>Mi Perfil</h2>
            <p>{{ auth.user()?.email }}</p>
          </ion-label>
        </ion-item>

        @if (auth.isClinicOwner()) {
          <ion-item button detail>
            <ion-icon name="business-outline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h2>Mi Consultorio</h2>
              <p>Configuración del consultorio</p>
            </ion-label>
          </ion-item>
        }

        <ion-item button detail>
          <ion-icon name="notifications-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h2>Notificaciones</h2>
            <p>Configurar alertas y recordatorios</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="moon-outline" slot="start" color="primary"></ion-icon>
          <ion-label>Modo Oscuro</ion-label>
          <ion-toggle slot="end"></ion-toggle>
        </ion-item>

        <ion-item button detail>
          <ion-icon name="lock-closed-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h2>Seguridad</h2>
            <p>Cambiar contraseña</p>
          </ion-label>
        </ion-item>

        <ion-item button detail>
          <ion-icon name="help-circle-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h2>Ayuda</h2>
            <p>Centro de ayuda y soporte</p>
          </ion-label>
        </ion-item>

        <ion-item button detail>
          <ion-icon name="information-circle-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h2>Acerca de</h2>
            <p>Versión 0.1.0</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: [
    `
      ion-item h2 {
        font-weight: 500;
      }

      ion-item p {
        color: var(--ion-color-medium);
      }
    `,
  ],
})
export class SettingsPage {
  auth = inject(AuthService);

  constructor() {
    addIcons({
      personOutline,
      businessOutline,
      notificationsOutline,
      moonOutline,
      lockClosedOutline,
      helpCircleOutline,
      informationCircleOutline,
    });
  }
}
