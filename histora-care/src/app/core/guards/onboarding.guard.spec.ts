import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { OnboardingService } from '../services/onboarding.service';
import {
  landingGuard,
  landingAccessGuard,
  postAuthOnboardingGuard,
  tutorialAccessGuard,
} from './onboarding.guard';
import {
  createMockAuthService,
  createMockRouter,
  createMockOnboardingService,
} from '../../../testing';

describe('Onboarding Guards', () => {
  let mockAuth: ReturnType<typeof createMockAuthService>;
  let mockRouter: ReturnType<typeof createMockRouter>;
  let mockOnboarding: ReturnType<typeof createMockOnboardingService>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth = createMockAuthService();
    mockRouter = createMockRouter();
    mockOnboarding = createMockOnboardingService();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
        { provide: OnboardingService, useValue: mockOnboarding },
      ],
    });
  });

  function runGuard(guard: any) {
    return TestBed.runInInjectionContext(() =>
      guard({} as any, {} as any)
    );
  }

  // ============= landingGuard =============

  describe('landingGuard', () => {
    it('should redirect to landing when not seen', async () => {
      mockOnboarding.shouldShowLanding.mockResolvedValue(true);
      const result = await runGuard(landingGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/onboarding/landing']);
    });

    it('should allow access when landing already seen', async () => {
      mockOnboarding.shouldShowLanding.mockResolvedValue(false);
      const result = await runGuard(landingGuard);
      expect(result).toBe(true);
    });

    it('should call ensureInitialized', async () => {
      mockOnboarding.shouldShowLanding.mockResolvedValue(false);
      await runGuard(landingGuard);
      expect(mockOnboarding.ensureInitialized).toHaveBeenCalled();
    });
  });

  // ============= landingAccessGuard =============

  describe('landingAccessGuard', () => {
    it('should allow access when landing not yet seen', async () => {
      mockOnboarding.shouldShowLanding.mockResolvedValue(true);
      const result = await runGuard(landingAccessGuard);
      expect(result).toBe(true);
    });

    it('should redirect to login when landing already seen', async () => {
      mockOnboarding.shouldShowLanding.mockResolvedValue(false);
      const result = await runGuard(landingAccessGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  // ============= postAuthOnboardingGuard =============

  describe('postAuthOnboardingGuard', () => {
    it('should allow nurses (they skip general tutorial)', async () => {
      mockAuth._setUser({ _id: '1', role: 'nurse' });
      const result = await runGuard(postAuthOnboardingGuard);
      expect(result).toBe(true);
    });

    it('should redirect patient to tutorial when not completed', async () => {
      mockAuth._setUser({ _id: '1', role: 'patient' });
      mockOnboarding.shouldShowOnboarding.mockResolvedValue(true);
      const result = await runGuard(postAuthOnboardingGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/onboarding/tutorial']);
    });

    it('should allow patient when tutorial completed', async () => {
      mockAuth._setUser({ _id: '1', role: 'patient' });
      mockOnboarding.shouldShowOnboarding.mockResolvedValue(false);
      const result = await runGuard(postAuthOnboardingGuard);
      expect(result).toBe(true);
    });

    it('should allow unauthenticated user (no tutorial needed)', async () => {
      mockOnboarding.shouldShowOnboarding.mockResolvedValue(false);
      const result = await runGuard(postAuthOnboardingGuard);
      expect(result).toBe(true);
    });
  });

  // ============= tutorialAccessGuard =============

  describe('tutorialAccessGuard', () => {
    it('should redirect unauthenticated to landing if not seen', async () => {
      mockOnboarding.shouldShowLanding.mockResolvedValue(true);
      const result = await runGuard(tutorialAccessGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/onboarding/landing']);
    });

    it('should redirect unauthenticated to login if landing seen', async () => {
      mockOnboarding.shouldShowLanding.mockResolvedValue(false);
      const result = await runGuard(tutorialAccessGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should redirect nurse to nurse onboarding', async () => {
      mockAuth._setUser({ _id: '1', role: 'nurse' });
      const result = await runGuard(tutorialAccessGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/nurse/onboarding']);
    });

    it('should redirect patient to home when tutorial already completed', async () => {
      mockAuth._setUser({ _id: '1', role: 'patient' });
      mockOnboarding.shouldShowOnboarding.mockResolvedValue(false);
      const result = await runGuard(tutorialAccessGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/patient/tabs/home']);
    });

    it('should redirect admin to admin verifications when completed', async () => {
      mockAuth._setUser({ _id: '1', role: 'platform_admin' });
      mockOnboarding.shouldShowOnboarding.mockResolvedValue(false);
      const result = await runGuard(tutorialAccessGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/verifications']);
    });

    it('should allow patient when tutorial not yet completed', async () => {
      mockAuth._setUser({ _id: '1', role: 'patient' });
      mockOnboarding.shouldShowOnboarding.mockResolvedValue(true);
      const result = await runGuard(tutorialAccessGuard);
      expect(result).toBe(true);
    });
  });
});
