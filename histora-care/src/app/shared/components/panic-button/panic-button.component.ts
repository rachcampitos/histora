import { Component, OnInit, OnDestroy, inject, signal, Input, DestroyRef, ChangeDetectionStrategy } from '@angular/core';

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
  imports: [IonicModule],
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
  tapCount = signal(0);
  isActive = signal(false);

  // Triple tap configuration
  private readonly TAP_WINDOW = 1500; // 1.5 seconds window for triple tap
  private readonly REQUIRED_TAPS = 3;
  private tapResetTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.checkActiveAlert();
  }

  ngOnDestroy() {
    this.clearTapTimer();
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

  // Handle tap for triple-tap detection
  async onTap() {
    if (this.activeAlert() || this.isLoading()) return;

    const currentTaps = this.tapCount() + 1;
    this.tapCount.set(currentTaps);
    this.isActive.set(true);

    // Progressive haptic feedback: light -> medium -> heavy
    const hapticStyle = this.getHapticStyleForTap(currentTaps);
    await Haptics.impact({ style: hapticStyle }).catch(() => {});

    // Reset the timer with each tap
    this.clearTapTimer();

    if (currentTaps >= this.REQUIRED_TAPS) {
      // Triple tap completed - show panic options
      this.clearTapTimer();
      this.showPanicOptions();
    } else {
      // Set timer to reset tap count after window expires
      this.tapResetTimer = setTimeout(() => {
        this.resetTapState();
      }, this.TAP_WINDOW);
    }
  }

  private getHapticStyleForTap(tapNumber: number): ImpactStyle {
    switch (tapNumber) {
      case 1:
        return ImpactStyle.Light;
      case 2:
        return ImpactStyle.Medium;
      case 3:
      default:
        return ImpactStyle.Heavy;
    }
  }

  private resetTapState() {
    this.tapCount.set(0);
    this.isActive.set(false);
  }

  private clearTapTimer() {
    if (this.tapResetTimer) {
      clearTimeout(this.tapResetTimer);
      this.tapResetTimer = null;
    }
  }

  async showPanicOptions() {
    // Reset tap state
    this.resetTapState();

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
