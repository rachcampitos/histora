import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgScrollbar } from 'ngx-scrollbar';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface CriticalAlert {
  id: string;
  img: string;
  patientName: string;
  roomNumber: string;
  alertType: string;
  message: string;
  time: string;
  timestamp: string;
  severity: string;
  severityClass: string;
  isNew: boolean;
}

@Component({
  selector: 'app-critical-alerts',
  standalone: true,
  templateUrl: './critical-alerts.component.html',
  styleUrls: ['./critical-alerts.component.scss'],
  imports: [
    CommonModule,
    NgScrollbar,
    MatCardModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class CriticalAlertsComponent {
  @Input() alerts: CriticalAlert[] = [];

  @Output() acknowledge = new EventEmitter<CriticalAlert>();
  @Output() viewDetails = new EventEmitter<CriticalAlert>();

  // Count of new alerts
  getNewAlertsCount(): number {
    return this.alerts.filter((a) => a.isNew).length;
  }

  markAsRead(alert: CriticalAlert) {
    this.acknowledge.emit(alert);
  }

  viewAlert(alert: CriticalAlert) {
    this.viewDetails.emit(alert);
  }
}
