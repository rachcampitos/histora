import { Component, input } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons } from '@ionic/angular/standalone';

@Component({
  selector: 'app-clinical-history-detail',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/clinical-history"></ion-back-button></ion-buttons>
        <ion-title>Historial Clínico</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding"><p>Detalle de historial {{ id() }} - En construcción</p></ion-content>
  `,
})
export class ClinicalHistoryDetailPage {
  id = input.required<string>();
}
