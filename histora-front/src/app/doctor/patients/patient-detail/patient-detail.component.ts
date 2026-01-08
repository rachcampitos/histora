import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { PatientsService } from '../patients.service';
import { Patient } from '../patients.model';
import { ConsultationsService } from '../../consultations/consultations.service';
import { Consultation } from '../../consultations/consultations.model';
import { PatientFormDialogComponent } from '../dialogs/form/form.component';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    TranslateModule,
    BreadcrumbComponent,
  ],
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.scss'],
})
export class PatientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientsService = inject(PatientsService);
  private consultationsService = inject(ConsultationsService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  patient: Patient | null = null;
  consultations: Consultation[] = [];
  isLoading = true;
  isLoadingConsultations = true;
  patientId: string = '';

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') || '';
    if (this.patientId) {
      this.loadPatient();
      this.loadConsultations();
    } else {
      this.router.navigate(['/doctor/patients']);
    }
  }

  loadPatient(): void {
    this.isLoading = true;
    this.patientsService.getById(this.patientId).subscribe({
      next: (patient) => {
        this.patient = patient;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading patient:', error);
        this.isLoading = false;
        this.router.navigate(['/doctor/patients']);
      },
    });
  }

  loadConsultations(): void {
    this.isLoadingConsultations = true;
    this.consultationsService.getByPatient(this.patientId, 10).subscribe({
      next: (consultations) => {
        this.consultations = consultations;
        this.isLoadingConsultations = false;
      },
      error: (error) => {
        console.error('Error loading consultations:', error);
        this.isLoadingConsultations = false;
      },
    });
  }

  get fullName(): string {
    if (!this.patient) return '';
    return `${this.patient.firstName} ${this.patient.lastName || ''}`.trim();
  }

  get age(): number | null {
    if (!this.patient?.dateOfBirth) return null;
    const birthDate = new Date(this.patient.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  get genderLabel(): string {
    if (!this.patient?.gender) return '';
    const genderMap: Record<string, string> = {
      male: 'Masculino',
      female: 'Femenino',
      other: 'Otro',
    };
    return genderMap[this.patient.gender] || this.patient.gender;
  }

  get fullAddress(): string {
    if (!this.patient?.address) return '';
    const parts = [
      this.patient.address.street,
      this.patient.address.city,
      this.patient.address.state,
      this.patient.address.country,
      this.patient.address.postalCode,
    ].filter(Boolean);
    return parts.join(', ');
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatDateTime(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      scheduled: 'status-scheduled',
      in_progress: 'status-in-progress',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
    };
    return statusClasses[status] || '';
  }

  getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      scheduled: 'Programada',
      in_progress: 'En Progreso',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return statusLabels[status] || status;
  }

  editPatient(): void {
    const dialogRef = this.dialog.open(PatientFormDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        action: 'edit',
        patient: this.patient,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Edit') {
        this.loadPatient();
      }
    });
  }

  scheduleAppointment(): void {
    this.router.navigate(['/doctor/appointments'], {
      queryParams: { patientId: this.patientId },
    });
  }

  viewConsultation(consultation: Consultation): void {
    this.router.navigate(['/doctor/consultations'], {
      queryParams: { consultationId: consultation._id },
    });
  }

  goBack(): void {
    this.router.navigate(['/doctor/patients']);
  }
}
