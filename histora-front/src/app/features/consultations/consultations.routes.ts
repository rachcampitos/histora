import { Routes } from '@angular/router';

export const CONSULTATIONS_ROUTES: Routes = [
  {
    path: '',
    title: 'Consultas',
    loadComponent: () =>
      import('./consultations-list/consultations-list.page').then((m) => m.ConsultationsListPage),
  },
  {
    path: 'new',
    title: 'Nueva Consulta',
    loadComponent: () =>
      import('./consultation-form/consultation-form.page').then((m) => m.ConsultationFormPage),
  },
  {
    path: ':id',
    title: 'Detalle de Consulta',
    loadComponent: () =>
      import('./consultation-detail/consultation-detail.page').then((m) => m.ConsultationDetailPage),
  },
  {
    path: ':id/edit',
    title: 'Editar Consulta',
    loadComponent: () =>
      import('./consultation-form/consultation-form.page').then((m) => m.ConsultationFormPage),
  },
];
