import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonMenuButton,
  IonButtons,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-consultations-list',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonMenuButton, IonButtons],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Consultas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Lista de consultas - En construcción</p>
    </ion-content>
  `,
})
export class ConsultationsListPage {}
