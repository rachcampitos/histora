# EJEMPLOS DE IMPLEMENTACIÓN
## Integración de Documentos Legales en NurseLite

Este documento proporciona ejemplos prácticos de código y diseño para implementar los requerimientos legales en la aplicación móvil Ionic/Angular.

---

## 1. PANTALLA DE REGISTRO CON ACEPTACIÓN DE TÉRMINOS

### Template (HTML)

```html
<!-- register.page.html -->
<ion-content>
  <form [formGroup]="registerForm" (ngSubmit)="onRegister()">
    <!-- ... campos de registro ... -->

    <!-- Sección de Términos Legales -->
    <ion-card class="legal-card">
      <ion-card-content>
        <ion-item lines="none">
          <ion-checkbox
            slot="start"
            formControlName="acceptTerms"
            [class.invalid]="registerForm.get('acceptTerms')?.invalid && registerForm.get('acceptTerms')?.touched">
          </ion-checkbox>
          <ion-label class="ion-text-wrap legal-label">
            He leído y acepto los
            <a (click)="openTerms()" class="legal-link">Términos y Condiciones</a>
          </ion-label>
        </ion-item>

        <ion-item lines="none">
          <ion-checkbox
            slot="start"
            formControlName="acceptPrivacy"
            [class.invalid]="registerForm.get('acceptPrivacy')?.invalid && registerForm.get('acceptPrivacy')?.touched">
          </ion-checkbox>
          <ion-label class="ion-text-wrap legal-label">
            He leído y acepto la
            <a (click)="openPrivacy()" class="legal-link">Política de Privacidad</a>
          </ion-label>
        </ion-item>

        <!-- Error messages -->
        <div class="error-message" *ngIf="registerForm.get('acceptTerms')?.invalid && registerForm.get('acceptTerms')?.touched">
          <ion-text color="danger">
            <small>Debes aceptar los Términos y Condiciones para continuar</small>
          </ion-text>
        </div>
      </ion-card-content>
    </ion-card>

    <ion-button
      expand="block"
      type="submit"
      [disabled]="registerForm.invalid || isLoading">
      <ion-spinner *ngIf="isLoading"></ion-spinner>
      <span *ngIf="!isLoading">Crear Cuenta</span>
    </ion-button>
  </form>
</ion-content>
```

### Component (TypeScript)

```typescript
// register.page.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { LegalDocumentModalComponent } from './legal-document-modal.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  registerForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      // ... otros campos ...
      acceptTerms: [false, Validators.requiredTrue],
      acceptPrivacy: [false, Validators.requiredTrue]
    });
  }

  async openTerms() {
    const modal = await this.modalCtrl.create({
      component: LegalDocumentModalComponent,
      componentProps: {
        title: 'Términos y Condiciones',
        type: 'terms'
      }
    });
    await modal.present();
  }

  async openPrivacy() {
    const modal = await this.modalCtrl.create({
      component: LegalDocumentModalComponent,
      componentProps: {
        title: 'Política de Privacidad',
        type: 'privacy'
      }
    });
    await modal.present();
  }

  async onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const userData = {
      ...this.registerForm.value,
      consentTimestamp: new Date().toISOString(),
      consentVersion: '1.0' // Versión de T&C y PP
    };

    try {
      await this.authService.register(userData);
      // Navegar a la siguiente pantalla
    } catch (error) {
      // Manejar error
    } finally {
      this.isLoading = false;
    }
  }
}
```

### Estilos (SCSS)

```scss
// register.page.scss
.legal-card {
  margin-top: 20px;
  border: 1px solid var(--ion-color-medium);

  &.has-error {
    border-color: var(--ion-color-danger);
  }
}

.legal-label {
  font-size: 14px;
  color: var(--ion-color-medium-shade);
  margin-left: 12px;
}

.legal-link {
  color: var(--ion-color-primary);
  text-decoration: underline;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    color: var(--ion-color-primary-shade);
  }
}

ion-checkbox.invalid {
  --border-color: var(--ion-color-danger);
  --checkbox-background-checked: var(--ion-color-danger);
}

.error-message {
  margin-top: 8px;
  padding: 0 16px;
}
```

