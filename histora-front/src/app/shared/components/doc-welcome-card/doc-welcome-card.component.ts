import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/service/auth.service';
import { DashboardService } from '@core/service/dashboard.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-doc-welcome-card',
  imports: [CommonModule, TranslateModule],
  templateUrl: './doc-welcome-card.component.html',
  styleUrl: './doc-welcome-card.component.scss'
})
export class DocWelcomeCardComponent implements OnInit, OnDestroy {
  doctorName = '';
  doctorSpecialty = '';
  private subscriptions = new Subscription();

  // Dashboard stats
  appointmentsCount = 0;
  consultationsCount = 0;
  patientsCount = 0;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.subscribeToUserUpdates();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private subscribeToUserUpdates(): void {
    // Get initial value
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.updateDoctorInfo(currentUser);
    }

    // Subscribe to updates
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        if (user && Object.keys(user).length > 0) {
          this.updateDoctorInfo(user);
        }
      })
    );
  }

  private updateDoctorInfo(user: any): void {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    this.doctorName = `Dr. ${firstName} ${lastName}`.trim();
    if (this.doctorName === 'Dr.') {
      this.doctorName = 'Dr.';
    }
    this.doctorSpecialty = user.specialty || '';
  }

  private loadStats(): void {
    this.subscriptions.add(
      this.dashboardService.getStats().subscribe({
        next: (stats) => {
          this.appointmentsCount = stats.appointmentsCount;
          this.consultationsCount = stats.completedConsultations;
          this.patientsCount = stats.patientsCount;
        },
        error: (err) => {
          console.error('Error loading dashboard stats:', err);
        }
      })
    );
  }
}
