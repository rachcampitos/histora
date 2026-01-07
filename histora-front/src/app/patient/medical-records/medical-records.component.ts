import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '@core';
import {
  MedicalRecordsService,
  Consultation,
  PatientMedicalSummary,
} from './medical-records.service';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  templateUrl: './medical-records.component.html',
  styleUrls: ['./medical-records.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDividerModule,
    MatListModule,
    MatBadgeModule,
    BreadcrumbComponent,
    TranslateModule,
  ],
})
export class MedicalRecordsComponent implements OnInit {
  isLoading = true;
  patientId = '';
  consultations: Consultation[] = [];
  medicalSummary: PatientMedicalSummary | null = null;
  error: string | null = null;

  constructor(
    private medicalRecordsService: MedicalRecordsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser?.['patientId']) {
      this.patientId = currentUser['patientId'] as string;
      this.loadData();
    } else {
      this.isLoading = false;
      this.error = 'No se encontró información del paciente';
    }
  }

  loadData(): void {
    this.isLoading = true;

    // Load consultations
    this.medicalRecordsService.getConsultations(this.patientId, 20).subscribe({
      next: (consultations) => {
        this.consultations = consultations;
        this.loadMedicalSummary();
      },
      error: (err) => {
        console.error('Error loading consultations:', err);
        this.loadMedicalSummary();
      },
    });
  }

  loadMedicalSummary(): void {
    this.medicalRecordsService.getMedicalSummary(this.patientId).subscribe({
      next: (summary) => {
        this.medicalSummary = summary;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading medical summary:', err);
        this.isLoading = false;
      },
    });
  }

  getDoctorName(consultation: Consultation): string {
    if (consultation.doctor) {
      return `Dr. ${consultation.doctor.firstName} ${consultation.doctor.lastName}`;
    }
    return 'Médico';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'in_progress':
        return 'in-progress';
      case 'scheduled':
        return 'scheduled';
      case 'cancelled':
        return 'cancelled';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed':
        return 'CLINICAL_HISTORY.STATUS.COMPLETED';
      case 'in_progress':
        return 'CLINICAL_HISTORY.STATUS.IN_PROGRESS';
      case 'scheduled':
        return 'CLINICAL_HISTORY.STATUS.SCHEDULED';
      case 'cancelled':
        return 'CLINICAL_HISTORY.STATUS.CANCELLED';
      default:
        return status;
    }
  }

  getSeverityColor(severity: string | undefined): string {
    switch (severity?.toLowerCase()) {
      case 'severe':
      case 'severa':
        return 'warn';
      case 'moderate':
      case 'moderada':
        return 'accent';
      case 'mild':
      case 'leve':
        return 'primary';
      default:
        return '';
    }
  }
}
