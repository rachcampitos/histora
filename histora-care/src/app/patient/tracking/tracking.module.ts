import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TrackingPageRoutingModule } from './tracking-routing.module';

import { TrackingPage } from './tracking.page';
import { ReviewModalComponent } from '../../shared/components/review-modal';
import { ChatModalComponent } from '../../shared/components/chat-modal';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TrackingPageRoutingModule,
    ReviewModalComponent,
    ChatModalComponent
  ],
  declarations: [TrackingPage]
})
export class TrackingPageModule {}
