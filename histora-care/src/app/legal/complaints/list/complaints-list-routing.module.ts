import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComplaintsListPage } from './complaints-list.page';

const routes: Routes = [
  {
    path: '',
    component: ComplaintsListPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComplaintsListRoutingModule {}
