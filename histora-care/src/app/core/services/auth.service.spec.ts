import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@stencil/core/internal/client', () => ({
  registerInstance: vi.fn(),
  getElement: vi.fn(),
  Host: vi.fn(),
  h: vi.fn(),
  proxyCustomElement: vi.fn((Cstr: any) => Cstr),
  HTMLElement: typeof HTMLElement !== 'undefined' ? HTMLElement : class {},
  defineCustomElement: vi.fn(),
  attachShadow: vi.fn(),
  createEvent: vi.fn(),
  setPlatformHelpers: vi.fn(),
  Build: { isBrowser: true, isDev: true },
}));

vi.mock('@ionic/core/components', () => ({
  isPlatform: vi.fn().mockReturnValue(false),
  getPlatforms: vi.fn().mockReturnValue(['desktop']),
  LIFECYCLE_WILL_ENTER: 'ionViewWillEnter',
  LIFECYCLE_DID_ENTER: 'ionViewDidEnter',
  LIFECYCLE_WILL_LEAVE: 'ionViewWillLeave',
  LIFECYCLE_DID_LEAVE: 'ionViewDidLeave',
  LIFECYCLE_WILL_UNLOAD: 'ionViewWillUnload',
  componentOnReady: vi.fn().mockResolvedValue(undefined),
  initialize: vi.fn(),
}));

vi.mock('@ionic/core/loader', () => ({
  defineCustomElements: vi.fn().mockResolvedValue(undefined),
  setNonce: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn().mockReturnValue(false),
    getPlatform: vi.fn().mockReturnValue('web'),
    isPluginAvailable: vi.fn().mockReturnValue(false),
    convertFileSrc: vi.fn((src: string) => src),
  },
  registerPlugin: vi.fn(),
  WebPlugin: class WebPlugin {},
}));

vi.mock('@capacitor/browser', () => ({
  Browser: {
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    removeAllListeners: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    removeAllListeners: vi.fn().mockResolvedValue(undefined),
    getState: vi.fn().mockResolvedValue({ isActive: true }),
    getInfo: vi.fn().mockResolvedValue({ id: 'test', name: 'Test', version: '1.0.0', build: '1' }),
    exitApp: vi.fn(),
  },
}));

import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError, firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { SessionGuardService } from './session-guard.service';
import { WebPushService } from './web-push.service';
import { createMockApiService, createMockStorageService, createMockRouter } from '../../../testing';
import { AuthUser, AuthResponse } from '../models';

