/**
 * Global test setup for Vitest
 * Mocks Capacitor plugins, third-party libs, and browser APIs
 */
import { vi } from 'vitest';

// ============= Capacitor Mocks =============

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue({ value: null }),
    remove: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    keys: vi.fn().mockResolvedValue({ keys: [] }),
  }
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

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn().mockResolvedValue(undefined),
    notification: vi.fn().mockResolvedValue(undefined),
    vibrate: vi.fn().mockResolvedValue(undefined),
    selectionStart: vi.fn().mockResolvedValue(undefined),
    selectionChanged: vi.fn().mockResolvedValue(undefined),
    selectionEnd: vi.fn().mockResolvedValue(undefined),
  },
  ImpactStyle: { Heavy: 'HEAVY', Medium: 'MEDIUM', Light: 'LIGHT' },
  NotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
}));

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    getCurrentPosition: vi.fn().mockResolvedValue({
      coords: { latitude: -12.046374, longitude: -77.042793, accuracy: 10 },
      timestamp: Date.now()
    }),
    watchPosition: vi.fn().mockReturnValue('watch-id'),
    clearWatch: vi.fn().mockResolvedValue(undefined),
    checkPermissions: vi.fn().mockResolvedValue({ location: 'granted' }),
    requestPermissions: vi.fn().mockResolvedValue({ location: 'granted' }),
  }
}));

vi.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: vi.fn().mockResolvedValue({
      webPath: 'data:image/png;base64,abc',
      format: 'png',
    }),
    checkPermissions: vi.fn().mockResolvedValue({ camera: 'granted', photos: 'granted' }),
    requestPermissions: vi.fn().mockResolvedValue({ camera: 'granted', photos: 'granted' }),
  },
  CameraResultType: { Uri: 'uri', DataUrl: 'dataUrl', Base64: 'base64' },
  CameraSource: { Prompt: 'PROMPT', Camera: 'CAMERA', Photos: 'PHOTOS' },
  CameraDirection: { Rear: 'REAR', Front: 'FRONT' },
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    requestPermissions: vi.fn().mockResolvedValue({ receive: 'granted' }),
    register: vi.fn().mockResolvedValue(undefined),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    removeAllListeners: vi.fn().mockResolvedValue(undefined),
    getDeliveredNotifications: vi.fn().mockResolvedValue({ notifications: [] }),
    removeAllDeliveredNotifications: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    schedule: vi.fn().mockResolvedValue({ notifications: [] }),
    cancel: vi.fn().mockResolvedValue(undefined),
    getPending: vi.fn().mockResolvedValue({ notifications: [] }),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    removeAllListeners: vi.fn().mockResolvedValue(undefined),
    checkPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
  }
}));

vi.mock('@capacitor/browser', () => ({
  Browser: {
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    removeAllListeners: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    removeAllListeners: vi.fn().mockResolvedValue(undefined),
    getState: vi.fn().mockResolvedValue({ isActive: true }),
    getInfo: vi.fn().mockResolvedValue({ id: 'com.historahealth.nurselite', name: 'NurseLite', version: '1.0.0', build: '1' }),
    exitApp: vi.fn(),
  }
}));

vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: vi.fn().mockResolvedValue({ connected: true, connectionType: 'wifi' }),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    removeAllListeners: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: {
    show: vi.fn().mockResolvedValue(undefined),
    hide: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    setStyle: vi.fn().mockResolvedValue(undefined),
    setBackgroundColor: vi.fn().mockResolvedValue(undefined),
    show: vi.fn().mockResolvedValue(undefined),
    hide: vi.fn().mockResolvedValue(undefined),
  },
  Style: { Dark: 'DARK', Light: 'LIGHT', Default: 'DEFAULT' },
}));

vi.mock('@capacitor/keyboard', () => ({
  Keyboard: {
    show: vi.fn().mockResolvedValue(undefined),
    hide: vi.fn().mockResolvedValue(undefined),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    removeAllListeners: vi.fn().mockResolvedValue(undefined),
  }
}));

// ============= Stencil Core Mock (prevent web component init in jsdom) =============

vi.mock('@stencil/core/internal/client', () => ({
  registerInstance: vi.fn(),
  getElement: vi.fn(),
  Host: vi.fn(),
  h: vi.fn(),
  proxyCustomElement: vi.fn((Cstr: any) => Cstr),
  HTMLElement: typeof HTMLElement !== 'undefined' ? HTMLElement : class {},
}));

// Note: @stencil/core/internal/client/index.js mock removed - exports field doesn't allow this path

vi.mock('@stencil/core', () => ({
  Component: () => () => {},
  Prop: () => () => {},
  State: () => () => {},
  Event: () => () => {},
  Method: () => () => {},
  Element: () => () => {},
  Watch: () => () => {},
  Listen: () => () => {},
  h: vi.fn(),
  Host: vi.fn(),
}));

// ============= Ionic Core Mocks (prevent Stencil init in jsdom) =============

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
  menuController: { open: vi.fn(), close: vi.fn(), toggle: vi.fn(), enable: vi.fn(), isOpen: vi.fn(), isEnabled: vi.fn() },
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

// ============= Ionic Angular Mock =============

