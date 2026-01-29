import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';

import { DashboardPage } from './dashboard.page';
import { PanicButtonComponent } from '../../shared/components/panic-button/panic-button.component';
import { ProfileChecklistComponent } from './components/profile-checklist/profile-checklist.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardPageRoutingModule,
    PanicButtonComponent,
    ProfileChecklistComponent
  ],
  declarations: [DashboardPage]
})
export class DashboardPageModule {}
