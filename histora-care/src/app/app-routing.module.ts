import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard, noAuthGuard, nurseGuard, patientGuard, adminGuard } from './core/guards';

const routes: Routes = [
  // Default redirect
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },

  // Auth routes (no auth required)
  {
    path: 'auth',
    canActivate: [noAuthGuard],
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

  // Complete registration (requires auth but no specific role - for new Google users)
  {
    path: 'auth/complete-registration',
    canActivate: [authGuard],
    loadChildren: () => import('./auth/complete-registration/complete-registration.module').then(m => m.CompleteRegistrationPageModule),
  },

  // Nurse routes
  {
    path: 'nurse',
    canActivate: [authGuard, nurseGuard],
    children: [
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
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
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

  // Patient routes with tabs
  {
    path: 'patient',
    canActivate: [authGuard, patientGuard],
    children: [
      // Tabs layout (main navigation)
      {
        path: 'tabs',
        loadChildren: () => import('./patient/tabs/tabs.module').then(m => m.TabsPageModule),
      },
      // Standalone pages (outside tabs)
      {
        path: 'search',
        loadChildren: () => import('./patient/search/search.module').then(m => m.SearchPageModule),
      },
      {
        path: 'request',
        loadChildren: () => import('./patient/request/request.module').then(m => m.RequestPageModule),
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

  // Fallback
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
