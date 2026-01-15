import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingService } from '../../core/services/onboarding.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: false,
})
export class LandingPage {
  constructor(
    private router: Router,
    private onboardingService: OnboardingService
  ) {}

  async navigateToRegister(): Promise<void> {
    await this.onboardingService.markLandingSeen();
    this.router.navigate(['/auth/register']);
  }

  async navigateToLogin(): Promise<void> {
    await this.onboardingService.markLandingSeen();
    this.router.navigate(['/auth/login']);
  }
}