---

## 2. MODAL DE DOCUMENTOS LEGALES

### Component

```typescript
// legal-document-modal.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { LegalService } from '../services/legal.service';

@Component({
  selector: 'app-legal-document-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner></ion-spinner>
      </div>

      <div *ngIf="!isLoading" [innerHTML]="content" class="legal-content"></div>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-button expand="block" (click)="dismiss()">
          Cerrar
        </ion-button>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .legal-content {
      font-size: 14px;
      line-height: 1.6;
      color: var(--ion-color-dark);

      h1, h2, h3 {
        color: var(--ion-color-primary);
        margin-top: 24px;
        margin-bottom: 12px;
      }

      h1 { font-size: 24px; }
      h2 { font-size: 20px; }
      h3 { font-size: 18px; }

      p {
        margin-bottom: 12px;
      }

      ul, ol {
        padding-left: 20px;
        margin-bottom: 12px;
      }

      strong {
        font-weight: 600;
        color: var(--ion-color-dark-shade);
      }

      a {
        color: var(--ion-color-primary);
        text-decoration: underline;
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }
  `]
})
export class LegalDocumentModalComponent implements OnInit {
  @Input() title: string;
  @Input() type: 'terms' | 'privacy' | 'help';

  content: string = '';
  isLoading = true;

  constructor(
    private modalCtrl: ModalController,
    private legalService: LegalService
  ) {}

  async ngOnInit() {
    try {
      this.content = await this.legalService.getDocument(this.type);
    } catch (error) {
      console.error('Error loading legal document:', error);
      this.content = '<p>Error al cargar el documento. Por favor, inténtalo de nuevo.</p>';
    } finally {
      this.isLoading = false;
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
```

---

## 3. CONSENTIMIENTO PARA DATOS SENSIBLES (SALUD)

### Template

```html
<!-- health-consent.page.html -->
<ion-content>
  <div class="consent-container">
    <div class="warning-icon">
      <ion-icon name="shield-checkmark" color="primary" size="large"></ion-icon>
    </div>

    <h1>Consentimiento para Datos de Salud</h1>

    <ion-card class="info-card">
      <ion-card-content>
        <p class="intro-text">
          Para que el profesional de enfermería pueda brindarte
          atención segura y adecuada, necesitamos tu consentimiento
          para recopilar y compartir información sobre tu salud.
        </p>

        <ion-list class="data-usage-list">
          <ion-item lines="none">
            <ion-icon name="checkmark-circle" slot="start" color="success"></ion-icon>
            <ion-label class="ion-text-wrap">
              <strong>Compartidos</strong> con el profesional asignado
            </ion-label>
          </ion-item>

          <ion-item lines="none">
            <ion-icon name="checkmark-circle" slot="start" color="success"></ion-icon>
            <ion-label class="ion-text-wrap">
              <strong>Almacenados</strong> en tu historial médico digital
            </ion-label>
          </ion-item>

          <ion-item lines="none">
            <ion-icon name="checkmark-circle" slot="start" color="success"></ion-icon>
            <ion-label class="ion-text-wrap">
              <strong>Protegidos</strong> conforme a la Ley 29733
            </ion-label>
          </ion-item>
        </ion-list>

        <ion-note class="revocation-note">
          <ion-icon name="information-circle" color="primary"></ion-icon>
          Puedes revocar este consentimiento en cualquier momento desde
          tu perfil, pero no podremos brindarte servicios sin esta información.
        </ion-note>
      </ion-card-content>
    </ion-card>

    <ion-card class="consent-card">
      <ion-card-content>
        <ion-item lines="none">
          <ion-checkbox
            slot="start"
            [(ngModel)]="hasConsented"
            [class.invalid]="showError">
          </ion-checkbox>
          <ion-label class="ion-text-wrap consent-label">
            <strong>Doy mi consentimiento expreso</strong> para el
            tratamiento de mis datos de salud conforme a lo descrito
          </ion-label>
        </ion-item>

        <div class="error-message" *ngIf="showError">
          <ion-text color="danger">
            <small>Debes otorgar tu consentimiento para continuar</small>
          </ion-text>
        </div>
      </ion-card-content>
    </ion-card>

    <div class="actions">
      <ion-button
        expand="block"
        (click)="onMoreInfo()"
        fill="outline">
        Más Información
      </ion-button>

      <ion-button
        expand="block"
        (click)="onContinue()"
        [disabled]="!hasConsented || isLoading">
        <ion-spinner *ngIf="isLoading"></ion-spinner>
        <span *ngIf="!isLoading">Continuar</span>
      </ion-button>
    </div>
  </div>
</ion-content>
```

### Component

```typescript
// health-consent.page.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-health-consent',
  templateUrl: './health-consent.page.html',
  styleUrls: ['./health-consent.page.scss'],
})
export class HealthConsentPage {
  hasConsented = false;
  showError = false;
  isLoading = false;

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  onMoreInfo() {
    // Abrir modal con Política de Privacidad completa
  }

