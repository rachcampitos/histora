import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { AuthService } from '@core';
import { UploadsService } from '@core/service/uploads.service';

@Component({
  standalone: true,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [
    BreadcrumbComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class SettingsComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  avatarPreview: string | null = null;
  avatarUrl: string | null = null;
  uploadingAvatar = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private uploadsService: UploadsService,
    private snackBar: MatSnackBar
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
      city: [''],
      country: [''],
      address: [''],
    });

    this.passwordForm = this.fb.group({
      username: [''],
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  loadUserData(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.profileForm.patchValue({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        city: currentUser['city'] || '',
        country: currentUser['country'] || '',
        address: currentUser['address'] || '',
      });

      this.passwordForm.patchValue({
        username: currentUser.email || currentUser.name || '',
      });

      // Load avatar if exists
      if (currentUser['avatar']) {
        this.avatarUrl = currentUser['avatar'];
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      this.snackBar.open('La imagen no debe superar 5MB', '', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Solo se permiten archivos de imagen', '', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  uploadAvatar(): void {
    if (!this.avatarPreview) return;

    this.uploadingAvatar = true;
    this.uploadsService.uploadProfilePhoto({
      imageData: this.avatarPreview,
      mimeType: this.getMimeType(this.avatarPreview),
    }).subscribe({
      next: (response) => {
        this.uploadingAvatar = false;
        if (response.success && response.url) {
          this.avatarUrl = response.url;
          this.avatarPreview = null;
          // Update avatar in AuthService so sidebar/navbar update
          this.authService.updateUserAvatar(response.url);
          this.snackBar.open('Foto de perfil actualizada', '', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        } else {
          this.snackBar.open(response.error || 'Error al subir la imagen', '', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        }
      },
      error: (error) => {
        this.uploadingAvatar = false;
        this.snackBar.open(error.message || 'Error al subir la imagen', '', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      },
    });
  }

  cancelAvatarPreview(): void {
    this.avatarPreview = null;
  }

  private getMimeType(dataUrl: string): string {
    const match = dataUrl.match(/data:([^;]+);/);
    return match ? match[1] : 'image/jpeg';
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      // TODO: Implement API call to update profile
      console.log('Profile data:', this.profileForm.value);
      this.snackBar.open('Perfil actualizado', '', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      // TODO: Implement API call to change password
      console.log('Password change data:', this.passwordForm.value);
      this.snackBar.open('Contraseña actualizada', '', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      this.passwordForm.reset();
      this.loadUserData(); // Reload username
    }
  }
}