describe('AuthService', () => {
  let service: AuthService;
  let mockApi: ReturnType<typeof createMockApiService>;
  let mockStorage: ReturnType<typeof createMockStorageService>;
  let mockRouter: ReturnType<typeof createMockRouter>;
  let mockSessionGuard: {
    initializeSession: ReturnType<typeof vi.fn>;
    stopMonitoring: ReturnType<typeof vi.fn>;
    setRefreshTokenCallback: ReturnType<typeof vi.fn>;
  };
  let mockWebPush: {
    subscribe: ReturnType<typeof vi.fn>;
    unsubscribe: ReturnType<typeof vi.fn>;
  };
  let mockNgZone: { run: ReturnType<typeof vi.fn> };

  const mockUser: AuthUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Maria',
    lastName: 'Torres',
    role: 'patient',
  };

  const mockNurseUser: AuthUser = {
    id: 'nurse-1',
    email: 'nurse@example.com',
    firstName: 'Ana',
    lastName: 'Lopez',
    role: 'nurse',
  };

  const mockAuthResponse: AuthResponse = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    user: mockUser,
  };

  const mockAuthResponseWithSession: AuthResponse = {
    ...mockAuthResponse,
    session: {
      expiresAt: Date.now() + 3600000,
      refreshExpiresAt: Date.now() + 86400000,
      inactivityTimeout: 1800000,
      warningBefore: 300000,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockApi = createMockApiService();
    mockStorage = createMockStorageService();
    mockRouter = createMockRouter();
    mockSessionGuard = {
      initializeSession: vi.fn().mockResolvedValue(undefined),
      stopMonitoring: vi.fn(),
      setRefreshTokenCallback: vi.fn(),
    };
    mockWebPush = {
      subscribe: vi.fn().mockResolvedValue(true),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
    };
    mockNgZone = { run: vi.fn((fn: Function) => fn()) };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: mockApi },
        { provide: StorageService, useValue: mockStorage },
        { provide: Router, useValue: mockRouter },
        { provide: NgZone, useValue: mockNgZone },
        { provide: SessionGuardService, useValue: mockSessionGuard },
        { provide: WebPushService, useValue: mockWebPush },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= Signals (initial state) =============

  it('initial state: user is null, isAuthenticated is false, loading is true', () => {
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isNurse()).toBe(false);
    expect(service.isPatient()).toBe(false);
    expect(service.isAdmin()).toBe(false);
    expect(service.loading()).toBe(true);
    expect(service.googleAuthPending()).toBe(false);
  });

  // ============= initialize =============

  it('initialize() should set user from storage when token and user exist', async () => {
    mockStorage._store.set('access_token', 'stored-token');
    mockStorage._store.set('user', mockUser);

    await service.initialize();

    expect(service.user()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isPatient()).toBe(true);
    expect(service.loading()).toBe(false);
  });

  it('initialize() should set up session guard when token and user exist', async () => {
    mockStorage._store.set('access_token', 'stored-token');
    mockStorage._store.set('user', mockUser);

    await service.initialize();

    expect(mockSessionGuard.setRefreshTokenCallback).toHaveBeenCalled();
    expect(mockSessionGuard.initializeSession).toHaveBeenCalled();
  });

  it('initialize() should set loading=false when no token in storage', async () => {
    await service.initialize();

    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.loading()).toBe(false);
  });

  it('initialize() should set loading=false when no user in storage', async () => {
    mockStorage._store.set('access_token', 'stored-token');
    // No user stored

    await service.initialize();

    expect(service.user()).toBeNull();
    expect(service.loading()).toBe(false);
  });

  it('initialize() should set loading=false even if storage throws error', async () => {
    mockStorage.get.mockRejectedValue(new Error('Storage error'));

    await service.initialize();

    expect(service.loading()).toBe(false);
  });

  // ============= login =============

  it('login() should POST /auth/login with credentials', () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    mockApi.post.mockReturnValue(of(mockAuthResponse));

    service.login(credentials).subscribe();

    expect(mockApi.post).toHaveBeenCalledWith('/auth/login', credentials);
  });

  it('login() should store tokens, user data and set user signal on success', async () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    mockApi.post.mockReturnValue(of(mockAuthResponse));

    const response = await firstValueFrom(service.login(credentials));
    expect(response).toEqual(mockAuthResponse);
    expect(mockStorage.set).toHaveBeenCalledWith('access_token', 'test-access-token');
    expect(mockStorage.set).toHaveBeenCalledWith('refresh_token', 'test-refresh-token');
    expect(mockStorage.set).toHaveBeenCalledWith('user', mockUser);
    expect(service.user()).toEqual(mockUser);
  });

  it('login() should initialize session guard when session info is returned', async () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    mockApi.post.mockReturnValue(of(mockAuthResponseWithSession));

    await firstValueFrom(service.login(credentials));
    expect(mockSessionGuard.setRefreshTokenCallback).toHaveBeenCalled();
    expect(mockSessionGuard.initializeSession).toHaveBeenCalledWith(
      mockAuthResponseWithSession.session
    );
  });

  // ============= registerNurse =============

  it('registerNurse() should POST /auth/register/nurse with data', () => {
    const data = {
      email: 'nurse@example.com',
      password: 'password123',
      firstName: 'Ana',
      lastName: 'Lopez',
      phone: '987654321',
      cepNumber: '108887',
      termsAccepted: true,
      professionalDisclaimerAccepted: true,
    };
    const response: AuthResponse = { ...mockAuthResponse, user: mockNurseUser };
    mockApi.post.mockReturnValue(of(response));

    service.registerNurse(data).subscribe();

    expect(mockApi.post).toHaveBeenCalledWith('/auth/register/nurse', data);
  });

  // ============= registerPatient =============

  it('registerPatient() should POST /auth/register/patient with data', () => {
    const data = {
      email: 'patient@example.com',
      password: 'password123',
      firstName: 'Carlos',
      lastName: 'Perez',
      phone: '912345678',
      termsAccepted: true,
    };
    mockApi.post.mockReturnValue(of(mockAuthResponse));

    service.registerPatient(data).subscribe();

    expect(mockApi.post).toHaveBeenCalledWith('/auth/register/patient', data);
  });

  it('registerPatient() should store auth data on success', async () => {
    const data = {
      email: 'patient@example.com',
      password: 'password123',
      firstName: 'Carlos',
      lastName: 'Perez',
      phone: '912345678',
      termsAccepted: true,
    };
    mockApi.post.mockReturnValue(of(mockAuthResponse));

    await firstValueFrom(service.registerPatient(data));
    expect(mockStorage.set).toHaveBeenCalledWith('access_token', 'test-access-token');
    expect(mockStorage.set).toHaveBeenCalledWith('user', mockUser);
    expect(service.user()).toEqual(mockUser);
  });

  // ============= logout =============

  it('logout() should call web push unsubscribe, POST /auth/logout, clear session and navigate', async () => {
    mockApi.post.mockReturnValue(of({}));

    // Pre-populate storage so we can verify clearing
    mockStorage._store.set('access_token', 'token');
    mockStorage._store.set('refresh_token', 'refresh');
    mockStorage._store.set('user', mockUser);

    await service.logout();

    expect(mockWebPush.unsubscribe).toHaveBeenCalled();
    expect(mockApi.post).toHaveBeenCalledWith('/auth/logout', {});
    expect(mockSessionGuard.stopMonitoring).toHaveBeenCalled();
    expect(mockStorage.remove).toHaveBeenCalledWith('access_token');
    expect(mockStorage.remove).toHaveBeenCalledWith('refresh_token');
    expect(mockStorage.remove).toHaveBeenCalledWith('user');
    expect(service.user()).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('logout() should clear session and navigate even if backend call fails', async () => {
    mockApi.post.mockReturnValue(throwError(() => new Error('Network error')));

    await service.logout();

    expect(mockStorage.remove).toHaveBeenCalledWith('access_token');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  // ============= refreshToken =============

  it('refreshToken() should return null when no refresh token in storage', async () => {
    const result = await service.refreshToken();
    expect(result).toBeNull();
  });

  it('refreshToken() should POST /auth/refresh with stored refresh token', async () => {
    mockStorage._store.set('refresh_token', 'stored-refresh-token');
    const newResponse: AuthResponse = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      user: mockUser,
    };
    mockApi.post.mockReturnValue(of(newResponse));

    const result = await service.refreshToken();

    expect(mockApi.post).toHaveBeenCalledWith('/auth/refresh', {
      refresh_token: 'stored-refresh-token',
    });
    expect(result).toBe('new-access-token');
  });

  it('refreshToken() should update stored tokens on success', async () => {
    mockStorage._store.set('refresh_token', 'stored-refresh-token');
    const newResponse: AuthResponse = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      user: mockUser,
    };
    mockApi.post.mockReturnValue(of(newResponse));

    await service.refreshToken();

    expect(mockStorage.set).toHaveBeenCalledWith('access_token', 'new-access-token');
    expect(mockStorage.set).toHaveBeenCalledWith('refresh_token', 'new-refresh-token');
  });

  it('refreshToken() should clear session and return null on error', async () => {
    mockStorage._store.set('refresh_token', 'stored-refresh-token');
    mockApi.post.mockReturnValue(throwError(() => new Error('Token expired')));

    const result = await service.refreshToken();

    expect(result).toBeNull();
    expect(mockSessionGuard.stopMonitoring).toHaveBeenCalled();
    expect(mockStorage.remove).toHaveBeenCalledWith('access_token');
    expect(service.user()).toBeNull();
  });

  // ============= getToken =============

  it('getToken() should return token from storage', async () => {
    mockStorage._store.set('access_token', 'my-token');

    const token = await service.getToken();

    expect(token).toBe('my-token');
  });

  it('getToken() should return null when no token stored', async () => {
    const token = await service.getToken();
    expect(token).toBeNull();
  });

  // ============= forgotPassword =============

  it('forgotPassword() should POST /auth/forgot-password with email and platform', () => {
    mockApi.post.mockReturnValue(of({ message: 'Email sent' }));

    service.forgotPassword('test@example.com').subscribe();

    expect(mockApi.post).toHaveBeenCalledWith('/auth/forgot-password', {
      email: 'test@example.com',
      platform: 'histora-care',
    });
  });

  // ============= requestPasswordOtp =============

  it('requestPasswordOtp() should POST /auth/password-reset/request-otp with email', () => {
    mockApi.post.mockReturnValue(of({ message: 'OTP sent' }));

    service.requestPasswordOtp('test@example.com').subscribe();

    expect(mockApi.post).toHaveBeenCalledWith('/auth/password-reset/request-otp', {
      email: 'test@example.com',
      platform: 'histora-care',
    });
  });

  // ============= verifyPasswordOtp =============

  it('verifyPasswordOtp() should POST /auth/password-reset/verify-otp with email and otp', () => {
    mockApi.post.mockReturnValue(of({ valid: true, message: 'Valid' }));

    service.verifyPasswordOtp('test@example.com', '123456').subscribe();

    expect(mockApi.post).toHaveBeenCalledWith('/auth/password-reset/verify-otp', {
      email: 'test@example.com',
      otp: '123456',
    });
  });

  // ============= resetPasswordWithOtp =============

  it('resetPasswordWithOtp() should POST /auth/password-reset/reset-with-otp', () => {
    mockApi.post.mockReturnValue(of({ message: 'Password reset' }));

    service.resetPasswordWithOtp('test@example.com', '123456', 'newPass!123').subscribe();

    expect(mockApi.post).toHaveBeenCalledWith('/auth/password-reset/reset-with-otp', {
      email: 'test@example.com',
      otp: '123456',
      newPassword: 'newPass!123',
    });
  });

  // ============= updateUserAvatar =============

  it('updateUserAvatar() should update user signal and storage with new avatar', async () => {
    // First initialize with a user
    mockStorage._store.set('access_token', 'token');
    mockStorage._store.set('user', mockUser);
    await service.initialize();

    await service.updateUserAvatar('https://cdn.example.com/new-avatar.jpg');

    const updatedUser = service.user();
    expect(updatedUser?.avatar).toBe('https://cdn.example.com/new-avatar.jpg');
    expect(mockStorage.set).toHaveBeenCalledWith('user', expect.objectContaining({
      avatar: 'https://cdn.example.com/new-avatar.jpg',
    }));
  });

  it('updateUserAvatar() should do nothing if no user is set', async () => {
    await service.updateUserAvatar('https://cdn.example.com/avatar.jpg');

    expect(service.user()).toBeNull();
    // set should not have been called for 'user' key (only during initialize if applicable)
    expect(mockStorage.set).not.toHaveBeenCalledWith('user', expect.anything());
  });

  // ============= handleOAuthCallback =============

  it('handleOAuthCallback() should parse URL, store auth data and navigate for patient', async () => {
    const userJson = encodeURIComponent(JSON.stringify(mockUser));
    const url = `historacare://oauth/callback?access_token=oauth-token&refresh_token=oauth-refresh&user=${userJson}&is_new_user=false`;

    await service.handleOAuthCallback(url);

    expect(mockStorage.set).toHaveBeenCalledWith('access_token', 'oauth-token');
    expect(mockStorage.set).toHaveBeenCalledWith('refresh_token', 'oauth-refresh');
    expect(mockStorage.set).toHaveBeenCalledWith('user', mockUser);
    expect(service.user()).toEqual(mockUser);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/patient/tabs/home']);
  });

  it('handleOAuthCallback() should navigate to nurse dashboard for nurse role', async () => {
    const userJson = encodeURIComponent(JSON.stringify(mockNurseUser));
    const url = `historacare://oauth/callback?access_token=token&refresh_token=refresh&user=${userJson}&is_new_user=false`;

    await service.handleOAuthCallback(url);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/nurse/dashboard']);
  });

  it('handleOAuthCallback() should navigate to complete-registration for new users', async () => {
    const userJson = encodeURIComponent(JSON.stringify(mockUser));
    const url = `historacare://oauth/callback?access_token=token&refresh_token=refresh&user=${userJson}&is_new_user=true`;

    await service.handleOAuthCallback(url);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/complete-registration']);
  });

  it('handleOAuthCallback() should navigate to login with error on failure', async () => {
    const url = 'historacare://oauth/callback?error=access_denied';

    await service.handleOAuthCallback(url);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { error: 'google_auth_failed' },
    });
  });

  // ============= handleWebOAuthCallback =============

  it('handleWebOAuthCallback() should store auth data and navigate based on role', async () => {
    const params = {
      access_token: 'web-token',
      refresh_token: 'web-refresh',
      user: JSON.stringify(mockNurseUser),
      is_new_user: 'false',
    };

    await service.handleWebOAuthCallback(params);

    expect(mockStorage.set).toHaveBeenCalledWith('access_token', 'web-token');
    expect(mockStorage.set).toHaveBeenCalledWith('refresh_token', 'web-refresh');
    expect(service.user()).toEqual(mockNurseUser);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/nurse/dashboard']);
  });

  // ============= handleOAuthSuccess =============

  it('handleOAuthSuccess() should store tokens and user without navigation', async () => {
    await service.handleOAuthSuccess('oauth-tk', 'oauth-rt', mockUser, false);

    expect(mockStorage.set).toHaveBeenCalledWith('access_token', 'oauth-tk');
    expect(mockStorage.set).toHaveBeenCalledWith('refresh_token', 'oauth-rt');
    expect(mockStorage.set).toHaveBeenCalledWith('user', mockUser);
    expect(service.user()).toEqual(mockUser);
    expect(service.googleAuthPending()).toBe(false);
    // handleOAuthSuccess should NOT navigate
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  // ============= computed signals =============

  it('isNurse should return true when user role is nurse', async () => {
    mockStorage._store.set('access_token', 'token');
    mockStorage._store.set('user', mockNurseUser);

    await service.initialize();

    expect(service.isNurse()).toBe(true);
    expect(service.isPatient()).toBe(false);
  });

  it('isAdmin should return true when user role is platform_admin', async () => {
    const adminUser: AuthUser = { ...mockUser, role: 'platform_admin' };
    mockStorage._store.set('access_token', 'token');
    mockStorage._store.set('user', adminUser);

    await service.initialize();

    expect(service.isAdmin()).toBe(true);
    expect(service.isPatient()).toBe(false);
    expect(service.isNurse()).toBe(false);
  });
});
