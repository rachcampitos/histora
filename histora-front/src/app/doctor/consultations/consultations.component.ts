import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ConsultationsService } from './consultations.service';
import { Consultation, ConsultationStatus } from './consultations.model';
import { AuthService } from '@core';
import { FormDialogComponent } from './dialogs/form/form.component';

@Component({
  selector: 'app-consultations',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatDialogModule,
    TranslateModule,
    BreadcrumbComponent,
  ],
  templateUrl: './consultations.component.html',
  styleUrls: ['./consultations.component.scss'],
})
export class ConsultationsComponent implements OnInit {
  displayedColumns: string[] = [
    'patient',
    'time',
    'chiefComplaint',
    'status',
    'actions',
  ];
  dataSource = new MatTableDataSource<Consultation>([]);
  isLoading = true;
  selectedDate = new Date();
  selectedStatus = '';
  doctorId = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private consultationsService: ConsultationsService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser?.['doctorId']) {
      this.doctorId = currentUser['doctorId'] as string;
    }
    this.loadConsultations();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadConsultations(): void {
    this.isLoading = true;
    const startOfDay = new Date(this.selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(this.selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    this.consultationsService
      .getAll({
        doctorId: this.doctorId || undefined,
        status: this.selectedStatus as ConsultationStatus || undefined,
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      })
      .subscribe({
        next: (consultations) => {
          this.dataSource.data = consultations;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading consultations:', err);
          this.isLoading = false;
        },
      });
  }

  onDateChange(): void {
    this.loadConsultations();
  }

  onStatusChange(): void {
    this.loadConsultations();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getStatusColor(status: ConsultationStatus): string {
    switch (status) {
      case ConsultationStatus.SCHEDULED:
        return 'primary';
      case ConsultationStatus.IN_PROGRESS:
        return 'accent';
      case ConsultationStatus.COMPLETED:
        return 'completed';
      case ConsultationStatus.CANCELLED:
        return 'warn';
      default:
        return '';
    }
  }

  getStatusLabel(status: ConsultationStatus): string {
    switch (status) {
      case ConsultationStatus.SCHEDULED:
        return 'CONSULTATIONS.STATUS.SCHEDULED';
      case ConsultationStatus.IN_PROGRESS:
        return 'CONSULTATIONS.STATUS.IN_PROGRESS';
      case ConsultationStatus.COMPLETED:
        return 'CONSULTATIONS.STATUS.COMPLETED';
      case ConsultationStatus.CANCELLED:
        return 'CONSULTATIONS.STATUS.CANCELLED';
      default:
        return status;
    }
  }

  startConsultation(consultation: Consultation): void {
    this.consultationsService
      .updateStatus(consultation._id, ConsultationStatus.IN_PROGRESS)
      .subscribe({
        next: () => {
          this.openConsultationForm(consultation);
        },
        error: (err) => {
          console.error('Error starting consultation:', err);
        },
      });
  }

  openConsultationForm(consultation: Consultation): void {
    const dialogRef = this.dialog.open(FormDialogComponent, {
      width: '95vw',
      maxWidth: '1200px',
      maxHeight: '95vh',
      data: { consultation },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadConsultations();
      }
    });
  }

  viewConsultation(consultation: Consultation): void {
    this.openConsultationForm(consultation);
  }

  getPatientName(consultation: Consultation): string {
    if (consultation.patient) {
      return `${consultation.patient.firstName} ${consultation.patient.lastName}`;
    }
    return 'Paciente';
  }

  getPatientAge(consultation: Consultation): number | null {
    if (consultation.patient?.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(consultation.patient.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    return null;
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
