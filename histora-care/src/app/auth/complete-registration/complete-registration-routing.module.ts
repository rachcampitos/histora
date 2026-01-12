import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CompleteRegistrationPage } from './complete-registration.page';

const routes: Routes = [
  {
    path: '',
    component: CompleteRegistrationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CompleteRegistrationPageRoutingModule {}
