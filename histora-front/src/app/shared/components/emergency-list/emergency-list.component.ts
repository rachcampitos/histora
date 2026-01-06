import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgScrollbarModule } from 'ngx-scrollbar';

export interface EmergencyCase {
  patientName: string;
  caseType: 'critical' | 'urgent' | string; // allows any string
  caseDescription: string;
  timeAgo: string;
}

@Component({
  selector: 'app-emergency-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    NgScrollbarModule,
  ],
  templateUrl: './emergency-list.component.html',
  styleUrls: ['./emergency-list.component.scss'],
})
export class EmergencyListComponent {
  @Input() cases: EmergencyCase[] = [];
}
