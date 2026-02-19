import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ComplaintsListRoutingModule } from './complaints-list-routing.module';
import { ComplaintsListPage } from './complaints-list.page';

@NgModule({
  imports: [CommonModule, IonicModule, ComplaintsListRoutingModule],
  declarations: [ComplaintsListPage],
})
export class ComplaintsListPageModule {}
