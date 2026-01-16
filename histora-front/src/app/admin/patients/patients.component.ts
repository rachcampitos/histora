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
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { AdminService, AdminPatient, PatientQueryParams } from '@core/service/admin.service';
import { FeatherModule } from 'angular-feather';

@Component({
  standalone: true,
  selector: 'app-admin-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.scss'],
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
    FormsModule,
    TranslateModule,
    FeatherModule,
  ],
})
export class PatientsComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true;
  displayedColumns = ['patient', 'email', 'phone', 'status', 'services', 'lastService', 'actions'];
  dataSource = new MatTableDataSource<AdminPatient>([]);

  // Pagination
  totalPatients = 0;
  pageSize = 10;
  currentPage = 0;

  // Filters
  searchTerm = '';
  statusFilter = '';

  statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
  ];

  ngOnInit(): void {
    this.loadPatients();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  loadPatients(): void {
    this.isLoading = true;

    const params: PatientQueryParams = {
      page: this.currentPage + 1,
      limit: this.pageSize,
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }
    if (this.statusFilter) {
      params.status = this.statusFilter;
    }

    this.adminService.getPatients(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalPatients = response.pagination.total;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        this.snackBar.open('Error al cargar pacientes', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPatients();
  }

  applyFilter(): void {
    this.currentPage = 0;
    this.loadPatients();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.currentPage = 0;
    this.loadPatients();
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'badge-solid-green' : 'badge-solid-gray';
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '??';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getAuthProviderIcon(provider: string): string {
    switch (provider) {
      case 'google':
        return 'google';
      default:
        return 'mail';
    }
  }

  getAuthProviderTooltip(provider: string): string {
    switch (provider) {
      case 'google':
        return 'Registrado con Google';
      default:
        return 'Registrado con email';
    }
  }
}
