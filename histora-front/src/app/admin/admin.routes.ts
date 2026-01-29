import { Route } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { ReportsComponent } from './reports/reports.component';
import { SettingsComponent } from './settings/settings.component';
import { NurseVerificationsComponent } from './nurse-verifications/nurse-verifications.component';
import { NursesComponent } from './nurses/nurses.component';
import { PatientsComponent } from './patients/patients.component';
import { ModerationComponent } from './moderation/moderation.component';
import { Page404Component } from '../authentication/page404/page404.component';

export const ADMIN_ROUTE: Route[] = [
  // Dashboard principal - Centro de control
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  // Gestión de enfermeras
  {
    path: 'nurses',
    component: NursesComponent,
  },
  {
    path: 'nurse-verifications',
    component: NurseVerificationsComponent,
  },
  // Gestión de pacientes
  {
    path: 'patients',
    component: PatientsComponent,
  },
  // Moderación y usuarios en riesgo
  {
    path: 'moderation',
    component: ModerationComponent,
  },
  // Usuarios admin y roles
  {
    path: 'users',
    component: UsersComponent,
  },
  // Finanzas y suscripciones
  {
    path: 'subscriptions',
    component: SubscriptionsComponent,
  },
  // Reportes y analytics
  {
    path: 'reports',
    component: ReportsComponent,
  },
  // Configuración del sistema
  {
    path: 'settings',
    component: SettingsComponent,
  },
  // Redirect root to dashboard
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  { path: '**', component: Page404Component },
];
