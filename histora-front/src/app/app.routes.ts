import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards';
import { clinicStaffGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./layouts/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        title: 'Iniciar Sesión',
        loadComponent: () =>
          import('./features/auth/login/login.page').then((m) => m.LoginPage),
      },
      {
        path: 'register',
        title: 'Crear Cuenta',
        loadComponent: () =>
          import('./features/auth/register/register.page').then((m) => m.RegisterPage),
      },
      {
        path: 'forgot-password',
        title: 'Recuperar Contraseña',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.page').then(
            (m) => m.ForgotPasswordPage
          ),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard, clinicStaffGuard],
    loadComponent: () =>
      import('./layouts/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'patients',
        loadChildren: () =>
          import('./features/patients/patients.routes').then((m) => m.PATIENTS_ROUTES),
      },
      {
        path: 'appointments',
        loadChildren: () =>
          import('./features/appointments/appointments.routes').then(
            (m) => m.APPOINTMENTS_ROUTES
          ),
      },
      {
        path: 'consultations',
        loadChildren: () =>
          import('./features/consultations/consultations.routes').then(
            (m) => m.CONSULTATIONS_ROUTES
          ),
      },
      {
        path: 'clinical-history',
        loadChildren: () =>
          import('./features/clinical-history/clinical-history.routes').then(
            (m) => m.CLINICAL_HISTORY_ROUTES
          ),
      },
      {
        path: 'settings',
        title: 'Configuración',
        loadComponent: () =>
          import('./features/settings/settings.page').then((m) => m.SettingsPage),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
