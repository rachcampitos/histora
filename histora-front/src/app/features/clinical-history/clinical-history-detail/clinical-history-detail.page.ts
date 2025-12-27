import { Component, inject, input, OnInit, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  IonSpinner,
  IonAccordionGroup,
  IonAccordion,
  IonBadge,
  IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  timeOutline,
  medkitOutline,
  documentTextOutline,
  warningOutline,
  heartOutline,
  bandageOutline,
  cutOutline,
  peopleOutline,
  fitnessOutline,
  nutritionOutline,
  briefcaseOutline,
  calendarOutline,
  createOutline,
} from 'ionicons/icons';
import { ClinicalHistoryService, ClinicalHistory } from '../clinical-history.service';

@Component({
  selector: 'app-clinical-history-detail',
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
    IonSpinner,
    IonAccordionGroup,
    IonAccordion,
    IonBadge,
    IonNote,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/clinical-history"></ion-back-button>
        </ion-buttons>
        <ion-title>Historial Clínico</ion-title>
        <ion-buttons slot="end">
          <ion-button>
            <ion-icon slot="icon-only" name="create-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (isLoading()) {
        <div class="loading-state">
          <ion-spinner></ion-spinner>
          <p>Cargando historial...</p>
        </div>
      } @else if (history()) {
        <!-- Header Card -->
        <ion-card class="header-card">
          <ion-card-content>
            <div class="header-info">
              <h2>{{ history()!.reasonForVisit }}</h2>
              <p class="date">
                <ion-icon name="calendar-outline"></ion-icon>
                {{ formatDate(history()!.date) }}
              </p>
            </div>
            @if (history()!.diagnosis) {
              <div class="diagnosis-section">
                <ion-chip color="primary">
                  <ion-icon name="medkit-outline"></ion-icon>
                  Diagnóstico
                </ion-chip>
                <p>{{ history()!.diagnosis }}</p>
              </div>
            }
            @if (history()!.treatment) {
              <div class="treatment-section">
                <ion-chip color="success">
                  <ion-icon name="bandage-outline"></ion-icon>
                  Tratamiento
                </ion-chip>
                <p>{{ history()!.treatment }}</p>
              </div>
            }
          </ion-card-content>
        </ion-card>

        <!-- Medical Background Accordion -->
        <ion-accordion-group [multiple]="true" [value]="openSections()">
          <!-- Allergies -->
          @if (history()!.allergies && history()!.allergies.length > 0) {
            <ion-accordion value="allergies">
              <ion-item slot="header" color="danger">
                <ion-icon name="warning-outline" slot="start"></ion-icon>
                <ion-label>
                  Alergias
                  <ion-badge slot="end">{{ history()!.allergies.length }}</ion-badge>
                </ion-label>
              </ion-item>
              <div class="accordion-content" slot="content">
                <ion-list lines="none">
                  @for (allergy of history()!.allergies; track allergy.allergen) {
                    <ion-item>
                      <ion-label>
                        <h3>{{ allergy.allergen }}</h3>
                        @if (allergy.reaction) {
                          <p>Reacción: {{ allergy.reaction }}</p>
                        }
                        @if (allergy.severity) {
                          <ion-chip [color]="getSeverityColor(allergy.severity)" size="small">
                            {{ getSeverityLabel(allergy.severity) }}
                          </ion-chip>
                        }
                      </ion-label>
                    </ion-item>
                  }
                </ion-list>
              </div>
            </ion-accordion>
          }

          <!-- Chronic Conditions -->
          @if (history()!.chronicConditions && history()!.chronicConditions.length > 0) {
            <ion-accordion value="conditions">
              <ion-item slot="header" color="warning">
                <ion-icon name="heart-outline" slot="start"></ion-icon>
                <ion-label>
                  Condiciones Crónicas
                  <ion-badge slot="end">{{ history()!.chronicConditions.length }}</ion-badge>
                </ion-label>
              </ion-item>
              <div class="accordion-content" slot="content">
                <ion-list lines="none">
                  @for (condition of history()!.chronicConditions; track condition.condition) {
                    <ion-item>
                      <ion-label>
                        <h3>{{ condition.condition }}</h3>
                        @if (condition.icdCode) {
                          <p>CIE-10: {{ condition.icdCode }}</p>
                        }
                        @if (condition.status) {
                          <ion-chip [color]="getConditionStatusColor(condition.status)" size="small">
                            {{ getConditionStatusLabel(condition.status) }}
                          </ion-chip>
                        }
                        @if (condition.notes) {
                          <p class="notes">{{ condition.notes }}</p>
                        }
                      </ion-label>
                    </ion-item>
                  }
                </ion-list>
              </div>
            </ion-accordion>
          }

          <!-- Current Medications -->
          @if (history()!.currentMedications && history()!.currentMedications.length > 0) {
            <ion-accordion value="medications">
              <ion-item slot="header" color="tertiary">
                <ion-icon name="bandage-outline" slot="start"></ion-icon>
                <ion-label>
                  Medicamentos Actuales
                  <ion-badge slot="end">{{ history()!.currentMedications.length }}</ion-badge>
                </ion-label>
              </ion-item>
              <div class="accordion-content" slot="content">
                <ion-list lines="none">
                  @for (med of history()!.currentMedications; track med.medication) {
                    <ion-item>
                      <ion-label>
                        <h3>{{ med.medication }}</h3>
                        @if (med.dosage) {
                          <p>Dosis: {{ med.dosage }}</p>
                        }
                        @if (med.frequency) {
                          <p>Frecuencia: {{ med.frequency }}</p>
                        }
                        @if (med.reason) {
                          <p class="notes">Razón: {{ med.reason }}</p>
                        }
                      </ion-label>
                    </ion-item>
                  }
                </ion-list>
              </div>
            </ion-accordion>
          }

          <!-- Surgical History -->
          @if (history()!.surgicalHistory && history()!.surgicalHistory.length > 0) {
            <ion-accordion value="surgeries">
              <ion-item slot="header">
                <ion-icon name="cut-outline" slot="start"></ion-icon>
                <ion-label>
                  Antecedentes Quirúrgicos
                  <ion-badge slot="end">{{ history()!.surgicalHistory.length }}</ion-badge>
                </ion-label>
              </ion-item>
              <div class="accordion-content" slot="content">
                <ion-list lines="none">
                  @for (surgery of history()!.surgicalHistory; track surgery.procedure) {
                    <ion-item>
                      <ion-label>
                        <h3>{{ surgery.procedure }}</h3>
                        @if (surgery.date) {
                          <p>Fecha: {{ formatDate(surgery.date) }}</p>
                        }
                        @if (surgery.hospital) {
                          <p>Hospital: {{ surgery.hospital }}</p>
                        }
                        @if (surgery.complications) {
                          <p class="notes danger">Complicaciones: {{ surgery.complications }}</p>
                        }
                      </ion-label>
                    </ion-item>
                  }
                </ion-list>
              </div>
            </ion-accordion>
          }

          <!-- Family History -->
          @if (history()!.familyHistory && history()!.familyHistory.length > 0) {
            <ion-accordion value="family">
              <ion-item slot="header">
                <ion-icon name="people-outline" slot="start"></ion-icon>
                <ion-label>
                  Antecedentes Familiares
                  <ion-badge slot="end">{{ history()!.familyHistory.length }}</ion-badge>
                </ion-label>
              </ion-item>
              <div class="accordion-content" slot="content">
                <ion-list lines="none">
                  @for (fh of history()!.familyHistory; track fh.condition + fh.relationship) {
                    <ion-item>
                      <ion-label>
                        <h3>{{ fh.condition }}</h3>
                        <p>Parentesco: {{ fh.relationship }}</p>
                        @if (fh.ageAtOnset) {
                          <p>Edad de inicio: {{ fh.ageAtOnset }} años</p>
                        }
                      </ion-label>
                    </ion-item>
                  }
                </ion-list>
              </div>
            </ion-accordion>
          }

          <!-- Vaccinations -->
          @if (history()!.vaccinations && history()!.vaccinations.length > 0) {
            <ion-accordion value="vaccinations">
              <ion-item slot="header" color="success">
                <ion-icon name="fitness-outline" slot="start"></ion-icon>
                <ion-label>
                  Vacunas
                  <ion-badge slot="end">{{ history()!.vaccinations.length }}</ion-badge>
                </ion-label>
              </ion-item>
              <div class="accordion-content" slot="content">
                <ion-list lines="none">
                  @for (vax of history()!.vaccinations; track vax.vaccine) {
                    <ion-item>
                      <ion-label>
                        <h3>{{ vax.vaccine }}</h3>
                        @if (vax.date) {
                          <p>Fecha: {{ formatDate(vax.date) }}</p>
                        }
                        @if (vax.doseNumber) {
                          <p>Dosis #{{ vax.doseNumber }}</p>
                        }
                        @if (vax.nextDoseDate) {
                          <ion-chip color="primary" size="small">
                            Próxima: {{ formatDate(vax.nextDoseDate) }}
                          </ion-chip>
                        }
                      </ion-label>
                    </ion-item>
                  }
                </ion-list>
              </div>
            </ion-accordion>
          }

          <!-- Lifestyle -->
          @if (hasLifestyleInfo()) {
            <ion-accordion value="lifestyle">
              <ion-item slot="header">
                <ion-icon name="nutrition-outline" slot="start"></ion-icon>
                <ion-label>Estilo de Vida</ion-label>
              </ion-item>
              <div class="accordion-content" slot="content">
                <ion-list lines="none">
                  @if (history()!.smokingStatus) {
                    <ion-item>
                      <ion-label>
                        <p>Tabaquismo</p>
                        <h3>{{ getSmokingLabel(history()!.smokingStatus!) }}</h3>
                      </ion-label>
                    </ion-item>
                  }
                  @if (history()!.alcoholUse) {
                    <ion-item>
                      <ion-label>
                        <p>Consumo de Alcohol</p>
                        <h3>{{ getAlcoholLabel(history()!.alcoholUse!) }}</h3>
                      </ion-label>
                    </ion-item>
                  }
                  @if (history()!.exerciseFrequency) {
                    <ion-item>
                      <ion-label>
                        <p>Ejercicio</p>
                        <h3>{{ getExerciseLabel(history()!.exerciseFrequency!) }}</h3>
                      </ion-label>
                    </ion-item>
                  }
                  @if (history()!.occupation) {
                    <ion-item>
                      <ion-icon name="briefcase-outline" slot="start"></ion-icon>
                      <ion-label>
                        <p>Ocupación</p>
                        <h3>{{ history()!.occupation }}</h3>
                      </ion-label>
                    </ion-item>
                  }
                </ion-list>
              </div>
            </ion-accordion>
          }
        </ion-accordion-group>

        <!-- Notes -->
        @if (history()!.notes) {
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="document-text-outline"></ion-icon>
                Notas
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>{{ history()!.notes }}</p>
            </ion-card-content>
          </ion-card>
        }
      } @else {
        <div class="empty-state">
          <ion-icon name="document-text-outline"></ion-icon>
          <h3>Historial no encontrado</h3>
          <ion-button routerLink="/clinical-history">Volver</ion-button>
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

    .header-card {
      margin-bottom: 16px;
    }

    .header-info h2 {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 600;
    }

    .header-info .date {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--ion-color-medium);
      font-size: 14px;
      margin: 0;
    }

    .diagnosis-section, .treatment-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--ion-color-light);
    }

    .diagnosis-section p, .treatment-section p {
      margin: 8px 0 0;
      line-height: 1.5;
    }

    ion-accordion ion-item[slot="header"] {
      --background: transparent;
    }

    .accordion-content {
      padding: 8px 16px;
      background: var(--ion-color-light);
    }

    .accordion-content ion-item {
      --background: white;
      margin-bottom: 8px;
      border-radius: 8px;
    }

    .notes {
      font-style: italic;
      color: var(--ion-color-medium);
      margin-top: 4px;
    }

    .notes.danger {
      color: var(--ion-color-danger);
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
export class ClinicalHistoryDetailPage implements OnInit {
  private clinicalHistoryService = inject(ClinicalHistoryService);
  private destroyRef = inject(DestroyRef);

  id = input.required<string>();
  history = signal<ClinicalHistory | null>(null);
  isLoading = signal(false);
  openSections = signal<string[]>(['allergies', 'conditions', 'medications']);

  constructor() {
    addIcons({
      personOutline,
      timeOutline,
      medkitOutline,
      documentTextOutline,
      warningOutline,
      heartOutline,
      bandageOutline,
      cutOutline,
      peopleOutline,
      fitnessOutline,
      nutritionOutline,
      briefcaseOutline,
      calendarOutline,
      createOutline,
    });
  }

  ngOnInit(): void {
    this.loadHistory();
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      mild: 'success',
      moderate: 'warning',
      severe: 'danger',
    };
    return colors[severity] || 'medium';
  }

  getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      mild: 'Leve',
      moderate: 'Moderada',
      severe: 'Severa',
    };
    return labels[severity] || severity;
  }

  getConditionStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: 'danger',
      controlled: 'success',
      resolved: 'medium',
    };
    return colors[status] || 'medium';
  }

  getConditionStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activa',
      controlled: 'Controlada',
      resolved: 'Resuelta',
    };
    return labels[status] || status;
  }

  getSmokingLabel(status: string): string {
    const labels: Record<string, string> = {
      never: 'Nunca',
      former: 'Ex-fumador',
      current: 'Fumador activo',
    };
    return labels[status] || status;
  }

  getAlcoholLabel(use: string): string {
    const labels: Record<string, string> = {
      none: 'No consume',
      occasional: 'Ocasional',
      moderate: 'Moderado',
      heavy: 'Excesivo',
    };
    return labels[use] || use;
  }

  getExerciseLabel(freq: string): string {
    const labels: Record<string, string> = {
      sedentary: 'Sedentario',
      light: 'Ligero',
      moderate: 'Moderado',
      active: 'Activo',
    };
    return labels[freq] || freq;
  }

  hasLifestyleInfo(): boolean {
    const h = this.history();
    if (!h) return false;
    return !!(h.smokingStatus || h.alcoholUse || h.exerciseFrequency || h.occupation);
  }

  private loadHistory(): void {
    this.isLoading.set(true);
    this.clinicalHistoryService.getClinicalHistory(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (history) => {
          this.history.set(history);
          this.isLoading.set(false);
        },
        error: () => {
          this.history.set(null);
          this.isLoading.set(false);
        },
      });
  }
}
