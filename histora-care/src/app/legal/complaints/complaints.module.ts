import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ComplaintsRoutingModule } from './complaints-routing.module';
import { ComplaintsPage } from './complaints.page';

@NgModule({
  imports: [CommonModule, IonicModule, ComplaintsRoutingModule],
  declarations: [ComplaintsPage],
})
export class ComplaintsPageModule {}
