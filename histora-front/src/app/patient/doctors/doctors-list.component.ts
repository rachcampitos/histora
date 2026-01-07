import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { DoctorsService, DoctorProfile } from '../../doctor/profile/doctors.service';

@Component({
  selector: 'app-patient-doctors-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
    BreadcrumbComponent,
  ],
  templateUrl: './doctors-list.component.html',
  styleUrls: ['./doctors-list.component.scss'],
})
export class PatientDoctorsListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['photo', 'name', 'specialty', 'rating', 'consultationFee', 'actions'];
  dataSource = new MatTableDataSource<DoctorProfile>([]);
  isLoading = true;

  searchTerm = '';
  selectedSpecialty = '';
  specialties: string[] = [];

  private subscriptions = new Subscription();

  constructor(
    private doctorsService: DoctorsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDoctors();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadDoctors(): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.doctorsService.getPublicDoctors({ specialty: this.selectedSpecialty || undefined }).subscribe({
        next: (doctors) => {
          this.dataSource.data = doctors;
          this.extractSpecialties(doctors);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading doctors:', err);
          this.isLoading = false;
        },
      })
    );
  }

  private extractSpecialties(doctors: DoctorProfile[]): void {
    const specialtiesSet = new Set<string>();
    doctors.forEach(d => {
      if (d.specialty) {
        specialtiesSet.add(d.specialty);
      }
    });
    this.specialties = Array.from(specialtiesSet).sort();
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  onSpecialtyChange(): void {
    this.loadDoctors();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedSpecialty = '';
    this.dataSource.filter = '';
    this.loadDoctors();
  }

  viewProfile(doctor: DoctorProfile): void {
    this.router.navigate(['/patient/doctors', doctor._id]);
  }

  bookAppointment(doctor: DoctorProfile): void {
    this.router.navigate(['/patient/appointments/book'], {
      queryParams: { doctorId: doctor._id }
    });
  }

  getFullName(doctor: DoctorProfile): string {
    return `Dr. ${doctor.firstName} ${doctor.lastName}`;
  }

  getRatingStars(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  formatCurrency(amount: number, currency: string = 'PEN'): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}
