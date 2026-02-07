import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ActiveServicePageRoutingModule } from './active-service-routing.module';

import { ActiveServicePage } from './active-service.page';
import { PanicButtonComponent } from '../../shared/components/panic-button/panic-button.component';
import { VirtualEscortComponent } from '../../shared/components/virtual-escort/virtual-escort.component';
import { CheckInReminderComponent } from '../../shared/components/check-in-reminder/check-in-reminder.component';
import { ChatModalComponent } from '../../shared/components/chat-modal/chat-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ActiveServicePageRoutingModule,
    PanicButtonComponent,
    VirtualEscortComponent,
    CheckInReminderComponent,
    ChatModalComponent
  ],
  declarations: [ActiveServicePage]
})
export class ActiveServicePageModule {}
