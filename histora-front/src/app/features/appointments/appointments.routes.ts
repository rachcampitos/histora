import { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./appointments-list/appointments-list.page').then((m) => m.AppointmentsListPage),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./appointment-form/appointment-form.page').then((m) => m.AppointmentFormPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./appointment-detail/appointment-detail.page').then((m) => m.AppointmentDetailPage),
  },
];
