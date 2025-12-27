import { Component, inject, OnInit, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonMenuButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  calendarOutline,
  medkitOutline,
  trendingUpOutline,
  timeOutline,
  chevronForwardOutline,
  addOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { CalendarPickerComponent } from '../../shared/components';
import { DashboardService, DashboardStats, TodayAppointment } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonMenuButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonButton,
    CalendarPickerComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="dashboard-layout">
        <!-- Main Content -->
        <main class="dashboard-main">
          <h2 class="greeting">Hola, {{ auth.user()?.firstName }}!</h2>

          <!-- Stats Cards -->
          <ion-grid class="stats-grid">
            <ion-row>
              <ion-col size="6" size-md="3">
                <ion-card class="stat-card" routerLink="/patients">
                  <ion-card-content>
                    <ion-icon name="people-outline" color="primary"></ion-icon>
                    @if (isLoading()) {
                      <ion-skeleton-text animated style="width: 60px; height: 32px;"></ion-skeleton-text>
                    } @else {
                      <h3>{{ stats()?.totalPatients || 0 }}</h3>
                    }
                    <p>Pacientes</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="3">
                <ion-card class="stat-card" routerLink="/appointments">
                  <ion-card-content>
                    <ion-icon name="calendar-outline" color="success"></ion-icon>
                    @if (isLoading()) {
                      <ion-skeleton-text animated style="width: 60px; height: 32px;"></ion-skeleton-text>
                    } @else {
                      <h3>{{ stats()?.todayAppointments || 0 }}</h3>
                    }
                    <p>Citas Hoy</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="3">
                <ion-card class="stat-card" routerLink="/consultations">
                  <ion-card-content>
                    <ion-icon name="medkit-outline" color="warning"></ion-icon>
                    @if (isLoading()) {
                      <ion-skeleton-text animated style="width: 60px; height: 32px;"></ion-skeleton-text>
                    } @else {
                      <h3>{{ stats()?.pendingConsultations || 0 }}</h3>
                    }
                    <p>Consultas</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="3">
                <ion-card class="stat-card">
                  <ion-card-content>
                    <ion-icon name="trending-up-outline" color="tertiary"></ion-icon>
                    @if (isLoading()) {
                      <ion-skeleton-text animated style="width: 60px; height: 32px;"></ion-skeleton-text>
                    } @else {
                      <h3>{{ stats()?.monthlyGrowth || 0 }}%</h3>
                    }
                    <p>Crecimiento</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>

          <!-- Today's Appointments -->
          <ion-card class="appointments-card">
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="time-outline"></ion-icon>
                Citas de Hoy
              </ion-card-title>
              <ion-button fill="clear" size="small" routerLink="/appointments">
                Ver todas
                <ion-icon slot="end" name="chevron-forward-outline"></ion-icon>
              </ion-button>
            </ion-card-header>
            <ion-card-content>
              @if (isLoading()) {
                <ion-list>
                  @for (item of [1, 2, 3]; track item) {
                    <ion-item>
                      <ion-skeleton-text animated style="width: 100%; height: 20px;"></ion-skeleton-text>
                    </ion-item>
                  }
                </ion-list>
              } @else if (todayAppointments().length === 0) {
                <div class="empty-appointments">
                  <ion-icon name="calendar-outline"></ion-icon>
                  <p>No hay citas programadas para hoy</p>
                  <ion-button fill="outline" size="small" routerLink="/appointments/new">
                    <ion-icon slot="start" name="add-outline"></ion-icon>
                    Nueva Cita
                  </ion-button>
                </div>
              } @else {
                <ion-list>
                  @for (appointment of todayAppointments(); track appointment._id) {
                    <ion-item button detail [routerLink]="['/appointments', appointment._id]">
                      <div class="time-badge" slot="start">
                        {{ appointment.startTime }}
                      </div>
                      <ion-label>
                        <h3>{{ appointment.patientName }}</h3>
                        <p>{{ appointment.reasonForVisit || 'Consulta general' }}</p>
                      </ion-label>
                      <ion-badge slot="end" [color]="getStatusColor(appointment.status)">
                        {{ getStatusLabel(appointment.status) }}
                      </ion-badge>
                    </ion-item>
                  }
                </ion-list>
              }
            </ion-card-content>
          </ion-card>
        </main>

        <!-- Calendar Sidebar -->
        <aside class="calendar-sidebar">
          <app-calendar-picker
            [eventsForDate]="appointmentsCount()"
            (dateSelected)="onDateSelected($event)"
          ></app-calendar-picker>

          <!-- Quick Actions -->
          <ion-card class="quick-actions">
            <ion-card-header>
              <ion-card-title>Acciones Rápidas</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-button expand="block" routerLink="/appointments/new">
                <ion-icon slot="start" name="calendar-outline"></ion-icon>
                Nueva Cita
              </ion-button>
              <ion-button expand="block" fill="outline" routerLink="/patients/new">
                <ion-icon slot="start" name="people-outline"></ion-icon>
                Nuevo Paciente
              </ion-button>
            </ion-card-content>
          </ion-card>
        </aside>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .dashboard-layout {
        display: flex;
        gap: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .dashboard-main {
        flex: 1;
        min-width: 0;
      }

      .calendar-sidebar {
        width: 320px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .greeting {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 16px;
        color: var(--ion-color-dark);
      }

      .stats-grid {
        padding: 0;
      }

      .stat-card {
        margin: 0;
        border-radius: 12px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .stat-card ion-card-content {
        text-align: center;
        padding: 16px 8px;
      }

      .stat-card ion-icon {
        font-size: 28px;
        margin-bottom: 8px;
      }

      .stat-card h3 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
      }

      .stat-card p {
        font-size: 0.75rem;
        color: var(--ion-color-medium);
        margin: 4px 0 0;
      }

      .appointments-card ion-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      ion-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.1rem;
      }

      ion-card-title ion-icon {
        font-size: 20px;
      }

      .empty-appointments {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 32px 16px;
        text-align: center;
      }

      .empty-appointments ion-icon {
        font-size: 48px;
        color: var(--ion-color-medium);
        margin-bottom: 12px;
      }

      .empty-appointments p {
        color: var(--ion-color-medium);
        margin: 0 0 16px;
      }

      .time-badge {
        background: var(--ion-color-primary);
        color: white;
        padding: 6px 10px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        margin-right: 12px;
      }

      .quick-actions ion-card-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .quick-actions ion-card-title {
        font-size: 1rem;
      }

      /* Responsive: Stack on mobile */
      @media (max-width: 992px) {
        .dashboard-layout {
          flex-direction: column-reverse;
        }

        .calendar-sidebar {
          width: 100%;
        }

        .stat-card h3 {
          font-size: 1.25rem;
        }
      }
    `,
  ],
})
export class DashboardPage implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private dashboardService = inject(DashboardService);

  isLoading = signal(true);
  stats = signal<DashboardStats | null>(null);
  todayAppointments = signal<TodayAppointment[]>([]);
  appointmentsCount = signal(0);

  constructor() {
    addIcons({
      peopleOutline,
      calendarOutline,
      medkitOutline,
      trendingUpOutline,
      timeOutline,
      chevronForwardOutline,
      addOutline,
    });
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  handleRefresh(event: CustomEvent): void {
    this.loadDashboardData();
    setTimeout(() => {
      (event.target as HTMLIonRefresherElement).complete();
    }, 1000);
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);

    // Load stats and appointments in parallel
    this.dashboardService.getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: () => this.stats.set({ totalPatients: 0, todayAppointments: 0, pendingConsultations: 0, monthlyGrowth: 0 }),
      });

    this.dashboardService.getTodayAppointments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (appointments) => {
          this.todayAppointments.set(appointments);
          this.isLoading.set(false);
        },
        error: () => {
          this.todayAppointments.set([]);
          this.isLoading.set(false);
        },
      });

    this.dashboardService.getMonthAppointmentsCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (count) => this.appointmentsCount.set(count),
        error: () => this.appointmentsCount.set(0),
      });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      scheduled: 'medium',
      confirmed: 'primary',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'danger',
    };
    return colors[status] || 'medium';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      scheduled: 'Agendada',
      confirmed: 'Confirmada',
      in_progress: 'En curso',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  }

  onDateSelected(dateString: string): void {
    // Navigate to appointments page with the selected date
    this.router.navigate(['/appointments'], {
      queryParams: { date: dateString.split('T')[0] }
    });
  }
}
