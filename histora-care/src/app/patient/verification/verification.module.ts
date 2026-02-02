import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { VerificationRoutingModule } from './verification-routing.module';
import { VerificationPage } from './verification.page';
import { PhoneStepComponent } from './components/phone-step/phone-step.component';
import { DniStepComponent } from './components/dni-step/dni-step.component';
import { SelfieStepComponent } from './components/selfie-step/selfie-step.component';
import { EmergencyContactStepComponent } from './components/emergency-contact-step/emergency-contact-step.component';
import { VerificationCompleteComponent } from './components/verification-complete/verification-complete.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    VerificationRoutingModule,
  ],
  declarations: [
    VerificationPage,
    PhoneStepComponent,
    DniStepComponent,
    SelfieStepComponent,
    EmergencyContactStepComponent,
    VerificationCompleteComponent,
  ],
})
export class VerificationPageModule {}
