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
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { AdminService, AdminUser, UserQueryParams } from '@core/service/admin.service';
import { UserFormDialogComponent } from './dialogs/user-form-dialog.component';
import { ConfirmDialogComponent } from './dialogs/confirm-dialog.component';

@Component({
  standalone: true,
  selector: 'app-admin-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
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
  ],
})
export class UsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true;
  displayedColumns = ['user', 'email', 'role', 'clinic', 'status', 'createdAt', 'lastLogin', 'actions'];
  dataSource = new MatTableDataSource<AdminUser>([]);

  // Pagination
  totalUsers = 0;
  pageSize = 10;
  currentPage = 0;

  // Filters
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';

  roleOptions = [
    { value: 'platform_admin', label: 'Admin Plataforma' },
    { value: 'clinic_owner', label: 'Dueño Clínica' },
    { value: 'clinic_admin', label: 'Admin Clínica' },
    { value: 'clinic_doctor', label: 'Doctor' },
    { value: 'clinic_staff', label: 'Staff' },
    { value: 'patient', label: 'Paciente' },
    { value: 'nurse', label: 'Enfermera' },
  ];

  statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  loadUsers(): void {
    this.isLoading = true;

    const params: UserQueryParams = {
      page: this.currentPage + 1,
      limit: this.pageSize,
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }
    if (this.roleFilter) {
      params.role = this.roleFilter;
    }
    if (this.statusFilter) {
      params.status = this.statusFilter;
    }

    this.adminService.getUsers(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalUsers = response.pagination.total;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  applyFilter(): void {
    this.currentPage = 0;
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.currentPage = 0;
    this.loadUsers();
  }

  getRoleLabel(role: string): string {
    const found = this.roleOptions.find((r) => r.value === role);
    return found ? found.label : role;
  }

  getRoleClass(role: string): string {
    const classes: Record<string, string> = {
      platform_admin: 'badge-role-admin',
      clinic_owner: 'badge-role-clinic-admin',
      clinic_admin: 'badge-role-clinic-admin',
      clinic_doctor: 'badge-role-doctor',
      clinic_staff: 'badge-role-staff',
      patient: 'badge-role-patient',
      nurse: 'badge-role-nurse',
    };
    return classes[role] || 'badge-role-default';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'badge-solid-green',
      inactive: 'badge-solid-gray',
      pending: 'badge-solid-orange',
    };
    return classes[status] || 'badge-solid-gray';
  }

  getStatusLabel(status: string): string {
    const found = this.statusOptions.find((s) => s.value === status);
    return found ? found.label : status;
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      data: { mode: 'create', roleOptions: this.roleOptions },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
        this.snackBar.open('Usuario creado exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  viewUser(user: AdminUser): void {
    this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      data: { mode: 'view', user, roleOptions: this.roleOptions },
    });
  }

  editUser(user: AdminUser): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      data: { mode: 'edit', user, roleOptions: this.roleOptions },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
        this.snackBar.open('Usuario actualizado exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  resetPassword(user: AdminUser): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Restablecer Contraseña',
        message: `¿Estás seguro de restablecer la contraseña de ${user.firstName} ${user.lastName}?`,
        confirmText: 'Restablecer',
        confirmColor: 'primary',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminService.resetUserPassword(user.id).subscribe({
          next: (response) => {
            if (response.temporaryPassword) {
              this.snackBar.open(`Contraseña temporal: ${response.temporaryPassword}`, 'Copiar', {
                duration: 10000,
              });
            } else {
              this.snackBar.open(response.message, 'Cerrar', { duration: 3000 });
            }
          },
          error: () => {
            this.snackBar.open('Error al restablecer contraseña', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  toggleStatus(user: AdminUser): void {
    const action = user.status === 'active' ? 'desactivar' : 'activar';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `${user.status === 'active' ? 'Desactivar' : 'Activar'} Usuario`,
        message: `¿Estás seguro de ${action} a ${user.firstName} ${user.lastName}?`,
        confirmText: user.status === 'active' ? 'Desactivar' : 'Activar',
        confirmColor: user.status === 'active' ? 'warn' : 'primary',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminService.toggleUserStatus(user.id).subscribe({
          next: (response) => {
            this.loadUsers();
            this.snackBar.open(response.message, 'Cerrar', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Error al cambiar estado del usuario', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  deleteUser(user: AdminUser): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Usuario',
        message: `¿Estás seguro de eliminar a ${user.firstName} ${user.lastName}? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminService.deleteUser(user.id).subscribe({
          next: (response) => {
            this.loadUsers();
            this.snackBar.open(response.message, 'Cerrar', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Error al eliminar usuario', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }
}
