import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FeatherModule } from 'angular-feather';
import { AdminService } from '@core/service/admin.service';
import { VerificationDetailDialogComponent } from './dialogs/verification-detail-dialog.component';

interface NurseVerification {
  id: string;
  nurseId: string;
  userId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  dniNumber?: string;
  fullNameOnDni?: string;
  documents: Array<{ url: string; type: string; uploadedAt: Date }>;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;
  attemptNumber: number;
  createdAt: Date;
  nurse?: {
    cepNumber: string;
    specialties: string[];
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
  };
}

interface VerificationStats {
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  total: number;
}

@Component({
  selector: 'app-nurse-verifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    MatSnackBarModule,
    FeatherModule,
  ],
  templateUrl: './nurse-verifications.component.html',
  styleUrls: ['./nurse-verifications.component.scss'],
})
export class NurseVerificationsComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = [
    'nurse',
    'cep',
    'dni',
    'status',
    'attempt',
    'createdAt',
    'actions',
  ];

  dataSource = new MatTableDataSource<NurseVerification>([]);
  isLoading = false;
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  statusFilter = '';

  stats: VerificationStats = {
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  };

  statusOptions = [
    { value: '', label: 'Todas las verificaciones' },
    { value: 'pending', label: 'Pendientes de revisión' },
    { value: 'under_review', label: 'En Revisión' },
    { value: 'approved', label: 'Aprobadas' },
    { value: 'rejected', label: 'Requieren corrección' },
  ];

  ngOnInit(): void {
    this.loadStats();
    this.loadVerifications();
  }

  async loadStats(): Promise<void> {
    try {
      this.stats = await this.adminService.getNurseVerificationStats().toPromise() as VerificationStats;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async loadVerifications(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await this.adminService
        .getNurseVerifications({
          status: this.statusFilter || undefined,
          page: this.currentPage + 1,
          limit: this.pageSize,
        })
        .toPromise() as { verifications: NurseVerification[]; total: number };

      this.dataSource.data = response.verifications;
      this.totalItems = response.total;
    } catch (error) {
      console.error('Error loading verifications:', error);
      const snackBarRef = this.snackBar.open(
        'No pudimos cargar las verificaciones. Revisa tu conexión',
        'Reintentar',
        { duration: 5000 }
      );
      snackBarRef.onAction().subscribe(() => this.loadVerifications());
    } finally {
      this.isLoading = false;
    }
  }

  onStatusFilterChange(): void {
    this.currentPage = 0;
    this.loadVerifications();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadVerifications();
  }

  openDetail(verification: NurseVerification): void {
    const dialogRef = this.dialog.open(VerificationDetailDialogComponent, {
      width: '90vw',
      maxWidth: '800px',
      maxHeight: '90vh',
      data: { verificationId: verification.id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadStats();
        this.loadVerifications();
      }
    });
  }

  async markUnderReview(verification: NurseVerification): Promise<void> {
    try {
      await this.adminService
        .markNurseVerificationUnderReview(verification.id)
        .toPromise();
      this.snackBar.open('Marcada como en revisión', 'Cerrar', { duration: 2000 });
      this.loadStats();
      this.loadVerifications();
    } catch (error) {
      console.error('Error:', error);
      const snackBarRef = this.snackBar.open(
        'No se pudo actualizar el estado. Intenta nuevamente',
        'Reintentar',
        { duration: 5000 }
      );
      snackBarRef.onAction().subscribe(() => this.markUnderReview(verification));
    }
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'status-pending',
      under_review: 'status-review',
      approved: 'status-approved',
      rejected: 'status-rejected',
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      under_review: 'En Revisión',
      approved: 'Aprobada',
      rejected: 'Requiere corrección',
    };
    return labels[status] || status;
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '??';
  }
}
