import { Routes } from '@angular/router';

export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Pacientes',
    loadComponent: () =>
      import('./patients-list/patients-list.page').then((m) => m.PatientsListPage),
  },
  {
    path: 'new',
    title: 'Nuevo Paciente',
    loadComponent: () =>
      import('./patient-form/patient-form.page').then((m) => m.PatientFormPage),
  },
  {
    path: ':id',
    title: 'Detalle del Paciente',
    loadComponent: () =>
      import('./patient-detail/patient-detail.page').then((m) => m.PatientDetailPage),
  },
  {
    path: ':id/edit',
    title: 'Editar Paciente',
    loadComponent: () =>
      import('./patient-form/patient-form.page').then((m) => m.PatientFormPage),
  },
];
