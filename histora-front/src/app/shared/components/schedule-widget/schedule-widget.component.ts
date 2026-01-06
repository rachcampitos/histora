import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

export interface ScheduleItem {
  id?: string;
  startTime: string;
  endTime: string;
  title: string;
  subtitle?: string;
  type: 'working' | 'break' | 'meeting' | 'urgent' | 'personal';
  location?: string;
  description?: string;
  icon?: string;
}

@Component({
  selector: 'app-schedule-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule],
  templateUrl: './schedule-widget.component.html',
  styleUrls: ['./schedule-widget.component.scss'],
})
export class ScheduleWidgetComponent implements OnInit {
  @Input() title: string = "Today's Schedule";
  @Input() scheduleItems: ScheduleItem[] = [];
  @Input() showIcons: boolean = true;
  @Input() compactView: boolean = false;
  @Input() darkMode: boolean = false;

  ngOnInit() {
    // Sort schedule items by start time
    this.scheduleItems.sort(
      (a, b) =>
        this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
    );
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  getTypeIcon(type: string): string {
    const icons = {
      working: 'work',
      break: 'coffee',
      meeting: 'groups',
      urgent: 'priority_high',
      personal: 'person',
    };
    return icons[type as keyof typeof icons] || 'schedule';
  }

  trackByFn(index: number, item: ScheduleItem): string {
    return item.id || `${item.startTime}-${item.title}-${index}`;
  }

  getTimeRange(item: ScheduleItem): string {
    return `${item.startTime} - ${item.endTime}`;
  }

  getCurrentTimePosition(): number {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (this.scheduleItems.length === 0) return 0;

    const firstItemMinutes = this.timeToMinutes(
      this.scheduleItems[0].startTime
    );
    const lastItem = this.scheduleItems[this.scheduleItems.length - 1];
    const lastItemMinutes = this.timeToMinutes(lastItem.endTime);

    if (currentMinutes < firstItemMinutes || currentMinutes > lastItemMinutes) {
      return -1; // Current time is outside schedule
    }

    const totalMinutes = lastItemMinutes - firstItemMinutes;
    const progressMinutes = currentMinutes - firstItemMinutes;

    return (progressMinutes / totalMinutes) * 100;
  }

  isCurrentlyActive(item: ScheduleItem): boolean {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = this.timeToMinutes(item.startTime);
    const endMinutes = this.timeToMinutes(item.endTime);

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
}
