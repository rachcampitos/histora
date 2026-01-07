import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  clinic?: string;
  status: string;
  lastLogin: Date;
  createdAt: Date;
}

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
    FormsModule,
  ],
})
export class UsersComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true;
  displayedColumns = ['user', 'email', 'role', 'clinic', 'status', 'lastLogin', 'actions'];
  dataSource = new MatTableDataSource<User>([]);

  searchTerm = '';
  roleFilter = '';
  statusFilter = '';

  roleOptions = [
    { value: 'platform_admin', label: 'Admin Plataforma' },
    { value: 'clinic_admin', label: 'Admin Clínica' },
    { value: 'clinic_doctor', label: 'Doctor' },
    { value: 'clinic_staff', label: 'Staff' },
    { value: 'patient', label: 'Paciente' },
  ];

  statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'pending', label: 'Pendiente' },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers(): void {
    setTimeout(() => {
      const users: User[] = [
        {
          id: '1',
          firstName: 'Carlos',
          lastName: 'Méndez García',
          email: 'dr.carlos.mendez@histora.com',
          role: 'clinic_doctor',
          clinic: 'Clínica San Rafael',
          status: 'active',
          lastLogin: new Date('2024-01-15T10:30:00'),
          createdAt: new Date('2023-06-15'),
        },
        {
          id: '2',
          firstName: 'María',
          lastName: 'Rodríguez López',
          email: 'dr.maria.rodriguez@histora.com',
          role: 'clinic_doctor',
          clinic: 'Centro Médico Aurora',
          status: 'active',
          lastLogin: new Date('2024-01-14T15:45:00'),
          createdAt: new Date('2023-08-20'),
        },
        {
          id: '3',
          firstName: 'Administrador',
          lastName: 'Sistema',
          email: 'admin@histora.com',
          role: 'platform_admin',
          status: 'active',
          lastLogin: new Date('2024-01-15T09:00:00'),
          createdAt: new Date('2023-01-01'),
        },
        {
          id: '4',
          firstName: 'Juan',
          lastName: 'Pérez Sánchez',
          email: 'paciente.juan@gmail.com',
          role: 'patient',
          clinic: 'Clínica San Rafael',
          status: 'active',
          lastLogin: new Date('2024-01-12T11:20:00'),
          createdAt: new Date('2023-09-10'),
        },
        {
          id: '5',
          firstName: 'Ana',
          lastName: 'García Hernández',
          email: 'paciente.ana@gmail.com',
          role: 'patient',
          clinic: 'Centro Médico Aurora',
          status: 'active',
          lastLogin: new Date('2024-01-10T16:00:00'),
          createdAt: new Date('2023-10-05'),
        },
        {
          id: '6',
          firstName: 'Roberto',
          lastName: 'Martínez Flores',
          email: 'paciente.roberto@gmail.com',
          role: 'patient',
          clinic: 'Clínica Familiar',
          status: 'inactive',
          lastLogin: new Date('2023-12-01T09:15:00'),
          createdAt: new Date('2023-07-20'),
        },
        {
          id: '7',
          firstName: 'Patricia',
          lastName: 'Ruiz Morales',
          email: 'patricia.ruiz@vidasana.com',
          role: 'clinic_admin',
          clinic: 'Clínica Vida Sana',
          status: 'active',
          lastLogin: new Date('2024-01-15T08:30:00'),
          createdAt: new Date('2023-04-10'),
        },
        {
          id: '8',
          firstName: 'Laura',
          lastName: 'Moreno Silva',
          email: 'laura@dermaclinica.com',
          role: 'clinic_staff',
          clinic: 'Dermaclínica Estética',
          status: 'pending',
          lastLogin: new Date('2024-01-13T14:00:00'),
          createdAt: new Date('2024-01-08'),
        },
      ];

      this.dataSource.data = users;
      this.isLoading = false;
    }, 500);
  }

  applyFilter(): void {
    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const searchStr = filter.toLowerCase();
      const fullName = `${data.firstName} ${data.lastName}`.toLowerCase();
      const matchesSearch = !this.searchTerm ||
        fullName.includes(searchStr) ||
        data.email.toLowerCase().includes(searchStr);
      const matchesRole = !this.roleFilter || data.role === this.roleFilter;
      const matchesStatus = !this.statusFilter || data.status === this.statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    };
    this.dataSource.filter = this.searchTerm.toLowerCase();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.dataSource.filter = '';
  }

  getRoleLabel(role: string): string {
    const found = this.roleOptions.find(r => r.value === role);
    return found ? found.label : role;
  }

  getRoleClass(role: string): string {
    const classes: Record<string, string> = {
      platform_admin: 'badge-role-admin',
      clinic_admin: 'badge-role-clinic-admin',
      clinic_doctor: 'badge-role-doctor',
      clinic_staff: 'badge-role-staff',
      patient: 'badge-role-patient',
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
    const found = this.statusOptions.find(s => s.value === status);
    return found ? found.label : status;
  }

  viewUser(user: User): void {
    console.log('View user:', user);
  }

  editUser(user: User): void {
    console.log('Edit user:', user);
  }

  resetPassword(user: User): void {
    console.log('Reset password for:', user);
  }

  toggleStatus(user: User): void {
    console.log('Toggle status for:', user);
  }

  deleteUser(user: User): void {
    console.log('Delete user:', user);
  }
}
