import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { LoginService } from '@core/service/login.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
    TranslateModule,
  ],
})
export class ResetPasswordComponent implements OnInit {
  private formBuilder = inject(UntypedFormBuilder);
  private loginService = inject(LoginService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  authForm!: UntypedFormGroup;
  submitted = false;
  isLoading = false;
  success = '';
  error = '';
  token = '';
  hidePassword = true;
  hideConfirmPassword = true;

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';

    if (!this.token) {
      this.error = 'El enlace de recuperación es inválido';
    }

    this.authForm = this.formBuilder.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: UntypedFormGroup) {
    const password = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  get f() {
    return this.authForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';
    this.success = '';

    if (this.authForm.invalid || !this.token) {
      return;
    }

    this.isLoading = true;
    const newPassword = this.authForm.get('newPassword')?.value;

    this.loginService.resetPassword(this.token, newPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        if ('message' in response) {
          this.success = response.message;
          setTimeout(() => {
            this.router.navigate(['/authentication/signin']);
          }, 3000);
        } else if ('error' in response) {
          this.error = response.error || 'Error al restablecer la contraseña';
        }
      },
      error: () => {
        this.isLoading = false;
        this.error = 'Error de conexión. Intenta de nuevo.';
      },
    });
  }
}
