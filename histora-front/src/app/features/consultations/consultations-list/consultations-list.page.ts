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
  IonFab,
  IonFabButton,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonNote,
  IonChip,
  IonSearchbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  documentTextOutline,
  personOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
  medkitOutline,
  searchOutline,
} from 'ionicons/icons';
import { ConsultationsService, ConsultationsResponse } from '../consultations.service';
import { Consultation } from '../../../core/models';

@Component({
  selector: 'app-consultations-list',
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
    IonFab,
    IonFabButton,
    IonSegment,
    IonSegmentButton,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonNote,
    IonChip,
    IonSearchbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Consultas</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/consultations/new">
            <ion-icon slot="icon-only" name="add-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="statusFilter()" (ionChange)="onStatusChange($event)">
          <ion-segment-button value="all">
            <ion-label>Todas</ion-label>
          </ion-segment-button>
          <ion-segment-button value="in_progress">
            <ion-label>En Curso</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed">
            <ion-label>Completadas</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          placeholder="Buscar consulta..."
          [debounce]="300"
          (ionInput)="onSearch($event)"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="consultations-container">
        <!-- Stats Cards -->
        <div class="stats-row">
          <ion-card class="stat-card">
            <ion-card-content>
              <div class="stat-value">{{ stats().inProgress }}</div>
              <div class="stat-label">En Curso</div>
            </ion-card-content>
          </ion-card>
          <ion-card class="stat-card">
            <ion-card-content>
              <div class="stat-value">{{ stats().completed }}</div>
              <div class="stat-label">Completadas Hoy</div>
            </ion-card-content>
          </ion-card>
          <ion-card class="stat-card">
            <ion-card-content>
              <div class="stat-value">{{ stats().total }}</div>
              <div class="stat-label">Total</div>
            </ion-card-content>
          </ion-card>
        </div>

        @if (isLoading()) {
          <ion-list>
            @for (item of [1, 2, 3, 4]; track item) {
              <ion-item>
                <ion-avatar slot="start">
                  <ion-skeleton-text animated></ion-skeleton-text>
                </ion-avatar>
                <ion-label>
                  <ion-skeleton-text animated style="width: 60%;"></ion-skeleton-text>
                  <ion-skeleton-text animated style="width: 40%;"></ion-skeleton-text>
                </ion-label>
              </ion-item>
            }
          </ion-list>
        } @else if (consultations().length === 0) {
          <div class="empty-state">
            <ion-icon name="document-text-outline"></ion-icon>
            <h3>No hay consultas</h3>
            <p>Inicia una nueva consulta desde una cita programada</p>
            <ion-button routerLink="/appointments">
              <ion-icon slot="start" name="time-outline"></ion-icon>
              Ver Citas
            </ion-button>
          </div>
        } @else {
          <ion-list class="consultations-list">
            @for (consultation of consultations(); track consultation._id) {
              <ion-item button detail [routerLink]="['/consultations', consultation._id]">
                <div class="consultation-avatar" slot="start" [class]="'status-' + consultation.status">
                  <ion-icon name="medkit-outline"></ion-icon>
                </div>
                <ion-label>
                  <h2>{{ consultation.chiefComplaint || 'Consulta médica' }}</h2>
                  <p class="patient-info">
                    <ion-icon name="person-outline"></ion-icon>
                    Paciente #{{ consultation.patientId | slice:0:8 }}
                  </p>
                  <p class="date-info">
                    <ion-icon name="time-outline"></ion-icon>
                    {{ formatDate(consultation.date) }}
                  </p>
                  @if (consultation.diagnoses && consultation.diagnoses.length > 0) {
                    <p class="diagnosis-preview">
                      Dx: {{ consultation.diagnoses[0].description }}
                      @if (consultation.diagnoses.length > 1) {
                        <span class="more">+{{ consultation.diagnoses.length - 1 }} más</span>
                      }
                    </p>
                  }
                </ion-label>
                <ion-chip [color]="getStatusColor(consultation.status)" slot="end">
                  {{ getStatusLabel(consultation.status) }}
                </ion-chip>
              </ion-item>
            }
          </ion-list>
        }
      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button routerLink="/consultations/new">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .consultations-container {
      padding: 16px;
    }

    .stats-row {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }

    .stat-card {
      flex: 1;
      margin: 0;
    }

    .stat-card ion-card-content {
      text-align: center;
      padding: 12px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--ion-color-primary);
    }

    .stat-label {
      font-size: 11px;
      color: var(--ion-color-medium);
      text-transform: uppercase;
    }

    .consultations-list ion-item {
      --padding-start: 8px;
      margin-bottom: 8px;
      border-radius: 8px;
      --background: var(--ion-color-light);
    }

    .consultation-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
    }

    .consultation-avatar ion-icon {
      font-size: 24px;
      color: white;
    }

    .consultation-avatar.status-in_progress {
      background: var(--ion-color-warning);
    }

    .consultation-avatar.status-completed {
      background: var(--ion-color-success);
    }

    .consultation-avatar.status-cancelled {
      background: var(--ion-color-danger);
    }

    .patient-info, .date-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    .patient-info ion-icon, .date-info ion-icon {
      font-size: 14px;
    }

    .diagnosis-preview {
      font-size: 12px;
      color: var(--ion-color-dark);
      margin-top: 4px;
    }

    .diagnosis-preview .more {
      color: var(--ion-color-primary);
      font-weight: 500;
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
        flex-wrap: wrap;
      }

      .stat-card {
        flex-basis: calc(50% - 6px);
      }

      .stat-card:last-child {
        flex-basis: 100%;
      }
    }
  `],
})
export class ConsultationsListPage implements OnInit {
  private consultationsService = inject(ConsultationsService);
  private destroyRef = inject(DestroyRef);

  consultations = signal<Consultation[]>([]);
  isLoading = signal(false);
  statusFilter = signal<'all' | 'in_progress' | 'completed'>('all');
  searchTerm = signal('');
  stats = signal({ inProgress: 0, completed: 0, total: 0 });

  constructor() {
    addIcons({
      addOutline,
      documentTextOutline,
      personOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      timeOutline,
      medkitOutline,
      searchOutline,
    });
  }

  ngOnInit(): void {
    this.loadConsultations();
  }

  onStatusChange(event: CustomEvent): void {
    this.statusFilter.set(event.detail.value);
    this.loadConsultations();
  }

  onSearch(event: CustomEvent): void {
    this.searchTerm.set(event.detail.value || '');
    this.loadConsultations();
  }

  handleRefresh(event: CustomEvent): void {
    this.loadConsultations();
    setTimeout(() => {
      (event.target as HTMLIonRefresherElement).complete();
    }, 1000);
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
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

  private loadConsultations(): void {
    this.isLoading.set(true);

    const params: any = {};
    if (this.statusFilter() !== 'all') {
      params.status = this.statusFilter();
    }

    this.consultationsService.getConsultations(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: ConsultationsResponse) => {
          this.consultations.set(response.data || []);
          this.updateStats(response.data || []);
          this.isLoading.set(false);
        },
        error: () => {
          this.consultations.set([]);
          this.isLoading.set(false);
        },
      });
  }

  private updateStats(consultations: Consultation[]): void {
    const stats = {
      inProgress: 0,
      completed: 0,
      total: consultations.length,
    };

    const today = new Date().toDateString();

    consultations.forEach((c) => {
      if (c.status === 'in_progress') stats.inProgress++;
      if (c.status === 'completed' && new Date(c.date).toDateString() === today) {
        stats.completed++;
      }
    });

    this.stats.set(stats);
  }
}
