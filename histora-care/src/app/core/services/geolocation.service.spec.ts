import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted before all imports - ensures the mock replaces the module
// before GeolocationService's bundled code loads
vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    getCurrentPosition: vi.fn().mockResolvedValue({
      coords: { latitude: -12.046374, longitude: -77.042793, accuracy: 10, heading: null, speed: null },
      timestamp: Date.now()
    }),
    watchPosition: vi.fn().mockResolvedValue('watch-id'),
    clearWatch: vi.fn().mockResolvedValue(undefined),
    checkPermissions: vi.fn().mockResolvedValue({ location: 'granted' }),
    requestPermissions: vi.fn().mockResolvedValue({ location: 'granted' }),
  }
}));

import '../../../testing/setup';
import { GeolocationService } from './geolocation.service';
import { Geolocation } from '@capacitor/geolocation';

describe('GeolocationService', () => {
  let service: GeolocationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GeolocationService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('location signal should initially be null', () => {
    expect(service.location()).toBeNull();
  });

  // ============= checkPermissions =============

  it('checkPermissions() should delegate to Capacitor Geolocation', async () => {
    const result = await service.checkPermissions();
    expect(Geolocation.checkPermissions as any).toHaveBeenCalled();
    expect(result).toEqual({ location: 'granted' });
  });

  // ============= requestPermissions =============

  it('requestPermissions() should delegate to Capacitor Geolocation', async () => {
    const result = await service.requestPermissions();
    expect(Geolocation.requestPermissions as any).toHaveBeenCalled();
    expect(result).toEqual({ location: 'granted' });
  });

  // ============= getCurrentPosition =============

  it('getCurrentPosition() should return coordinates and update location signal', async () => {
    const coords = await service.getCurrentPosition();

    expect(Geolocation.getCurrentPosition as any).toHaveBeenCalledWith({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    expect(coords.latitude).toBe(-12.046374);
    expect(coords.longitude).toBe(-77.042793);
    expect(coords.accuracy).toBe(10);

    // Signal should be updated
    expect(service.location()).toEqual(coords);
  });

  it('getCurrentPosition() should propagate errors from Capacitor', async () => {
    (Geolocation.getCurrentPosition as any).mockRejectedValueOnce(
      new Error('Location unavailable')
    );

    await expect(service.getCurrentPosition()).rejects.toThrow('Location unavailable');
  });

  // ============= startWatching =============

  it('startWatching() should call Geolocation.watchPosition', async () => {
    await service.startWatching();

    expect(Geolocation.watchPosition as any).toHaveBeenCalledWith(
      expect.objectContaining({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }),
      expect.any(Function)
    );
  });

  it('startWatching() should return early if already watching', async () => {
    await service.startWatching();
    await service.startWatching();

    // Should only be called once
    expect(Geolocation.watchPosition as any).toHaveBeenCalledTimes(1);
  });

  // ============= stopWatching =============

  it('stopWatching() should call Geolocation.clearWatch with watch id', async () => {
    await service.startWatching();
    await service.stopWatching();

    expect(Geolocation.clearWatch as any).toHaveBeenCalledWith({ id: 'watch-id' });
  });

  it('stopWatching() should do nothing if not watching', async () => {
    await service.stopWatching();
    expect(Geolocation.clearWatch as any).not.toHaveBeenCalled();
  });

  it('stopWatching() should allow startWatching again after stop', async () => {
    await service.startWatching();
    await service.stopWatching();
    await service.startWatching();

    expect(Geolocation.watchPosition as any).toHaveBeenCalledTimes(2);
  });

  // ============= calculateDistance =============

  it('calculateDistance() should return 0 for same coordinates', () => {
    const distance = service.calculateDistance(-12.046374, -77.042793, -12.046374, -77.042793);
    expect(distance).toBe(0);
  });

  it('calculateDistance() should return correct distance (Lima Centro to Miraflores)', () => {
    // Lima Centro (-12.0464, -77.0428) to Miraflores (-12.1197, -77.0295)
    const distance = service.calculateDistance(-12.0464, -77.0428, -12.1197, -77.0295);
    // Approximately 8.2 km
    expect(distance).toBeGreaterThan(7);
    expect(distance).toBeLessThan(10);
  });

  it('calculateDistance() should return symmetric results', () => {
    const d1 = service.calculateDistance(-12.0464, -77.0428, -12.1197, -77.0295);
    const d2 = service.calculateDistance(-12.1197, -77.0295, -12.0464, -77.0428);
    expect(d1).toBeCloseTo(d2, 10);
  });
});
