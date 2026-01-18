import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { UnsubscribeOnDestroyAdapter } from '@shared';
import { AuthService, Role } from '@core';
import { AuthResponse } from '@core/models/interface';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    TranslateModule,
  ],
})
export class SigninComponent
  extends UnsubscribeOnDestroyAdapter
  implements OnInit
{
  authForm!: UntypedFormGroup;
  submitted = false;
  loading = false;
  rememberMe = false;
  error = '';
  hide = true;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    super();
  }

  ngOnInit() {
    this.authForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    // Check for OAuth error in query params
    const errorParam = this.route.snapshot.queryParams['error'];
    if (errorParam) {
      // Clear any stale session data when redirected with OAuth error
      this.authService.logout().subscribe();

      // Show appropriate error message
      if (errorParam === 'google_auth_failed') {
        this.error = 'Error en la autenticación con Google. Por favor intenta de nuevo.';
      } else if (errorParam === 'google_auth_cancelled') {
        this.error = 'Autenticación con Google cancelada.';
      } else {
        this.error = 'Error de autenticación. Por favor intenta de nuevo.';
      }
    }
  }

  get f() {
    return this.authForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.loading = true;
    this.error = '';

    if (this.authForm.invalid) {
      this.error = 'Email y contraseña son requeridos';
      this.loading = false;
      return;
    }

    this.authService
      .login(this.f['email'].value, this.f['password'].value, this.rememberMe)
      .subscribe({
        next: (response) => {
          this.loading = false;

          // Check if response is an auth response (success)
          if (this.isAuthResponse(response)) {
            const role = response.user.roles?.[0];
            const roleName = role?.name || '';

            if (roleName === Role.PlatformAdminUI || roleName === Role.PlatformAdmin) {
              this.router.navigate(['/admin/dashboard']);
            } else if (roleName === Role.Admin || roleName === Role.Doctor) {
              this.router.navigate(['/doctor/dashboard']);
            } else if (roleName === Role.Patient) {
              this.router.navigate(['/patient/dashboard']);
            } else {
              this.router.navigate(['/doctor/dashboard']);
            }
          } else {
            // Handle error response
            this.error = (response as { error?: string }).error || 'Credenciales inválidas';
            this.submitted = false;
          }
        },
        error: (error) => {
          this.error = error.message || 'Error al iniciar sesión';
          this.submitted = false;
          this.loading = false;
        },
      });
  }

  private isAuthResponse(response: unknown): response is AuthResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      'access_token' in response &&
      'user' in response
    );
  }

  signInWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  signInWithFacebook(): void {
    // TODO: Implement Facebook login
  }

  signInWithApple(): void {
    // TODO: Implement Apple login
  }
}
