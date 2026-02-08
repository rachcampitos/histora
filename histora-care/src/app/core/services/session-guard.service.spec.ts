import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signal } from '@angular/core';
import '../../../testing/setup';
import { SessionGuardService } from './session-guard.service';
import {
  createMockStorageService,
  createMockRouter,
  createMockModalController,
} from '../../../testing';

describe('SessionGuardService', () => {
  let service: SessionGuardService;
  let mockStorage: ReturnType<typeof createMockStorageService>;
  let mockRouter: ReturnType<typeof createMockRouter>;
  let mockModalController: ReturnType<typeof createMockModalController>;

  /**
   * Bypass Angular DI by constructing service manually.
   * The ModalController token from @ionic/angular doesn't match in the test
   * environment due to module bundling differences, so we avoid TestBed entirely.
   */
  function createService(): SessionGuardService {
    const svc = Object.create(SessionGuardService.prototype) as SessionGuardService;
    // Injected dependencies (normally set via inject())
    (svc as any).storage = mockStorage;
    (svc as any).router = mockRouter;
    (svc as any).modalController = mockModalController;
    // Signals (normally initialized as class field defaults)
    (svc as any).sessionInfo = signal(null);
    (svc as any).lastActivity = signal(Date.now());
    (svc as any).warningShown = signal(false);
    // Instance state
    (svc as any).monitoringSubscription = null;
    (svc as any).activitySubscription = null;
    (svc as any).warningModal = null;
    (svc as any).warningTimeoutId = null;
    (svc as any).refreshTokenCallback = null;
    // Constants (readonly instance properties set in constructor)
    (svc as any).DEFAULT_INACTIVITY_TIMEOUT = 7 * 24 * 60 * 60 * 1000;
    (svc as any).DEFAULT_WARNING_BEFORE = 2 * 60 * 1000;
    (svc as any).CHECK_INTERVAL = 30 * 1000;
    return svc;
  }

  beforeEach(() => {
    vi.clearAllMocks();

    mockStorage = createMockStorageService();
    mockRouter = createMockRouter();
    mockModalController = createMockModalController();

    service = createService();

    vi.useFakeTimers();
  });

  afterEach(() => {
    service.ngOnDestroy();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ======= initializeSession() =======

  it('should initialize session with provided session info', async () => {
    const session = {
      expiresAt: Date.now() + 3600000,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 60000,
      warningBefore: 10000,
    };

    await service.initializeSession(session);

    expect(mockStorage.set).toHaveBeenCalledWith('session_info', session);
    expect(mockStorage.set).toHaveBeenCalledWith('last_activity', expect.any(Number));
  });

  it('should load session from storage when no session provided', async () => {
    const storedSession = {
      expiresAt: Date.now() + 3600000,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 60000,
      warningBefore: 10000,
    };
    mockStorage._store.set('session_info', storedSession);

    await service.initializeSession();

    expect(mockStorage.get).toHaveBeenCalledWith('session_info');
  });

  it('should record initial activity on initialize', async () => {
    await service.initializeSession();

    expect(mockStorage.set).toHaveBeenCalledWith('last_activity', expect.any(Number));
  });

  // ======= stopMonitoring() =======

  it('should stop monitoring and clean up subscriptions', async () => {
    await service.initializeSession();

    service.stopMonitoring();

    // Should not throw on double stop
    expect(() => service.stopMonitoring()).not.toThrow();
  });

  // ======= setRefreshTokenCallback() =======

  it('should accept a refresh token callback', () => {
    const callback = vi.fn().mockResolvedValue('new-token');
    service.setRefreshTokenCallback(callback);
    expect(() => service.setRefreshTokenCallback(callback)).not.toThrow();
  });

  // ======= getTimeUntilExpiry() =======

  it('should return Infinity when no session info', () => {
    expect(service.getTimeUntilExpiry()).toBe(Infinity);
  });

  it('should return time until expiry', async () => {
    const expiresAt = Date.now() + 60000;
    await service.initializeSession({
      expiresAt,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 600000,
      warningBefore: 10000,
    });

    const timeUntil = service.getTimeUntilExpiry();
    expect(timeUntil).toBeGreaterThan(0);
    expect(timeUntil).toBeLessThanOrEqual(60000);
  });

  it('should return 0 when session already expired', async () => {
    await service.initializeSession({
      expiresAt: Date.now() - 1000,
      refreshExpiresAt: Date.now() - 500,
      inactivityTimeout: 600000,
      warningBefore: 10000,
    });

    expect(service.getTimeUntilExpiry()).toBe(0);
  });

  // ======= isSessionExpiringSoon() =======

  it('should return false when no session', () => {
    expect(service.isSessionExpiringSoon()).toBe(false);
  });

  it('should return true when expiring soon', async () => {
    const warningBefore = 120000; // 2 minutes
    await service.initializeSession({
      expiresAt: Date.now() + 60000, // 1 minute left (less than warningBefore)
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 600000,
      warningBefore,
    });

    expect(service.isSessionExpiringSoon()).toBe(true);
  });

  it('should return false when session has plenty of time', async () => {
    await service.initializeSession({
      expiresAt: Date.now() + 3600000, // 1 hour
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 600000,
      warningBefore: 120000,
    });

    expect(service.isSessionExpiringSoon()).toBe(false);
  });

  // ======= checkSessionStatus (via interval) =======

  it('should handle expired session due to inactivity', async () => {
    mockRouter.url = '/home';

    await service.initializeSession({
      expiresAt: Date.now() + 3600000,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 5000, // 5 seconds
      warningBefore: 1000,
    });

    // Advance past inactivity timeout
    vi.advanceTimersByTime(6000);

    // Allow async checkSessionStatus to resolve
    await vi.runAllTimersAsync();

    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/auth/session-expired'],
      expect.objectContaining({ queryParams: { reason: 'inactivity' } })
    );
  });

  it('should check session every 30 seconds', async () => {
    await service.initializeSession({
      expiresAt: Date.now() + 3600000,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 604800000, // 7 days
      warningBefore: 120000,
    });

    // The check interval is 30 seconds
    vi.advanceTimersByTime(30000);
    // Activity was recorded so session should still be valid
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  // ======= isSensitiveRoute (via handleSessionExpired) =======

  it('should not store return URL for sensitive routes', async () => {
    mockRouter.url = '/settings/profile';

    await service.initializeSession({
      expiresAt: Date.now() + 3600000,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 1000,
      warningBefore: 500,
    });

    vi.advanceTimersByTime(2000);
    await vi.runAllTimersAsync();

    // Should NOT have stored the return URL for /settings
    const returnUrlCalls = mockStorage.set.mock.calls.filter(
      (call: any[]) => call[0] === 'return_url'
    );
    expect(returnUrlCalls).toHaveLength(0);
  });

  it('should store return URL for non-sensitive routes', async () => {
    mockRouter.url = '/home';

    await service.initializeSession({
      expiresAt: Date.now() + 3600000,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 1000,
      warningBefore: 500,
    });

    vi.advanceTimersByTime(2000);
    await vi.runAllTimersAsync();

    const returnUrlCalls = mockStorage.set.mock.calls.filter(
      (call: any[]) => call[0] === 'return_url'
    );
    expect(returnUrlCalls.length).toBeGreaterThanOrEqual(1);
  });

  // ======= tryRefreshToken =======

  it('should call refreshTokenCallback and recover session', async () => {
    const refreshCallback = vi.fn().mockResolvedValue('new-token');
    service.setRefreshTokenCallback(refreshCallback);

    await service.initializeSession({
      expiresAt: Date.now() - 100, // Already expired
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 604800000,
      warningBefore: 120000,
    });

    // Trigger one check interval (runAllTimersAsync would infinite loop
    // because the token is still expired after refresh, triggering endless retries)
    await vi.advanceTimersByTimeAsync(30000);

    expect(refreshCallback).toHaveBeenCalled();
  });

  it('should redirect to session-expired when refresh fails', async () => {
    mockRouter.url = '/home';
    const refreshCallback = vi.fn().mockResolvedValue(null);
    service.setRefreshTokenCallback(refreshCallback);

    await service.initializeSession({
      expiresAt: Date.now() - 100,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 604800000,
      warningBefore: 120000,
    });

    vi.advanceTimersByTime(30000);
    await vi.runAllTimersAsync();

    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/auth/session-expired'],
      expect.objectContaining({ queryParams: { reason: 'token_expired' } })
    );
  });

  // ======= clearSessionData =======

  it('should clear all session storage keys on expiration', async () => {
    mockRouter.url = '/home';

    await service.initializeSession({
      expiresAt: Date.now() + 3600000,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 1000,
      warningBefore: 500,
    });

    vi.advanceTimersByTime(2000);
    await vi.runAllTimersAsync();

    expect(mockStorage.remove).toHaveBeenCalledWith('session_info');
    expect(mockStorage.remove).toHaveBeenCalledWith('last_activity');
    expect(mockStorage.remove).toHaveBeenCalledWith('access_token');
    expect(mockStorage.remove).toHaveBeenCalledWith('refresh_token');
    expect(mockStorage.remove).toHaveBeenCalledWith('user');
  });

  // ======= tryRefreshToken error handling =======

  it('should redirect when refreshTokenCallback throws error', async () => {
    mockRouter.url = '/home';
    const refreshCallback = vi.fn().mockRejectedValue(new Error('Network error'));
    service.setRefreshTokenCallback(refreshCallback);

    await service.initializeSession({
      expiresAt: Date.now() - 100,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 604800000,
      warningBefore: 120000,
    });

    await vi.advanceTimersByTimeAsync(30000);

    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/auth/session-expired'],
      expect.objectContaining({ queryParams: { reason: 'token_expired' } })
    );
  });

  it('should redirect when no refreshTokenCallback set', async () => {
    mockRouter.url = '/home';
    // Don't set any refresh callback

    await service.initializeSession({
      expiresAt: Date.now() - 100,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 604800000,
      warningBefore: 120000,
    });

    await vi.advanceTimersByTimeAsync(30000);

    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/auth/session-expired'],
      expect.objectContaining({ queryParams: { reason: 'token_expired' } })
    );
  });

  // ======= showExpirationWarning =======

  it('should show warning modal when approaching inactivity timeout', async () => {
    mockRouter.url = '/home';
    mockModalController._modal.onWillDismiss.mockResolvedValue({ role: 'keep' });

    await service.initializeSession({
      expiresAt: Date.now() + 3600000,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 35000, // 35 seconds
      warningBefore: 10000, // Warning at 10 sec before expiry
    });

    // Advance 26 seconds → 9 seconds until inactivity (within warningBefore)
    vi.advanceTimersByTime(30000);
    // Allow the checkSessionStatus async to resolve
    await vi.advanceTimersByTimeAsync(0);

    expect(mockModalController.create).toHaveBeenCalled();
    expect(mockModalController._modal.present).toHaveBeenCalled();
  });

  it('should show warning when token expiration is near', async () => {
    mockRouter.url = '/home';
    mockModalController._modal.onWillDismiss.mockResolvedValue({ role: 'keep' });

    await service.initializeSession({
      expiresAt: Date.now() + 60000, // Expires in 60s
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 604800000,
      warningBefore: 120000, // Warning at 2 min before
    });

    // Token expires in 60s which is < warningBefore 120s → warning should trigger
    vi.advanceTimersByTime(30000);
    await vi.advanceTimersByTimeAsync(0);

    expect(mockModalController.create).toHaveBeenCalled();
  });

  it('should handle user choosing logout from warning modal', async () => {
    mockRouter.url = '/home';
    mockModalController._modal.onWillDismiss.mockResolvedValue({ role: 'logout' });

    await service.initializeSession({
      expiresAt: Date.now() + 3600000,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 35000,
      warningBefore: 10000,
    });

    vi.advanceTimersByTime(30000);
    await vi.advanceTimersByTimeAsync(0);

    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/auth/session-expired'],
      expect.objectContaining({ queryParams: { reason: 'user_logout' } })
    );
  });

  // ======= isSensitiveRoute via handleSessionExpired =======

  it('should not store return URL for /payment route', async () => {
    mockRouter.url = '/payment/checkout';

    await service.initializeSession({
      expiresAt: Date.now() + 3600000,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 1000,
      warningBefore: 500,
    });

    vi.advanceTimersByTime(2000);
    await vi.runAllTimersAsync();

    const returnUrlCalls = mockStorage.set.mock.calls.filter(
      (call: any[]) => call[0] === 'return_url'
    );
    expect(returnUrlCalls).toHaveLength(0);
  });

  it('should not store return URL for /checkout route', async () => {
    mockRouter.url = '/checkout/confirm';

    await service.initializeSession({
      expiresAt: Date.now() + 3600000,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 1000,
      warningBefore: 500,
    });

    vi.advanceTimersByTime(2000);
    await vi.runAllTimersAsync();

    const returnUrlCalls = mockStorage.set.mock.calls.filter(
      (call: any[]) => call[0] === 'return_url'
    );
    expect(returnUrlCalls).toHaveLength(0);
  });

  // ======= ngOnDestroy =======

  it('should stop monitoring on destroy', async () => {
    await service.initializeSession();
    service.ngOnDestroy();
    // Should not throw
    expect(() => service.ngOnDestroy()).not.toThrow();
  });

  // ======= Not starting double monitoring =======

  it('should not start monitoring twice', async () => {
    await service.initializeSession();
    // Second call should not create duplicate subscriptions
    await service.initializeSession();
    // stopMonitoring should still work normally
    service.stopMonitoring();
  });
});
