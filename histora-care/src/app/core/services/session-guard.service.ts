import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { Subscription, interval, fromEvent, merge } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { SessionInfo } from '../models';
import { SessionWarningModalComponent } from '../../shared/components/session-warning-modal/session-warning-modal.component';

const SESSION_KEY = 'session_info';
const LAST_ACTIVITY_KEY = 'last_activity';

@Injectable({
  providedIn: 'root'
})
export class SessionGuardService implements OnDestroy {
  private storage = inject(StorageService);
  private router = inject(Router);
  private modalController = inject(ModalController);

  // Monitoring state
  private monitoringSubscription: Subscription | null = null;
  private activitySubscription: Subscription | null = null;
  private warningModal: HTMLIonModalElement | null = null;

  // Session state
  private sessionInfo = signal<SessionInfo | null>(null);
  private lastActivity = signal<number>(Date.now());
  private warningShown = signal<boolean>(false);

  // Default session config (fallback if not provided by backend)
  private readonly DEFAULT_INACTIVITY_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days for patients
  private readonly DEFAULT_WARNING_BEFORE = 2 * 60 * 1000; // 2 minutes
  private readonly CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

  /**
   * Initialize session monitoring with session info from auth response
   */
  async initializeSession(session?: SessionInfo): Promise<void> {
    if (session) {
      this.sessionInfo.set(session);
      await this.storage.set(SESSION_KEY, session);
    } else {
      // Try to load from storage
      const storedSession = await this.storage.get<SessionInfo>(SESSION_KEY);
      if (storedSession) {
        this.sessionInfo.set(storedSession);
      }
    }

    // Record initial activity
    await this.recordActivity();

    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start session monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringSubscription) {
      return; // Already monitoring
    }

    console.log('[SESSION] Starting session monitoring');

    // Monitor for expiration every 30 seconds
    this.monitoringSubscription = interval(this.CHECK_INTERVAL).subscribe(() => {
      this.checkSessionStatus();
    });