  async onContinue() {
    if (!this.hasConsented) {
      this.showError = true;
      return;
    }

    this.isLoading = true;

    try {
      await this.userService.saveHealthDataConsent({
        consented: true,
        timestamp: new Date().toISOString(),
        version: '1.0'
      });

      // Navegar a la siguiente pantalla
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error saving consent:', error);
      // Mostrar error
    } finally {
      this.isLoading = false;
    }
  }
}
```

### Estilos

```scss
// health-consent.page.scss
.consent-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.warning-icon {
  text-align: center;
  margin: 20px 0;

  ion-icon {
    font-size: 80px;
  }
}

h1 {
  text-align: center;
  color: var(--ion-color-primary);
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

.intro-text {
  font-size: 16px;
  line-height: 1.6;
  color: var(--ion-color-dark);
  margin-bottom: 20px;
}

.data-usage-list {
  margin: 20px 0;

  ion-item {
    --padding-start: 0;
    --inner-padding-end: 0;
    margin-bottom: 12px;
  }
}

.revocation-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
  margin-top: 20px;
  font-size: 13px;
  line-height: 1.5;

  ion-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }
}

.consent-card {
  border: 2px solid var(--ion-color-primary);
  margin-top: 20px;
}

.consent-label {
  font-size: 15px;
  margin-left: 12px;
}

.actions {
  margin-top: 30px;

  ion-button {
    margin-bottom: 12px;
  }
}
```

---

## 4. SERVICIO DE GESTIÓN LEGAL

```typescript
// services/legal.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LegalDocument {
  type: 'terms' | 'privacy' | 'help';
  version: string;
  lastUpdated: string;
  content: string;
}

