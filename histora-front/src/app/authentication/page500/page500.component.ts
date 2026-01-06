import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { AuthService, Role } from '@core';

@Component({
  selector: 'app-page500',
  templateUrl: './page500.component.html',
  styleUrls: ['./page500.component.scss'],
  imports: [FormsModule, MatButtonModule, RouterLink, MatCardModule],
})
export class Page500Component {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  goToHome() {
    const user = this.authService.currentUserValue;
    if (!user) {
      this.router.navigate(['/authentication/signin']);
      return;
    }

    const roleName = user.roles?.[0]?.name || '';
    if (roleName === Role.PlatformAdminUI || roleName === Role.PlatformAdmin) {
      this.router.navigate(['/admin/dashboard']);
    } else if (roleName === Role.Admin || roleName === Role.Doctor) {
      this.router.navigate(['/doctor/dashboard']);
    } else if (roleName === Role.Patient) {
      this.router.navigate(['/patient/dashboard']);
    } else {
      this.router.navigate(['/authentication/signin']);
    }
  }
}
