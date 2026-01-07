import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  standalone: true,
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
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
export class ForgotPasswordComponent implements OnInit {
  private formBuilder = inject(UntypedFormBuilder);
  private loginService = inject(LoginService);

  authForm!: UntypedFormGroup;
  submitted = false;
  isLoading = false;
  success = '';
  error = '';

  ngOnInit() {
    this.authForm = this.formBuilder.group({
      email: [
        '',
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
    });
  }

  get f() {
    return this.authForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';
    this.success = '';

    if (this.authForm.invalid) {
      return;
    }

    this.isLoading = true;
    const email = this.authForm.get('email')?.value;

    this.loginService.forgotPassword(email).subscribe({
      next: (response) => {
        this.isLoading = false;
        if ('message' in response) {
          this.success = response.message;
          this.authForm.reset();
          this.submitted = false;
        } else if ('error' in response) {
          this.error = response.error || 'Error al procesar la solicitud';
        }
      },
      error: () => {
        this.isLoading = false;
        this.error = 'Error de conexión. Intenta de nuevo.';
      },
    });
  }
}
