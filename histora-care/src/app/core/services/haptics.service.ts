import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Centralized haptic feedback service
 * Provides tactile feedback for user interactions
 * Gracefully degrades on web/unsupported platforms
 */
@Injectable({
  providedIn: 'root'
})
export class HapticsService {
  private readonly isNative = Capacitor.isNativePlatform();

  /**
   * Light impact feedback - for subtle interactions
   * Use for: Toggle switches, checkbox selection, list item tap
   */
  async light(): Promise<void> {
    if (!this.isNative) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Silently fail on unsupported devices
    }
  }

  /**
   * Medium impact feedback - for moderate interactions
   * Use for: Button presses, card swipes, pull-to-refresh
   */
  async medium(): Promise<void> {
    if (!this.isNative) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Silently fail
    }
  }

  /**
   * Heavy impact feedback - for significant interactions
   * Use for: Major actions completed, confirmation dialogs
   */
  async heavy(): Promise<void> {
    if (!this.isNative) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      // Silently fail
    }
  }

  /**
   * Success notification feedback
   * Use for: Successful form submission, payment completed, task done
   */
  async success(): Promise<void> {
    if (!this.isNative) return;

    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      // Silently fail
    }
  }

  /**
   * Warning notification feedback
   * Use for: Validation errors, incomplete forms, warnings
   */
  async warning(): Promise<void> {
    if (!this.isNative) return;

    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {
      // Silently fail
    }
  }

  /**
   * Error notification feedback
   * Use for: Failed operations, errors, denied actions
   */
  async error(): Promise<void> {
    if (!this.isNative) return;

    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      // Silently fail
    }
  }

  /**
   * Selection changed feedback
   * Use for: Picker selection, segment change, slider movement
   */
  async selectionChanged(): Promise<void> {
    if (!this.isNative) return;

    try {
      await Haptics.selectionChanged();
    } catch {
      // Silently fail
    }
  }

  /**
   * Selection start feedback (for continuous selection)
   * Use for: Beginning of drag, slider touch start
   */
  async selectionStart(): Promise<void> {
    if (!this.isNative) return;

    try {
      await Haptics.selectionStart();
    } catch {
      // Silently fail
    }
  }

  /**
   * Selection end feedback (for continuous selection)
   * Use for: End of drag, slider touch end
   */
  async selectionEnd(): Promise<void> {
    if (!this.isNative) return;

    try {
      await Haptics.selectionEnd();
    } catch {
      // Silently fail
    }
  }

  /**
   * Custom vibration pattern
   * @param duration Duration in milliseconds (max 5000ms)
   */
  async vibrate(duration: number = 100): Promise<void> {
    if (!this.isNative) return;

    try {
      await Haptics.vibrate({ duration: Math.min(duration, 5000) });
    } catch {
      // Silently fail
    }
  }
}
