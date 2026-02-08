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

import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { OnboardingService } from './onboarding.service';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { of, throwError } from 'rxjs';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let storageMock: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    keys: ReturnType<typeof vi.fn>;
  };
  let authMock: { user: ReturnType<typeof vi.fn> };
  let apiMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    storageMock = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      keys: vi.fn().mockResolvedValue([]),
    };

    authMock = {
      user: vi.fn().mockReturnValue({ id: 'user-1', role: 'patient' }),
    };

    apiMock = {
      get: vi.fn().mockReturnValue(of(null)),
      post: vi.fn().mockReturnValue(of({})),
      patch: vi.fn().mockReturnValue(of({})),
      put: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
    };

    TestBed.configureTestingModule({
      providers: [
        OnboardingService,
        { provide: StorageService, useValue: storageMock },
        { provide: AuthService, useValue: authMock },
        { provide: ApiService, useValue: apiMock },
      ],
    });

    service = TestBed.inject(OnboardingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= shouldShowLanding =============

  it('shouldShowLanding() should return true when landing not seen', async () => {
    storageMock.get.mockResolvedValue(null);
    const result = await service.shouldShowLanding();
    expect(result).toBe(true);
  });

  it('shouldShowLanding() should return false when landing was seen with current version', async () => {
    storageMock.get.mockImplementation((key: string) => {
      if (key === 'histora_care_landing_status') {
        return Promise.resolve({ seen: true, seenAt: '2026-01-01', version: '2.0' });
      }
      return Promise.resolve(null);
    });

    // Re-create service so init() picks up the mock
    service = TestBed.inject(OnboardingService);
    // Force re-init by calling ensureInitialized (since init already ran with null)
    (service as any).initialized = false;

    const result = await service.shouldShowLanding();
    expect(result).toBe(false);
  });

  it('shouldShowLanding() should return true when version changed', async () => {
    storageMock.get.mockImplementation((key: string) => {
      if (key === 'histora_care_landing_status') {
        return Promise.resolve({ seen: true, seenAt: '2026-01-01', version: '1.0' });
      }
      return Promise.resolve(null);
    });

    service = TestBed.inject(OnboardingService);
    (service as any).initialized = false;

    const result = await service.shouldShowLanding();
    expect(result).toBe(true);
  });

  // ============= shouldShowLandingSync =============

  it('shouldShowLandingSync() should return true when no cached landing status', () => {
    expect(service.shouldShowLandingSync()).toBe(true);
  });

  it('shouldShowLandingSync() should return false when cached as seen with current version', () => {
    (service as any).landingStatus = { seen: true, seenAt: '2026-01-01', version: '2.0' };
    expect(service.shouldShowLandingSync()).toBe(false);
  });

  // ============= markLandingSeen =============

  it('markLandingSeen() should save landing status to storage', async () => {
    await service.markLandingSeen();

    expect(storageMock.set).toHaveBeenCalledWith(
      'histora_care_landing_status',
      expect.objectContaining({
        seen: true,
        version: '2.0',
        seenAt: expect.any(String),
      })
    );
  });

  it('markLandingSeen() should update internal cache', async () => {
    await service.markLandingSeen();
    expect(service.shouldShowLandingSync()).toBe(false);
  });

  // ============= shouldShowOnboarding =============

  it('shouldShowOnboarding() should return true when onboarding not completed', async () => {
    const result = await service.shouldShowOnboarding();
    expect(result).toBe(true);
  });

  it('shouldShowOnboarding() should return false when onboarding completed with current version', async () => {
    storageMock.get.mockImplementation((key: string) => {
      if (key.startsWith('histora_care_onboarding_')) {
        return Promise.resolve({ completed: true, completedAt: '2026-01-01', version: '2.0', skipped: false });
      }
      return Promise.resolve(null);
    });

    (service as any).initialized = false;
    (service as any).onboardingStatusUserId = null;

    const result = await service.shouldShowOnboarding();
    expect(result).toBe(false);
  });

  // ============= shouldShowOnboardingSync =============

  it('shouldShowOnboardingSync() should return true when no cached onboarding status', () => {
    expect(service.shouldShowOnboardingSync()).toBe(true);
  });

  it('shouldShowOnboardingSync() should return false when cached as completed', () => {
    (service as any).onboardingStatus = { completed: true, completedAt: '2026-01-01', version: '2.0', skipped: false };
    expect(service.shouldShowOnboardingSync()).toBe(false);
  });

  // ============= completeOnboarding =============

  it('completeOnboarding() should save to storage and PATCH to API', async () => {
    await service.completeOnboarding();

    expect(storageMock.set).toHaveBeenCalledWith(
      expect.stringContaining('histora_care_onboarding_user-1'),
      expect.objectContaining({
        completed: true,
        version: '2.0',
        skipped: false,
      })
    );

    expect(apiMock.patch).toHaveBeenCalledWith(
      '/users/me/onboarding/complete',
      { version: '2.0' }
    );
  });

  it('completeOnboarding(true) should mark as skipped', async () => {
    await service.completeOnboarding(true);

    expect(storageMock.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ skipped: true })
    );
  });

  it('completeOnboarding() should not throw when API fails', async () => {
    apiMock.patch.mockReturnValue(throwError(() => new Error('Network error')));

    await expect(service.completeOnboarding()).resolves.not.toThrow();
    // Should still update local storage
    expect(storageMock.set).toHaveBeenCalled();
  });

  // ============= resetLanding =============

  it('resetLanding() should remove landing status from storage', async () => {
    await service.resetLanding();
    expect(storageMock.remove).toHaveBeenCalledWith('histora_care_landing_status');
  });

  // ============= resetOnboarding =============

  it('resetOnboarding() should remove onboarding status from storage', async () => {
    await service.resetOnboarding();
    expect(storageMock.remove).toHaveBeenCalledWith(expect.stringContaining('histora_care_onboarding_'));
  });

  // ============= resetAll =============

  it('resetAll() should reset both landing and onboarding', async () => {
    await service.resetAll();
    expect(storageMock.remove).toHaveBeenCalledTimes(2);
  });

  // ============= getFullStatus =============

  it('getFullStatus() should return both statuses', async () => {
    const result = await service.getFullStatus();

    expect(result).toHaveProperty('landing');
    expect(result).toHaveProperty('onboarding');
    expect(result.landing).toHaveProperty('seen');
    expect(result.onboarding).toHaveProperty('completed');
  });
});
