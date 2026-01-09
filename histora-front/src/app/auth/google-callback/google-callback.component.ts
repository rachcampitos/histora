import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/service/auth.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="callback-container">
      <mat-spinner diameter="48"></mat-spinner>
      <p>{{ message }}</p>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 1rem;
    }
    p {
      color: #666;
      font-size: 1rem;
    }
  `]
})
export class GoogleCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  message = 'Procesando inicio de sesión con Google...';

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParams;
    console.log('GoogleCallback - queryParams:', queryParams);

    if (queryParams['access_token'] && queryParams['refresh_token'] && queryParams['user']) {
      try {
        console.log('GoogleCallback - parsing user...');
        const user = JSON.parse(queryParams['user']);
        const isNewUser = queryParams['is_new_user'] === 'true';
        console.log('GoogleCallback - user:', user, 'isNewUser:', isNewUser);

        // Store tokens and user data
        this.authService.handleGoogleCallback(
          queryParams['access_token'],
          queryParams['refresh_token'],
          user
        );
        console.log('GoogleCallback - tokens stored');

        // If new user, redirect to role selection
        if (isNewUser) {
          console.log('GoogleCallback - new user, redirecting to role selection');
          this.router.navigate(['/auth/google/select-type'], {
            queryParams: { name: user.firstName }
          });
          return;
        }

        // Navigate based on role
        const targetRoute = this.authService.getDefaultRouteForRole(user.role);
        console.log('GoogleCallback - navigating to:', targetRoute);
        this.router.navigate([targetRoute]);
      } catch (error) {
        console.error('GoogleCallback - error:', error);
        this.message = 'Error al procesar la respuesta de Google';
        setTimeout(() => {
          this.router.navigate(['/authentication/signin']);
        }, 2000);
      }
    } else if (queryParams['error']) {
      console.log('GoogleCallback - error in params:', queryParams['error']);
      this.message = 'Error en la autenticación con Google';
      setTimeout(() => {
        this.router.navigate(['/authentication/signin']);
      }, 2000);
    } else {
      console.log('GoogleCallback - no tokens, redirecting to signin');
      this.router.navigate(['/authentication/signin']);
    }
  }
}
