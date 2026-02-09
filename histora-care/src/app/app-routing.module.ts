import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import {
  authGuard,
  noAuthGuard,
  nurseGuard,
  patientGuard,
  adminGuard,
  landingGuard,
  landingAccessGuard,
  postAuthOnboardingGuard,
  tutorialAccessGuard,
  patientVerificationGuard
} from './core/guards';

/**
 * ============================================================
 * APPLICATION ROUTES - HYBRID ONBOARDING FLOW
 * ============================================================
 *
 * ROUTE FLOW:
 * 1. First visit → /onboarding/landing (pre-auth, 1 slide)
 * 2. Click CTA → /auth/register or /auth/login
 * 3. After registration → /onboarding/tutorial (post-auth, 5 slides)
 * 4. Complete tutorial → /nurse/dashboard or /patient/tabs (based on role)
 *
 * RETURNING USERS:
 * - Already seen landing → Skip to /auth/login
 * - Already logged in → Skip to dashboard
 * - Already completed tutorial → Skip to dashboard
 */

const routes: Routes = [
  // ============================================================
  // DEFAULT REDIRECT
  // ============================================================
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },

  // ============================================================
  // BROWSE ROUTES (PUBLIC - No auth required)
  // View nurses without registration
  // ============================================================
  {
    path: 'browse',
    loadChildren: () => import('./browse/browse.module').then(m => m.BrowsePageModule),
  },

  // ============================================================
  // LEGAL ROUTES (PUBLIC - No auth required)
  // ============================================================
  {
    path: 'legal',
    children: [
      {
        path: 'terms',
        loadChildren: () => import('./legal/terms/terms.module').then(m => m.TermsPageModule),
      },
      {
        path: 'privacy',
        loadChildren: () => import('./legal/privacy/privacy.module').then(m => m.PrivacyPageModule),
      },
      {
        path: 'help',
        loadChildren: () => import('./legal/help/help.module').then(m => m.HelpPageModule),
      },
    ],
  },

  // ============================================================
  // SHARED ROUTES (requires auth)
  // ============================================================
  {
    path: 'notifications/settings',
    canActivate: [authGuard],
    loadChildren: () => import('./shared/notifications/notification-settings.module').then(m => m.NotificationSettingsPageModule),
  },

  // ============================================================
  // ONBOARDING ROUTES
  // ============================================================
  {
    path: 'onboarding',
    children: [
      // Pre-auth landing (1 slide)
      {
        path: 'landing',
        canActivate: [landingAccessGuard],
        loadChildren: () => import('./onboarding/landing/landing.module').then(m => m.LandingPageModule),
      },
      // Post-auth tutorial (5 slides)
      {
        path: 'tutorial',
        canActivate: [tutorialAccessGuard],
        loadChildren: () => import('./onboarding/tutorial/tutorial.module').then(m => m.TutorialPageModule),
      },
      {
        path: '',
        redirectTo: 'landing',
        pathMatch: 'full',
      },
    ],
  },

  // ============================================================
  // AUTH ROUTES (requires landing to be seen)
  // ============================================================
  {
    path: 'auth',
    canActivate: [landingGuard, noAuthGuard],
    children: [
      {
        path: 'login',
        loadChildren: () => import('./auth/login/login.module').then(m => m.LoginPageModule),
      },
      {
        path: 'register',
        loadChildren: () => import('./auth/register/register.module').then(m => m.RegisterPageModule),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },

  // Google OAuth callback (no auth guard - handles auth tokens from Google)
  {
    path: 'auth/google/callback',
    loadChildren: () => import('./auth/google-callback/google-callback.module').then(m => m.GoogleCallbackPageModule),
  },

  // Password reset (no auth guard - accessed via email link)
  {
    path: 'auth/reset-password',
    loadChildren: () => import('./auth/reset-password/reset-password.module').then(m => m.ResetPasswordPageModule),
  },

  // Forgot password with OTP (no auth guard - public page)
  {
    path: 'auth/forgot-password',
    loadChildren: () => import('./auth/forgot-password/forgot-password.module').then(m => m.ForgotPasswordPageModule),
  },

  // Session expired (no auth guard - shown after session timeout)
  {
    path: 'auth/session-expired',
    loadChildren: () => import('./auth/session-expired/session-expired.module').then(m => m.SessionExpiredPageModule),
  },

  // Complete registration (requires auth but no specific role - for new Google users)
  {
    path: 'auth/complete-registration',
    canActivate: [authGuard],
    loadChildren: () => import('./auth/complete-registration/complete-registration.module').then(m => m.CompleteRegistrationPageModule),
  },

  // ============================================================
  // NURSE ROUTES (requires auth + tutorial + nurse role)
  // ============================================================
  {
    path: 'nurse',
    canActivate: [authGuard, postAuthOnboardingGuard, nurseGuard],
    children: [
      {
        path: 'onboarding',
        loadChildren: () => import('./nurse/onboarding/onboarding.module').then(m => m.OnboardingPageModule),
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./nurse/dashboard/dashboard.module').then(m => m.DashboardPageModule),
      },
      {
        path: 'profile',
        loadChildren: () => import('./nurse/profile/profile.module').then(m => m.ProfilePageModule),
      },
      {
        path: 'services',
        loadChildren: () => import('./nurse/services/services.module').then(m => m.ServicesPageModule),
      },
      {
        path: 'requests',
        loadChildren: () => import('./nurse/requests/requests.module').then(m => m.RequestsPageModule),
      },
      {
        path: 'earnings',
        loadChildren: () => import('./nurse/earnings/earnings.module').then(m => m.EarningsPageModule),
      },
      {
        path: 'verification',
        loadChildren: () => import('./nurse/verification/verification.module').then(m => m.VerificationPageModule),
      },
      {
        path: 'subscription',
        loadChildren: () => import('./nurse/subscription/subscription.module').then(m => m.SubscriptionPageModule),
      },
      {
        path: 'reviews',
        loadChildren: () => import('./nurse/reviews/reviews.module').then(m => m.ReviewsPageModule),
      },
      {
        path: 'active-service/:requestId',
        loadChildren: () => import('./nurse/active-service/active-service.module').then(m => m.ActiveServicePageModule),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // ============================================================
  // ADMIN ROUTES (requires auth + tutorial + admin role)
  // ============================================================
  {
    path: 'admin',
    canActivate: [authGuard, postAuthOnboardingGuard, adminGuard],
    children: [
      {
        path: 'verifications',
        loadChildren: () => import('./admin/verifications/verifications.module').then(m => m.VerificationsPageModule),
      },
      {
        path: '',
        redirectTo: 'verifications',
        pathMatch: 'full',
      },
    ],
  },

  // ============================================================
  // PATIENT ROUTES (requires auth + tutorial + patient role)
  // ============================================================
  {
    path: 'patient',
    canActivate: [authGuard, postAuthOnboardingGuard, patientGuard],
    children: [
      // Tabs layout (main navigation)
      {
        path: 'tabs',
        loadChildren: () => import('./patient/tabs/tabs.module').then(m => m.TabsPageModule),
      },
      // Standalone pages (outside tabs)
      {
        path: 'verification',
        loadChildren: () => import('./patient/verification/verification.module').then(m => m.VerificationPageModule),
      },
      {
        path: 'search',
        loadChildren: () => import('./patient/search/search.module').then(m => m.SearchPageModule),
      },
      {
        path: 'request',
        canActivate: [patientVerificationGuard],
        loadChildren: () => import('./patient/request/request.module').then(m => m.RequestPageModule),
      },
      {
        path: 'checkout/:requestId',
        canActivate: [patientVerificationGuard],
        loadChildren: () => import('./patient/checkout/checkout.module').then(m => m.CheckoutPageModule),
      },
      {
        path: 'tracking/:requestId',
        loadChildren: () => import('./patient/tracking/tracking.module').then(m => m.TrackingPageModule),
      },
      // Legacy redirects (for old bookmarks/cache)
      {
        path: 'map',
        redirectTo: 'tabs/map',
        pathMatch: 'full',
      },
      {
        path: 'home',
        redirectTo: 'tabs/home',
        pathMatch: 'full',
      },
      {
        path: 'history',
        redirectTo: 'tabs/history',
        pathMatch: 'full',
      },
      {
        path: 'settings',
        redirectTo: 'tabs/settings',
        pathMatch: 'full',
      },
      // Default redirect to tabs
      {
        path: '',
        redirectTo: 'tabs',
        pathMatch: 'full',
      },
    ],
  },

  // ============================================================
  // FALLBACK
  // ============================================================
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
