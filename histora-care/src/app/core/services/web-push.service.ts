import { Injectable, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

const STORAGE_KEYS = {
  WEB_PUSH_SUBSCRIPTION: 'web_push_subscription',
  WEB_PUSH_PERMISSION: 'web_push_permission',
};

export interface WebPushConfig {
  publicKey: string | null;
  enabled: boolean;
}

/**
 * Service for handling Web Push notifications in PWA
 * Works only on web platform (not native iOS/Android)
 */
@Injectable({
  providedIn: 'root'
})
export class WebPushService {
  private api = inject(ApiService);
  private storage = inject(StorageService);
  private router = inject(Router);

  // State signals
  private _isSupported = signal(false);
  private _isSubscribed = signal(false);
  private _permissionState = signal<NotificationPermission>('default');
  private _vapidPublicKey = signal<string | null>(null);

  // Public readonly signals
  isSupported = this._isSupported.asReadonly();
  isSubscribed = this._isSubscribed.asReadonly();
  permissionState = this._permissionState.asReadonly();

  constructor() {
    this.init();
  }

  private async init() {
    // Only run on web platform
    if (Capacitor.isNativePlatform()) {
      return;
    }

    // Check browser support
    if (!this.checkSupport()) {
      return;
    }

    this._isSupported.set(true);
    this._permissionState.set(Notification.permission);

    // Load VAPID key from backend
    await this.loadVapidKey();

    // Check existing subscription
    await this.checkExistingSubscription();
  }

  /**
   * Check if Web Push is supported
   */
  private checkSupport(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Load VAPID public key from backend
   */
  private async loadVapidKey(): Promise<void> {
    try {
      const config = await firstValueFrom(
        this.api.get<WebPushConfig>('/notifications/web-push/vapid-public-key')
      );

      if (config?.publicKey) {
        this._vapidPublicKey.set(config.publicKey);
      } else {
        console.warn('[WebPush] No VAPID key available from server');
      }
    } catch (error) {
      console.error('[WebPush] Failed to load VAPID key:', error);
    }
  }

  /**
   * Check if user already has an active subscription
   */
  private async checkExistingSubscription(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        this._isSubscribed.set(true);
      }
    } catch (error) {
      console.error('[WebPush] Error checking subscription:', error);
    }
  }

  /**
   * Request permission and subscribe to push notifications
   * Call this after user authentication
   */
  async subscribe(): Promise<boolean> {
    if (!this._isSupported()) {
      return false;
    }

    if (!this._vapidPublicKey()) {
      await this.loadVapidKey();
      if (!this._vapidPublicKey()) {
        return false;
      }
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      this._permissionState.set(permission);

      if (permission !== 'granted') {
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const applicationServerKey = this.urlBase64ToUint8Array(this._vapidPublicKey()!);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Send subscription to backend
      const success = await this.sendSubscriptionToServer(subscription);

      if (success) {
        this._isSubscribed.set(true);
        await this.storage.set(STORAGE_KEYS.WEB_PUSH_SUBSCRIPTION, {
          endpoint: subscription.endpoint,
          subscribedAt: new Date().toISOString(),
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('[WebPush] Subscription failed:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this._isSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Notify backend - use POST since DELETE with body is not standard
        await firstValueFrom(
          this.api.post('/notifications/web-push/unsubscribe', {
            endpoint: subscription.endpoint,
          })
        ).catch(() => { /* ignore backend errors */ });

        // Unsubscribe locally
        await subscription.unsubscribe();
        this._isSubscribed.set(false);
        await this.storage.remove(STORAGE_KEYS.WEB_PUSH_SUBSCRIPTION);

        return true;
      }

      return false;
    } catch (error) {
      console.error('[WebPush] Unsubscribe failed:', error);
      return false;
    }
  }

  /**
   * Send push subscription to backend
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
    try {
      const json = subscription.toJSON();
      const keys = json.keys as Record<string, string> | undefined;

      await firstValueFrom(
        this.api.post('/notifications/web-push/subscribe', {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: keys?.['p256dh'] || '',
            auth: keys?.['auth'] || '',
          },
          deviceInfo: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        })
      );

      return true;
    } catch (error) {
      console.error('[WebPush] Failed to send subscription to server:', error);
      return false;
    }
  }

  /**
   * Send a test notification (for debugging)
   */
  async sendTestNotification(): Promise<boolean> {
    if (!this._isSubscribed()) {
      return false;
    }

    try {
      const result = await firstValueFrom(
        this.api.post<{ success: boolean; sent: number }>('/notifications/web-push/test', {})
      );

      return result?.success ?? false;
    } catch (error) {
      console.error('[WebPush] Test notification failed:', error);
      return false;
    }
  }

  /**
   * Handle incoming push notification action (click)
   * This is called from the service worker
   */
  handleNotificationClick(data: Record<string, any>): void {
    const type = data?.['type'];
    const url = data?.['url'];
    const requestId = data?.['requestId'];

    if (url) {
      this.router.navigateByUrl(url);
      return;
    }

    // Navigate based on notification type
    switch (type) {
      case 'ACCOUNT_VERIFIED':
        this.router.navigate(['/nurse/dashboard']);
        break;

      case 'ACCOUNT_REJECTED':
        this.router.navigate(['/nurse/verification']);
        break;

      case 'NEW_SERVICE_REQUEST':
        if (requestId) {
          this.router.navigate(['/nurse/requests', requestId]);
        } else {
          this.router.navigate(['/nurse/requests']);
        }
        break;

      case 'SERVICE_ACCEPTED':
      case 'NURSE_ON_THE_WAY':
      case 'NURSE_ARRIVED':
        if (requestId) {
          this.router.navigate(['/patient/tracking', requestId]);
        }
        break;

      case 'SERVICE_COMPLETED':
        if (requestId) {
          this.router.navigate(['/patient/requests', requestId, 'review']);
        }
        break;

      case 'PAYMENT_RECEIVED':
        this.router.navigate(['/nurse/earnings']);
        break;

      case 'new_message':
      case 'chat_message':
      case 'NEW_MESSAGE':
        if (requestId) {
          this.router.navigate(['/nurse/active-service', requestId]);
        }
        break;

      case 'TEST':
        break;

      default:
        this.router.navigate(['/home']);
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}