export interface UserConsent {
  userId: string;
  termsVersion: string;
  privacyVersion: string;
  healthDataConsent: boolean;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class LegalService {
  private apiUrl = `${environment.apiUrl}/legal`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el contenido de un documento legal
   */
  async getDocument(type: 'terms' | 'privacy' | 'help'): Promise<string> {
    const url = `${this.apiUrl}/documents/${type}`;
    return firstValueFrom(this.http.get(url, { responseType: 'text' }));
  }

  /**
   * Obtiene la versión actual de los documentos legales
   */
  async getCurrentVersions(): Promise<{ terms: string; privacy: string }> {
    const url = `${this.apiUrl}/versions`;
    return firstValueFrom(this.http.get<any>(url));
  }

  /**
   * Guarda el consentimiento del usuario
   */
  async saveConsent(consent: Partial<UserConsent>): Promise<void> {
    const url = `${this.apiUrl}/consent`;
    await firstValueFrom(this.http.post(url, consent));
  }

  /**
   * Obtiene el historial de consentimientos del usuario
   */
  getConsentHistory(): Observable<UserConsent[]> {
    const url = `${this.apiUrl}/consent/history`;
    return this.http.get<UserConsent[]>(url);
  }

  /**
   * Revoca el consentimiento para datos de salud
   */
  async revokeHealthDataConsent(): Promise<void> {
    const url = `${this.apiUrl}/consent/health-data/revoke`;
    await firstValueFrom(this.http.post(url, {}));
  }

  /**
   * Solicita la exportación de datos del usuario (derecho ARCO)
   */
  async requestDataExport(): Promise<{ exportId: string }> {
    const url = `${this.apiUrl}/data-export`;
    return firstValueFrom(this.http.post<any>(url, {}));
  }

  /**
   * Obtiene el estado de una exportación de datos
   */
  getExportStatus(exportId: string): Observable<any> {
    const url = `${this.apiUrl}/data-export/${exportId}`;
    return this.http.get(url);
  }

  /**
   * Descarga el archivo de exportación
   */
  downloadExport(exportId: string): Observable<Blob> {
    const url = `${this.apiUrl}/data-export/${exportId}/download`;
    return this.http.get(url, { responseType: 'blob' });
  }

  /**
   * Solicita la eliminación de cuenta
   */
  async requestAccountDeletion(reason?: string): Promise<void> {
    const url = `${this.apiUrl}/account-deletion`;
    await firstValueFrom(this.http.post(url, { reason }));
  }
}
```

---

## 5. PANTALLA DE PRIVACIDAD EN PERFIL

### Template

```html
<!-- privacy-settings.page.html -->
<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-back-button></ion-back-button>
    </ion-buttons>
    <ion-title>Privacidad y Datos</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <ion-list>
    <!-- Documentos Legales -->
    <ion-list-header>
      <ion-label>Documentos Legales</ion-label>
    </ion-list-header>

    <ion-item button (click)="openDocument('terms')">
      <ion-icon name="document-text-outline" slot="start"></ion-icon>
      <ion-label>Términos y Condiciones</ion-label>
      <ion-note slot="end">v1.0</ion-note>
    </ion-item>

    <ion-item button (click)="openDocument('privacy')">
      <ion-icon name="shield-checkmark-outline" slot="start"></ion-icon>
      <ion-label>Política de Privacidad</ion-label>
      <ion-note slot="end">v1.0</ion-note>
    </ion-item>

    <!-- Gestión de Consentimientos -->
    <ion-list-header>
      <ion-label>Mis Consentimientos</ion-label>
    </ion-list-header>

    <ion-item>
      <ion-icon name="medkit-outline" slot="start" color="primary"></ion-icon>
      <ion-label>
        <h2>Datos de Salud</h2>
        <p>Compartir información médica con profesionales</p>
      </ion-label>
      <ion-toggle
        [(ngModel)]="healthDataConsent"
        (ionChange)="onHealthConsentChange($event)">
      </ion-toggle>
    </ion-item>

    <ion-item button (click)="viewConsentHistory()">
      <ion-icon name="time-outline" slot="start"></ion-icon>
      <ion-label>Historial de Consentimientos</ion-label>
      <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
    </ion-item>

    <!-- Derechos ARCO -->
    <ion-list-header>
      <ion-label>Mis Derechos sobre Mis Datos</ion-label>
    </ion-list-header>

    <ion-item button (click)="exportData()">
      <ion-icon name="download-outline" slot="start" color="primary"></ion-icon>
      <ion-label>
        <h2>Exportar Mis Datos</h2>
        <p>Descarga una copia de tu información</p>
      </ion-label>
    </ion-item>

