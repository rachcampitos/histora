import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CompleteRegistrationPageRoutingModule } from './complete-registration-routing.module';
import { CompleteRegistrationPage } from './complete-registration.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CompleteRegistrationPageRoutingModule
  ],
  declarations: [CompleteRegistrationPage]
})
export class CompleteRegistrationPageModule {}
