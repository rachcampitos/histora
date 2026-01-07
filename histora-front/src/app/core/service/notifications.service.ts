import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, switchMap, startWith, tap } from 'rxjs';
import { environment } from 'environments/environment';

export interface NotificationData {
  _id: string;
  userId: string;
  type: string;
  channel: string;
  status: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  readAt?: string;
  createdAt: string;
  appointmentId?: string;
}

export interface NotificationsResponse {
  data: NotificationData[];
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private unreadCount$ = new BehaviorSubject<number>(0);
  private notifications$ = new BehaviorSubject<NotificationData[]>([]);

  constructor(private http: HttpClient) {}

  // Get unread count observable for header badge
  get unreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  // Get notifications observable
  get notifications(): Observable<NotificationData[]> {
    return this.notifications$.asObservable();
  }

  // Fetch notifications from backend
  getNotifications(options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}): Observable<NotificationsResponse> {
    const { limit = 20, offset = 0, unreadOnly = false } = options;
    return this.http.get<NotificationsResponse>(
      `${this.apiUrl}?limit=${limit}&offset=${offset}&unreadOnly=${unreadOnly}`
    ).pipe(
      tap(response => {
        this.notifications$.next(response.data);
      })
    );
  }

  // Fetch unread count
  fetchUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`).pipe(
      tap(response => {
        this.unreadCount$.next(response.count);
      })
    );
  }

  // Mark notification as read
  markAsRead(notificationId: string): Observable<NotificationData> {
    return this.http.patch<NotificationData>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Decrease unread count
        const currentCount = this.unreadCount$.value;
        if (currentCount > 0) {
          this.unreadCount$.next(currentCount - 1);
        }
        // Update notifications list
        const notifications = this.notifications$.value.map(n =>
          n._id === notificationId ? { ...n, status: 'read', readAt: new Date().toISOString() } : n
        );
        this.notifications$.next(notifications);
      })
    );
  }

  // Mark all as read
  markAllAsRead(): Observable<{ modified: number }> {
    return this.http.patch<{ modified: number }>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.unreadCount$.next(0);
        // Update all notifications to read
        const notifications = this.notifications$.value.map(n => ({
          ...n,
          status: 'read',
          readAt: new Date().toISOString()
        }));
        this.notifications$.next(notifications);
      })
    );
  }

  // Start polling for notifications (every 30 seconds)
  startPolling(intervalMs: number = 30000): Observable<UnreadCountResponse> {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.fetchUnreadCount())
    );
  }

  // Convert backend notification to UI format
  toUiNotification(notification: NotificationData): {
    id: string;
    message: string;
    time: string;
    icon: string;
    color: string;
    status: string;
    actionLabel?: string;
    actionType?: string;
    data?: Record<string, any>;
  } {
    const iconMap: Record<string, string> = {
      new_appointment_booked: 'event_available',
      appointment_cancelled_by_patient: 'event_busy',
      new_patient_review: 'star',
      upcoming_appointment_reminder: 'schedule',
      appointment_reminder: 'alarm',
      appointment_confirmation: 'check_circle',
      appointment_cancelled: 'cancel',
      consultation_completed: 'assignment_turned_in',
      payment_received: 'payment',
      welcome: 'celebration',
      general: 'notifications',
    };

    const colorMap: Record<string, string> = {
      new_appointment_booked: 'notification-green',
      appointment_cancelled_by_patient: 'notification-red',
      new_patient_review: 'notification-orange',
      upcoming_appointment_reminder: 'notification-blue',
      appointment_reminder: 'notification-blue',
      appointment_confirmation: 'notification-green',
      appointment_cancelled: 'notification-red',
      consultation_completed: 'notification-purple',
      payment_received: 'notification-green',
      welcome: 'notification-purple',
      general: 'notification-blue',
    };

    const actionMap: Record<string, { label: string; type: string }> = {
      new_appointment_booked: { label: 'Ver Cita', type: 'view-appointment' },
      new_patient_review: { label: 'Ver Reseña', type: 'view-review' },
      upcoming_appointment_reminder: { label: 'Ver Cita', type: 'view-appointment' },
    };

    const timeAgo = this.getTimeAgo(new Date(notification.createdAt));
    const action = actionMap[notification.type];

    return {
      id: notification._id,
      message: notification.message,
      time: timeAgo,
      icon: iconMap[notification.type] || 'notifications',
      color: colorMap[notification.type] || 'notification-blue',
      status: notification.readAt ? 'msg-read' : 'msg-unread',
      actionLabel: action?.label,
      actionType: action?.type,
      data: notification.data,
    };
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-PE');
  }
}