    <ion-item button (click)="manageNotifications()">
      <ion-icon name="notifications-outline" slot="start"></ion-icon>
      <ion-label>
        <h2>Gestionar Notificaciones</h2>
        <p>Controla qué notificaciones recibes</p>
      </ion-label>
    </ion-item>

    <ion-item button (click)="manageCookies()">
      <ion-icon name="analytics-outline" slot="start"></ion-icon>
      <ion-label>
        <h2>Cookies y Seguimiento</h2>
        <p>Configura tus preferencias de cookies</p>
      </ion-label>
    </ion-item>

    <!-- Zona de Peligro -->
    <ion-list-header>
      <ion-label color="danger">Zona de Peligro</ion-label>
    </ion-list-header>

    <ion-item button (click)="deleteAccount()" lines="none">
      <ion-icon name="trash-outline" slot="start" color="danger"></ion-icon>
      <ion-label color="danger">
        <h2>Eliminar Mi Cuenta</h2>
        <p>Esta acción no se puede deshacer</p>
      </ion-label>
    </ion-item>
  </ion-list>
</ion-content>
```

### Component

```typescript
// privacy-settings.page.ts
import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { LegalService } from '../services/legal.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-privacy-settings',
  templateUrl: './privacy-settings.page.html',
  styleUrls: ['./privacy-settings.page.scss'],
})
export class PrivacySettingsPage implements OnInit {
  healthDataConsent = false;

  constructor(
    private legalService: LegalService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  async ngOnInit() {
    // Cargar estado actual de consentimientos
    await this.loadConsentStatus();
  }

  async loadConsentStatus() {
    // Implementar lógica para cargar estado
  }

  async onHealthConsentChange(event: any) {
    const newValue = event.detail.checked;

    if (!newValue) {
      // Usuario quiere revocar consentimiento
      const alert = await this.alertCtrl.create({
        header: 'Revocar Consentimiento',
        message: 'Si revocas el consentimiento para datos de salud, no podrás solicitar servicios de enfermería. ¿Estás seguro?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => {
              this.healthDataConsent = true; // Revertir
            }
          },
          {
            text: 'Revocar',
            role: 'destructive',
            handler: async () => {
              await this.revokeHealthConsent();
            }
          }
        ]
      });

