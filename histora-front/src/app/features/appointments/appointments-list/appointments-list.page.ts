import { Component, inject, OnInit, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  IonSplitPane,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  timeOutline,
  personOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  calendarOutline,
} from 'ionicons/icons';
import { CalendarPickerComponent } from '../../../shared/components';
import { AppointmentsService, Appointment } from '../appointments.service';

@Component({
  selector: 'app-appointments-list',
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
    CalendarPickerComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Citas</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/appointments/new">
            <ion-icon slot="icon-only" name="add-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="viewMode()" (ionChange)="onViewModeChange($event)">
          <ion-segment-button value="day">
            <ion-label>Día</ion-label>
          </ion-segment-button>
          <ion-segment-button value="week">
            <ion-label>Semana</ion-label>
          </ion-segment-button>
          <ion-segment-button value="all">
            <ion-label>Todas</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="appointments-layout">
        <!-- Calendar Sidebar -->
        <aside class="calendar-sidebar">
          <app-calendar-picker
            [eventsForDate]="appointmentsCount()"
            [highlightedDates]="highlightedDates()"
            (dateSelected)="onDateSelected($event)"
          ></app-calendar-picker>

          <!-- Quick Stats -->
          <div class="quick-stats">
            <div class="stat-item">
              <span class="stat-value">{{ stats().scheduled }}</span>
              <span class="stat-label">Programadas</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats().confirmed }}</span>
              <span class="stat-label">Confirmadas</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats().completed }}</span>
              <span class="stat-label">Completadas</span>
            </div>
          </div>
        </aside>

        <!-- Appointments List -->
        <main class="appointments-main">
          <div class="date-header">
            <ion-icon name="calendar-outline"></ion-icon>
            <h2>{{ formatDateHeader() }}</h2>
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
          } @else if (appointments().length === 0) {
            <div class="empty-state">
              <ion-icon name="calendar-outline"></ion-icon>
              <h3>No hay citas para este día</h3>
              <p>Programa una nueva cita para comenzar</p>
              <ion-button routerLink="/appointments/new">
                <ion-icon slot="start" name="add-outline"></ion-icon>
                Nueva Cita
              </ion-button>
            </div>
          } @else {
            <ion-list class="appointments-list">
              @for (apt of appointments(); track apt._id) {
                <ion-item button detail [routerLink]="['/appointments', apt._id]">
                  <div class="time-slot" slot="start">
                    <span class="time">{{ apt.startTime }}</span>
                    <span class="duration">{{ apt.endTime }}</span>
                  </div>
                  <ion-label>
                    <h2>{{ apt.patientName || 'Paciente' }}</h2>
                    <p>{{ apt.reasonForVisit || 'Consulta general' }}</p>
                    <p class="doctor-name">
                      <ion-icon name="person-outline"></ion-icon>
                      {{ apt.doctorName || 'Dr.' }}
                    </p>
                  </ion-label>
                  <ion-chip
                    [color]="getStatusColor(apt.status)"
                    slot="end"
                  >
                    {{ getStatusLabel(apt.status) }}
                  </ion-chip>
                </ion-item>
              }
            </ion-list>
          }
        </main>
      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button routerLink="/appointments/new">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .appointments-layout {
      display: flex;
      height: 100%;
      gap: 16px;
      padding: 16px;
    }

    .calendar-sidebar {
      width: 320px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .appointments-main {
      flex: 1;
      min-width: 0;
    }

    .date-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: var(--ion-color-light);
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .date-header ion-icon {
      font-size: 24px;
      color: var(--ion-color-primary);
    }

    .date-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      text-transform: capitalize;
    }

    .quick-stats {
      display: flex;
      gap: 8px;
    }

    .stat-item {
      flex: 1;
      text-align: center;
      padding: 12px 8px;
      background: var(--ion-color-light);
      border-radius: 8px;
    }

    .stat-value {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: var(--ion-color-primary);
    }

    .stat-label {
      font-size: 11px;
      color: var(--ion-color-medium);
      text-transform: uppercase;
    }

    .appointments-list ion-item {
      --padding-start: 8px;
      margin-bottom: 8px;
      border-radius: 8px;
      --background: var(--ion-color-light);
    }

    .time-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 12px;
      background: var(--ion-color-primary);
      color: white;
      border-radius: 8px;
      margin-right: 12px;
      min-width: 60px;
    }

    .time-slot .time {
      font-weight: 700;
      font-size: 14px;
    }

    .time-slot .duration {
      font-size: 11px;
      opacity: 0.8;
    }

    .doctor-name {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    .doctor-name ion-icon {
      font-size: 14px;
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

    /* Responsive: Hide sidebar on mobile */
    @media (max-width: 768px) {
      .appointments-layout {
        flex-direction: column;
      }

      .calendar-sidebar {
        width: 100%;
      }

      .quick-stats {
        display: none;
      }
    }
  `],
})
export class AppointmentsListPage implements OnInit {
  private appointmentsService = inject(AppointmentsService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  appointments = signal<Appointment[]>([]);
  isLoading = signal(false);
  selectedDate = signal<string>(new Date().toISOString());
  viewMode = signal<'day' | 'week' | 'all'>('day');
  appointmentsCount = signal(0);
  highlightedDates = signal<{ date: string; textColor: string; backgroundColor: string }[]>([]);
  stats = signal({ scheduled: 0, confirmed: 0, completed: 0 });

  constructor() {
    addIcons({
      addOutline,
      timeOutline,
      personOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      calendarOutline,
    });
  }

  ngOnInit(): void {
    // Check for date query param from dashboard navigation
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['date']) {
          const date = new Date(params['date']);
          if (!isNaN(date.getTime())) {
            this.selectedDate.set(date.toISOString());
          }
        }
        this.loadAppointments();
      });
  }

  onDateSelected(dateString: string): void {
    this.selectedDate.set(dateString);
    this.loadAppointments();
  }

  onViewModeChange(event: CustomEvent): void {
    this.viewMode.set(event.detail.value);
    this.loadAppointments();
  }

  handleRefresh(event: CustomEvent): void {
    this.loadAppointments();
    setTimeout(() => {
      (event.target as HTMLIonRefresherElement).complete();
    }, 1000);
  }

  formatDateHeader(): string {
    const date = new Date(this.selectedDate());
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy, ' + date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana, ' + date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    }

    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      scheduled: 'primary',
      confirmed: 'success',
      in_progress: 'warning',
      completed: 'medium',
      cancelled: 'danger',
      no_show: 'dark',
    };
    return colors[status] || 'medium';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      scheduled: 'Programada',
      confirmed: 'Confirmada',
      in_progress: 'En curso',
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No asistió',
    };
    return labels[status] || status;
  }

  private loadAppointments(): void {
    this.isLoading.set(true);

    const date = new Date(this.selectedDate());

    this.appointmentsService.getAppointments({
      date: date.toISOString().split('T')[0],
      viewMode: this.viewMode(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: { data: Appointment[]; total: number }) => {
          this.appointments.set(response.data || []);
          this.appointmentsCount.set(response.total || 0);
          this.updateStats(response.data || []);
          this.isLoading.set(false);
        },
        error: () => {
          this.appointments.set([]);
          this.isLoading.set(false);
        },
      });
  }

  private updateStats(appointments: Appointment[]): void {
    const stats = {
      scheduled: 0,
      confirmed: 0,
      completed: 0,
    };

    appointments.forEach((apt) => {
      if (apt.status === 'scheduled') stats.scheduled++;
      if (apt.status === 'confirmed') stats.confirmed++;
      if (apt.status === 'completed') stats.completed++;
    });

    this.stats.set(stats);
  }
}
