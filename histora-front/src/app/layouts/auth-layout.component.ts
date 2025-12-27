import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonApp, IonContent, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, IonApp, IonContent, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-content class="auth-content">
        <div class="auth-container">
          <div class="auth-logo">
            <h1>Histora</h1>
            <p>Gestión de Consultorios Médicos</p>
          </div>
          <ion-router-outlet></ion-router-outlet>
        </div>
      </ion-content>
    </ion-app>
  `,
  styles: [
    `
      .auth-content {
        --background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
      }

      .auth-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
      }

      .auth-logo {
        text-align: center;
        margin-bottom: 32px;
        color: white;
      }

      .auth-logo h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0;
      }

      .auth-logo p {
        font-size: 1rem;
        opacity: 0.9;
        margin-top: 8px;
      }
    `,
  ],
})
export class AuthLayoutComponent {}
