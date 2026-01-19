import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PrivacyRoutingModule } from './privacy-routing.module';
import { PrivacyPage } from './privacy.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    PrivacyRoutingModule
  ],
  declarations: [PrivacyPage]
})
export class PrivacyPageModule {}
