import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

/**
 * Status for the pre-auth landing page
 */
export interface LandingStatus {
  seen: boolean;
  seenAt: string;
  version: string;
}

/**
 * Status for the post-auth onboarding tutorial
 */
export interface OnboardingStatus {
  completed: boolean;
  completedAt: string;
  version: string;
  skipped: boolean;
}

// Landing is global (pre-auth, same for all users)
const LANDING_KEY = 'histora_care_landing_status';
// Onboarding prefix - will be combined with user ID
const ONBOARDING_KEY_PREFIX = 'histora_care_onboarding_';
// Version 2.0: Differentiated onboarding for nurses and patients
const CURRENT_VERSION = '2.0';

/**
 * OnboardingService manages the hybrid onboarding flow for NurseLite:
 *
 * 1. PRE-AUTH LANDING (1 slide):
 *    - Shown on first app open before authentication
 *    - Purpose: Value proposition + trust signals
 *    - Goal: Drive registration without friction
 *
 * 2. POST-AUTH ONBOARDING (5 slides):
 *    - Shown after successful registration
 *    - Purpose: Security education + feature discovery
 *    - Goal: Build confidence in verified users
 *
 * This follows the "Progressive Trust Model" pattern:
 * - Pre-auth: Generate CURIOSITY
 * - Post-auth: Generate CONFIDENCE
 *
 * Based on research:
 * - Apps with >3 pre-auth slides have 15-25% lower registration conversion
 * - Users are more receptive to learning after making a commitment (registration)
 */
