import { Route } from '@angular/router';
import { MainLayoutComponent } from './layout/app-layout/main-layout/main-layout.component';
import { AuthGuard } from '@core/guard/auth.guard';
import { AuthLayoutComponent } from './layout/app-layout/auth-layout/auth-layout.component';
import { Page404Component } from './authentication/page404/page404.component';
import { Role } from '@core';

export const APP_ROUTE: Route[] = [
  // Histora Care Admin - Dashboard principal
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'admin/dashboard',
      },
      {
        path: 'admin',
        canActivate: [AuthGuard],
        data: {
          role: [Role.PlatformAdmin, Role.PlatformAdminUI],
        },
        loadChildren: () =>
          import('./admin/admin.routes').then((m) => m.ADMIN_ROUTE),
      },
    ],
  },

  // Google Auth Callbacks
  {
    path: 'auth/google/callback',
    loadComponent: () =>
      import('./auth/google-callback/google-callback.component').then(
        (m) => m.GoogleCallbackComponent
      ),
  },
  {
    path: 'auth/google/select-type',
    loadComponent: () =>
      import('./auth/google-select-type/google-select-type.component').then(
        (m) => m.GoogleSelectTypeComponent
      ),
  },

  // Authentication
  {
    path: 'authentication',
    component: AuthLayoutComponent,
    loadChildren: () =>
      import('./authentication/auth.routes').then((m) => m.AUTH_ROUTE),
  },

  // Fallback
  { path: '**', component: Page404Component },
];
