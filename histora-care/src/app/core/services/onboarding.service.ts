import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

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

const LANDING_KEY = 'histora_care_landing_status';
const ONBOARDING_KEY = 'histora_care_onboarding_status';
const CURRENT_VERSION = '1.0';

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
  // Cache for sync access (loaded on init)
  private landingStatus: LandingStatus | null = null;
  private onboardingStatus: OnboardingStatus | null = null;
  private initialized = false;

  constructor(private storage: StorageService) {
    this.init();
  }

  /**
   * Initialize by loading status from storage
   */
  private async init(): Promise<void> {
    if (this.initialized) return;

    this.landingStatus = await this.storage.get<LandingStatus>(LANDING_KEY);
    this.onboardingStatus = await this.storage.get<OnboardingStatus>(ONBOARDING_KEY);
    this.initialized = true;
  }

  /**
   * Ensure service is initialized before operations
   */
  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
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
   */
  async completeOnboarding(skipped = false): Promise<void> {
    const status: OnboardingStatus = {
      completed: true,
      completedAt: new Date().toISOString(),
      version: CURRENT_VERSION,
      skipped,
    };
    await this.storage.set(ONBOARDING_KEY, status);
    this.onboardingStatus = status;
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
    await this.storage.remove(ONBOARDING_KEY);
    this.onboardingStatus = null;
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
