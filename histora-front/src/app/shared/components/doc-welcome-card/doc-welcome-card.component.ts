import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/service/auth.service';
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
  private userSubscription?: Subscription;

  // TODO: These should come from a service that fetches real stats
  appointmentsCount = 0;
  consultationsCount = 0;
  patientsCount = 0;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.subscribeToUserUpdates();
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  private subscribeToUserUpdates(): void {
    // Get initial value
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.updateDoctorInfo(currentUser);
    }

    // Subscribe to updates
    this.userSubscription = this.authService.user$.subscribe((user) => {
      if (user && Object.keys(user).length > 0) {
        this.updateDoctorInfo(user);
      }
    });
  }

  private updateDoctorInfo(user: any): void {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    this.doctorName = `Dr. ${firstName} ${lastName}`.trim();
    if (this.doctorName === 'Dr.') {
      this.doctorName = 'Dr.';
    }
    // Specialty would come from the doctor profile, not the user
    // For now, we'll leave it empty or use a default
    this.doctorSpecialty = user.specialty || '';
  }
}
