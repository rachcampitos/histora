import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotificationSettingsPage } from './notification-settings.page';

const routes: Routes = [
  {
    path: '',
    component: NotificationSettingsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotificationSettingsRoutingModule {}
