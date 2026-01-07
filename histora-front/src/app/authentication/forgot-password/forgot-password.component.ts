import { Component, OnInit } from '@angular/core';
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

@Component({
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
  authForm!: UntypedFormGroup;
  submitted = false;
  isLoading = false;
  success = '';
  error = '';

  constructor(private formBuilder: UntypedFormBuilder) {}

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

    // Simulate API call - in production, this should call a real API
    setTimeout(() => {
      this.isLoading = false;
      this.success = 'Se ha enviado un enlace de recuperación a tu correo electrónico.';
      this.authForm.reset();
      this.submitted = false;
    }, 1500);
  }
}
