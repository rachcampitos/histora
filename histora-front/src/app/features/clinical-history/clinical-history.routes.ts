import { Routes } from '@angular/router';

export const CLINICAL_HISTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./clinical-history-list/clinical-history-list.page').then((m) => m.ClinicalHistoryListPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./clinical-history-detail/clinical-history-detail.page').then((m) => m.ClinicalHistoryDetailPage),
  },
];