    // Track user activity (throttled to avoid too many storage writes)
    this.activitySubscription = merge(
      fromEvent(document, 'click'),
      fromEvent(document, 'keypress'),
      fromEvent(document, 'touchstart'),
      fromEvent(document, 'scroll')
    ).pipe(
      throttleTime(60000) // Record activity at most once per minute
    ).subscribe(() => {
      this.recordActivity();
    });
  }

  /**
   * Stop session monitoring
   */
  stopMonitoring(): void {
    console.log('[SESSION] Stopping session monitoring');

    if (this.monitoringSubscription) {
      this.monitoringSubscription.unsubscribe();
      this.monitoringSubscription = null;
    }

    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = null;
    }

    if (this.warningModal) {
      this.warningModal.dismiss();
      this.warningModal = null;
    }
  }

  /**
   * Record user activity
   */
  private async recordActivity(): Promise<void> {
    const now = Date.now();
    this.lastActivity.set(now);
    await this.storage.set(LAST_ACTIVITY_KEY, now);
  }

  /**
   * Check session status and show warning or logout if needed
   */
  private async checkSessionStatus(): Promise<void> {
    const session = this.sessionInfo();
    const now = Date.now();

    // Load last activity from storage (in case it was updated in another tab)
    const storedActivity = await this.storage.get<number>(LAST_ACTIVITY_KEY);
    if (storedActivity) {
      this.lastActivity.set(storedActivity);
    }

    const lastActivityTime = this.lastActivity();
    const inactivityTimeout = session?.inactivityTimeout || this.DEFAULT_INACTIVITY_TIMEOUT;
    const warningBefore = session?.warningBefore || this.DEFAULT_WARNING_BEFORE;

    // Check inactivity timeout
    const timeSinceActivity = now - lastActivityTime;
    if (timeSinceActivity >= inactivityTimeout) {
      console.log('[SESSION] Session expired due to inactivity');
      await this.handleSessionExpired('inactivity');
      return;
    }

    // Check if approaching inactivity timeout
    const timeUntilInactivityExpiry = inactivityTimeout - timeSinceActivity;
    if (timeUntilInactivityExpiry <= warningBefore && !this.warningShown()) {
      await this.showExpirationWarning(timeUntilInactivityExpiry);
      return;
    }

    // Check absolute token expiration (if session info available)
    if (session?.expiresAt) {
      const timeUntilExpiry = session.expiresAt - now;

      if (timeUntilExpiry <= 0) {
        console.log('[SESSION] Access token expired');
        // Try to refresh the token
        await this.tryRefreshToken();
        return;
      }

      // Show warning if close to expiration
      if (timeUntilExpiry <= warningBefore && !this.warningShown()) {
        await this.showExpirationWarning(timeUntilExpiry);
      }
    }
  }

  // Callback for token refresh (set by AuthService to avoid circular dependency)
  private refreshTokenCallback: (() => Promise<string | null>) | null = null;

  /**
   * Set the token refresh callback (called by AuthService)
   */
  setRefreshTokenCallback(callback: () => Promise<string | null>): void {
    this.refreshTokenCallback = callback;
  }

  /**
   * Try to refresh the token
   */
  private async tryRefreshToken(): Promise<void> {
    if (!this.refreshTokenCallback) {
      console.error('[SESSION] No refresh token callback set');
      await this.handleSessionExpired('token_expired');
      return;
    }

    try {
      const newToken = await this.refreshTokenCallback();
      if (newToken) {
        console.log('[SESSION] Token refreshed successfully');
        this.warningShown.set(false);
        // Session info will be updated by handleAuthResponse
      } else {
        console.log('[SESSION] Failed to refresh token');
        await this.handleSessionExpired('token_expired');
      }
    } catch (error) {
      console.error('[SESSION] Error refreshing token:', error);
      await this.handleSessionExpired('token_expired');
    }
  }

  /**
   * Show expiration warning modal
   */
  private async showExpirationWarning(timeRemaining: number): Promise<void> {
    if (this.warningShown() || this.warningModal) {
      return;
    }

    this.warningShown.set(true);
    const minutes = Math.max(1, Math.ceil(timeRemaining / (60 * 1000)));

    console.log(`[SESSION] Showing expiration warning - ${minutes} minutes remaining`);

    this.warningModal = await this.modalController.create({
      component: SessionWarningModalComponent,
      componentProps: {
        minutesRemaining: minutes
      },
      breakpoints: [0, 0.55],
      initialBreakpoint: 0.55,
      backdropDismiss: false,
      handle: true,
      cssClass: 'session-warning-modal'
    });

    await this.warningModal.present();

    const { role } = await this.warningModal.onWillDismiss();

    if (role === 'keep') {
      // Record activity to extend session
      await this.recordActivity();
      // Try to refresh token
      await this.tryRefreshToken();
      this.warningShown.set(false);
      this.warningModal = null;
    } else if (role === 'logout') {
      this.warningModal = null;
      await this.handleSessionExpired('user_logout');
    }

    // Auto-dismiss after time remaining and trigger expiration
    setTimeout(async () => {
      if (this.warningModal) {
        await this.warningModal.dismiss();
        this.warningModal = null;
        await this.handleSessionExpired('timeout');
      }
    }, timeRemaining);
  }

  /**
   * Handle session expiration
   */
  private async handleSessionExpired(reason: 'inactivity' | 'token_expired' | 'user_logout' | 'timeout'): Promise<void> {
    console.log(`[SESSION] Session expired - reason: ${reason}`);

    // Stop monitoring
    this.stopMonitoring();

    // Clear session data
    await this.clearSessionData();

    // Store the current URL to return to after login (if not sensitive)
    const currentUrl = this.router.url;
    if (!this.isSensitiveRoute(currentUrl)) {
      await this.storage.set('return_url', currentUrl);
    }

    // Navigate to session expired page with reason
    this.router.navigate(['/auth/session-expired'], {
      queryParams: { reason }
    });
  }

  /**
   * Clear session data from storage
   */
  private async clearSessionData(): Promise<void> {
    await this.storage.remove(SESSION_KEY);
    await this.storage.remove(LAST_ACTIVITY_KEY);
    await this.storage.remove('access_token');
    await this.storage.remove('refresh_token');
    await this.storage.remove('user');
    this.sessionInfo.set(null);
    this.warningShown.set(false);
  }

  /**
   * Check if route contains sensitive data
   */
  private isSensitiveRoute(url: string): boolean {
    const sensitivePatterns = [
      '/settings',
      '/profile/edit',
      '/payment',
      '/checkout'
    ];
    return sensitivePatterns.some(pattern => url.includes(pattern));
  }

  /**
   * Get time until session expires (for UI display)
   */
  getTimeUntilExpiry(): number {
    const session = this.sessionInfo();
    if (!session?.expiresAt) {
      return Infinity;
    }
    return Math.max(0, session.expiresAt - Date.now());
  }

  /**
   * Check if session is about to expire
   */
  isSessionExpiringSoon(): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiry();
    const warningBefore = this.sessionInfo()?.warningBefore || this.DEFAULT_WARNING_BEFORE;
    return timeUntilExpiry <= warningBefore;
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }
}
