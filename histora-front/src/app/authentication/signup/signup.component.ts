import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '@core';
import { LoginService } from '@core/service/login.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    RouterModule,
    TranslateModule,
  ],
})
export class SignupComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private loginService = inject(LoginService);

  signupForm!: FormGroup;
  hidePassword = true;
  isLoading = false;
  error = '';
  success = '';

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.signupForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      acceptTerms: [false, Validators.requiredTrue],
    });
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.isLoading = true;
      this.error = '';
      this.success = '';

      const { firstName, lastName, email, phone, password } = this.signupForm.value;

      this.loginService.registerPatient({
        firstName,
        lastName,
        email,
        phone,
        password,
      }).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response && 'access_token' in response && response.access_token) {
            this.success = 'Cuenta creada exitosamente. Redirigiendo...';
            setTimeout(() => {
              this.router.navigate(['/patient/dashboard']);
            }, 1500);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.error = err.error?.message || 'Error al crear la cuenta. Intenta de nuevo.';
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.signupForm.controls).forEach((key) => {
      const control = this.signupForm.get(key);
      control?.markAsTouched();
    });
  }

  signInWithGoogle(): void {
    this.authService.loginWithGoogle();
  }
}
