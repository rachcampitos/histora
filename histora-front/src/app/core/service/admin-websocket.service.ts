import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { LocalStorageService } from '../../shared/services/storage.service';

export interface AdminNotification {
  type: 'nurse_registered' | 'verification_pending' | 'panic_alert' | 'negative_review' | 'service_completed' | 'payment_received';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read?: boolean;
  id?: string;
}

interface ConnectionStatus {
  connected: boolean;
  lastConnected?: Date;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminWebSocketService implements OnDestroy {
  private storage = inject(LocalStorageService);
  private socket: Socket | null = null;

  // Signals for reactive state
  private _connectionStatus = signal<ConnectionStatus>({ connected: false });
  private _notifications = signal<AdminNotification[]>([]);
  private _unreadCount = signal<number>(0);

  // Public signals
  connectionStatus = this._connectionStatus.asReadonly();
  notifications = this._notifications.asReadonly();
  unreadCount = this._unreadCount.asReadonly();

  // Computed signals
  hasUnread = computed(() => this._unreadCount() > 0);
  criticalAlerts = computed(() =>
    this._notifications().filter(n => n.priority === 'critical' && !n.read)
  );

  // Event subjects
  onNotification = new Subject<AdminNotification>();
  onPanicAlert = new Subject<AdminNotification>();

  // Sound for notifications
  private notificationSound: HTMLAudioElement | null = null;
  private panicSound: HTMLAudioElement | null = null;

  constructor() {
    // Initialize sounds
    if (typeof window !== 'undefined') {
      this.notificationSound = new Audio('/assets/sounds/notification.mp3');
      this.panicSound = new Audio('/assets/sounds/panic-alert.mp3');
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  /**
   * Connect to admin WebSocket namespace
   */
  connect(): void {
    if (this.socket?.connected) return;

    const authData = this.storage.get('auth');
    const token = authData?.access_token;

    if (!token) {
      console.warn('AdminWebSocket: No auth token available');
      this._connectionStatus.set({ connected: false, error: 'No token' });
      return;
    }

    // Check if user is admin
    const userRole = authData?.user?.role;
    if (userRole !== 'platform_admin' && userRole !== 'platform_admin_ui') {
      console.warn('AdminWebSocket: User is not an admin');
      return;
    }

    const wsUrl = environment.apiUrl.replace('/api', '');

    this.socket = io(`${wsUrl}/admin`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._connectionStatus.set({ connected: false });
    }
  }

  /**
   * Reconnect to WebSocket
   */
  reconnect(): void {
    this.disconnect();
    setTimeout(() => this.connect(), 500);
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): void {
    const notifications = this._notifications().map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this._notifications.set(notifications);
    this.updateUnreadCount();
    this.saveToLocalStorage();
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    const notifications = this._notifications().map(n => ({ ...n, read: true }));
    this._notifications.set(notifications);
    this._unreadCount.set(0);
    this.saveToLocalStorage();
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this._notifications.set([]);
    this._unreadCount.set(0);
    this.saveToLocalStorage();
  }

  /**
   * Load notifications from local storage (for persistence)
   */
  loadFromLocalStorage(): void {
    const saved = localStorage.getItem('admin_notifications');
    if (saved) {
      try {
        const notifications = JSON.parse(saved) as AdminNotification[];
        // Only keep notifications from the last 24 hours
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const recentNotifications = notifications.filter(n =>
          new Date(n.timestamp).getTime() > oneDayAgo
        );
        this._notifications.set(recentNotifications);
        this.updateUnreadCount();
      } catch (e) {
        console.error('Error parsing saved notifications', e);
      }
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('AdminWebSocket: Connected');
      this._connectionStatus.set({ connected: true, lastConnected: new Date() });
      this.loadFromLocalStorage();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('AdminWebSocket: Disconnected', reason);
      this._connectionStatus.set({ connected: false, error: reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('AdminWebSocket: Connection error', error);
      this._connectionStatus.set({ connected: false, error: error.message });
    });

    this.socket.on('connected', (data: { userId: string; connectedAdmins: number }) => {
      console.log('AdminWebSocket: Confirmed connection', data);
    });

    // Main notification handler
    this.socket.on('notification', (notification: AdminNotification) => {
      this.handleNotification(notification);
    });
  }

  private handleNotification(notification: AdminNotification): void {
    // Add unique ID and mark as unread
    const enrichedNotification: AdminNotification = {
      ...notification,
      id: `${notification.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      timestamp: new Date(notification.timestamp),
    };

    // Add to beginning of array (newest first)
    const notifications = [enrichedNotification, ...this._notifications()];
    // Keep only last 100 notifications
    this._notifications.set(notifications.slice(0, 100));
    this.updateUnreadCount();
    this.saveToLocalStorage();

    // Emit to subscribers
    this.onNotification.next(enrichedNotification);

    // Handle critical alerts specially
    if (notification.priority === 'critical') {
      this.onPanicAlert.next(enrichedNotification);
      this.playPanicSound();
      this.showBrowserNotification(enrichedNotification);
    } else {
      this.playNotificationSound();
      if (notification.priority === 'high') {
        this.showBrowserNotification(enrichedNotification);
      }
    }
  }

  private updateUnreadCount(): void {
    const unread = this._notifications().filter(n => !n.read).length;
    this._unreadCount.set(unread);
  }

  private saveToLocalStorage(): void {
    try {
      const toSave = this._notifications().slice(0, 50); // Save only last 50
      localStorage.setItem('admin_notifications', JSON.stringify(toSave));
    } catch (e) {
      console.error('Error saving notifications', e);
    }
  }

  private playNotificationSound(): void {
    if (this.notificationSound) {
      this.notificationSound.volume = 0.3;
      this.notificationSound.play().catch(() => {
        // Ignore autoplay restrictions
      });
    }
  }

  private playPanicSound(): void {
    if (this.panicSound) {
      this.panicSound.volume = 0.7;
      this.panicSound.play().catch(() => {
        // Ignore autoplay restrictions
      });
    }
  }

  private showBrowserNotification(notification: AdminNotification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/images/logo/nurse-lite-icon.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical',
      });
    }
  }

  /**
   * Request browser notification permission
   */
  requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied' as NotificationPermission);
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: AdminNotification['type']): string {
    const icons: Record<AdminNotification['type'], string> = {
      nurse_registered: 'person_add',
      verification_pending: 'verified_user',
      panic_alert: 'warning',
      negative_review: 'star_half',
      service_completed: 'check_circle',
      payment_received: 'payments',
    };
    return icons[type] || 'notifications';
  }

  /**
   * Get notification color based on priority
   */
  getNotificationColor(priority: AdminNotification['priority']): string {
    const colors: Record<AdminNotification['priority'], string> = {
      low: '#10b981',      // green
      medium: '#3b82f6',   // blue
      high: '#f59e0b',     // amber
      critical: '#ef4444', // red
    };
    return colors[priority] || '#64748b';
  }
}
