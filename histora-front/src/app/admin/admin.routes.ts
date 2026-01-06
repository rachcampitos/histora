import { Route } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ClinicsComponent } from './clinics/clinics.component';
import { UsersComponent } from './users/users.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { ReportsComponent } from './reports/reports.component';
import { SettingsComponent } from './settings/settings.component';
import { Page404Component } from '../authentication/page404/page404.component';

export const ADMIN_ROUTE: Route[] = [
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'clinics',
    component: ClinicsComponent,
  },
  {
    path: 'users',
    component: UsersComponent,
  },
  {
    path: 'subscriptions',
    component: SubscriptionsComponent,
  },
  {
    path: 'reports',
    component: ReportsComponent,
  },
  {
    path: 'settings',
    component: SettingsComponent,
  },
  { path: '**', component: Page404Component },
];
