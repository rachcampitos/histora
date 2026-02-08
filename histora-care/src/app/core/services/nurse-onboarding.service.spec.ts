import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { createMockApiService } from '../../../testing';
import { of, throwError } from 'rxjs';
import { NurseOnboardingService } from './nurse-onboarding.service';

const STORAGE_KEY = 'nurselite-nurse-onboarding';

describe('NurseOnboardingService', () => {
  let service: NurseOnboardingService;
  let mockApi: ReturnType<typeof createMockApiService>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockApi = createMockApiService();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NurseOnboardingService,
        { provide: ApiService, useValue: mockApi },
      ],
    });

    service = TestBed.inject(NurseOnboardingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= Constructor / localStorage =============

  describe('loadFromLocalStorage', () => {
    it('should load completed state from localStorage', () => {
      const cachedState = {
        completedAt: '2026-01-15T00:00:00.000Z',
        currentStep: 0,
        skippedSetup: false,
        checklistItems: {
          paymentMethods: false,
          services: false,
          availability: false,
          bio: false,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));

      // Call private method directly to test localStorage loading behavior
      (service as any).loadFromLocalStorage();

      expect(service.isCompleted()).toBe(true);
    });

    it('should not load state from localStorage when completedAt is null', () => {
      const cachedState = {
        completedAt: null,
        currentStep: 3,
        skippedSetup: true,
        checklistItems: {
          paymentMethods: true,
          services: true,
          availability: false,
          bio: false,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));

      // Call private method directly
      (service as any).loadFromLocalStorage();

      // Should keep default state since completedAt is null
      expect(service.isCompleted()).toBe(false);
      expect(service.currentStep()).toBe(0);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'not-valid-json');

      // Should not throw
      expect(() => (service as any).loadFromLocalStorage()).not.toThrow();
      expect(service.isCompleted()).toBe(false);
    });
  });

  // ============= Computed signals =============

  describe('computed signals', () => {
    it('isCompleted should be false by default', () => {
      expect(service.isCompleted()).toBe(false);
    });

    it('currentStep should be 0 by default', () => {
      expect(service.currentStep()).toBe(0);
    });

    it('checklistItems should all be false by default', () => {
      const items = service.checklistItems();
      expect(items.paymentMethods).toBe(false);
      expect(items.services).toBe(false);
      expect(items.availability).toBe(false);
      expect(items.bio).toBe(false);
    });

    it('checklistProgress should be 0 by default', () => {
      expect(service.checklistProgress()).toBe(0);
    });

    it('checklistProgress should be 50 when 2 of 4 items are true', async () => {
      await service.updateChecklistItem('paymentMethods', true);
      await service.updateChecklistItem('services', true);

      expect(service.checklistProgress()).toBe(50);
    });

    it('checklistProgress should be 100 when all items are true', async () => {
      await service.updateChecklistItem('paymentMethods', true);
      await service.updateChecklistItem('services', true);
      await service.updateChecklistItem('availability', true);
      await service.updateChecklistItem('bio', true);

      expect(service.checklistProgress()).toBe(100);
    });
  });

  // ============= init =============

  describe('init', () => {
    it('should call GET /users/me/onboarding and set completed state', async () => {
      mockApi.get.mockReturnValue(of({
        onboardingCompleted: true,
        onboardingCompletedAt: '2026-01-20T10:00:00.000Z',
      }));

      await service.init();

      expect(mockApi.get).toHaveBeenCalledWith('/users/me/onboarding');
      expect(service.isCompleted()).toBe(true);
    });

    it('should save to localStorage when onboarding is completed', async () => {
      mockApi.get.mockReturnValue(of({
        onboardingCompleted: true,
        onboardingCompletedAt: '2026-01-20T10:00:00.000Z',
      }));

      await service.init();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.any(String)
      );
    });

    it('should not change state when onboarding is not completed', async () => {
      mockApi.get.mockReturnValue(of({ onboardingCompleted: false }));

      await service.init();

      expect(service.isCompleted()).toBe(false);
    });

    it('should only initialize once (skip second call)', async () => {
      mockApi.get.mockReturnValue(of({ onboardingCompleted: false }));

      await service.init();
      await service.init();

      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it('should keep cached state on API error', async () => {
      mockApi.get.mockReturnValue(throwError(() => new Error('Network error')));

      await service.init();

      // Should not throw, should keep default state
      expect(service.isCompleted()).toBe(false);
    });
  });

  // ============= completeOnboarding =============

  describe('completeOnboarding', () => {
    it('should PATCH /users/me/onboarding/complete and mark as completed', async () => {
      mockApi.patch.mockReturnValue(of({ success: true }));

      await service.completeOnboarding();

      expect(mockApi.patch).toHaveBeenCalledWith('/users/me/onboarding/complete', {
        version: '1.0.0',
      });
      expect(service.isCompleted()).toBe(true);
    });

    it('should throw on API error', async () => {
      mockApi.patch.mockReturnValue(throwError(() => new Error('Server error')));

      await expect(service.completeOnboarding()).rejects.toThrow('Server error');
    });
  });

  // ============= Local-only methods =============

  describe('setCurrentStep', () => {
    it('should update current step signal', async () => {
      await service.setCurrentStep(3);
      expect(service.currentStep()).toBe(3);
    });
  });

  describe('markSkippedSetup', () => {
    it('should set skippedSetup in state', async () => {
      await service.markSkippedSetup();
      const state = service.getState();
      expect(state.skippedSetup).toBe(true);
    });
  });

  describe('updateChecklistItem', () => {
    it('should update a single checklist item', async () => {
      await service.updateChecklistItem('bio', true);
      expect(service.checklistItems().bio).toBe(true);
      expect(service.checklistItems().paymentMethods).toBe(false);
    });
  });

  describe('resetOnboarding', () => {
    it('should reset state to default and clear localStorage', async () => {
      // Set some state first
      await service.setCurrentStep(2);
      await service.updateChecklistItem('bio', true);

      await service.resetOnboarding();

      expect(service.isCompleted()).toBe(false);
      expect(service.currentStep()).toBe(0);
      expect(service.checklistItems().bio).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });
  });

  describe('getState', () => {
    it('should return current state object', () => {
      const state = service.getState();
      expect(state).toEqual({
        completedAt: null,
        currentStep: 0,
        skippedSetup: false,
        checklistItems: {
          paymentMethods: false,
          services: false,
          availability: false,
          bio: false,
        },
      });
    });
  });
});
