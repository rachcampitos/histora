import { Component, EventEmitter, Input, Output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonDatetime,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  chevronForwardOutline,
  todayOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-calendar-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    IonDatetime,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonBadge,
  ],
  template: `
    <ion-card class="calendar-card">
      <ion-card-content class="calendar-content">
        <div class="calendar-header">
          <ion-button fill="clear" size="small" (click)="goToToday()">
            <ion-icon name="today-outline" slot="start"></ion-icon>
            Hoy
          </ion-button>
          @if (hasEvents()) {
            <ion-badge color="primary">{{ eventCount() }} citas</ion-badge>
          }
        </div>

        <ion-datetime
          #calendar
          presentation="date"
          [value]="selectedDate()"
          [highlightedDates]="highlightedDates"
          [min]="minDate"
          [max]="maxDate"
          [locale]="'es-ES'"
          [firstDayOfWeek]="1"
          (ionChange)="onDateChange($event)"
        ></ion-datetime>

        <div class="calendar-footer">
          <ion-button fill="clear" size="small" (click)="navigateWeek(-1)">
            <ion-icon name="chevron-back-outline" slot="icon-only"></ion-icon>
          </ion-button>
          <span class="selected-date">{{ formatSelectedDate() }}</span>
          <ion-button fill="clear" size="small" (click)="navigateWeek(1)">
            <ion-icon name="chevron-forward-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .calendar-card {
      margin: 0;
      box-shadow: none;
      border: 1px solid var(--ion-color-light-shade);
    }

    .calendar-content {
      padding: 8px;
    }

    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 8px 8px;
      border-bottom: 1px solid var(--ion-color-light-shade);
      margin-bottom: 8px;
    }

    ion-datetime {
      --background: transparent;
      width: 100%;
      min-height: 320px;
    }

    ion-datetime::part(calendar-day today) {
      border: 2px solid var(--ion-color-primary);
      border-radius: 50%;
    }

    ion-datetime::part(calendar-day active) {
      background: var(--ion-color-primary);
      color: white;
    }

    .calendar-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      border-top: 1px solid var(--ion-color-light-shade);
      margin-top: 8px;
    }

    .selected-date {
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    ion-badge {
      font-size: 12px;
    }
  `],
})
export class CalendarPickerComponent {
  @Input() minDate?: string;
  @Input() maxDate?: string;
  @Input() highlightedDates: { date: string; textColor: string; backgroundColor: string }[] = [];
  @Input() set initialDate(value: string | undefined) {
    if (value) {
      this.selectedDate.set(value);
    }
  }

  @Output() dateSelected = new EventEmitter<string>();
  @Output() monthChanged = new EventEmitter<{ month: number; year: number }>();

  selectedDate = signal<string>(new Date().toISOString());
  eventCount = signal<number>(0);

  constructor() {
    addIcons({
      chevronBackOutline,
      chevronForwardOutline,
      todayOutline,
    });
  }

  @Input() set eventsForDate(count: number) {
    this.eventCount.set(count);
  }

  hasEvents(): boolean {
    return this.eventCount() > 0;
  }

  onDateChange(event: CustomEvent): void {
    const value = event.detail.value;
    if (value) {
      this.selectedDate.set(value);
      this.dateSelected.emit(value);
    }
  }

  goToToday(): void {
    const today = new Date().toISOString();
    this.selectedDate.set(today);
    this.dateSelected.emit(today);
  }

  navigateWeek(direction: number): void {
    const current = new Date(this.selectedDate());
    current.setDate(current.getDate() + (7 * direction));
    const newDate = current.toISOString();
    this.selectedDate.set(newDate);
    this.dateSelected.emit(newDate);
  }

  formatSelectedDate(): string {
    const date = new Date(this.selectedDate());
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
}
