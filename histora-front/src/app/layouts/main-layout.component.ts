import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonRouterOutlet,
  IonAvatar,
  IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  peopleOutline,
  calendarOutline,
  medkitOutline,
  documentTextOutline,
  settingsOutline,
  logOutOutline,
  personCircleOutline,
} from 'ionicons/icons';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonRouterOutlet,
    IonAvatar,
    IonButton,
  ],
  template: `
    <ion-app>
      <ion-split-pane contentId="main-content">
        <ion-menu contentId="main-content" type="overlay">
          <ion-header>
            <ion-toolbar color="primary">
              <ion-title>Histora</ion-title>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <!-- User Info -->
            <div class="user-info">
              <ion-avatar>
                <ion-icon name="person-circle-outline" size="large"></ion-icon>
              </ion-avatar>
              <div class="user-details">
                <h3>{{ auth.user()?.firstName }} {{ auth.user()?.lastName }}</h3>
                <p>{{ auth.user()?.email }}</p>
              </div>
            </div>

            <ion-list>
              <ion-list-header>
                <ion-label>Menú Principal</ion-label>
              </ion-list-header>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/dashboard" routerLinkActive="selected">
                  <ion-icon name="home-outline" slot="start"></ion-icon>
                  <ion-label>Dashboard</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/patients" routerLinkActive="selected">
                  <ion-icon name="people-outline" slot="start"></ion-icon>
                  <ion-label>Pacientes</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/appointments" routerLinkActive="selected">
                  <ion-icon name="calendar-outline" slot="start"></ion-icon>
                  <ion-label>Citas</ion-label>
                </ion-item>
              </ion-menu-toggle>

              @if (auth.isDoctor()) {
                <ion-menu-toggle auto-hide="false">
                  <ion-item routerLink="/consultations" routerLinkActive="selected">
                    <ion-icon name="medkit-outline" slot="start"></ion-icon>
                    <ion-label>Consultas</ion-label>
                  </ion-item>
                </ion-menu-toggle>

                <ion-menu-toggle auto-hide="false">
                  <ion-item routerLink="/clinical-history" routerLinkActive="selected">
                    <ion-icon name="document-text-outline" slot="start"></ion-icon>
                    <ion-label>Historiales</ion-label>
                  </ion-item>
                </ion-menu-toggle>
              }
            </ion-list>

            <ion-list>
              <ion-list-header>
                <ion-label>Configuración</ion-label>
              </ion-list-header>

              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/settings" routerLinkActive="selected">
                  <ion-icon name="settings-outline" slot="start"></ion-icon>
                  <ion-label>Ajustes</ion-label>
                </ion-item>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <ion-item button (click)="logout()">
                  <ion-icon name="log-out-outline" slot="start" color="danger"></ion-icon>
                  <ion-label color="danger">Cerrar Sesión</ion-label>
                </ion-item>
              </ion-menu-toggle>
            </ion-list>
          </ion-content>
        </ion-menu>

        <ion-router-outlet id="main-content"></ion-router-outlet>
      </ion-split-pane>
    </ion-app>
  `,
  styles: [
    `
      .user-info {
        display: flex;
        align-items: center;
        padding: 16px;
        background: var(--ion-color-light);
        border-bottom: 1px solid var(--ion-color-light-shade);
      }

      .user-info ion-avatar {
        width: 48px;
        height: 48px;
        margin-right: 12px;
      }

      .user-info ion-avatar ion-icon {
        width: 100%;
        height: 100%;
        color: var(--ion-color-medium);
      }

      .user-details h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      .user-details p {
        margin: 4px 0 0;
        font-size: 12px;
        color: var(--ion-color-medium);
      }

      ion-item.selected {
        --background: var(--ion-color-primary-tint);
        --color: var(--ion-color-primary);
      }

      ion-item.selected ion-icon {
        color: var(--ion-color-primary);
      }
    `,
  ],
})
export class MainLayoutComponent {
  auth = inject(AuthService);

  constructor() {
    addIcons({
      homeOutline,
      peopleOutline,
      calendarOutline,
      medkitOutline,
      documentTextOutline,
      settingsOutline,
      logOutOutline,
      personCircleOutline,
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
