import { Component, inject, input, OnInit, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
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
  IonChip,
  IonSkeletonText,
  IonSpinner,
  IonAccordionGroup,
  IonAccordion,
  IonBadge,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  timeOutline,
  medkitOutline,
  clipboardOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  createOutline,
  trashOutline,
  pulseOutline,
  bandageOutline,
  flaskOutline,
  calendarOutline,
} from 'ionicons/icons';
import { ConsultationsService } from '../consultations.service';
import { Consultation } from '../../../core/models';

@Component({
  selector: 'app-consultation-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
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
    IonChip,
    IonSkeletonText,
    IonSpinner,
    IonAccordionGroup,
    IonAccordion,
    IonBadge,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/consultations"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle de Consulta</ion-title>
        <ion-buttons slot="end">
          @if (consultation() && consultation()!.status === 'in_progress') {
            <ion-button (click)="completeConsultation()">
              <ion-icon slot="icon-only" name="checkmark-circle-outline"></ion-icon>
            </ion-button>
          }
          <ion-button [routerLink]="['/consultations', id(), 'edit']">
            <ion-icon slot="icon-only" name="create-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (isLoading()) {
        <div class="loading-state">
          <ion-spinner></ion-spinner>
          <p>Cargando consulta...</p>
        </div>
      } @else if (consultation()) {
        <!-- Status Header -->
        <ion-card class="status-card" [class]="'status-' + consultation()!.status">
          <ion-card-content>
            <div class="status-header">
              <ion-chip [color]="getStatusColor(consultation()!.status)">
                {{ getStatusLabel(consultation()!.status) }}
              </ion-chip>
              <span class="date">{{ formatDate(consultation()!.date) }}</span>
            </div>
            <h2 class="chief-complaint">{{ consultation()!.chiefComplaint || 'Consulta médica' }}</h2>
          </ion-card-content>
        </ion-card>

        <!-- Patient Info -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="person-outline"></ion-icon>
              Información del Paciente
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-label>
                  <p>ID Paciente</p>
                  <h3>{{ consultation()!.patientId }}</h3>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Clinical Data Accordion -->
        <ion-accordion-group [multiple]="true" [value]="['history', 'physical', 'diagnoses']">
          <!-- History -->
          @if (consultation()!.historyOfPresentIllness) {
            <ion-accordion value="history">
              <ion-item slot="header">
                <ion-icon name="clipboard-outline" slot="start"></ion-icon>
                <ion-label>Historia de la Enfermedad Actual</ion-label>
              </ion-item>
              <div class="accordion-content" slot="content">
                <p>{{ consultation()!.historyOfPresentIllness }}</p>
              </div>
            </ion-accordion>
          }

          <!-- Physical Examination -->
          @if (consultation()!.physicalExamination && hasPhysicalExam()) {
            <ion-accordion value="physical">
              <ion-item slot="header">
                <ion-icon name="pulse-outline" slot="start"></ion-icon>
                <ion-label>Examen Físico</ion-label>
              </ion-item>
              <div class="accordion-content" slot="content">
                <ion-list lines="none">
                  @for (entry of getPhysicalExamEntries(); track entry.key) {
                    <ion-item>
                      <ion-label>
                        <p>{{ entry.label }}</p>
                        <h3>{{ entry.value }}</h3>
                      </ion-label>
                    </ion-item>
                  }
                </ion-list>
              </div>
            </ion-accordion>
          }

          <!-- Diagnoses -->
          @if (consultation()!.diagnoses && consultation()!.diagnoses!.length > 0) {
            <ion-accordion value="diagnoses">
              <ion-item slot="header">
                <ion-icon name="medkit-outline" slot="start"></ion-icon>
                <ion-label>
                  Diagnósticos
                  <ion-badge slot="end">{{ consultation()!.diagnoses!.length }}</ion-badge>
                </ion-label>
              </ion-item>
              <div class="accordion-content" slot="content">
                <ion-list lines="none">
                  @for (dx of consultation()!.diagnoses!; track dx.code || dx.description) {
                    <ion-item>
                      <ion-chip [color]="dx.type === 'primary' ? 'primary' : 'medium'" slot="start">
                        {{ dx.type === 'primary' ? 'P' : 'S' }}
                      </ion-chip>
                      <ion-label>
                        @if (dx.code) {
                          <p>{{ dx.code }}</p>
                        }
                        <h3>{{ dx.description }}</h3>
                      </ion-label>
                    </ion-item>
                  }
                </ion-list>
              </div>
            </ion-accordion>
          }

          <!-- Treatment Plan -->
          @if (consultation()!.treatmentPlan) {
            <ion-accordion value="treatment">
              <ion-item slot="header">
                <ion-icon name="document-text-outline" slot="start"></ion-icon>
                <ion-label>Plan de Tratamiento</ion-label>
              </ion-item>
              <div class="accordion-content" slot="content">
                <p>{{ consultation()!.treatmentPlan }}</p>
              </div>
            </ion-accordion>
          }

          <!-- Prescriptions -->
          @if (consultation()!.prescriptions && consultation()!.prescriptions!.length > 0) {
            <ion-accordion value="prescriptions">
              <ion-item slot="header">
                <ion-icon name="bandage-outline" slot="start"></ion-icon>
                <ion-label>
                  Recetas
                  <ion-badge slot="end">{{ consultation()!.prescriptions!.length }}</ion-badge>
                </ion-label>
              </ion-item>
              <div class="accordion-content" slot="content">
                <ion-list lines="none">
                  @for (rx of consultation()!.prescriptions!; track rx.medication) {
                    <ion-item>
                      <ion-label>
                        <h3>{{ rx.medication }}</h3>
                        <p>{{ rx.dosage }} - {{ rx.frequency }}</p>
                        <p>Duración: {{ rx.duration }}</p>
                        @if (rx.instructions) {
                          <p class="instructions">{{ rx.instructions }}</p>
                        }
                      </ion-label>
                    </ion-item>
                  }
                </ion-list>
              </div>
            </ion-accordion>
          }

          <!-- Ordered Exams -->
          @if (consultation()!.orderedExams && consultation()!.orderedExams!.length > 0) {
            <ion-accordion value="exams">
              <ion-item slot="header">
                <ion-icon name="flask-outline" slot="start"></ion-icon>
                <ion-label>
                  Exámenes Solicitados
                  <ion-badge slot="end">{{ consultation()!.orderedExams!.length }}</ion-badge>
                </ion-label>
              </ion-item>
              <div class="accordion-content" slot="content">
                <ion-list lines="none">
                  @for (exam of consultation()!.orderedExams!; track exam.name) {
                    <ion-item>
                      <ion-chip [color]="exam.priority === 'urgent' ? 'danger' : 'medium'" slot="start">
                        {{ exam.priority === 'urgent' ? 'URG' : (exam.type ? exam.type.slice(0,3).toUpperCase() : 'EXM') }}
                      </ion-chip>
                      <ion-label>
                        <h3>{{ exam.name }}</h3>
                        @if (exam.instructions) {
                          <p>{{ exam.instructions }}</p>
                        }
                      </ion-label>
                    </ion-item>
                  }
                </ion-list>
              </div>
            </ion-accordion>
          }
        </ion-accordion-group>

        <!-- Follow-up -->
        @if (consultation()!.followUpDate) {
          <ion-card class="followup-card">
            <ion-card-content>
              <ion-icon name="calendar-outline"></ion-icon>
              <div>
                <p>Próxima cita</p>
                <h3>{{ formatDate(consultation()!.followUpDate!) }}</h3>
              </div>
            </ion-card-content>
          </ion-card>
        }

        <!-- Notes -->
        @if (consultation()!.notes) {
          <ion-card>
            <ion-card-header>
              <ion-card-title>Notas Adicionales</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>{{ consultation()!.notes }}</p>
            </ion-card-content>
          </ion-card>
        }

        <!-- Actions -->
        @if (consultation()!.status === 'in_progress') {
          <div class="actions">
            <ion-button expand="block" (click)="completeConsultation()">
              <ion-icon slot="start" name="checkmark-circle-outline"></ion-icon>
              Completar Consulta
            </ion-button>
          </div>
        }
      } @else {
        <div class="empty-state">
          <ion-icon name="document-text-outline"></ion-icon>
          <h3>Consulta no encontrada</h3>
          <ion-button routerLink="/consultations">Volver a consultas</ion-button>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .loading-state p {
      margin-top: 16px;
      color: var(--ion-color-medium);
    }

    .status-card {
      margin-bottom: 16px;
    }

    .status-card.status-in_progress {
      --background: linear-gradient(135deg, var(--ion-color-warning-tint), var(--ion-color-warning));
    }

    .status-card.status-completed {
      --background: linear-gradient(135deg, var(--ion-color-success-tint), var(--ion-color-success));
    }

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .status-header .date {
      font-size: 12px;
      opacity: 0.8;
    }

    .chief-complaint {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
    }

    ion-card-title ion-icon {
      color: var(--ion-color-primary);
    }

    .accordion-content {
      padding: 16px;
      background: var(--ion-color-light);
    }

    .accordion-content p {
      margin: 0;
      line-height: 1.6;
    }

    .instructions {
      font-style: italic;
      color: var(--ion-color-medium);
    }

    .followup-card ion-card-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .followup-card ion-icon {
      font-size: 32px;
      color: var(--ion-color-primary);
    }

    .followup-card p {
      margin: 0;
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    .followup-card h3 {
      margin: 4px 0 0;
      font-weight: 600;
    }

    .actions {
      padding: 16px 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-state ion-icon {
      font-size: 64px;
      color: var(--ion-color-medium);
      margin-bottom: 16px;
    }
  `],
})
export class ConsultationDetailPage implements OnInit {
  private consultationsService = inject(ConsultationsService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private destroyRef = inject(DestroyRef);

  id = input.required<string>();
  consultation = signal<Consultation | null>(null);
  isLoading = signal(false);

  private physicalExamLabels: Record<string, string> = {
    generalAppearance: 'Aspecto General',
    head: 'Cabeza',
    eyes: 'Ojos',
    ears: 'Oídos',
    nose: 'Nariz',
    throat: 'Garganta',
    neck: 'Cuello',
    chest: 'Tórax',
    lungs: 'Pulmones',
    heart: 'Corazón',
    abdomen: 'Abdomen',
    extremities: 'Extremidades',
    skin: 'Piel',
    neurological: 'Neurológico',
    musculoskeletal: 'Musculoesquelético',
    other: 'Otros',
  };

  constructor() {
    addIcons({
      personOutline,
      timeOutline,
      medkitOutline,
      clipboardOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      createOutline,
      trashOutline,
      pulseOutline,
      bandageOutline,
      flaskOutline,
      calendarOutline,
    });
  }

  ngOnInit(): void {
    this.loadConsultation();
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'danger',
    };
    return colors[status] || 'medium';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      in_progress: 'En curso',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  }

  hasPhysicalExam(): boolean {
    const exam = this.consultation()?.physicalExamination;
    if (!exam) return false;
    return Object.values(exam).some(v => v && v.trim() !== '');
  }

  getPhysicalExamEntries(): { key: string; label: string; value: string }[] {
    const exam = this.consultation()?.physicalExamination;
    if (!exam) return [];

    return Object.entries(exam)
      .filter(([_, value]) => value && value.trim() !== '')
      .map(([key, value]) => ({
        key,
        label: this.physicalExamLabels[key] || key,
        value: value as string,
      }));
  }

  async completeConsultation(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Completar Consulta',
      message: '¿Estás seguro de que deseas marcar esta consulta como completada?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Completar',
          handler: () => {
            this.consultationsService.completeConsultation(this.id())
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (updated) => {
                  this.consultation.set(updated);
                  this.showToast('Consulta completada exitosamente', 'success');
                },
                error: () => {
                  this.showToast('Error al completar la consulta', 'danger');
                },
              });
          },
        },
      ],
    });
    await alert.present();
  }

  private loadConsultation(): void {
    this.isLoading.set(true);
    this.consultationsService.getConsultation(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (consultation) => {
          this.consultation.set(consultation);
          this.isLoading.set(false);
        },
        error: () => {
          this.consultation.set(null);
          this.isLoading.set(false);
        },
      });
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
