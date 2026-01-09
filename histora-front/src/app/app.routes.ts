import { Route } from '@angular/router';
import { MainLayoutComponent } from './layout/app-layout/main-layout/main-layout.component';
import { AuthGuard } from '@core/guard/auth.guard';
import { AuthLayoutComponent } from './layout/app-layout/auth-layout/auth-layout.component';
import { Page404Component } from './authentication/page404/page404.component';
import { Role } from '@core';
import { roleRedirectGuard } from '@core/guard/role-redirect.guard';

export const APP_ROUTE: Route[] = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [roleRedirectGuard],
        // Empty component - guard handles redirect
        children: [],
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
      {
        path: 'doctor',
        canActivate: [AuthGuard],
        data: {
          role: [Role.Admin, Role.Doctor],
        },
        loadChildren: () =>
          import('./doctor/doctor.routes').then((m) => m.DOCTOR_ROUTE),
      },
      {
        path: 'patient',
        canActivate: [AuthGuard],
        data: {
          role: [Role.Admin, Role.Patient],
        },
        loadChildren: () =>
          import('./patient/patient.routes').then((m) => m.PATIENT_ROUTE),
      },
    ],
  },
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
  {
    path: 'authentication',
    component: AuthLayoutComponent,
    loadChildren: () =>
      import('./authentication/auth.routes').then((m) => m.AUTH_ROUTE),
  },
  { path: '**', component: Page404Component },
];