vi.mock('@ionic/angular', () => {
  const createMockOverlay = () => ({
    present: vi.fn().mockResolvedValue(undefined),
    dismiss: vi.fn().mockResolvedValue(true),
    onDidDismiss: vi.fn().mockResolvedValue({ data: undefined, role: undefined }),
    onWillDismiss: vi.fn().mockResolvedValue({ data: undefined, role: undefined }),
  });

  const createControllerMock = () => ({
    create: vi.fn().mockResolvedValue(createMockOverlay()),
    dismiss: vi.fn().mockResolvedValue(true),
    getTop: vi.fn().mockResolvedValue(undefined),
  });

  return {
    IonicModule: {
      forRoot: vi.fn().mockReturnValue({ ngModule: class MockIonicModule {} }),
    },
    IonicRouteStrategy: class MockIonicRouteStrategy {
      shouldDetach() { return false; }
      store() {}
      shouldAttach() { return false; }
      retrieve() { return null; }
      shouldReuseRoute() { return false; }
    },
    ToastController: class MockToastController {
      create = vi.fn().mockResolvedValue(createMockOverlay());
      dismiss = vi.fn().mockResolvedValue(true);
      getTop = vi.fn().mockResolvedValue(undefined);
    },
    AlertController: class MockAlertController {
      create = vi.fn().mockResolvedValue(createMockOverlay());
      dismiss = vi.fn().mockResolvedValue(true);
      getTop = vi.fn().mockResolvedValue(undefined);
    },
    LoadingController: class MockLoadingController {
      create = vi.fn().mockResolvedValue(createMockOverlay());
      dismiss = vi.fn().mockResolvedValue(true);
      getTop = vi.fn().mockResolvedValue(undefined);
    },
    ModalController: class MockModalController {
      create = vi.fn().mockResolvedValue(createMockOverlay());
      dismiss = vi.fn().mockResolvedValue(true);
      getTop = vi.fn().mockResolvedValue(undefined);
    },
    ActionSheetController: class MockActionSheetController {
      create = vi.fn().mockResolvedValue(createMockOverlay());
      dismiss = vi.fn().mockResolvedValue(true);
      getTop = vi.fn().mockResolvedValue(undefined);
    },
    NavController: class MockNavController {
      navigateForward = vi.fn().mockResolvedValue(true);
      navigateBack = vi.fn().mockResolvedValue(true);
      navigateRoot = vi.fn().mockResolvedValue(true);
      back = vi.fn();
      pop = vi.fn().mockResolvedValue(undefined);
    },
    Platform: class MockPlatform {
      is = vi.fn().mockReturnValue(false);
      ready = vi.fn().mockResolvedValue('dom');
      isRTL = false;
      width = vi.fn().mockReturnValue(375);
      height = vi.fn().mockReturnValue(812);
      pause = { subscribe: vi.fn() };
      resume = { subscribe: vi.fn() };
      backButton = { subscribeWithPriority: vi.fn() };
    },
    IonModal: class MockIonModal {},
    RefresherCustomEvent: class MockRefresherCustomEvent {},
  };
});

// ============= Third-party Mocks =============

vi.mock('mapbox-gl', () => {
  class MockMap {
    on = vi.fn();
    off = vi.fn();
    remove = vi.fn();
    addControl = vi.fn();
    removeControl = vi.fn();
    addSource = vi.fn();
    removeSource = vi.fn();
    addLayer = vi.fn();
    removeLayer = vi.fn();
    getSource = vi.fn();
    getLayer = vi.fn();
    setCenter = vi.fn();
    setZoom = vi.fn();
    getZoom = vi.fn().mockReturnValue(14);
    setStyle = vi.fn();
    flyTo = vi.fn();
    fitBounds = vi.fn();
    resize = vi.fn();
    loaded = vi.fn().mockReturnValue(true);
    getCanvas = vi.fn().mockReturnValue({ style: {} });
  }

  class MockPopup {
    setLngLat = vi.fn().mockReturnThis();
    setHTML = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
    on = vi.fn().mockReturnThis();
    isOpen = vi.fn().mockReturnValue(false);
  }

  class MockMarker {
    private _popup: MockPopup | null = null;
    setLngLat = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
    getElement = vi.fn().mockReturnValue(typeof document !== 'undefined' ? document.createElement('div') : {});
    setPopup = vi.fn().mockImplementation((popup) => {
      this._popup = popup;
      return this;
    });
    getPopup = vi.fn().mockImplementation(() => this._popup);
  }

  class MockNavigationControl {}
  class MockGeolocateControl {}
  class MockAttributionControl {}

  class MockLngLatBounds {
    extend = vi.fn().mockReturnThis();
  }

  const mockAccessToken = { value: '' };

  return {
    default: {
      Map: MockMap,
      Marker: MockMarker,
      Popup: MockPopup,
      NavigationControl: MockNavigationControl,
      GeolocateControl: MockGeolocateControl,
      AttributionControl: MockAttributionControl,
      LngLatBounds: MockLngLatBounds,
      get accessToken() { return mockAccessToken.value; },
      set accessToken(val: string) { mockAccessToken.value = val; },
    },
    Map: MockMap,
    Marker: MockMarker,
    Popup: MockPopup,
    NavigationControl: MockNavigationControl,
    GeolocateControl: MockGeolocateControl,
    AttributionControl: MockAttributionControl,
    LngLatBounds: MockLngLatBounds,
  };
});

vi.mock('socket.io-client', () => ({
  io: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
    id: 'mock-socket-id',
  }),
}));

vi.mock('driver.js', () => ({
  driver: vi.fn().mockReturnValue({
    highlight: vi.fn(),
    drive: vi.fn(),
    destroy: vi.fn(),
    isActive: vi.fn().mockReturnValue(false),
    moveNext: vi.fn(),
    movePrevious: vi.fn(),
    moveTo: vi.fn(),
  }),
}));

vi.mock('@sentry/angular', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  createErrorHandler: vi.fn().mockReturnValue({ handleError: vi.fn() }),
  TraceService: vi.fn(),
}));

vi.mock('@sentry/browser', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

// ============= Browser API Mocks =============

// matchMedia
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; }),
      get length() { return Object.keys(store).length; },
      key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    };
  })();

  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });
}
