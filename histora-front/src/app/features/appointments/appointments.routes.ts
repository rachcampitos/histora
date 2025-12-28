import { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Citas',
    loadComponent: () =>
      import('./appointments-list/appointments-list.page').then((m) => m.AppointmentsListPage),
  },
  {
    path: 'new',
    title: 'Nueva Cita',
    loadComponent: () =>
      import('./appointment-form/appointment-form.page').then((m) => m.AppointmentFormPage),
  },
  {
    path: ':id',
    title: 'Detalle de la Cita',
    loadComponent: () =>
      import('./appointment-detail/appointment-detail.page').then((m) => m.AppointmentDetailPage),
  },
];
