import { Component, input } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons } from '@ionic/angular/standalone';

@Component({
  selector: 'app-consultation-detail',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/consultations"></ion-back-button></ion-buttons>
        <ion-title>Detalle de Consulta</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding"><p>Detalle de consulta {{ id() }} - En construcción</p></ion-content>
  `,
})
export class ConsultationDetailPage {
  id = input.required<string>();
}
