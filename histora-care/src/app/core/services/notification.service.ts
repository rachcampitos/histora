import { Injectable, inject, signal } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface NotificationPreferences {
  pushEnabled: boolean;
  serviceRequests: boolean;
  serviceUpdates: boolean;
  payments: boolean;
  promotions: boolean;
  reminders: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export type NotificationType =
  | 'service_request'
  | 'service_accepted'
  | 'service_rejected'
  | 'service_started'
  | 'service_completed'
  | 'service_cancelled'
  | 'payment_received'
  | 'payment_pending'
  | 'verification_approved'
  | 'verification_rejected'
  | 'promotion'
  | 'reminder'
  | 'system';

const STORAGE_KEYS = {
  PREFERENCES: 'notification_preferences',
  DEVICE_TOKEN: 'push_device_token',
  NOTIFICATIONS: 'app_notifications'
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  serviceRequests: true,
  serviceUpdates: true,
  payments: true,
  promotions: false,
  reminders: true
};

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private api = inject(ApiService);
  private storage = inject(StorageService);
  private platform = inject(Platform);
  private router = inject(Router);

  // State signals
  private _preferences = signal<NotificationPreferences>(DEFAULT_PREFERENCES);
  private _notifications = signal<AppNotification[]>([]);
  private _unreadCount = signal(0);
  private _deviceToken = signal<string | null>(null);
  private _permissionGranted = signal(false);

  // Public readonly signals
  preferences = this._preferences.asReadonly();
  notifications = this._notifications.asReadonly();
  unreadCount = this._unreadCount.asReadonly();
  deviceToken = this._deviceToken.asReadonly();
  permissionGranted = this._permissionGranted.asReadonly();

  // Observable for new notifications (for real-time updates)
  private newNotification$ = new BehaviorSubject<AppNotification | null>(null);

  constructor() {
    this.init();
  }

  private async init() {
    await this.loadPreferences();
    await this.loadNotifications();

    if (Capacitor.isNativePlatform()) {
      await this.setupPushNotifications();
    }
  }

  /**
   * Setup push notifications for native platforms
   */
  private async setupPushNotifications() {
    // Check and request permission
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive === 'granted') {
      this._permissionGranted.set(true);
      await PushNotifications.register();
    } else {
      this._permissionGranted.set(false);
      console.log('Push notifications permission denied');
      return;
    }

    // Listen for registration success
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      this._deviceToken.set(token.value);
      await this.storage.set(STORAGE_KEYS.DEVICE_TOKEN, token.value);
      await this.registerDeviceToken(token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Listen for incoming notifications when app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      this.handleIncomingNotification(notification);
    });

    // Listen for notification tap/action
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action:', action);
      this.handleNotificationAction(action.notification);
    });
  }

  /**
   * Request push notification permissions (call this after user onboarding)
   */
  async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      // For web, we could use Web Push API in the future
      console.log('Push notifications not available on web');
      return false;
    }

    const permStatus = await PushNotifications.requestPermissions();
    const granted = permStatus.receive === 'granted';
    this._permissionGranted.set(granted);

    if (granted) {
      await PushNotifications.register();
    }

    return granted;
  }

  /**
   * Register device token with backend
   */
  private async registerDeviceToken(token: string): Promise<void> {
    const platform = Capacitor.getPlatform();

    this.api.post('/notifications/register-device', {
      token,
      platform,
      deviceInfo: {
        model: this.platform.is('ios') ? 'iOS' : 'Android'
      }
    }).pipe(
      catchError(error => {
        console.error('Failed to register device token:', error);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Handle incoming push notification (foreground)
   */
  private handleIncomingNotification(notification: PushNotificationSchema) {
    const appNotification: AppNotification = {
      id: notification.id || Date.now().toString(),
      title: notification.title || '',
      body: notification.body || '',
      type: (notification.data?.type as NotificationType) || 'system',
      data: notification.data,
      read: false,
      createdAt: new Date()
    };

    // Add to local notifications list
    const current = this._notifications();
    this._notifications.set([appNotification, ...current]);
    this._unreadCount.update(count => count + 1);

    // Emit for subscribers
    this.newNotification$.next(appNotification);

    // Save to storage
    this.saveNotifications();

    // Show local notification if app is in foreground
    this.showLocalNotification(appNotification);
  }

  /**
   * Handle notification tap action
   */
  private handleNotificationAction(notification: PushNotificationSchema) {
    const data = notification.data;

    if (!data) return;

    // Navigate based on notification type
    switch (data.type) {
      case 'service_request':
        if (data.requestId) {
          this.router.navigate(['/nurse/requests', data.requestId]);
        }
        break;

      case 'service_accepted':
      case 'service_started':
      case 'service_completed':
        if (data.requestId) {
          this.router.navigate(['/patient/tracking', data.requestId]);
        }
        break;

      case 'payment_received':
      case 'payment_pending':
        this.router.navigate(['/nurse/earnings']);
        break;

      case 'verification_approved':
      case 'verification_rejected':
        this.router.navigate(['/nurse/verification']);
        break;

      default:
        // Navigate to notifications list
        this.router.navigate(['/notifications']);
    }
  }

  /**
   * Show a local notification (for foreground push or scheduled)
   */
  async showLocalNotification(notification: AppNotification): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const options: ScheduleOptions = {
      notifications: [{
        id: parseInt(notification.id) || Date.now(),
        title: notification.title,
        body: notification.body,
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#1e3a5f',
        sound: 'default',
        extra: notification.data
      }]
    };

    await LocalNotifications.schedule(options);
  }

  /**
   * Schedule a local notification
   */
  async scheduleNotification(
    title: string,
    body: string,
    triggerAt: Date,
    data?: Record<string, any>
  ): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    await LocalNotifications.schedule({
      notifications: [{
        id: Date.now(),
        title,
        body,
        schedule: { at: triggerAt },
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#1e3a5f',
        sound: 'default',
        extra: data
      }]
    });
  }

  /**
   * Get notification stream for real-time updates
   */
  onNewNotification(): Observable<AppNotification | null> {
    return this.newNotification$.asObservable();
  }

  /**
   * Load preferences from storage
   */
  private async loadPreferences() {
    const stored = await this.storage.get(STORAGE_KEYS.PREFERENCES);
    if (stored) {
      this._preferences.set({ ...DEFAULT_PREFERENCES, ...stored });
    }
  }

  /**
   * Save preferences to storage and backend
   */
  async savePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    const updated = { ...this._preferences(), ...preferences };
    this._preferences.set(updated);
    await this.storage.set(STORAGE_KEYS.PREFERENCES, updated);

    // Sync with backend
    this.api.put('/notifications/preferences', updated).pipe(
      catchError(error => {
        console.error('Failed to save preferences to server:', error);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Toggle a specific preference
   */
  async togglePreference(key: keyof NotificationPreferences): Promise<void> {
    const current = this._preferences();
    await this.savePreferences({ [key]: !current[key] });
  }

  /**
   * Load notifications from storage
   */
  private async loadNotifications() {
    const stored = await this.storage.get(STORAGE_KEYS.NOTIFICATIONS);
    if (stored && Array.isArray(stored)) {
      this._notifications.set(stored);
      this._unreadCount.set(stored.filter((n: AppNotification) => !n.read).length);
    }
  }

  /**
   * Save notifications to storage
   */
  private async saveNotifications() {
    // Keep only last 50 notifications
    const toSave = this._notifications().slice(0, 50);
    await this.storage.set(STORAGE_KEYS.NOTIFICATIONS, toSave);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const updated = this._notifications().map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this._notifications.set(updated);
    this._unreadCount.set(updated.filter(n => !n.read).length);
    await this.saveNotifications();
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    const updated = this._notifications().map(n => ({ ...n, read: true }));
    this._notifications.set(updated);
    this._unreadCount.set(0);
    await this.saveNotifications();
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const updated = this._notifications().filter(n => n.id !== notificationId);
    this._notifications.set(updated);
    this._unreadCount.set(updated.filter(n => !n.read).length);
    await this.saveNotifications();
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    this._notifications.set([]);
    this._unreadCount.set(0);
    await this.storage.remove(STORAGE_KEYS.NOTIFICATIONS);
  }

  /**
   * Fetch notifications from server
   */
  fetchFromServer(): Observable<AppNotification[]> {
    return this.api.get<AppNotification[]>('/notifications').pipe(
      tap(notifications => {
        if (notifications) {
          this._notifications.set(notifications);
          this._unreadCount.set(notifications.filter(n => !n.read).length);
          this.saveNotifications();
        }
      }),
      catchError(error => {
        console.error('Failed to fetch notifications:', error);
        return of([]);
      })
    );
  }

  /**
   * Unregister device (on logout)
   */
  async unregisterDevice(): Promise<void> {
    const token = this._deviceToken();
    if (token) {
      this.api.post('/notifications/unregister-device', { token }).pipe(
        catchError(error => {
          console.error('Failed to unregister device:', error);
          return of(null);
        })
      ).subscribe();
    }

    await this.storage.remove(STORAGE_KEYS.DEVICE_TOKEN);
    this._deviceToken.set(null);
  }
}
