import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';
import { AuthService } from '../services/auth.service';

/**
 * ============================================================
 * HYBRID ONBOARDING GUARDS
 * ============================================================
 *
 * This file implements guards for the "Progressive Trust Model":
 *
 * FLOW:
 * 1. First app open → Landing (pre-auth, 1 slide)
 * 2. User clicks "Comenzar" → Signup/Login
 * 3. After registration → Tutorial (post-auth, 5 slides)
 * 4. After login → Dashboard (skip onboarding for existing users)
 *
 * WHY HYBRID?
 * - Pre-auth slides >3 reduce conversion by 15-25%
 * - Users are more receptive after commitment (registration)
 * - Security education is better absorbed by verified users
 */

// ============================================================
// PRE-AUTH LANDING GUARDS
// ============================================================

/**
 * Guard that redirects to landing page if user hasn't seen it
 * Use on authentication routes to show landing before login/register
 */
export const landingGuard: CanActivateFn = async () => {
  const onboardingService = inject(OnboardingService);
  const router = inject(Router);

  await onboardingService.ensureInitialized();

  if (await onboardingService.shouldShowLanding()) {
    router.navigate(['/onboarding/landing']);
    return false;
  }

  return true;
};

/**
 * Guard that prevents accessing landing if already seen
 * Use on the landing route itself
 */
export const landingAccessGuard: CanActivateFn = async () => {
  const onboardingService = inject(OnboardingService);
  const router = inject(Router);

  await onboardingService.ensureInitialized();

  // If already seen, redirect to auth
  if (!(await onboardingService.shouldShowLanding())) {
    router.navigate(['/auth/login']);
    return false;
  }

  return true;
};

// ============================================================
// POST-AUTH ONBOARDING GUARDS
// ============================================================

/**
 * Guard that redirects to tutorial if user hasn't completed it
 * Use on main app routes AFTER authentication
 *
 * IMPORTANT: This guard should be used AFTER authGuard
 * It checks if the authenticated user needs to complete onboarding
 */
export const postAuthOnboardingGuard: CanActivateFn = async () => {
  const onboardingService = inject(OnboardingService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to initialize
  while (authService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  await onboardingService.ensureInitialized();

  // Only show tutorial if user is authenticated AND hasn't completed it
  if (authService.isAuthenticated() && await onboardingService.shouldShowOnboarding()) {
    router.navigate(['/onboarding/tutorial']);
    return false;
  }

  return true;
};

/**
 * Guard that prevents accessing tutorial if already completed
 * Also ensures user is authenticated before showing tutorial
 */
export const tutorialAccessGuard: CanActivateFn = async () => {
  const onboardingService = inject(OnboardingService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to initialize
  while (authService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  await onboardingService.ensureInitialized();

  // If not authenticated, redirect to landing/auth
  if (!authService.isAuthenticated()) {
    if (await onboardingService.shouldShowLanding()) {
      router.navigate(['/onboarding/landing']);
    } else {
      router.navigate(['/auth/login']);
    }
    return false;
  }

  // If already completed, redirect to dashboard based on role
  if (!(await onboardingService.shouldShowOnboarding())) {
    if (authService.isAdmin()) {
      router.navigate(['/admin/verifications']);
    } else if (authService.isNurse()) {
      router.navigate(['/nurse/dashboard']);
    } else {
      router.navigate(['/patient/tabs/home']);
    }
    return false;
  }

  return true;
};
