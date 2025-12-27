import { Component, inject, OnInit, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonMenuButton,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonAvatar,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonChip,
  IonSearchbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  personOutline,
  timeOutline,
  medkitOutline,
  searchOutline,
  warningOutline,
  heartOutline,
  bandageOutline,
} from 'ionicons/icons';
import { ClinicalHistoryService, ClinicalHistory, ClinicalHistoryResponse } from '../clinical-history.service';

@Component({
  selector: 'app-clinical-history-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonMenuButton,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonAvatar,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonChip,
    IonSearchbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonNote,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Historiales Clínicos</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          placeholder="Buscar por paciente..."
          [debounce]="300"
          (ionInput)="onSearch($event)"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="history-container">
        <!-- Stats Cards -->
        <div class="stats-row">
          <ion-card class="stat-card">
            <ion-card-content>
              <ion-icon name="document-text-outline" color="primary"></ion-icon>
              <div class="stat-info">
                <div class="stat-value">{{ stats().total }}</div>
                <div class="stat-label">Total Registros</div>
              </div>
            </ion-card-content>
          </ion-card>
          <ion-card class="stat-card">
            <ion-card-content>
              <ion-icon name="warning-outline" color="danger"></ion-icon>
              <div class="stat-info">
                <div class="stat-value">{{ stats().withAllergies }}</div>
                <div class="stat-label">Con Alergias</div>
              </div>
            </ion-card-content>
          </ion-card>
          <ion-card class="stat-card">
            <ion-card-content>
              <ion-icon name="heart-outline" color="warning"></ion-icon>
              <div class="stat-info">
                <div class="stat-value">{{ stats().withConditions }}</div>
                <div class="stat-label">Condiciones Crónicas</div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        @if (isLoading()) {
          <ion-list>
            @for (item of [1, 2, 3, 4, 5]; track item) {
              <ion-item>
                <ion-avatar slot="start">
                  <ion-skeleton-text animated></ion-skeleton-text>
                </ion-avatar>
                <ion-label>
                  <ion-skeleton-text animated style="width: 60%;"></ion-skeleton-text>
                  <ion-skeleton-text animated style="width: 40%;"></ion-skeleton-text>
                  <ion-skeleton-text animated style="width: 30%;"></ion-skeleton-text>
                </ion-label>
              </ion-item>
            }
          </ion-list>
        } @else if (histories().length === 0) {
          <div class="empty-state">
            <ion-icon name="document-text-outline"></ion-icon>
            <h3>No hay historiales clínicos</h3>
            <p>Los historiales se crean automáticamente al completar consultas</p>
            <ion-button routerLink="/consultations">
              <ion-icon slot="start" name="medkit-outline"></ion-icon>
              Ver Consultas
            </ion-button>
          </div>
        } @else {
          <ion-list class="history-list">
            @for (history of histories(); track history._id) {
              <ion-item button detail [routerLink]="['/clinical-history', history._id]">
                <div class="history-avatar" slot="start">
                  <ion-icon name="document-text-outline"></ion-icon>
                </div>
                <ion-label>
                  <h2>{{ history.reasonForVisit }}</h2>
                  <p class="patient-info">
                    <ion-icon name="person-outline"></ion-icon>
                    Paciente #{{ history.patientId | slice:0:8 }}
                  </p>
                  <p class="date-info">
                    <ion-icon name="time-outline"></ion-icon>
                    {{ formatDate(history.date) }}
                  </p>
                  @if (history.diagnosis) {
                    <p class="diagnosis">
                      <ion-icon name="medkit-outline"></ion-icon>
                      {{ history.diagnosis | slice:0:50 }}{{ history.diagnosis.length > 50 ? '...' : '' }}
                    </p>
                  }
                  <div class="badges">
                    @if (history.allergies && history.allergies.length > 0) {
                      <ion-chip color="danger" size="small">
                        <ion-icon name="warning-outline"></ion-icon>
                        {{ history.allergies.length }} Alergias
                      </ion-chip>
                    }
                    @if (history.chronicConditions && history.chronicConditions.length > 0) {
                      <ion-chip color="warning" size="small">
                        <ion-icon name="heart-outline"></ion-icon>
                        {{ history.chronicConditions.length }} Crónicas
                      </ion-chip>
                    }
                    @if (history.currentMedications && history.currentMedications.length > 0) {
                      <ion-chip color="tertiary" size="small">
                        <ion-icon name="bandage-outline"></ion-icon>
                        {{ history.currentMedications.length }} Medicamentos
                      </ion-chip>
                    }
                  </div>
                </ion-label>
              </ion-item>
            }
          </ion-list>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .history-container {
      padding: 16px;
    }

    .stats-row {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      overflow-x: auto;
    }

    .stat-card {
      flex: 1;
      min-width: 120px;
      margin: 0;
    }

    .stat-card ion-card-content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
    }

    .stat-card ion-icon {
      font-size: 32px;
    }

    .stat-info {
      flex: 1;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      line-height: 1;
    }

    .stat-label {
      font-size: 11px;
      color: var(--ion-color-medium);
      text-transform: uppercase;
      margin-top: 4px;
    }

    .history-list ion-item {
      --padding-start: 8px;
      margin-bottom: 8px;
      border-radius: 8px;
      --background: var(--ion-color-light);
    }

    .history-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      background: var(--ion-color-primary);
    }

    .history-avatar ion-icon {
      font-size: 24px;
      color: white;
    }

    .patient-info, .date-info, .diagnosis {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    .patient-info ion-icon, .date-info ion-icon, .diagnosis ion-icon {
      font-size: 14px;
    }

    .diagnosis {
      color: var(--ion-color-dark);
      margin-top: 4px;
    }

    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 8px;
    }

    .badges ion-chip {
      height: 24px;
      font-size: 11px;
    }

    .badges ion-chip ion-icon {
      font-size: 12px;
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

    .empty-state h3 {
      margin: 0 0 8px;
      color: var(--ion-color-dark);
    }

    .empty-state p {
      margin: 0 0 24px;
      color: var(--ion-color-medium);
    }

    @media (max-width: 576px) {
      .stats-row {
        flex-wrap: nowrap;
        padding-bottom: 8px;
      }

      .stat-card {
        min-width: 140px;
      }
    }
  `],
})
export class ClinicalHistoryListPage implements OnInit {
  private clinicalHistoryService = inject(ClinicalHistoryService);
  private destroyRef = inject(DestroyRef);

  histories = signal<ClinicalHistory[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  stats = signal({ total: 0, withAllergies: 0, withConditions: 0 });

  constructor() {
    addIcons({
      documentTextOutline,
      personOutline,
      timeOutline,
      medkitOutline,
      searchOutline,
      warningOutline,
      heartOutline,
      bandageOutline,
    });
  }

  ngOnInit(): void {
    this.loadHistories();
  }

  onSearch(event: CustomEvent): void {
    this.searchTerm.set(event.detail.value || '');
    this.loadHistories();
  }

  handleRefresh(event: CustomEvent): void {
    this.loadHistories();
    setTimeout(() => {
      (event.target as HTMLIonRefresherElement).complete();
    }, 1000);
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  private loadHistories(): void {
    this.isLoading.set(true);

    this.clinicalHistoryService.getClinicalHistories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: ClinicalHistoryResponse) => {
          this.histories.set(response.data || []);
          this.updateStats(response.data || []);
          this.isLoading.set(false);
        },
        error: () => {
          this.histories.set([]);
          this.isLoading.set(false);
        },
      });
  }

  private updateStats(histories: ClinicalHistory[]): void {
    const stats = {
      total: histories.length,
      withAllergies: 0,
      withConditions: 0,
    };

    histories.forEach((h) => {
      if (h.allergies && h.allergies.length > 0) stats.withAllergies++;
      if (h.chronicConditions && h.chronicConditions.length > 0) stats.withConditions++;
    });

    this.stats.set(stats);
  }
}
