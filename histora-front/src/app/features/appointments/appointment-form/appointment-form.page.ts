import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/appointments"></ion-back-button>
        </ion-buttons>
        <ion-title>Nueva Cita</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Formulario de cita - En construcción</p>
    </ion-content>
  `,
})
export class AppointmentFormPage {}
