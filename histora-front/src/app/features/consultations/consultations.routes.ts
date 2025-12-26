import { Routes } from '@angular/router';

export const CONSULTATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./consultations-list/consultations-list.page').then((m) => m.ConsultationsListPage),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./consultation-form/consultation-form.page').then((m) => m.ConsultationFormPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./consultation-detail/consultation-detail.page').then((m) => m.ConsultationDetailPage),
  },
];
