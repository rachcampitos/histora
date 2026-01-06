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
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

interface Clinic {
  id: string;
  name: string;
  owner: string;
  ownerEmail: string;
  plan: string;
  status: string;
  doctorsCount: number;
  patientsCount: number;
  createdAt: Date;
  lastActivity: Date;
}

@Component({
  selector: 'app-admin-clinics',
  templateUrl: './clinics.component.html',
  styleUrls: ['./clinics.component.scss'],
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
    MatChipsModule,
    FormsModule,
  ],
})
export class ClinicsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true;
  displayedColumns = ['name', 'owner', 'plan', 'status', 'doctorsCount', 'patientsCount', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Clinic>([]);

  // Filters
  searchTerm = '';
  statusFilter = '';
  planFilter = '';

  statusOptions = ['active', 'pending', 'trial', 'suspended'];
  planOptions = ['Basic', 'Professional', 'Premium', 'Enterprise'];

  ngOnInit(): void {
    this.loadClinics();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadClinics(): void {
    // Simulated data - replace with API calls
    setTimeout(() => {
      const clinics: Clinic[] = [
        {
          id: '1',
          name: 'Clínica San Rafael',
          owner: 'Dr. Carlos Méndez',
          ownerEmail: 'carlos@sanrafael.com',
          plan: 'Premium',
          status: 'active',
          doctorsCount: 8,
          patientsCount: 450,
          createdAt: new Date('2023-06-15'),
          lastActivity: new Date('2024-01-15'),
        },
        {
          id: '2',
          name: 'Centro Médico Aurora',
          owner: 'Dra. María López',
          ownerEmail: 'maria@aurora.com',
          plan: 'Professional',
          status: 'active',
          doctorsCount: 5,
          patientsCount: 280,
          createdAt: new Date('2023-08-20'),
          lastActivity: new Date('2024-01-14'),
        },
        {
          id: '3',
          name: 'Hospital del Valle',
          owner: 'Dr. Juan Hernández',
          ownerEmail: 'juan@valle.com',
          plan: 'Enterprise',
          status: 'pending',
          doctorsCount: 25,
          patientsCount: 1200,
          createdAt: new Date('2024-01-08'),
          lastActivity: new Date('2024-01-08'),
        },
        {
          id: '4',
          name: 'Clínica Familiar',
          owner: 'Dra. Ana García',
          ownerEmail: 'ana@familiar.com',
          plan: 'Basic',
          status: 'active',
          doctorsCount: 2,
          patientsCount: 95,
          createdAt: new Date('2023-11-05'),
          lastActivity: new Date('2024-01-12'),
        },
        {
          id: '5',
          name: 'Centro Dental Plus',
          owner: 'Dr. Roberto Sánchez',
          ownerEmail: 'roberto@dentalplus.com',
          plan: 'Professional',
          status: 'trial',
          doctorsCount: 3,
          patientsCount: 45,
          createdAt: new Date('2024-01-02'),
          lastActivity: new Date('2024-01-15'),
        },
        {
          id: '6',
          name: 'Clínica Vida Sana',
          owner: 'Dra. Patricia Ruiz',
          ownerEmail: 'patricia@vidasana.com',
          plan: 'Premium',
          status: 'active',
          doctorsCount: 6,
          patientsCount: 320,
          createdAt: new Date('2023-04-10'),
          lastActivity: new Date('2024-01-15'),
        },
        {
          id: '7',
          name: 'Centro Pediátrico Feliz',
          owner: 'Dr. Miguel Torres',
          ownerEmail: 'miguel@pediatricofeliz.com',
          plan: 'Professional',
          status: 'suspended',
          doctorsCount: 4,
          patientsCount: 180,
          createdAt: new Date('2023-02-28'),
          lastActivity: new Date('2023-12-01'),
        },
        {
          id: '8',
          name: 'Dermaclínica Estética',
          owner: 'Dra. Laura Moreno',
          ownerEmail: 'laura@dermaclinica.com',
          plan: 'Basic',
          status: 'active',
          doctorsCount: 2,
          patientsCount: 75,
          createdAt: new Date('2023-09-15'),
          lastActivity: new Date('2024-01-13'),
        },
      ];

      this.dataSource.data = clinics;
      this.isLoading = false;
    }, 500);
  }

  applyFilter(): void {
    this.dataSource.filterPredicate = (data: Clinic, filter: string) => {
      const searchStr = filter.toLowerCase();
      const matchesSearch = !this.searchTerm ||
        data.name.toLowerCase().includes(searchStr) ||
        data.owner.toLowerCase().includes(searchStr) ||
        data.ownerEmail.toLowerCase().includes(searchStr);
      const matchesStatus = !this.statusFilter || data.status === this.statusFilter;
      const matchesPlan = !this.planFilter || data.plan === this.planFilter;
      return matchesSearch && matchesStatus && matchesPlan;
    };
    this.dataSource.filter = this.searchTerm.toLowerCase();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.planFilter = '';
    this.dataSource.filter = '';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'badge-solid-green',
      pending: 'badge-solid-orange',
      trial: 'badge-solid-blue',
      suspended: 'badge-solid-red',
    };
    return classes[status] || 'badge-solid-gray';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      pending: 'Pendiente',
      trial: 'Prueba',
      suspended: 'Suspendido',
    };
    return labels[status] || status;
  }

  getPlanClass(plan: string): string {
    const classes: Record<string, string> = {
      Basic: 'badge-outline-gray',
      Professional: 'badge-outline-blue',
      Premium: 'badge-outline-purple',
      Enterprise: 'badge-outline-gold',
    };
    return classes[plan] || 'badge-outline-gray';
  }

  viewClinic(clinic: Clinic): void {
    console.log('View clinic:', clinic);
  }

  editClinic(clinic: Clinic): void {
    console.log('Edit clinic:', clinic);
  }

  suspendClinic(clinic: Clinic): void {
    console.log('Suspend clinic:', clinic);
  }

  deleteClinic(clinic: Clinic): void {
    console.log('Delete clinic:', clinic);
  }
}
