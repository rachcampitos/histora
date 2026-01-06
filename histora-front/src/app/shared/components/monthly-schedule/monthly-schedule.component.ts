import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ElementRef,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AfterViewInit } from '@angular/core';

export interface ScheduleActivity {
  id: string;
  title: string;
  type: string;
  time: string;
  color?: string;
  description?: string;
  doctorName?: string;
  patientName?: string;
}

@Component({
  selector: 'app-monthly-schedule',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './monthly-schedule.component.html',
  styleUrls: ['./monthly-schedule.component.scss'],
})
export class MonthlyScheduleComponent implements OnInit, AfterViewInit {
  @Input() activityData: { [date: string]: ScheduleActivity[] } = {};
  @Input() selectedDate?: Date;
  @Input() month?: number; // 0-based
  @Input() year?: number;
  @Output() onDateChange = new EventEmitter<Date>();
  @ViewChildren('dateItemRefs') dateItemElements!: QueryList<ElementRef>;

  daysInMonth: number[] = [];
  currentDate: Date = new Date();
  activities: ScheduleActivity[] = [];

  ngOnInit() {
    const today = new Date();
    this.year = this.year ?? today.getFullYear();
    this.month = this.month ?? today.getMonth();
    this.updateDaysInMonth();
    // ✅ Use selectedDate if provided, else default to today
    if (
      this.selectedDate &&
      this.selectedDate.getMonth() === this.month &&
      this.selectedDate.getFullYear() === this.year
    ) {
      this.currentDate = new Date(this.selectedDate);
    } else {
      this.currentDate = new Date(this.year, this.month, today.getDate());
    }
    this.updateActivities();
  }

  ngAfterViewInit() {
    // ✅ Scroll to the current date on load
    setTimeout(() => {
      const selectedIndex = this.daysInMonth.indexOf(
        this.currentDate.getDate()
      );
      const el = this.dateItemElements.get(selectedIndex);
      if (el) {
        el.nativeElement.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    });
  }

  updateDaysInMonth() {
    const days = new Date(this.year!, this.month! + 1, 0).getDate();
    this.daysInMonth = Array.from({ length: days }, (_, i) => i + 1);
  }

  selectDate(day: number) {
    this.currentDate = new Date(this.year!, this.month!, day);
    this.updateActivities();
    this.onDateChange.emit(this.currentDate);

    setTimeout(() => {
      const selectedIndex = this.daysInMonth.indexOf(day);
      const el = this.dateItemElements.get(selectedIndex);
      if (el) {
        el.nativeElement.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    });
  }

  prevDay() {
    const day = this.currentDate.getDate();
    if (day > 1) {
      this.selectDate(day - 1); // triggers scroll
    }
  }

  nextDay() {
    const day = this.currentDate.getDate();
    if (day < this.daysInMonth.length) {
      this.selectDate(day + 1); // triggers scroll
    }
  }

  updateActivities() {
    const key = this.currentDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    this.activities = this.activityData[key] || [];
  }

  isSelected(day: number): boolean {
    return this.currentDate.getDate() === day;
  }

  getDayOfWeek(day: number): string {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
      new Date(this.year!, this.month!, day).getDay()
    ];
  }
}