      await alert.present();
    }
  }

  async revokeHealthConsent() {
    const loading = await this.loadingCtrl.create({
      message: 'Revocando consentimiento...'
    });
    await loading.present();

    try {
      await this.legalService.revokeHealthDataConsent();

      const toast = await this.toastCtrl.create({
        message: 'Consentimiento revocado exitosamente',
        duration: 3000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error revoking consent:', error);
      this.healthDataConsent = true; // Revertir

      const toast = await this.toastCtrl.create({
        message: 'Error al revocar consentimiento',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  async exportData() {
    const loading = await this.loadingCtrl.create({
      message: 'Preparando tu exportación...'
    });
    await loading.present();

    try {
      const result = await this.legalService.requestDataExport();

      await loading.dismiss();

      const alert = await this.alertCtrl.create({
        header: 'Exportación Iniciada',
        message: 'Estamos preparando tu exportación. Recibirás un correo cuando esté lista (usualmente toma 5-10 minutos).',
        buttons: ['Entendido']
      });
      await alert.present();
    } catch (error) {
      await loading.dismiss();
      console.error('Error exporting data:', error);

      const toast = await this.toastCtrl.create({
        message: 'Error al exportar datos',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async deleteAccount() {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Cuenta',
      message: 'Esta acción eliminará permanentemente tu cuenta y todos tus datos. Esta acción NO se puede deshacer.',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Cuéntanos por qué te vas (opcional)'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async (data) => {
            await this.confirmAccountDeletion(data.reason);
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmAccountDeletion(reason?: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Eliminando cuenta...'
    });
    await loading.present();

    try {
      await this.legalService.requestAccountDeletion(reason);
      await loading.dismiss();

      // Logout y redirigir
      this.router.navigate(['/login']);

      const toast = await this.toastCtrl.create({
        message: 'Tu cuenta será eliminada en 30 días. Puedes cancelar la eliminación antes de ese plazo.',
        duration: 5000,
        color: 'warning'
      });
      await toast.present();
    } catch (error) {
      await loading.dismiss();
      console.error('Error deleting account:', error);

      const toast = await this.toastCtrl.create({
        message: 'Error al eliminar cuenta',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  openDocument(type: 'terms' | 'privacy') {
    // Abrir modal con el documento
  }

  viewConsentHistory() {
    this.router.navigate(['/consent-history']);
  }

  manageNotifications() {
    this.router.navigate(['/notification-settings']);
  }

  manageCookies() {
    this.router.navigate(['/cookie-settings']);
  }
}
```

---

## 6. BACKEND - ENDPOINTS DE API

### Controller (NestJS)

```typescript
// legal.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LegalService } from './legal.service';

@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  /**
   * GET /legal/documents/:type
   * Obtiene el contenido de un documento legal
   */
  @Get('documents/:type')
  async getDocument(@Param('type') type: string) {
    return this.legalService.getDocument(type);
  }

  /**
   * GET /legal/versions
   * Obtiene las versiones actuales de los documentos
   */
  @Get('versions')
  async getVersions() {
    return {
      terms: '1.0',
      privacy: '1.0',
      lastUpdated: '2026-01-19'
    };
  }

  /**
   * POST /legal/consent
   * Guarda el consentimiento del usuario
   */
  @Post('consent')
  @UseGuards(AuthGuard('jwt'))
  async saveConsent(@Req() req, @Body() consentData: any) {
    const userId = req.user.id;
    return this.legalService.saveConsent(userId, consentData);
  }

  /**
   * GET /legal/consent/history
   * Obtiene el historial de consentimientos
   */
  @Get('consent/history')
  @UseGuards(AuthGuard('jwt'))
  async getConsentHistory(@Req() req) {
    const userId = req.user.id;
    return this.legalService.getConsentHistory(userId);
  }

  /**
   * POST /legal/consent/health-data/revoke
   * Revoca el consentimiento para datos de salud
   */
  @Post('consent/health-data/revoke')
  @UseGuards(AuthGuard('jwt'))
  async revokeHealthDataConsent(@Req() req) {
    const userId = req.user.id;
    return this.legalService.revokeHealthDataConsent(userId);
  }

  /**
   * POST /legal/data-export
   * Solicita exportación de datos (derecho ARCO)
   */
  @Post('data-export')
  @UseGuards(AuthGuard('jwt'))
  async requestDataExport(@Req() req) {
    const userId = req.user.id;
    return this.legalService.requestDataExport(userId);
  }

  /**
   * GET /legal/data-export/:exportId
   * Obtiene el estado de una exportación
   */
  @Get('data-export/:exportId')
  @UseGuards(AuthGuard('jwt'))
  async getExportStatus(@Req() req, @Param('exportId') exportId: string) {
    const userId = req.user.id;
    return this.legalService.getExportStatus(userId, exportId);
  }

  /**
   * POST /legal/account-deletion
   * Solicita eliminación de cuenta
   */
  @Post('account-deletion')
  @UseGuards(AuthGuard('jwt'))
  async requestAccountDeletion(@Req() req, @Body() data: any) {
    const userId = req.user.id;
    return this.legalService.requestAccountDeletion(userId, data.reason);
  }
}
```

### Service (NestJS)

```typescript
// legal.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LegalService {
  constructor(
    @InjectModel('UserConsent') private consentModel: Model<any>,
    @InjectModel('DataExport') private exportModel: Model<any>,
  ) {}

  /**
   * Obtiene el contenido de un documento legal desde el sistema de archivos
   */
  async getDocument(type: string): Promise<string> {
    const filePath = path.join(__dirname, '..', '..', 'legal-docs', `${type}.html`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Document not found: ${type}`);
    }
  }

  /**
   * Guarda el consentimiento del usuario
   */
  async saveConsent(userId: string, consentData: any) {
    const consent = new this.consentModel({
      userId,
      ...consentData,
      timestamp: new Date(),
      ipAddress: consentData.ipAddress,
      userAgent: consentData.userAgent
    });

    await consent.save();

    // Actualizar el documento del usuario
    // await this.userModel.updateOne(
    //   { _id: userId },
    //   {
    //     $set: {
    //       'legal.lastConsentDate': new Date(),
    //       'legal.termsVersion': consentData.termsVersion,
    //       'legal.privacyVersion': consentData.privacyVersion,
    //       'legal.healthDataConsent': consentData.healthDataConsent
    //     }
    //   }
    // );

    return { success: true };
  }

  /**
   * Obtiene el historial de consentimientos del usuario
   */
  async getConsentHistory(userId: string) {
    return this.consentModel
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .exec();
  }

  /**
   * Revoca el consentimiento para datos de salud
   */
  async revokeHealthDataConsent(userId: string) {
    const revocation = new this.consentModel({
      userId,
      action: 'revoke',
      type: 'healthData',
      timestamp: new Date()
    });

    await revocation.save();

    // Actualizar el usuario
    // await this.userModel.updateOne(
    //   { _id: userId },
    //   { $set: { 'legal.healthDataConsent': false } }
    // );

    return { success: true };
  }

  /**
   * Solicita exportación de datos del usuario
   */
  async requestDataExport(userId: string) {
    const exportRequest = new this.exportModel({
      userId,
      status: 'pending',
      requestDate: new Date()
    });

    await exportRequest.save();

    // Encolar job para generar la exportación
    // await this.queueService.addJob('generate-export', {
    //   exportId: exportRequest._id,
    //   userId
    // });

    return {
      exportId: exportRequest._id,
      message: 'Export request received. You will receive an email when ready.'
    };
  }

  /**
   * Obtiene el estado de una exportación
   */
  async getExportStatus(userId: string, exportId: string) {
    const exportRequest = await this.exportModel
      .findOne({ _id: exportId, userId })
      .exec();

    if (!exportRequest) {
      throw new Error('Export not found');
    }

    return {
      status: exportRequest.status,
      requestDate: exportRequest.requestDate,
      completedDate: exportRequest.completedDate,
      downloadUrl: exportRequest.status === 'completed'
        ? `/legal/data-export/${exportId}/download`
        : null
    };
  }

  /**
   * Solicita eliminación de cuenta
   */
  async requestAccountDeletion(userId: string, reason?: string) {
    // Marcar usuario para eliminación (soft delete con 30 días de gracia)
    // await this.userModel.updateOne(
    //   { _id: userId },
    //   {
    //     $set: {
    //       'deletion.requested': true,
    //       'deletion.requestDate': new Date(),
    //       'deletion.scheduledDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    //       'deletion.reason': reason
    //     }
    //   }
    // );

    // Enviar email de confirmación
    // await this.emailService.sendAccountDeletionEmail(userId);

    return {
      success: true,
      message: 'Account deletion scheduled for 30 days from now'
    };
  }
}
```

---

## 7. MODELOS DE DATOS (MONGODB)

### Consent Schema

```typescript
// schemas/user-consent.schema.ts
import { Schema } from 'mongoose';

export const UserConsentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['accept', 'revoke', 'update'],
    default: 'accept'
  },
  type: {
    type: String,
    enum: ['terms', 'privacy', 'healthData', 'marketing'],
    required: true
  },
  version: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  ipAddress: String,
  userAgent: String,
  metadata: Schema.Types.Mixed
}, {
  timestamps: true
});

UserConsentSchema.index({ userId: 1, timestamp: -1 });
```

### Data Export Schema

```typescript
// schemas/data-export.schema.ts
import { Schema } from 'mongoose';

export const DataExportSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  completedDate: Date,
  expiryDate: Date,
  fileUrl: String,
  fileSize: Number,
  format: {
    type: String,
    enum: ['json', 'zip'],
    default: 'zip'
  },
  error: String
}, {
  timestamps: true
});

DataExportSchema.index({ userId: 1, requestDate: -1 });
DataExportSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });
```

---

## 8. NOTIFICACIÓN DE CAMBIOS EN TÉRMINOS

### Service

```typescript
// services/legal-update.service.ts
import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class LegalUpdateService {
  private readonly CURRENT_TERMS_VERSION = '1.0';
  private readonly CURRENT_PRIVACY_VERSION = '1.0';

  constructor(
    private storage: Storage,
    private alertCtrl: AlertController
  ) {}

  async checkForLegalUpdates() {
    const acceptedTermsVersion = await this.storage.get('acceptedTermsVersion');
    const acceptedPrivacyVersion = await this.storage.get('acceptedPrivacyVersion');

    const termsUpdated = acceptedTermsVersion !== this.CURRENT_TERMS_VERSION;
    const privacyUpdated = acceptedPrivacyVersion !== this.CURRENT_PRIVACY_VERSION;

    if (termsUpdated || privacyUpdated) {
      await this.showUpdateAlert(termsUpdated, privacyUpdated);
    }
  }

  private async showUpdateAlert(termsUpdated: boolean, privacyUpdated: boolean) {
    let message = 'Hemos actualizado nuestros ';

    if (termsUpdated && privacyUpdated) {
      message += 'Términos y Condiciones y Política de Privacidad';
    } else if (termsUpdated) {
      message += 'Términos y Condiciones';
    } else {
      message += 'Política de Privacidad';
    }

    message += '. Por favor, revísalos y acepta los cambios para continuar usando la app.';

    const alert = await this.alertCtrl.create({
      header: 'Actualización de Documentos Legales',
      message,
      backdropDismiss: false,
      buttons: [
        {
          text: 'Revisar',
          handler: () => {
            // Navegar a pantalla de re-aceptación
          }
        }
      ]
    });

    await alert.present();
  }

  async recordAcceptance() {
    await this.storage.set('acceptedTermsVersion', this.CURRENT_TERMS_VERSION);
    await this.storage.set('acceptedPrivacyVersion', this.CURRENT_PRIVACY_VERSION);
    await this.storage.set('acceptanceDate', new Date().toISOString());
  }
}
```

---

## RESUMEN DE IMPLEMENTACIÓN

### Checklist de Desarrollo

```
FRONTEND (IONIC/ANGULAR)
[ ] Crear componente de registro con checkboxes de T&C y PP
[ ] Crear modal de documentos legales
[ ] Crear página de consentimiento para datos de salud
[ ] Crear página de configuración de privacidad
[ ] Crear servicio de gestión legal (LegalService)
[ ] Implementar exportación de datos
[ ] Implementar eliminación de cuenta
[ ] Implementar detección de actualizaciones de T&C/PP

BACKEND (NESTJS)
[ ] Crear endpoints de API para documentos legales
[ ] Crear endpoints para gestión de consentimientos
[ ] Crear endpoints para derechos ARCO
[ ] Crear schemas de MongoDB (UserConsent, DataExport)
[ ] Implementar job para generar exportaciones de datos
[ ] Implementar soft delete con período de gracia (30 días)
[ ] Implementar logs de auditoría de consentimientos

DOCUMENTOS
[ ] Convertir .md a HTML para servir en la app
[ ] Hospedar en care.nurselite.pe/terminos, /privacidad, /ayuda
[ ] Asegurar accesibilidad sin autenticación

TESTING
[ ] Test de flujo completo de registro
[ ] Test de aceptación/revocación de consentimientos
[ ] Test de exportación de datos
[ ] Test de eliminación de cuenta
[ ] Test de actualización de T&C/PP
```

---

**Última actualización:** 19 de enero de 2026
