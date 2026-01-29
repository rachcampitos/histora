import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { AdminService, AdminNurse, NurseQueryParams } from '@core/service/admin.service';
import { ConfirmDialogComponent } from '../users/dialogs/confirm-dialog.component';
import { FeatherModule } from 'angular-feather';

interface NursesSummary {
  total: number;
  active: number;
  verified: number;
  atRisk: number;
  pendingVerification: number;
}

@Component({
  standalone: true,
  selector: 'app-admin-nurses',
  templateUrl: './nurses.component.html',
  styleUrls: ['./nurses.component.scss'],
  imports: [
    CommonModule,
    BreadcrumbComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    FormsModule,
    FeatherModule,
  ],
})
export class NursesComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true;
  displayedColumns = ['nurse', 'cep', 'status', 'verification', 'quality', 'services', 'actions'];
  dataSource = new MatTableDataSource<AdminNurse>([]);

  // Summary stats
  summary: NursesSummary = {
    total: 0,
    active: 0,
    verified: 0,
    atRisk: 0,
    pendingVerification: 0,
  };

  // Pagination
  totalNurses = 0;
  pageSize = 10;
  currentPage = 0;

  // Filters
  searchTerm = '';
  statusFilter = '';
  verificationFilter = '';
  availabilityFilter = '';

  verificationOptions = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'under_review', label: 'En Revision' },
    { value: 'approved', label: 'Aprobada' },
    { value: 'rejected', label: 'Rechazada' },
  ];

  statusOptions = [
    { value: 'active', label: 'Activa' },
    { value: 'inactive', label: 'Inactiva' },
  ];

  availabilityOptions = [
    { value: 'available', label: 'Disponible' },
    { value: 'unavailable', label: 'No Disponible' },
  ];

  ngOnInit(): void {
    this.loadNurses();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  loadNurses(): void {
    this.isLoading = true;

    const params: NurseQueryParams = {
      page: this.currentPage + 1,
      limit: this.pageSize,
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }
    if (this.statusFilter) {
      params.status = this.statusFilter;
    }
    if (this.verificationFilter) {
      params.verificationStatus = this.verificationFilter;
    }
    if (this.availabilityFilter) {
      params.availability = this.availabilityFilter;
    }

    this.adminService.getNurses(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalNurses = response.pagination.total;
        this.updateSummary();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading nurses:', err);
        this.snackBar.open('Error al cargar enfermeras', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadNurses();
  }

  applyFilter(): void {
    this.currentPage = 0;
    this.loadNurses();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.verificationFilter = '';
    this.availabilityFilter = '';
    this.currentPage = 0;
    this.loadNurses();
  }

  getVerificationClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'badge-warning',
      under_review: 'badge-info',
      approved: 'badge-success',
      rejected: 'badge-danger',
    };
    return classes[status] || 'badge-default';
  }

  getVerificationLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      under_review: 'En Revision',
      approved: 'Aprobada',
      rejected: 'Rechazada',
    };
    return labels[status] || status;
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'badge-solid-green' : 'badge-solid-gray';
  }

  getAvailabilityClass(isAvailable: boolean): string {
    return isAvailable ? 'badge-available' : 'badge-unavailable';
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '??';
  }

  // Quality Score: Combines rating (50%), review count (25%), services count (25%)
  calculateQualityScore(nurse: AdminNurse): number {
    // Rating component: 0-5 -> 0-50 points
    const ratingScore = (nurse.averageRating / 5) * 50;

    // Reviews component: More reviews = better, max at 50 reviews
    const reviewsScore = Math.min(nurse.totalReviews / 50, 1) * 25;

    // Services component: More services = better, max at 100 services
    const servicesScore = Math.min(nurse.totalServicesCompleted / 100, 1) * 25;

    return Math.round(ratingScore + reviewsScore + servicesScore);
  }

  getQualityClass(score: number): string {
    if (score >= 70) return 'quality-excellent';
    if (score >= 50) return 'quality-good';
    if (score >= 30) return 'quality-average';
    return 'quality-low';
  }

  getQualityLabel(score: number): string {
    if (score >= 70) return 'Excelente';
    if (score >= 50) return 'Bueno';
    if (score >= 30) return 'Regular';
    return 'Bajo';
  }

  isAtRisk(nurse: AdminNurse): boolean {
    return nurse.averageRating < 3 || this.calculateQualityScore(nurse) < 30;
  }

  updateSummary(): void {
    const nurses = this.dataSource.data;
    this.summary = {
      total: this.totalNurses,
      active: nurses.filter(n => n.isActive).length,
      verified: nurses.filter(n => n.verificationStatus === 'approved').length,
      atRisk: nurses.filter(n => this.isAtRisk(n)).length,
      pendingVerification: nurses.filter(n => n.verificationStatus === 'pending').length,
    };
  }

  viewReviews(nurse: AdminNurse): void {
    // TODO: Navigate to reviews for this nurse
    this.snackBar.open(`Resenas de ${nurse.user?.firstName}: ${nurse.totalReviews} resenas`, 'Ver', {
      duration: 3000,
    });
  }

  suspendNurse(nurse: AdminNurse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Suspender Enfermera',
        message: `¿Suspender temporalmente a ${nurse.user?.firstName} ${nurse.user?.lastName}? Esto desactivara su cuenta y no podra recibir servicios.`,
        confirmText: 'Suspender',
        confirmColor: 'warn',
        icon: 'block',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminService.toggleNurseStatus(nurse.id).subscribe({
          next: (response) => {
            this.loadNurses();
            this.snackBar.open('Enfermera suspendida temporalmente', 'Cerrar', { duration: 3000 });
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al suspender enfermera', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  toggleStatus(nurse: AdminNurse): void {
    const action = nurse.isActive ? 'desactivar' : 'activar';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `${nurse.isActive ? 'Desactivar' : 'Activar'} Enfermera`,
        message: `¿Deseas ${action} a ${nurse.user?.firstName} ${nurse.user?.lastName}?`,
        confirmText: nurse.isActive ? 'Desactivar' : 'Activar',
        confirmColor: nurse.isActive ? 'warn' : 'primary',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminService.toggleNurseStatus(nurse.id).subscribe({
          next: (response) => {
            this.loadNurses();
            this.snackBar.open(response.message, 'Cerrar', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Error al cambiar estado', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  toggleAvailability(nurse: AdminNurse): void {
    if (!nurse.isActive) {
      this.snackBar.open('No se puede cambiar disponibilidad de una enfermera inactiva', 'Cerrar', { duration: 3000 });
      return;
    }

    const action = nurse.isAvailable ? 'no disponible' : 'disponible';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Cambiar Disponibilidad',
        message: `¿Marcar a ${nurse.user?.firstName} ${nurse.user?.lastName} como ${action}?`,
        confirmText: 'Confirmar',
        confirmColor: 'primary',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminService.toggleNurseAvailability(nurse.id).subscribe({
          next: (response) => {
            this.loadNurses();
            this.snackBar.open(response.message, 'Cerrar', { duration: 3000 });
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al cambiar disponibilidad', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  deleteNurse(nurse: AdminNurse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Eliminar Enfermera',
        message: `¿Eliminar a ${nurse.user?.firstName} ${nurse.user?.lastName}? Esta accion desactivara la cuenta.`,
        confirmText: 'Eliminar',
        confirmColor: 'warn',
        icon: 'delete_forever',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminService.deleteNurse(nurse.id).subscribe({
          next: (response) => {
            this.loadNurses();
            this.snackBar.open(response.message, 'Cerrar', { duration: 3000 });
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al eliminar enfermera', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }
}
