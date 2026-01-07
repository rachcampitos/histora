import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { AuthService } from '@core/service/auth.service';

@Component({
  standalone: true,
  selector: 'app-admin-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [
    CommonModule,
    BreadcrumbComponent,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatSnackBarModule,
  ],
})
export class SettingsComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  platformForm!: FormGroup;
  notificationsForm!: FormGroup;

  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadUserData();
  }

  initForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });

    this.platformForm = this.fb.group({
      platformName: ['Histora', Validators.required],
      supportEmail: ['support@histora.com', [Validators.required, Validators.email]],
      trialDays: [14, [Validators.required, Validators.min(0)]],
      defaultLanguage: ['es'],
      maintenanceMode: [false],
    });

    this.notificationsForm = this.fb.group({
      emailNewClinic: [true],
      emailNewSubscription: [true],
      emailCancellation: [true],
      emailPaymentFailed: [true],
      systemAlerts: [true],
    });
  }

  loadUserData(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      console.log('Saving profile:', this.profileForm.value);
      this.snackBar.open('Perfil actualizado correctamente', 'Cerrar', {
        duration: 3000,
      });
    }
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      const { newPassword, confirmPassword } = this.passwordForm.value;
      if (newPassword !== confirmPassword) {
        this.snackBar.open('Las contraseñas no coinciden', 'Cerrar', {
          duration: 3000,
        });
        return;
      }
      console.log('Changing password');
      this.snackBar.open('Contraseña actualizada correctamente', 'Cerrar', {
        duration: 3000,
      });
      this.passwordForm.reset();
    }
  }

  savePlatformSettings(): void {
    if (this.platformForm.valid) {
      console.log('Saving platform settings:', this.platformForm.value);
      this.snackBar.open('Configuración de plataforma guardada', 'Cerrar', {
        duration: 3000,
      });
    }
  }

  saveNotifications(): void {
    console.log('Saving notifications:', this.notificationsForm.value);
    this.snackBar.open('Preferencias de notificación guardadas', 'Cerrar', {
      duration: 3000,
    });
  }
}
