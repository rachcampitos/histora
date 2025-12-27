import { Component, inject, OnInit, signal, input, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  trashOutline,
  callOutline,
  mailOutline,
  calendarOutline,
  waterOutline,
  alertCircleOutline,
  medkitOutline,
  documentTextOutline,
} from 'ionicons/icons';
import { PatientsService } from '../patients.service';
import { Patient } from '../../../core/models';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSkeletonText,
    IonSegment,
    IonSegmentButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/patients"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle del Paciente</ion-title>
        <ion-buttons slot="end">
          <ion-button [routerLink]="['/patients', id(), 'edit']">
            <ion-icon slot="icon-only" name="create-outline"></ion-icon>
          </ion-button>
          <ion-button (click)="confirmDelete()" color="danger">
            <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (isLoading()) {
        <ion-card>
          <ion-card-content>
            <ion-skeleton-text animated style="width: 60%; height: 24px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="width: 40%; height: 16px;"></ion-skeleton-text>
          </ion-card-content>
        </ion-card>
      } @else if (patient()) {
        <!-- Patient Info Card -->
        <ion-card>
          <ion-card-content>
            <div class="patient-header">
              <div class="avatar">
                {{ getInitials() }}
              </div>
              <div class="info">
                <h2>{{ patient()!.firstName }} {{ patient()!.lastName }}</h2>
                @if (patient()!.bloodType) {
                  <ion-badge color="primary">{{ patient()!.bloodType }}</ion-badge>
                }
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Contact Info -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Información de Contacto</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              @if (patient()!.email) {
                <ion-item>
                  <ion-icon name="mail-outline" slot="start" color="primary"></ion-icon>
                  <ion-label>{{ patient()!.email }}</ion-label>
                </ion-item>
              }
              @if (patient()!.phone) {
                <ion-item>
                  <ion-icon name="call-outline" slot="start" color="primary"></ion-icon>
                  <ion-label>{{ patient()!.phone }}</ion-label>
                </ion-item>
              }
              @if (patient()!.dateOfBirth) {
                <ion-item>
                  <ion-icon name="calendar-outline" slot="start" color="primary"></ion-icon>
                  <ion-label>{{ formatDate(patient()!.dateOfBirth) }}</ion-label>
                </ion-item>
              }
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Medical Info -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Información Médica</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              @if (patient()!.bloodType) {
                <ion-item>
                  <ion-icon name="water-outline" slot="start" color="danger"></ion-icon>
                  <ion-label>
                    <p>Tipo de Sangre</p>
                    <h3>{{ patient()!.bloodType }}</h3>
                  </ion-label>
                </ion-item>
              }
              @if (patient()!.allergies && patient()!.allergies!.length > 0) {
                <ion-item>
                  <ion-icon name="alert-circle-outline" slot="start" color="warning"></ion-icon>
                  <ion-label>
                    <p>Alergias</p>
                    <h3>{{ patient()!.allergies!.join(', ') }}</h3>
                  </ion-label>
                </ion-item>
              }
              @if (patient()!.chronicConditions && patient()!.chronicConditions!.length > 0) {
                <ion-item>
                  <ion-icon name="medkit-outline" slot="start" color="tertiary"></ion-icon>
                  <ion-label>
                    <p>Condiciones Crónicas</p>
                    <h3>{{ patient()!.chronicConditions!.join(', ') }}</h3>
                  </ion-label>
                </ion-item>
              }
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Quick Actions -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Acciones Rápidas</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item button detail routerLink="/appointments/new" [queryParams]="{patientId: id()}">
                <ion-icon name="calendar-outline" slot="start" color="success"></ion-icon>
                <ion-label>Agendar Cita</ion-label>
              </ion-item>
              <ion-item button detail routerLink="/consultations/new" [queryParams]="{patientId: id()}">
                <ion-icon name="medkit-outline" slot="start" color="warning"></ion-icon>
                <ion-label>Nueva Consulta</ion-label>
              </ion-item>
              <ion-item button detail routerLink="/clinical-history" [queryParams]="{patientId: id()}">
                <ion-icon name="document-text-outline" slot="start" color="primary"></ion-icon>
                <ion-label>Ver Historial Clínico</ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
  styles: [
    `
      .patient-header {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--ion-color-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: 600;
      }

      .info h2 {
        margin: 0 0 4px;
        font-size: 1.25rem;
        font-weight: 600;
      }

      ion-card-title {
        font-size: 1rem;
      }

      ion-item ion-label p {
        color: var(--ion-color-medium);
        font-size: 0.75rem;
        margin-bottom: 2px;
      }

      ion-item ion-label h3 {
        font-size: 0.95rem;
        margin: 0;
      }
    `,
  ],
})
export class PatientDetailPage implements OnInit {
  private patientsService = inject(PatientsService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private destroyRef = inject(DestroyRef);

  id = input.required<string>();
  patient = signal<Patient | null>(null);
  isLoading = signal(true);

  constructor() {
    addIcons({
      createOutline,
      trashOutline,
      callOutline,
      mailOutline,
      calendarOutline,
      waterOutline,
      alertCircleOutline,
      medkitOutline,
      documentTextOutline,
    });
  }

  ngOnInit(): void {
    this.loadPatient();
  }

  getInitials(): string {
    const p = this.patient();
    if (!p) return '';
    return `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`.toUpperCase();
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  async confirmDelete(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Paciente',
      message: '¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deletePatient();
          },
        },
      ],
    });
    await alert.present();
  }

  private loadPatient(): void {
    this.isLoading.set(true);
    this.patientsService.getPatient(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (patient) => {
          this.patient.set(patient);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  private async deletePatient(): Promise<void> {
    this.patientsService.deletePatient(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async () => {
          const toast = await this.toastController.create({
            message: 'Paciente eliminado correctamente',
            duration: 2000,
            color: 'success',
          });
          await toast.present();
          this.router.navigate(['/patients']);
        },
      });
  }
}
