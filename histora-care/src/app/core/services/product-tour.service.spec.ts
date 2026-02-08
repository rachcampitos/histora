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
import { Router } from '@angular/router';
import { ProductTourService, TourType } from './product-tour.service';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { of, throwError } from 'rxjs';

describe('ProductTourService', () => {
  let service: ProductTourService;
  let authMock: { user: ReturnType<typeof vi.fn> };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
    navigateByUrl: ReturnType<typeof vi.fn>;
    url: string;
  };
  let apiMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test to avoid carryover
    localStorage.clear();

    authMock = {
      user: vi.fn().mockReturnValue({ id: 'user-1', role: 'patient' }),
    };

    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
      navigateByUrl: vi.fn().mockResolvedValue(true),
      url: '/patient/home',
    };

    apiMock = {
      get: vi.fn().mockReturnValue(of({ completedTours: [] })),
      post: vi.fn().mockReturnValue(of({})),
      patch: vi.fn().mockReturnValue(of({ success: true, completedTours: [] })),
      put: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({ success: true })),
    };

    TestBed.configureTestingModule({
      providers: [
        ProductTourService,
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
        { provide: ApiService, useValue: apiMock },
      ],
    });

    service = TestBed.inject(ProductTourService);

    // Mark service as initialized to prevent isTourCompleted from calling init()
    // which would overwrite the local cache with API response (empty completedTours)
    (service as any).initialized = true;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= isTourCompleted =============

  it('isTourCompleted() should return false for a tour not yet completed', async () => {
    const result = await service.isTourCompleted('patient_home');
    expect(result).toBe(false);
  });

  it('isTourCompleted() should return true after marking tour completed', async () => {
    await service.markTourCompleted('patient_home');
    const result = await service.isTourCompleted('patient_home');
    expect(result).toBe(true);
  });

  // ============= markTourCompleted =============

  it('markTourCompleted() should update cache and localStorage', async () => {
    await service.markTourCompleted('patient_home');

    expect(localStorage.setItem).toHaveBeenCalled();
    const result = await service.isTourCompleted('patient_home');
    expect(result).toBe(true);
  });

  it('markTourCompleted() should call API to persist', async () => {
    await service.markTourCompleted('patient_map');

    expect(apiMock.patch).toHaveBeenCalledWith(
      '/users/me/tours/patient_map/complete',
      {}
    );
  });

  it('markTourCompleted() should not throw when API fails', async () => {
    apiMock.patch.mockReturnValue(throwError(() => new Error('Network error')));

    await expect(service.markTourCompleted('patient_home')).resolves.not.toThrow();
    // Cache should still be updated
    const result = await service.isTourCompleted('patient_home');
    expect(result).toBe(true);
  });

  // ============= resetTour =============

  it('resetTour() should remove a specific tour from cache', async () => {
    await service.markTourCompleted('patient_home');
    expect(await service.isTourCompleted('patient_home')).toBe(true);

    await service.resetTour('patient_home');
    expect(await service.isTourCompleted('patient_home')).toBe(false);
  });

  it('resetTour() should not affect other tours', async () => {
    await service.markTourCompleted('patient_home');
    await service.markTourCompleted('patient_map');

    await service.resetTour('patient_home');

    expect(await service.isTourCompleted('patient_home')).toBe(false);
    expect(await service.isTourCompleted('patient_map')).toBe(true);
  });

  // ============= resetAllTours =============

  it('resetAllTours() should clear all tours from cache', async () => {
    await service.markTourCompleted('patient_home');
    await service.markTourCompleted('patient_map');
    await service.markTourCompleted('nurse_dashboard');

    await service.resetAllTours();

    expect(await service.isTourCompleted('patient_home')).toBe(false);
    expect(await service.isTourCompleted('patient_map')).toBe(false);
    expect(await service.isTourCompleted('nurse_dashboard')).toBe(false);
  });

  it('resetAllTours() should call API delete', async () => {
    await service.resetAllTours();
    expect(apiMock.delete).toHaveBeenCalledWith(
      '/users/me/tours',
      { body: { tourTypes: undefined } }
    );
  });

  // ============= setPendingTour / getPendingTour =============

  it('setPendingTour() should store tour type in sessionStorage', async () => {
    await service.setPendingTour('nurse_dashboard');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('nurselite-pending-tour', 'nurse_dashboard');
  });

  it('getPendingTour() should return and clear pending tour', async () => {
    // Manually set a pending tour value
    (sessionStorage.getItem as any).mockReturnValueOnce('nurse_dashboard');

    const result = await service.getPendingTour();
    expect(result).toBe('nurse_dashboard');
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('nurselite-pending-tour');
  });

  it('getPendingTour() should return null when no pending tour', async () => {
    (sessionStorage.getItem as any).mockReturnValueOnce(null);

    const result = await service.getPendingTour();
    expect(result).toBeNull();
  });

  // ============= isTourActive signal =============

  it('isTourActive should be false initially', () => {
    expect(service.isTourActive()).toBe(false);
  });

  // ============= stopTour =============

  it('stopTour() should set isTourActive to false', () => {
    // Force active state
    service.isTourActive.set(true);
    (service as any).activeTourType = 'patient_home';

    service.stopTour();

    expect(service.isTourActive()).toBe(false);
    expect((service as any).activeTourType).toBeNull();
  });

  // ============= forceStop =============

  it('forceStop() should cleanup and set isTourActive to false', () => {
    service.isTourActive.set(true);
    (service as any).activeTourType = 'patient_home';

    service.forceStop();

    expect(service.isTourActive()).toBe(false);
    expect((service as any).activeTourType).toBeNull();
  });

  it('forceStop() should not throw even without an active driver', () => {
    expect(() => service.forceStop()).not.toThrow();
  });

  // ============= loadFromLocalStorage =============

  it('should load completed tours from localStorage', () => {
    // Set localStorage data for the storage key
    localStorage.setItem('nurselite-completed-tours', JSON.stringify(['patient_home', 'patient_map']));

    // Call private method to reload from localStorage
    (service as any).loadFromLocalStorage();

    // The cache should have the tours from localStorage
    const cache = (service as any).completedToursCache();
    expect(cache.has('patient_home')).toBe(true);
    expect(cache.has('patient_map')).toBe(true);
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorage.setItem('nurselite-completed-tours', 'not-valid-json');

    // Should not throw
    expect(() => (service as any).loadFromLocalStorage()).not.toThrow();
  });

  // ============= init =============

  it('init() should load completed tours from API', async () => {
    apiMock.get.mockReturnValue(of({ completedTours: ['patient_home', 'nurse_dashboard'] }));
    (service as any).initialized = false;

    await service.init();

    expect(apiMock.get).toHaveBeenCalledWith('/users/me/tours');
    expect(await service.isTourCompleted('patient_home')).toBe(true);
    expect(await service.isTourCompleted('nurse_dashboard')).toBe(true);
  });

  it('init() should save to localStorage after API load', async () => {
    apiMock.get.mockReturnValue(of({ completedTours: ['patient_map'] }));
    (service as any).initialized = false;

    await service.init();

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'nurselite-completed-tours',
      JSON.stringify(['patient_map'])
    );
  });

  it('init() should not re-initialize if already initialized', async () => {
    (service as any).initialized = true;
    apiMock.get.mockClear();

    await service.init();

    expect(apiMock.get).not.toHaveBeenCalled();
  });

  it('init() should handle API errors gracefully and keep localStorage cache', async () => {
    localStorage.setItem('nurselite-completed-tours', JSON.stringify(['patient_home']));
    (service as any).loadFromLocalStorage();
    (service as any).initialized = false;

    apiMock.get.mockReturnValue(throwError(() => new Error('Network error')));

    await service.init();

    // Should not throw and cache should remain from localStorage
    expect(await service.isTourCompleted('patient_home')).toBe(true);
    expect((service as any).initialized).toBe(true);
  });

  // ============= resetToursByRole =============

  it('resetToursByRole() should reset all patient tours', async () => {
    await service.markTourCompleted('patient_home');
    await service.markTourCompleted('patient_map');
    await service.markTourCompleted('patient_settings');
    await service.markTourCompleted('nurse_dashboard'); // Different role

    await service.resetToursByRole('patient');

    expect(await service.isTourCompleted('patient_home')).toBe(false);
    expect(await service.isTourCompleted('patient_map')).toBe(false);
    expect(await service.isTourCompleted('patient_settings')).toBe(false);
    expect(await service.isTourCompleted('nurse_dashboard')).toBe(true); // Unchanged
  });

  it('resetToursByRole() should reset all nurse tours', async () => {
    await service.markTourCompleted('nurse_dashboard');
    await service.markTourCompleted('nurse_profile');
    await service.markTourCompleted('nurse_requests');
    await service.markTourCompleted('nurse_services');
    await service.markTourCompleted('nurse_earnings');
    await service.markTourCompleted('patient_home'); // Different role

    await service.resetToursByRole('nurse');

    expect(await service.isTourCompleted('nurse_dashboard')).toBe(false);
    expect(await service.isTourCompleted('nurse_profile')).toBe(false);
    expect(await service.isTourCompleted('nurse_requests')).toBe(false);
    expect(await service.isTourCompleted('nurse_services')).toBe(false);
    expect(await service.isTourCompleted('nurse_earnings')).toBe(false);
    expect(await service.isTourCompleted('patient_home')).toBe(true); // Unchanged
  });

  it('resetToursByRole() should reset admin tours', async () => {
    await service.markTourCompleted('admin_verifications');

    await service.resetToursByRole('admin');

    expect(await service.isTourCompleted('admin_verifications')).toBe(false);
  });

  // ============= checkAndStartPendingTour =============

  it('checkAndStartPendingTour() should start pending tour if exists', async () => {
    (sessionStorage.getItem as any).mockReturnValueOnce('patient_home');
    const startTourSpy = vi.spyOn(service, 'startTour').mockResolvedValue();

    await service.checkAndStartPendingTour();

    expect(startTourSpy).toHaveBeenCalledWith('patient_home', true);
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('nurselite-pending-tour');
  });

  it('checkAndStartPendingTour() should do nothing if no pending tour', async () => {
    (sessionStorage.getItem as any).mockReturnValueOnce(null);
    const startTourSpy = vi.spyOn(service, 'startTour').mockResolvedValue();

    await service.checkAndStartPendingTour();

    expect(startTourSpy).not.toHaveBeenCalled();
  });

  // ============= getTourConfig =============

  it('getTourConfig() should return config for patient_home', () => {
    const config = (service as any).getTourConfig('patient_home');
    expect(config).toBeTruthy();
    expect(config.steps).toBeInstanceOf(Array);
    expect(config.steps.length).toBeGreaterThan(0);
    expect(config.steps[0].popover?.title).toContain('Bienvenido');
  });

  it('getTourConfig() should return config for patient_map', () => {
    const config = (service as any).getTourConfig('patient_map');
    expect(config).toBeTruthy();
    expect(config.steps.length).toBeGreaterThan(0);
  });

  it('getTourConfig() should return config for patient_settings', () => {
    const config = (service as any).getTourConfig('patient_settings');
    expect(config).toBeTruthy();
    expect(config.steps.length).toBeGreaterThan(0);
  });

  it('getTourConfig() should return config for nurse_dashboard', () => {
    const config = (service as any).getTourConfig('nurse_dashboard');
    expect(config).toBeTruthy();
    expect(config.steps.length).toBeGreaterThan(0);
    expect(config.steps[0].popover?.title).toContain('Bienvenida');
  });

  it('getTourConfig() should return config for nurse_profile', () => {
    const config = (service as any).getTourConfig('nurse_profile');
    expect(config).toBeTruthy();
    expect(config.steps.length).toBeGreaterThan(0);
  });

  it('getTourConfig() should return config for nurse_requests', () => {
    const config = (service as any).getTourConfig('nurse_requests');
    expect(config).toBeTruthy();
    expect(config.steps.length).toBeGreaterThan(0);
  });

  it('getTourConfig() should return config for nurse_services', () => {
    const config = (service as any).getTourConfig('nurse_services');
    expect(config).toBeTruthy();
    expect(config.steps.length).toBeGreaterThan(0);
  });

  it('getTourConfig() should return config for nurse_earnings', () => {
    const config = (service as any).getTourConfig('nurse_earnings');
    expect(config).toBeTruthy();
    expect(config.steps.length).toBeGreaterThan(0);
  });

  it('getTourConfig() should return config for admin_verifications', () => {
    const config = (service as any).getTourConfig('admin_verifications');
    expect(config).toBeTruthy();
    expect(config.steps.length).toBeGreaterThan(0);
  });

  it('getTourConfig() should return null for unknown tour type', () => {
    const config = (service as any).getTourConfig('unknown_tour' as TourType);
    expect(config).toBeNull();
  });

  // ============= waitForElements =============

  it('waitForElements() should resolve true when all elements exist', async () => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="tour-main-action"></div>
      <div id="tour-quick-actions"></div>
    `;

    const steps = [
      { element: '#tour-main-action', popover: { title: 'Test' } },
      { element: '#tour-quick-actions', popover: { title: 'Test' } },
    ];

    const result = await (service as any).waitForElements(steps, 1000);
    expect(result).toBe(true);
  });

  it('waitForElements() should resolve false when elements timeout', async () => {
    // No elements in DOM
    document.body.innerHTML = '';

    const steps = [
      { element: '#missing-element', popover: { title: 'Test' } },
    ];

    const result = await (service as any).waitForElements(steps, 500);
    expect(result).toBe(false);
  });

  it('waitForElements() should resolve true for steps without element selectors', async () => {
    const steps = [
      { popover: { title: 'Test', description: 'No element' } },
    ];

    const result = await (service as any).waitForElements(steps, 1000);
    expect(result).toBe(true);
  });

  it('waitForElements() should wait and retry until elements appear', async () => {
    document.body.innerHTML = '';

    const steps = [
      { element: '#delayed-element', popover: { title: 'Test' } },
    ];

    // Add element after a delay
    setTimeout(() => {
      document.body.innerHTML = '<div id="delayed-element"></div>';
    }, 200);

    const result = await (service as any).waitForElements(steps, 1000);
    expect(result).toBe(true);
  });

  // ============= startTour =============

  it('startTour() should not start if already active', async () => {
    service.isTourActive.set(true);
    const getTourConfigSpy = vi.spyOn(service as any, 'getTourConfig');

    await service.startTour('patient_home', true);

    expect(getTourConfigSpy).not.toHaveBeenCalled();
  });

  it('startTour() should not start if on wrong route', async () => {
    routerMock.url = '/nurse/dashboard'; // Wrong route for patient_home
    const getTourConfigSpy = vi.spyOn(service as any, 'getTourConfig');

    await service.startTour('patient_home', true);

    expect(getTourConfigSpy).not.toHaveBeenCalled();
  });

  it('startTour() should not start if already completed (unless forceShow)', async () => {
    await service.markTourCompleted('patient_home');
    const getTourConfigSpy = vi.spyOn(service as any, 'getTourConfig');

    await service.startTour('patient_home', false);

    expect(getTourConfigSpy).not.toHaveBeenCalled();
  });

  it('startTour() should start even if completed when forceShow=true', async () => {
    await service.markTourCompleted('patient_home');
    routerMock.url = '/patient/home';

    // Mock elements in DOM
    document.body.innerHTML = `
      <div id="tour-main-action"></div>
      <div id="tour-quick-actions"></div>
      <div id="tour-tab-map"></div>
      <div id="tour-tab-settings"></div>
    `;

    await service.startTour('patient_home', true);

    // Should have initialized driver
    const { driver } = await import('driver.js');
    expect(driver).toHaveBeenCalled();
  });

  it('startTour() should not start if elements are not ready', async () => {
    routerMock.url = '/patient/home';
    document.body.innerHTML = ''; // No elements

    // Mock waitForElements to resolve immediately (false = elements not found)
    vi.spyOn(service as any, 'waitForElements').mockResolvedValue(false);

    await service.startTour('patient_home', true);

    expect(service.isTourActive()).toBe(false);
  });

  it('startTour() should initialize driver with correct config', async () => {
    routerMock.url = '/patient/home';
    document.body.innerHTML = `
      <div id="tour-main-action"></div>
      <div id="tour-quick-actions"></div>
      <div id="tour-tab-map"></div>
      <div id="tour-tab-settings"></div>
    `;

    await service.startTour('patient_home', true);

    const { driver } = await import('driver.js');
    expect(driver).toHaveBeenCalledWith(
      expect.objectContaining({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Entendido',
        progressText: '{{current}} de {{total}}',
        disableActiveInteraction: true,
      })
    );
  });

  it('startTour() should set isTourActive to true', async () => {
    routerMock.url = '/patient/home';
    document.body.innerHTML = `
      <div id="tour-main-action"></div>
      <div id="tour-quick-actions"></div>
      <div id="tour-tab-map"></div>
      <div id="tour-tab-settings"></div>
    `;

    await service.startTour('patient_home', true);

    expect(service.isTourActive()).toBe(true);
  });

  it('startTour() should call drive() on driver instance', async () => {
    routerMock.url = '/patient/home';
    document.body.innerHTML = `
      <div id="tour-main-action"></div>
      <div id="tour-quick-actions"></div>
      <div id="tour-tab-map"></div>
      <div id="tour-tab-settings"></div>
    `;

    const mockDriverInstance = {
      drive: vi.fn(),
      destroy: vi.fn(),
    };

    const { driver } = await import('driver.js');
    (driver as any).mockReturnValue(mockDriverInstance);

    await service.startTour('patient_home', true);

    expect(mockDriverInstance.drive).toHaveBeenCalled();
  });

  it('startTour() should not start if getTourConfig returns null', async () => {
    routerMock.url = '/unknown/route';
    const getTourConfigSpy = vi.spyOn(service as any, 'getTourConfig').mockReturnValue(null);

    await service.startTour('patient_home', true);

    expect(service.isTourActive()).toBe(false);
  });

  // ============= stopTour with active driver =============

  it('stopTour() should destroy driver instance if active', () => {
    const mockDriverInstance = {
      destroy: vi.fn(),
    };

    (service as any).driverInstance = mockDriverInstance;
    service.isTourActive.set(true);
    (service as any).activeTourType = 'patient_home';

    service.stopTour();

    expect(mockDriverInstance.destroy).toHaveBeenCalled();
    expect((service as any).driverInstance).toBeNull();
  });

  // ============= forceStop with driver errors =============

  it('forceStop() should handle driver destroy errors', () => {
    const mockDriverInstance = {
      destroy: vi.fn(() => { throw new Error('Destroy error'); }),
    };

    (service as any).driverInstance = mockDriverInstance;

    expect(() => service.forceStop()).not.toThrow();
    expect(service.isTourActive()).toBe(false);
  });

  // ============= saveToLocalStorage error handling =============

  it('saveToLocalStorage() should handle errors gracefully', () => {
    const mockError = new Error('Storage full');
    (localStorage.setItem as any).mockImplementationOnce(() => { throw mockError; });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => (service as any).saveToLocalStorage(new Set(['test']))).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error saving completed tours to localStorage:',
      mockError
    );

    consoleSpy.mockRestore();
  });

  // ============= resetTours API sync =============

  it('resetTours() should sync with backend response if different from local', async () => {
    await service.markTourCompleted('patient_home');
    await service.markTourCompleted('patient_map');

    // Backend returns different state
    apiMock.delete.mockReturnValue(of({
      success: true,
      completedTours: ['nurse_dashboard'], // Different from local
    }));

    await service.resetAllTours();

    // Should sync with backend state
    expect(await service.isTourCompleted('patient_home')).toBe(false);
    expect(await service.isTourCompleted('nurse_dashboard')).toBe(true);
  });

  it('resetTours() should handle API errors without throwing', async () => {
    apiMock.delete.mockReturnValue(throwError(() => new Error('Network error')));

    await expect(service.resetAllTours()).resolves.not.toThrow();
  });

  // ============= Edge cases =============

  it('isTourCompleted() should initialize service if not initialized', async () => {
    (service as any).initialized = false;
    apiMock.get.mockReturnValue(of({ completedTours: ['patient_home'] }));

    const result = await service.isTourCompleted('patient_home');

    expect(apiMock.get).toHaveBeenCalledWith('/users/me/tours');
    expect(result).toBe(true);
  });

  it('startTour() should handle race condition guard', async () => {
    routerMock.url = '/patient/home';
    document.body.innerHTML = `
      <div id="tour-main-action"></div>
      <div id="tour-quick-actions"></div>
      <div id="tour-tab-map"></div>
      <div id="tour-tab-settings"></div>
    `;

    // Start a tour
    const promise1 = service.startTour('patient_home', true);

    // Try to start another tour immediately (race condition)
    const promise2 = service.startTour('patient_map', true);

    await Promise.all([promise1, promise2]);

    // Only one tour should have started
    const { driver } = await import('driver.js');
    expect((driver as any).mock.calls.length).toBe(1);
  });
});
