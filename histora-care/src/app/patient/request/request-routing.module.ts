import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RequestPage } from './request.page';
import { unsavedChangesGuard } from './request-unsaved.guard';

const routes: Routes = [
  {
    path: '',
    component: RequestPage,
    canDeactivate: [unsavedChangesGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RequestPageRoutingModule {}
