import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TermsRoutingModule } from './terms-routing.module';
import { TermsPage } from './terms.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    TermsRoutingModule
  ],
  declarations: [TermsPage]
})
export class TermsPageModule {}
