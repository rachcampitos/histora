/**
 * Individual Capacitor mock exports for tests that need to customize behavior
 */
import { vi } from 'vitest';

export const MockPreferences = {
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue({ value: null }),
  remove: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
  keys: vi.fn().mockResolvedValue({ keys: [] }),
};

export const MockCapacitor = {
  isNativePlatform: vi.fn().mockReturnValue(false),
  getPlatform: vi.fn().mockReturnValue('web'),
  isPluginAvailable: vi.fn().mockReturnValue(false),
  convertFileSrc: vi.fn((src: string) => src),
};

export const MockHaptics = {
  impact: vi.fn().mockResolvedValue(undefined),
  notification: vi.fn().mockResolvedValue(undefined),
  vibrate: vi.fn().mockResolvedValue(undefined),
  selectionStart: vi.fn().mockResolvedValue(undefined),
  selectionChanged: vi.fn().mockResolvedValue(undefined),
  selectionEnd: vi.fn().mockResolvedValue(undefined),
};

export const MockGeolocation = {
  getCurrentPosition: vi.fn().mockResolvedValue({
    coords: { latitude: -12.046374, longitude: -77.042793, accuracy: 10 },
    timestamp: Date.now()
  }),
  watchPosition: vi.fn().mockReturnValue('watch-id'),
  clearWatch: vi.fn().mockResolvedValue(undefined),
  checkPermissions: vi.fn().mockResolvedValue({ location: 'granted' }),
  requestPermissions: vi.fn().mockResolvedValue({ location: 'granted' }),
};

export const MockCamera = {
  getPhoto: vi.fn().mockResolvedValue({
    webPath: 'data:image/png;base64,abc',
    format: 'png',
  }),
  checkPermissions: vi.fn().mockResolvedValue({ camera: 'granted', photos: 'granted' }),
  requestPermissions: vi.fn().mockResolvedValue({ camera: 'granted', photos: 'granted' }),
};

export const MockPushNotifications = {
  requestPermissions: vi.fn().mockResolvedValue({ receive: 'granted' }),
  register: vi.fn().mockResolvedValue(undefined),
  addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  removeAllListeners: vi.fn().mockResolvedValue(undefined),
  getDeliveredNotifications: vi.fn().mockResolvedValue({ notifications: [] }),
  removeAllDeliveredNotifications: vi.fn().mockResolvedValue(undefined),
};

export const MockBrowser = {
  open: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  removeAllListeners: vi.fn().mockResolvedValue(undefined),
};

export const MockApp = {
  addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  removeAllListeners: vi.fn().mockResolvedValue(undefined),
  getState: vi.fn().mockResolvedValue({ isActive: true }),
  getInfo: vi.fn().mockResolvedValue({ id: 'com.historahealth.nurselite', name: 'NurseLite', version: '1.0.0', build: '1' }),
  exitApp: vi.fn(),
};

export const MockNetwork = {
  getStatus: vi.fn().mockResolvedValue({ connected: true, connectionType: 'wifi' }),
  addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  removeAllListeners: vi.fn().mockResolvedValue(undefined),
};
