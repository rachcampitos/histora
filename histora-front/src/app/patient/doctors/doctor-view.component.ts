import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { DoctorsService, DoctorProfile } from '../../doctor/profile/doctors.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CurrencyService } from '@core/service/currency.service';

@Component({
  selector: 'app-doctor-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    TranslateModule,
    BreadcrumbComponent,
  ],
  templateUrl: './doctor-view.component.html',
  styleUrls: ['./doctor-view.component.scss'],
})
export class DoctorViewComponent implements OnInit, OnDestroy {
  doctor: DoctorProfile | null = null;
  isLoading = true;
  cvViewerUrl: SafeResourceUrl | null = null;

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorsService: DoctorsService,
    private sanitizer: DomSanitizer,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    const doctorId = this.route.snapshot.paramMap.get('id');
    if (doctorId) {
      this.loadDoctor(doctorId);
    } else {
      this.router.navigate(['/patient/doctors']);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadDoctor(id: string): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.doctorsService.getPublicDoctorById(id).subscribe({
        next: (doctor) => {
          this.doctor = doctor;
          if (doctor.cvUrl && doctor.cvFormat === 'pdf') {
            // For PDF, use Google Docs viewer for inline viewing without download
            const encodedUrl = encodeURIComponent(doctor.cvUrl);
            this.cvViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
              `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`
            );
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading doctor:', err);
          this.isLoading = false;
          this.router.navigate(['/patient/doctors']);
        },
      })
    );
  }

  getFullName(): string {
    if (!this.doctor) return '';
    return `Dr. ${this.doctor.firstName} ${this.doctor.lastName}`;
  }

  getRatingStars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  formatCurrency(amount: number, currency: string = 'PEN'): string {
    // Use CurrencyService to show converted price based on user's language
    return this.currencyService.formatWithConversion(amount, currency);
  }

  bookAppointment(): void {
    if (this.doctor) {
      this.router.navigate(['/patient/appointments/book'], {
        queryParams: { doctorId: this.doctor._id }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/patient/doctors']);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
