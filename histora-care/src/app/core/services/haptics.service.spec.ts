import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import '../../../testing/setup';
import { HapticsService } from './haptics.service';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

describe('HapticsService', () => {
  let service: HapticsService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: web platform (not native)
    (Capacitor.isNativePlatform as any).mockReturnValue(false);
    service = new HapticsService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---- Non-native (web) scenarios ----

  describe('when NOT native', () => {
    it('should NOT call Haptics.impact on light()', async () => {
      await service.light();
      expect(Haptics.impact as any).not.toHaveBeenCalled();
    });

    it('should NOT call Haptics.impact on medium()', async () => {
      await service.medium();
      expect(Haptics.impact as any).not.toHaveBeenCalled();
    });

    it('should NOT call Haptics.impact on heavy()', async () => {
      await service.heavy();
      expect(Haptics.impact as any).not.toHaveBeenCalled();
    });

    it('should NOT call Haptics.notification on success()', async () => {
      await service.success();
      expect(Haptics.notification as any).not.toHaveBeenCalled();
    });

    it('should NOT call Haptics.notification on warning()', async () => {
      await service.warning();
      expect(Haptics.notification as any).not.toHaveBeenCalled();
    });

    it('should NOT call Haptics.notification on error()', async () => {
      await service.error();
      expect(Haptics.notification as any).not.toHaveBeenCalled();
    });

    it('should NOT call Haptics.selectionChanged on selectionChanged()', async () => {
      await service.selectionChanged();
      expect(Haptics.selectionChanged as any).not.toHaveBeenCalled();
    });

    it('should NOT call Haptics.selectionStart on selectionStart()', async () => {
      await service.selectionStart();
      expect(Haptics.selectionStart as any).not.toHaveBeenCalled();
    });

    it('should NOT call Haptics.selectionEnd on selectionEnd()', async () => {
      await service.selectionEnd();
      expect(Haptics.selectionEnd as any).not.toHaveBeenCalled();
    });

    it('should NOT call Haptics.vibrate on vibrate()', async () => {
      await service.vibrate(200);
      expect(Haptics.vibrate as any).not.toHaveBeenCalled();
    });
  });

  // ---- Native scenarios ----

  describe('when native', () => {
    let nativeService: HapticsService;

    beforeEach(() => {
      (Capacitor.isNativePlatform as any).mockReturnValue(true);
      nativeService = new HapticsService();
    });

    it('should call Haptics.impact with Light style on light()', async () => {
      await nativeService.light();
      expect(Haptics.impact as any).toHaveBeenCalledWith({ style: ImpactStyle.Light });
    });

    it('should call Haptics.impact with Medium style on medium()', async () => {
      await nativeService.medium();
      expect(Haptics.impact as any).toHaveBeenCalledWith({ style: ImpactStyle.Medium });
    });

    it('should call Haptics.impact with Heavy style on heavy()', async () => {
      await nativeService.heavy();
      expect(Haptics.impact as any).toHaveBeenCalledWith({ style: ImpactStyle.Heavy });
    });

    it('should call Haptics.notification with Success on success()', async () => {
      await nativeService.success();
      expect(Haptics.notification as any).toHaveBeenCalledWith({ type: NotificationType.Success });
    });

    it('should call Haptics.notification with Warning on warning()', async () => {
      await nativeService.warning();
      expect(Haptics.notification as any).toHaveBeenCalledWith({ type: NotificationType.Warning });
    });

    it('should call Haptics.notification with Error on error()', async () => {
      await nativeService.error();
      expect(Haptics.notification as any).toHaveBeenCalledWith({ type: NotificationType.Error });
    });

    it('should call Haptics.selectionChanged on selectionChanged()', async () => {
      await nativeService.selectionChanged();
      expect(Haptics.selectionChanged as any).toHaveBeenCalled();
    });

    it('should call Haptics.selectionStart on selectionStart()', async () => {
      await nativeService.selectionStart();
      expect(Haptics.selectionStart as any).toHaveBeenCalled();
    });

    it('should call Haptics.selectionEnd on selectionEnd()', async () => {
      await nativeService.selectionEnd();
      expect(Haptics.selectionEnd as any).toHaveBeenCalled();
    });

    it('should call Haptics.vibrate with specified duration', async () => {
      await nativeService.vibrate(300);
      expect(Haptics.vibrate as any).toHaveBeenCalledWith({ duration: 300 });
    });

    it('should cap vibrate duration to 5000ms', async () => {
      await nativeService.vibrate(10000);
      expect(Haptics.vibrate as any).toHaveBeenCalledWith({ duration: 5000 });
    });

    it('should use default vibrate duration of 100ms', async () => {
      await nativeService.vibrate();
      expect(Haptics.vibrate as any).toHaveBeenCalledWith({ duration: 100 });
    });

    it('should not throw when Haptics.impact rejects', async () => {
      (Haptics.impact as any).mockRejectedValueOnce(new Error('fail'));
      await expect(nativeService.light()).resolves.toBeUndefined();
    });
  });
});
