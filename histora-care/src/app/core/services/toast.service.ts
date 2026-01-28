import { Injectable, inject } from '@angular/core';
import { ToastController, ToastOptions } from '@ionic/angular';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: 'top' | 'middle' | 'bottom';
  showCloseButton?: boolean;
}

/**
 * Centralized toast notification service
 * Provides consistent toast styling and behavior across the app
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastCtrl = inject(ToastController);

  private readonly typeConfig: Record<ToastType, { color: string; icon: string }> = {
    success: { color: 'success', icon: 'checkmark-circle-outline' },
    error: { color: 'danger', icon: 'alert-circle-outline' },
    warning: { color: 'warning', icon: 'warning-outline' },
    info: { color: 'primary', icon: 'information-circle-outline' }
  };

  /**
   * Show a toast with custom configuration
   */
  async show(config: ToastConfig): Promise<void> {
    const type = config.type || 'info';
    const typeStyle = this.typeConfig[type];

    const options: ToastOptions = {
      message: config.message,
      duration: config.duration ?? 3000,
      position: config.position ?? 'bottom',
      color: typeStyle.color,
      icon: typeStyle.icon,
      cssClass: `toast-${type}`,
      buttons: config.showCloseButton ? [
        {
          icon: 'close-outline',
          role: 'cancel'
        }
      ] : undefined
    };

    const toast = await this.toastCtrl.create(options);
    await toast.present();
  }

  /**
   * Show success toast
   */
  async success(message: string, duration?: number): Promise<void> {
    await this.show({ message, type: 'success', duration });
  }

  /**
   * Show error toast
   */
  async error(message: string, duration?: number): Promise<void> {
    await this.show({ message, type: 'error', duration: duration ?? 4000 });
  }

  /**
   * Show warning toast
   */
  async warning(message: string, duration?: number): Promise<void> {
    await this.show({ message, type: 'warning', duration });
  }

  /**
   * Show info toast
   */
  async info(message: string, duration?: number): Promise<void> {
    await this.show({ message, type: 'info', duration });
  }

  /**
   * Show network error toast
   */
  async networkError(): Promise<void> {
    await this.error('Error de conexion. Verifica tu internet.');
  }

  /**
   * Show generic error toast
   */
  async genericError(): Promise<void> {
    await this.error('Ocurrio un error. Intenta de nuevo.');
  }

  /**
   * Show a "coming soon" toast
   */
  async comingSoon(feature?: string): Promise<void> {
    const message = feature
      ? `${feature} estara disponible proximamente`
      : 'Esta funcion estara disponible proximamente';
    await this.info(message);
  }

  /**
   * Dismiss all active toasts
   */
  async dismissAll(): Promise<void> {
    try {
      const toast = await this.toastCtrl.getTop();
      if (toast) {
        await toast.dismiss();
      }
    } catch {
      // Ignore if no toast is present
    }
  }
}
