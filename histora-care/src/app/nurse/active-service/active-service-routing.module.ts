import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ActiveServicePage } from './active-service.page';

const routes: Routes = [
  {
    path: '',
    component: ActiveServicePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ActiveServicePageRoutingModule {}
