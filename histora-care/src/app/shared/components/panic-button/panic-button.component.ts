import { Component, OnInit, OnDestroy, inject, signal, Input, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController, ModalController } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SafetyService, PanicAlertLevel, PanicAlert, TriggerPanicDto } from '../../../core/services/safety.service';
import { GeolocationService } from '../../../core/services/geolocation.service';

@Component({
  selector: 'app-panic-button',
  templateUrl: './panic-button.component.html',
  styleUrls: ['./panic-button.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanicButtonComponent implements OnInit, OnDestroy {
  private safetyService = inject(SafetyService);
  private geolocationService = inject(GeolocationService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);
  private destroyRef = inject(DestroyRef);

  @Input() serviceRequestId?: string;
  @Input() patientId?: string;
  @Input() compact = false;

  // State
  isLoading = signal(false);
  activeAlert = signal<PanicAlert | null>(null);
  holdProgress = signal(0);
  isHolding = signal(false);

  private holdTimer: ReturnType<typeof setInterval> | null = null;
  private readonly HOLD_DURATION = 3000; // 3 seconds to trigger

  ngOnInit() {
    this.checkActiveAlert();
  }

  ngOnDestroy() {
    this.clearHoldTimer();
  }

  async checkActiveAlert() {
    this.safetyService.getActivePanicAlert()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (alert) => {
          this.activeAlert.set(alert);
        },
        error: (err) => {
          console.error('Error checking active alert:', err);
        }
      });
  }

  // Handle press start
  onPressStart() {
    if (this.activeAlert()) return;

    this.isHolding.set(true);
    this.holdProgress.set(0);

    // Vibrate to indicate holding
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});

    const startTime = Date.now();
    const interval = 50;

    this.holdTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / this.HOLD_DURATION) * 100, 100);
      this.holdProgress.set(progress);

      if (progress >= 100) {
        this.clearHoldTimer();
        this.showPanicOptions();
      }
    }, interval);
  }

  // Handle press end
  onPressEnd() {
    if (!this.isHolding()) return;

    this.clearHoldTimer();
    this.isHolding.set(false);
    this.holdProgress.set(0);
  }

  private clearHoldTimer() {
    if (this.holdTimer) {
      clearInterval(this.holdTimer);
      this.holdTimer = null;
    }
  }

  async showPanicOptions() {
    // Strong haptic feedback
    await Haptics.impact({ style: ImpactStyle.Heavy });

    const alert = await this.alertCtrl.create({
      header: 'Alerta de Seguridad',
      message: 'Selecciona el tipo de alerta',
      cssClass: 'panic-alert',
      backdropDismiss: false,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'cancel-button',
        },
        {
          text: 'Necesito Ayuda',
          cssClass: 'help-button',
          handler: () => {
            this.triggerPanic(PanicAlertLevel.HELP_NEEDED);
          }
        },
        {
          text: 'EMERGENCIA',
          cssClass: 'emergency-button',
          handler: () => {
            this.confirmEmergency();
          }
        },
      ],
    });

    await alert.present();
  }

  async confirmEmergency() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar EMERGENCIA',
      message: 'Se contactará a tu contacto de emergencia y administradores. ¿Estás en peligro inmediato?',
      cssClass: 'emergency-confirm-alert',
      backdropDismiss: false,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'SÍ, EMERGENCIA',
          cssClass: 'emergency-button',
          handler: () => {
            this.triggerPanic(PanicAlertLevel.EMERGENCY);
          }
        },
      ],
    });

    await alert.present();
  }

  async triggerPanic(level: PanicAlertLevel) {
    this.isLoading.set(true);

    // Haptic feedback
    await Haptics.impact({ style: ImpactStyle.Heavy });

    try {
      // Get current location
      const position = await this.geolocationService.getCurrentPosition();

      const dto: TriggerPanicDto = {
        level,
        serviceRequestId: this.serviceRequestId,
        patientId: this.patientId,
        location: {
          latitude: position?.latitude || 0,
          longitude: position?.longitude || 0,
          accuracy: position?.accuracy,
        },
        deviceInfo: {
          platform: this.getPlatform(),
        }
      };

      this.safetyService.triggerPanic(dto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (alert) => {
            this.activeAlert.set(alert);
            this.showToast(
              level === PanicAlertLevel.EMERGENCY
                ? 'Alerta de EMERGENCIA enviada. Ayuda en camino.'
                : 'Alerta enviada. Un administrador te contactará pronto.',
              level === PanicAlertLevel.EMERGENCY ? 'danger' : 'warning'
            );
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error triggering panic:', err);
            this.showToast('Error al enviar la alerta. Intenta de nuevo.', 'danger');
            this.isLoading.set(false);
          }
        });
    } catch (error) {
      console.error('Error getting location:', error);
      this.showToast('Error al obtener ubicación', 'danger');
      this.isLoading.set(false);
    }
  }

  async cancelAlert() {
    const currentAlert = this.activeAlert();
    if (!currentAlert) return;

    const alert = await this.alertCtrl.create({
      header: 'Cancelar Alerta',
      message: '¿Estás segura de que quieres cancelar la alerta? Solo cancela si fue una falsa alarma.',
      buttons: [
        {
          text: 'No, mantener alerta',
          role: 'cancel',
        },
        {
          text: 'Sí, cancelar',
          cssClass: 'cancel-alert-button',
          handler: () => {
            this.safetyService.cancelPanicAlert(currentAlert._id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => {
                  this.activeAlert.set(null);
                  this.showToast('Alerta cancelada', 'success');
                },
                error: (err) => {
                  console.error('Error cancelling alert:', err);
                  this.showToast('Error al cancelar la alerta', 'danger');
                }
              });
          }
        },
      ],
    });

    await alert.present();
  }

  private getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    return 'web';
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 4000,
      position: 'top',
      color,
    });
    await toast.present();
  }

  getAlertStatusText(): string {
    const alert = this.activeAlert();
    if (!alert) return '';

    switch (alert.status) {
      case 'active':
        return 'Alerta enviada';
      case 'acknowledged':
        return 'Ayuda notificada';
      case 'responding':
        return 'Ayuda en camino';
      default:
        return 'Procesando...';
    }
  }
}
