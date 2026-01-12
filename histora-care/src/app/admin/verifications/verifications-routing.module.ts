import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VerificationsPage } from './verifications.page';

const routes: Routes = [
  {
    path: '',
    component: VerificationsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VerificationsPageRoutingModule {}
