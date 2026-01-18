import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/service/auth.service';
import { LoginService } from '@core/service/login.service';

@Component({
  standalone: true,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatSelectModule,
    MatOptionModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ]
})
export class SettingsComponent implements OnInit, OnDestroy {
  securityForm: FormGroup;
  accountForm: FormGroup;
  isSavingSecurity = false;
  isSavingAccount = false;
  userName = '';

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loginService: LoginService,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.securityForm = this.fb.group({
      username: [''],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(8)]],
    });

    this.accountForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      city: [''],
      email: ['', [Validators.required, Validators.email]],
      country: [''],
      dateOfBirth: [''],
      mobile: [''],
      bloodGroup: [''],
      address: [''],
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadUserData(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

      this.securityForm.patchValue({
        username: this.userName,
      });

      this.accountForm.patchValue({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }

  saveSecuritySettings(): void {
    if (this.securityForm.invalid) {
      return;
    }

    const { currentPassword, newPassword } = this.securityForm.value;
    if (!currentPassword || !newPassword) {
      this.snackBar.open(
        'Por favor ingresa tu contraseña actual y nueva',
        this.translate.instant('COMMON.ACTIONS.CLOSE'),
        { duration: 3000 }
      );
      return;
    }

    this.isSavingSecurity = true;
    this.loginService.changePassword(currentPassword, newPassword).subscribe({
      next: (response) => {
        this.isSavingSecurity = false;
        if ('success' in response && response.success) {
          this.snackBar.open(
            this.translate.instant('SETTINGS.MESSAGES.SECURITY_SAVED'),
            this.translate.instant('COMMON.ACTIONS.CLOSE'),
            { duration: 3000 }
          );
          this.securityForm.patchValue({ currentPassword: '', newPassword: '' });
        } else if ('error' in response) {
          this.snackBar.open(
            response.error || 'Error al cambiar contraseña',
            this.translate.instant('COMMON.ACTIONS.CLOSE'),
            { duration: 3000 }
          );
        }
      },
      error: () => {
        this.isSavingSecurity = false;
        this.snackBar.open(
          'Error al cambiar contraseña',
          this.translate.instant('COMMON.ACTIONS.CLOSE'),
          { duration: 3000 }
        );
      }
    });
  }

  saveAccountSettings(): void {
    if (this.accountForm.invalid) {
      return;
    }

    this.isSavingAccount = true;
    const profileData = {
      firstName: this.accountForm.value.firstName,
      lastName: this.accountForm.value.lastName,
      city: this.accountForm.value.city,
      country: this.accountForm.value.country,
      address: this.accountForm.value.address,
      phone: this.accountForm.value.mobile,
    };

    this.loginService.updateProfile(profileData).subscribe({
      next: (response) => {
        this.isSavingAccount = false;
        if ('success' in response && response.success) {
          // Update local user data
          if (response.user) {
            const currentUser = this.authService.currentUserValue;
            const updatedUser = { ...currentUser, ...response.user };
            this.authService.user$.next(updatedUser);
          }
          this.snackBar.open(
            this.translate.instant('SETTINGS.MESSAGES.ACCOUNT_SAVED'),
            this.translate.instant('COMMON.ACTIONS.CLOSE'),
            { duration: 3000 }
          );
        } else if ('error' in response) {
          this.snackBar.open(
            response.error || 'Error al actualizar perfil',
            this.translate.instant('COMMON.ACTIONS.CLOSE'),
            { duration: 3000 }
          );
        }
      },
      error: () => {
        this.isSavingAccount = false;
        this.snackBar.open(
          'Error al actualizar perfil',
          this.translate.instant('COMMON.ACTIONS.CLOSE'),
          { duration: 3000 }
        );
      }
    });
  }
}
