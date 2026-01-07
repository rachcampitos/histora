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
      email: ['admin@histora.pe', [Validators.required, Validators.email]],
      password: ['admin123', Validators.required],
    });
  }

  get f() {
    return this.authForm.controls;
  }

  adminSet() {
    this.authForm.get('email')?.setValue('admin@histora.pe');
    this.authForm.get('password')?.setValue('admin123');
  }

  doctorSet() {
    this.authForm.get('email')?.setValue('doctor@histora.pe');
    this.authForm.get('password')?.setValue('doctor123');
  }

  patientSet() {
    this.authForm.get('email')?.setValue('patient@histora.pe');
    this.authForm.get('password')?.setValue('patient123');
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
      .login(this.f['email'].value, this.f['password'].value, false)
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
    console.log('Login with Facebook');
  }

  signInWithApple(): void {
    console.log('Login with Apple');
  }
}
