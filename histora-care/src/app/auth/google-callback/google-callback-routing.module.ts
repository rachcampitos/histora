import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GoogleCallbackPage } from './google-callback.page';

const routes: Routes = [
  {
    path: '',
    component: GoogleCallbackPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GoogleCallbackPageRoutingModule {}
