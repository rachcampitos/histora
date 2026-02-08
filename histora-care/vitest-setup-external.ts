/**
 * Vitest setup file for mocking external modules (@ionic/core, @stencil/core)
 * These modules are marked as externalDependencies in angular.json
 * so vi.mock here can intercept them before they load.
 */
import { vi, beforeAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// Initialize TestBed for Angular tests
beforeAll(() => {
  try {
    TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  } catch (e) {
    // Already initialized, ignore
  }
});

// Mock Stencil runtime to prevent web component initialization in jsdom
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

// Note: @stencil/core exports field only allows './internal/client', not './internal/client/index.js'

// Mock @ionic/core/components to prevent Stencil component loading
vi.mock('@ionic/core/components', () => ({
  isPlatform: vi.fn().mockReturnValue(false),
  getPlatforms: vi.fn().mockReturnValue(['desktop']),
  LIFECYCLE_WILL_ENTER: 'ionViewWillEnter',
  LIFECYCLE_DID_ENTER: 'ionViewDidEnter',
  LIFECYCLE_WILL_LEAVE: 'ionViewWillLeave',
  LIFECYCLE_DID_LEAVE: 'ionViewDidLeave',
  LIFECYCLE_WILL_UNLOAD: 'ionViewWillUnload',
  componentOnReady: vi.fn().mockResolvedValue(undefined),
  modalController: { create: vi.fn(), dismiss: vi.fn(), getTop: vi.fn() },
  popoverController: { create: vi.fn(), dismiss: vi.fn(), getTop: vi.fn() },
  initialize: vi.fn(),
  actionSheetController: { create: vi.fn(), dismiss: vi.fn(), getTop: vi.fn() },
  alertController: { create: vi.fn(), dismiss: vi.fn(), getTop: vi.fn() },
  createAnimation: vi.fn(),
  getTimeGivenProgression: vi.fn(),
  createGesture: vi.fn(),
  loadingController: { create: vi.fn(), dismiss: vi.fn(), getTop: vi.fn() },
  menuController: { open: vi.fn(), close: vi.fn(), toggle: vi.fn() },
  pickerController: { create: vi.fn(), dismiss: vi.fn(), getTop: vi.fn() },
  toastController: { create: vi.fn(), dismiss: vi.fn(), getTop: vi.fn() },
  IonicSafeString: class IonicSafeString { constructor(public value: string) {} },
  IonicSlides: vi.fn(),
  iosTransitionAnimation: vi.fn(),
  mdTransitionAnimation: vi.fn(),
}));

vi.mock('@ionic/core/components/index.js', () => ({
  isPlatform: vi.fn().mockReturnValue(false),
  getPlatforms: vi.fn().mockReturnValue(['desktop']),
  componentOnReady: vi.fn().mockResolvedValue(undefined),
  initialize: vi.fn(),
}));

vi.mock('@ionic/core/loader', () => ({
  defineCustomElements: vi.fn().mockResolvedValue(undefined),
  setNonce: vi.fn(),
}));

vi.mock('@ionic/core/loader/index.js', () => ({
  defineCustomElements: vi.fn().mockResolvedValue(undefined),
  setNonce: vi.fn(),
}));
