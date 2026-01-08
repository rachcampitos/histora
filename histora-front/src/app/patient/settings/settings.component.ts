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

    this.isSavingSecurity = true;
    // TODO: Implement password change API
    setTimeout(() => {
      this.isSavingSecurity = false;
      this.snackBar.open(
        this.translate.instant('SETTINGS.MESSAGES.SECURITY_SAVED'),
        this.translate.instant('COMMON.ACTIONS.CLOSE'),
        { duration: 3000 }
      );
    }, 1000);
  }

  saveAccountSettings(): void {
    if (this.accountForm.invalid) {
      return;
    }

    this.isSavingAccount = true;
    // TODO: Implement profile update API
    setTimeout(() => {
      this.isSavingAccount = false;
      this.snackBar.open(
        this.translate.instant('SETTINGS.MESSAGES.ACCOUNT_SAVED'),
        this.translate.instant('COMMON.ACTIONS.CLOSE'),
        { duration: 3000 }
      );
    }, 1000);
  }
}