@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private authService = inject(AuthService);
  private api = inject(ApiService);

  // Cache for sync access (loaded on init)
  private landingStatus: LandingStatus | null = null;
  private onboardingStatus: OnboardingStatus | null = null;
  private onboardingStatusUserId: string | null = null; // Track which user's status is cached
  private initialized = false;
  private serverSyncAttempted = false;

  constructor(private storage: StorageService) {
    this.init();
  }

  /**
   * Get user-specific onboarding key
   */
  private getOnboardingKey(): string {
    const userId = this.authService.user()?.id;
    if (userId) {
      return `${ONBOARDING_KEY_PREFIX}${userId}`;
    }
    // Fallback for edge cases (shouldn't happen for authenticated routes)
    return `${ONBOARDING_KEY_PREFIX}anonymous`;
  }

  /**
   * Initialize by loading status from storage
   */
  private async init(): Promise<void> {
    if (this.initialized) return;

    this.landingStatus = await this.storage.get<LandingStatus>(LANDING_KEY);
    // Onboarding status is loaded per-user in ensureInitialized
    this.initialized = true;
  }

  /**
   * Ensure service is initialized before operations
   * Also ensures onboarding status is loaded for current user
   * Syncs with server to survive cache clear
   */
  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }

    // Check if we need to load onboarding status for current user
    const currentUserId = this.authService.user()?.id;
    if (currentUserId && currentUserId !== this.onboardingStatusUserId) {
      // First, try to get from local storage
      const key = this.getOnboardingKey();
      this.onboardingStatus = await this.storage.get<OnboardingStatus>(key);
      this.onboardingStatusUserId = currentUserId;

      // If not in local storage, check server (survives cache clear)
      if (!this.onboardingStatus && !this.serverSyncAttempted) {
        this.serverSyncAttempted = true;
        try {
          const serverStatus = await firstValueFrom(
            this.api.get<{ completed: boolean; version?: string }>('/users/me/onboarding')
          );

          if (serverStatus?.completed) {
            // Server says completed, restore local status
            this.onboardingStatus = {
              completed: true,
              completedAt: '',
              version: serverStatus.version || CURRENT_VERSION,
              skipped: false,
            };
            // Save to local storage for faster access next time
            await this.storage.set(key, this.onboardingStatus);
          }
        } catch (error) {
          console.error('[ONBOARDING] Failed to sync with server:', error);
          // Continue with local-only status
        }
      }
    }
  }

  // ============================================================
  // PRE-AUTH LANDING METHODS
  // ============================================================

  /**
   * Check if the pre-auth landing should be shown
   * Returns true if user hasn't seen it or version changed
   */
  async shouldShowLanding(): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.landingStatus) {
      return true;
    }

    // Show if version changed (new landing content)
    if (this.landingStatus.version !== CURRENT_VERSION) {
      return true;
    }

    return !this.landingStatus.seen;
  }

  /**
   * Sync version for guards (uses cached value)
   */
  shouldShowLandingSync(): boolean {
    if (!this.landingStatus) {
      return true;
    }

    if (this.landingStatus.version !== CURRENT_VERSION) {
      return true;
    }

    return !this.landingStatus.seen;
  }

  /**
   * Get current landing status
   */
  async getLandingStatus(): Promise<LandingStatus> {
    await this.ensureInitialized();

    return this.landingStatus || {
      seen: false,
      seenAt: '',
      version: '',
    };
  }

  /**
   * Mark landing as seen
   * Called when user clicks any CTA on landing
   */
  async markLandingSeen(): Promise<void> {
    const status: LandingStatus = {
      seen: true,
      seenAt: new Date().toISOString(),
      version: CURRENT_VERSION,
    };
    await this.storage.set(LANDING_KEY, status);
    this.landingStatus = status;
  }

  // ============================================================
  // POST-AUTH ONBOARDING METHODS
  // ============================================================

  /**
   * Check if the post-auth onboarding should be shown
   * Returns true if user hasn't completed it or version changed
   */
  async shouldShowOnboarding(): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.onboardingStatus) {
      return true;
    }

    // Show if version changed (new onboarding content)
    if (this.onboardingStatus.version !== CURRENT_VERSION) {
      return true;
    }

    return !this.onboardingStatus.completed;
  }

  /**
   * Sync version for guards (uses cached value)
   */
  shouldShowOnboardingSync(): boolean {
    if (!this.onboardingStatus) {
      return true;
    }

    if (this.onboardingStatus.version !== CURRENT_VERSION) {
      return true;
    }

    return !this.onboardingStatus.completed;
  }

  /**
   * Get current onboarding status
   */
  async getOnboardingStatus(): Promise<OnboardingStatus> {
    await this.ensureInitialized();

    return this.onboardingStatus || {
      completed: false,
      completedAt: '',
      version: '',
      skipped: false,
    };
  }

  /**
   * Mark onboarding as completed
   * Called when user finishes or skips onboarding
   * Saves to both local storage and server
   */
  async completeOnboarding(skipped = false): Promise<void> {
    const status: OnboardingStatus = {
      completed: true,
      completedAt: new Date().toISOString(),
      version: CURRENT_VERSION,
      skipped,
    };

    // Save to local storage
    const key = this.getOnboardingKey();
    await this.storage.set(key, status);
    this.onboardingStatus = status;
    this.onboardingStatusUserId = this.authService.user()?.id || null;

    // Save to server (survives cache clear)
    try {
      await firstValueFrom(
        this.api.patch('/users/me/onboarding/complete', { version: CURRENT_VERSION })
      );
    } catch (error) {
      // Non-critical: local storage will work as fallback
      // Continue anyway - local storage will work
    }
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Reset landing status (for testing or re-showing)
   */
  async resetLanding(): Promise<void> {
    await this.storage.remove(LANDING_KEY);
    this.landingStatus = null;
  }

  /**
   * Reset onboarding status (for testing or re-showing)
   */
  async resetOnboarding(): Promise<void> {
    const key = this.getOnboardingKey();
    await this.storage.remove(key);
    this.onboardingStatus = null;
    this.onboardingStatusUserId = null;
    this.serverSyncAttempted = false;
  }

  /**
   * Reset all onboarding-related status
   */
  async resetAll(): Promise<void> {
    await this.resetLanding();
    await this.resetOnboarding();
  }

  /**
   * Get complete status for debugging/analytics
   */
  async getFullStatus(): Promise<{ landing: LandingStatus; onboarding: OnboardingStatus }> {
    return {
      landing: await this.getLandingStatus(),
      onboarding: await this.getOnboardingStatus(),
    };
  }
}
