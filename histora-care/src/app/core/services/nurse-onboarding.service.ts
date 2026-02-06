import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface NurseOnboardingState {
  completedAt: string | null;
  currentStep: number;
  skippedSetup: boolean;
  checklistItems: {
    paymentMethods: boolean;
    services: boolean;
    availability: boolean;
    bio: boolean;
  };
}

interface OnboardingStatusResponse {
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  onboardingVersion?: string;
}

const ONBOARDING_VERSION = '1.0.0';
const DEFAULT_STATE: NurseOnboardingState = {
  completedAt: null,
  currentStep: 0,
  skippedSetup: false,
  checklistItems: {
    paymentMethods: false,
    services: false,
    availability: false,
    bio: false,
  },
};

@Injectable({
  providedIn: 'root',
})
export class NurseOnboardingService {
  private api = inject(ApiService);
  private state = signal<NurseOnboardingState>(DEFAULT_STATE);
  private initialized = false;

  // Computed values
  isCompleted = computed(() => !!this.state().completedAt);
  currentStep = computed(() => this.state().currentStep);
  checklistItems = computed(() => this.state().checklistItems);

  checklistProgress = computed(() => {
    const items = this.state().checklistItems;
    const completed = Object.values(items).filter(Boolean).length;
    const total = Object.keys(items).length;
    return Math.round((completed / total) * 100);
  });

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load onboarding status from backend
      const response = await firstValueFrom(
        this.api.get<OnboardingStatusResponse>('/users/me/onboarding')
      );

      if (response?.onboardingCompleted) {
        this.state.set({
          ...DEFAULT_STATE,
          completedAt: response.onboardingCompletedAt || new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Error loading nurse onboarding state from API:', e);
      // On error, assume not completed (will show onboarding)
    }

    this.initialized = true;
  }

  async completeOnboarding(): Promise<void> {
    try {
      // Save to backend
      await firstValueFrom(
        this.api.patch<{ success: boolean }>('/users/me/onboarding/complete', {
          version: ONBOARDING_VERSION,
        })
      );

      const newState: NurseOnboardingState = {
        ...this.state(),
        completedAt: new Date().toISOString(),
      };
      this.state.set(newState);
    } catch (e) {
      console.error('Error saving onboarding completion to API:', e);
      throw e;
    }
  }

  async setCurrentStep(step: number): Promise<void> {
    const newState: NurseOnboardingState = {
      ...this.state(),
      currentStep: step,
    };
    this.state.set(newState);
    // Note: currentStep is not persisted to backend, only locally during session
  }

  async markSkippedSetup(): Promise<void> {
    const newState: NurseOnboardingState = {
      ...this.state(),
      skippedSetup: true,
    };
    this.state.set(newState);
    // Note: skippedSetup is not persisted to backend
  }

  async updateChecklistItem(
    item: keyof NurseOnboardingState['checklistItems'],
    value: boolean
  ): Promise<void> {
    const newState: NurseOnboardingState = {
      ...this.state(),
      checklistItems: {
        ...this.state().checklistItems,
        [item]: value,
      },
    };
    this.state.set(newState);
    // Note: checklist items are not persisted to backend
  }

  async resetOnboarding(): Promise<void> {
    this.state.set(DEFAULT_STATE);
    this.initialized = false;
    // Note: This only resets local state, backend state remains
    // To reset backend state, a new endpoint would be needed
  }

  getState(): NurseOnboardingState {
    return this.state();
  }
}
