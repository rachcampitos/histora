import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface CheckInStatus {
  isActive: boolean;
  serviceRequestId: string | null;
  nextCheckInDue: Date | null;
  missedCheckIns: number;
  intervalMinutes: number;
}

export interface CheckInResponse {
  success: boolean;
  nextCheckInDue: Date;
  missedCheckIns: number;
}

@Injectable({
  providedIn: 'root'
})
export class CheckInService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Configuration
  private readonly MIN_SERVICE_DURATION_MINUTES = 60; // Only activate for services > 1 hour
  private readonly DEFAULT_INTERVAL_MINUTES = 30;
  private readonly REMINDER_TIMEOUT_MINUTES = 5;
  private readonly MAX_MISSED_BEFORE_ALERT = 3;

  // State
  private _checkInStatus = new BehaviorSubject<CheckInStatus>({
    isActive: false,
    serviceRequestId: null,
    nextCheckInDue: null,
    missedCheckIns: 0,
    intervalMinutes: this.DEFAULT_INTERVAL_MINUTES,
  });

  private _showReminder = new BehaviorSubject<boolean>(false);
  private _reminderDismissed = new BehaviorSubject<boolean>(false);

  checkInStatus$ = this._checkInStatus.asObservable();
  showReminder$ = this._showReminder.asObservable();

  private timerSubscription: Subscription | null = null;
  private reminderTimeoutSubscription: Subscription | null = null;

  /**
   * Start check-in monitoring for a service
   * Only activates if service duration is > 60 minutes
   */
  startMonitoring(
    serviceRequestId: string,
    estimatedDurationMinutes: number,
    intervalMinutes: number = this.DEFAULT_INTERVAL_MINUTES
  ): void {
    // Only activate for longer services
    if (estimatedDurationMinutes < this.MIN_SERVICE_DURATION_MINUTES) {
      // Service too short, skip check-in monitoring
      return;
    }

    const nextCheckInDue = new Date(Date.now() + intervalMinutes * 60 * 1000);

    this._checkInStatus.next({
      isActive: true,
      serviceRequestId,
      nextCheckInDue,
      missedCheckIns: 0,
      intervalMinutes,
    });

    this.scheduleNextReminder(nextCheckInDue);
    this.requestNotificationPermission();
  }

  /**
   * Stop check-in monitoring
   */
  stopMonitoring(): void {
    this.clearTimers();

    this._checkInStatus.next({
      isActive: false,
      serviceRequestId: null,
      nextCheckInDue: null,
      missedCheckIns: 0,
      intervalMinutes: this.DEFAULT_INTERVAL_MINUTES,
    });

    this._showReminder.next(false);
    this._reminderDismissed.next(false);
  }

  /**
   * Perform check-in
   */
  checkIn(message?: string): Observable<CheckInResponse> {
    const status = this._checkInStatus.value;
    if (!status.serviceRequestId) {
      throw new Error('No active service for check-in');
    }

    return this.http.post<CheckInResponse>(
      `${this.apiUrl}/tracking/${status.serviceRequestId}/check-in`,
      { message: message || 'Check-in manual' }
    ).pipe(
      tap(response => {
        // Reset state
        const newNextDue = new Date(response.nextCheckInDue);

        this._checkInStatus.next({
          ...status,
          nextCheckInDue: newNextDue,
          missedCheckIns: 0,
        });

        this._showReminder.next(false);
        this._reminderDismissed.next(false);

        // Schedule next reminder
        this.scheduleNextReminder(newNextDue);

        // Haptic feedback
        Haptics.notification({ type: NotificationType.Success }).catch(() => {});
      })
    );
  }

  /**
   * Dismiss reminder without checking in
   * Will be marked as missed after timeout
   */
  dismissReminder(): void {
    this._showReminder.next(false);
    this._reminderDismissed.next(true);

    // Start timeout for missed check-in
    this.reminderTimeoutSubscription?.unsubscribe();
    this.reminderTimeoutSubscription = timer(this.REMINDER_TIMEOUT_MINUTES * 60 * 1000)
      .subscribe(() => {
        this.handleMissedCheckIn();
      });
  }

  /**
   * Handle missed check-in
   */
  private handleMissedCheckIn(): void {
    const status = this._checkInStatus.value;
    if (!status.isActive || !status.serviceRequestId) return;

    const newMissedCount = status.missedCheckIns + 1;

    this._checkInStatus.next({
      ...status,
      missedCheckIns: newMissedCount,
    });

    // Notify backend about missed check-in
    this.notifyMissedCheckIn(status.serviceRequestId);

    // If too many missed, trigger automatic alert
    if (newMissedCount >= this.MAX_MISSED_BEFORE_ALERT) {
      this.triggerAutomaticAlert(status.serviceRequestId);
    } else {
      // Schedule next reminder
      const nextDue = new Date(Date.now() + status.intervalMinutes * 60 * 1000);
      this._checkInStatus.next({
        ...this._checkInStatus.value,
        nextCheckInDue: nextDue,
      });
      this.scheduleNextReminder(nextDue);
    }
  }

  /**
   * Schedule reminder for next check-in
   */
  private scheduleNextReminder(nextDue: Date): void {
    this.clearTimers();

    const msUntilDue = nextDue.getTime() - Date.now();
    if (msUntilDue <= 0) return;

    this.timerSubscription = timer(msUntilDue).subscribe(() => {
      this.showCheckInReminder();
    });
  }

  /**
   * Show check-in reminder
   */
  private showCheckInReminder(): void {
    const status = this._checkInStatus.value;
    if (!status.isActive) return;

    this._showReminder.next(true);

    // Haptic feedback
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});

    // Local notification
    this.sendLocalNotification();

    // Start timeout for missed check-in
    this.reminderTimeoutSubscription?.unsubscribe();
    this.reminderTimeoutSubscription = timer(this.REMINDER_TIMEOUT_MINUTES * 60 * 1000)
      .subscribe(() => {
        if (!this._reminderDismissed.value) {
          this.handleMissedCheckIn();
        }
      });
  }

  /**
   * Send local notification
   */
  private async sendLocalNotification(): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1001,
            title: 'NurseLite - Check-in',
            body: 'Todo bien? Toca para confirmar que estas bien.',
            sound: 'default',
            smallIcon: 'ic_stat_icon',
            largeIcon: 'ic_launcher',
          }
        ]
      });
    } catch (error) {
      console.error('[CheckIn] Error sending notification:', error);
    }
  }

  /**
   * Request notification permission
   */
  private async requestNotificationPermission(): Promise<void> {
    try {
      const permission = await LocalNotifications.requestPermissions();
      // Permission obtained
    } catch (error) {
      console.error('[CheckIn] Error requesting notification permission:', error);
    }
  }

  /**
   * Notify backend about missed check-in
   */
  private notifyMissedCheckIn(serviceRequestId: string): void {
    // This is handled by the backend's cron job, but we can increment locally
    // Missed check-in tracked locally
  }

  /**
   * Trigger automatic alert after too many missed check-ins
   */
  private triggerAutomaticAlert(serviceRequestId: string): void {
    // Triggering automatic alert

    // This would typically trigger a panic alert or notify emergency contacts
    // For now, we'll just log it - the actual implementation depends on the safety module
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = null;

    this.reminderTimeoutSubscription?.unsubscribe();
    this.reminderTimeoutSubscription = null;
  }

  /**
   * Get remaining time until next check-in
   */
  getRemainingTime(): number {
    const status = this._checkInStatus.value;
    if (!status.nextCheckInDue) return 0;

    const remaining = status.nextCheckInDue.getTime() - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Format remaining time as string
   */
  formatRemainingTime(): string {
    const remaining = this.getRemainingTime();
    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
