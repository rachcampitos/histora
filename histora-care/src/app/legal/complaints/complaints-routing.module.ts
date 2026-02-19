import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComplaintsPage } from './complaints.page';

const routes: Routes = [
  {
    path: '',
    component: ComplaintsPage,
  },
  {
    path: 'list',
    loadChildren: () =>
      import('./list/complaints-list.module').then(
        (m) => m.ComplaintsListPageModule,
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComplaintsRoutingModule {}
