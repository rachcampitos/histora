import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard, noAuthGuard, nurseGuard, patientGuard } from './core/guards';

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
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // Patient routes
  {
    path: 'patient',
    canActivate: [authGuard, patientGuard],
    children: [
      {
        path: 'map',
        loadChildren: () => import('./patient/map/map.module').then(m => m.MapPageModule),
      },
      {
        path: 'search',
        loadChildren: () => import('./patient/search/search.module').then(m => m.SearchPageModule),
      },
      {
        path: 'request/:nurseId',
        loadChildren: () => import('./patient/request/request.module').then(m => m.RequestPageModule),
      },
      {
        path: 'tracking/:requestId',
        loadChildren: () => import('./patient/tracking/tracking.module').then(m => m.TrackingPageModule),
      },
      {
        path: 'history',
        loadChildren: () => import('./patient/history/history.module').then(m => m.HistoryPageModule),
      },
      {
        path: '',
        redirectTo: 'map',
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
