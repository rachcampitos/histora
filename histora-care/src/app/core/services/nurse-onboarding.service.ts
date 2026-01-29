import { Injectable, signal, computed } from '@angular/core';

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

const STORAGE_KEY = 'nurselite_nurse_onboarding';
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
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.state.set({ ...DEFAULT_STATE, ...parsed });
      }
    } catch (e) {
      console.error('Error loading nurse onboarding state:', e);
    }

    this.initialized = true;
  }

  async completeOnboarding(): Promise<void> {
    const newState: NurseOnboardingState = {
      ...this.state(),
      completedAt: new Date().toISOString(),
    };
    this.state.set(newState);
    this.saveState(newState);
  }

  async setCurrentStep(step: number): Promise<void> {
    const newState: NurseOnboardingState = {
      ...this.state(),
      currentStep: step,
    };
    this.state.set(newState);
    this.saveState(newState);
  }

  async markSkippedSetup(): Promise<void> {
    const newState: NurseOnboardingState = {
      ...this.state(),
      skippedSetup: true,
    };
    this.state.set(newState);
    this.saveState(newState);
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
    this.saveState(newState);
  }

  async resetOnboarding(): Promise<void> {
    this.state.set(DEFAULT_STATE);
    localStorage.removeItem(STORAGE_KEY);
    this.initialized = false;
  }

  getState(): NurseOnboardingState {
    return this.state();
  }

  private saveState(state: NurseOnboardingState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving nurse onboarding state:', e);
    }
  }
}
