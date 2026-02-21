import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NotificationsListRoutingModule } from './notifications-list-routing.module';
import { NotificationsListPage } from './notifications-list.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    NotificationsListRoutingModule
  ],
  declarations: [NotificationsListPage]
})
export class NotificationsListPageModule {}
