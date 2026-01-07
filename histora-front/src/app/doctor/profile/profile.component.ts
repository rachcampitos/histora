import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { DoctorsService, DoctorProfile } from './doctors.service';
import { UploadsService } from '@core/service/uploads.service';
import { AuthService } from '@core/service/auth.service';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    MatCheckboxModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    TranslateModule,
    BreadcrumbComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class DoctorProfileComponent implements OnInit, OnDestroy {
  doctorProfile: DoctorProfile | null = null;
  profileForm!: FormGroup;
  isLoading = true;
  isSaving = false;
  isUploadingCv = false;
  cvFileName = '';
  userAvatar: string | null = null;
  userName: { firstName: string; lastName: string } | null = null;

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private doctorsService: DoctorsService,
    private uploadsService: UploadsService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Subscribe to user changes to get avatar and name
    this.subscriptions.add(
      this.authService.user$.subscribe(user => {
        if (user?.avatar) {
          this.userAvatar = user.avatar;
        }
        if (user?.firstName || user?.lastName) {
          this.userName = {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
          };
        }
      })
    );

    // Load current user data
    const currentUser = this.authService.currentUserValue;
    if (currentUser?.avatar) {
      this.userAvatar = currentUser.avatar;
    }
    if (currentUser?.firstName || currentUser?.lastName) {
      this.userName = {
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
      };
    }

    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      specialty: ['', Validators.required],
      subspecialties: [''],
      licenseNumber: [''],
      phone: [''],
      email: ['', Validators.email],
      bio: [''],
      address: [''],
      city: [''],
      country: [''],
      consultationFee: [0],
      currency: ['PEN'],
      isPublicProfile: [false],
      education: this.fb.array([]),
      experience: this.fb.array([]),
      certifications: this.fb.array([]),
      skills: this.fb.array([]),
    });
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.doctorsService.getMyProfile().subscribe({
        next: (profile) => {
          this.doctorProfile = profile;
          this.patchForm(profile);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading profile:', err);
          this.isLoading = false;
          this.snackBar.open('Error al cargar el perfil', 'Cerrar', { duration: 3000 });
        },
      })
    );
  }

  private patchForm(profile: DoctorProfile): void {
    this.profileForm.patchValue({
      firstName: profile.firstName,
      lastName: profile.lastName,
      specialty: profile.specialty,
      subspecialties: profile.subspecialties?.join(', ') || '',
      licenseNumber: profile.licenseNumber,
      phone: profile.phone,
      email: profile.email,
      bio: profile.bio,
      address: profile.address,
      city: profile.city,
      country: profile.country,
      consultationFee: profile.consultationFee || 0,
      currency: profile.currency || 'PEN',
      isPublicProfile: profile.isPublicProfile,
    });

    // Clear and populate arrays
    this.clearFormArray(this.education);
    profile.education?.forEach(edu => this.addEducation(edu));

    this.clearFormArray(this.experience);
    profile.experience?.forEach(exp => this.addExperience(exp));

    this.clearFormArray(this.certifications);
    profile.certifications?.forEach(cert => this.addCertification(cert));

    this.clearFormArray(this.skills);
    profile.skills?.forEach(skill => this.addSkill(skill));

    if (profile.cvUrl) {
      this.cvFileName = profile.cvFormat === 'pdf' ? 'curriculum.pdf' : 'curriculum.docx';
    }
  }

  // Form array getters
  get education(): FormArray {
    return this.profileForm.get('education') as FormArray;
  }

  get experience(): FormArray {
    return this.profileForm.get('experience') as FormArray;
  }

  get certifications(): FormArray {
    return this.profileForm.get('certifications') as FormArray;
  }

  get skills(): FormArray {
    return this.profileForm.get('skills') as FormArray;
  }

  private clearFormArray(formArray: FormArray): void {
    while (formArray.length) {
      formArray.removeAt(0);
    }
  }

  // Add methods
  addEducation(data?: any): void {
    this.education.push(this.fb.group({
      institution: [data?.institution || '', Validators.required],
      degree: [data?.degree || '', Validators.required],
      year: [data?.year || null],
      country: [data?.country || ''],
    }));
  }

  addExperience(data?: any): void {
    this.experience.push(this.fb.group({
      position: [data?.position || '', Validators.required],
      institution: [data?.institution || '', Validators.required],
      startYear: [data?.startYear || null],
      endYear: [data?.endYear || null],
      currentlyWorking: [data?.currentlyWorking || false],
      description: [data?.description || ''],
    }));
  }

  addCertification(data?: any): void {
    this.certifications.push(this.fb.group({
      name: [data?.name || '', Validators.required],
      issuer: [data?.issuer || '', Validators.required],
      year: [data?.year || null],
      expiryYear: [data?.expiryYear || null],
      licenseNumber: [data?.licenseNumber || ''],
    }));
  }

  addSkill(data?: any): void {
    this.skills.push(this.fb.group({
      name: [data?.name || '', Validators.required],
      percentage: [data?.percentage || 50, [Validators.min(0), Validators.max(100)]],
    }));
  }

  // Remove methods
  removeEducation(index: number): void {
    this.education.removeAt(index);
  }

  removeExperience(index: number): void {
    this.experience.removeAt(index);
  }

  removeCertification(index: number): void {
    this.certifications.removeAt(index);
  }

  removeSkill(index: number): void {
    this.skills.removeAt(index);
  }

  // CV upload
  onCvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (!allowedTypes.includes(file.type)) {
      this.snackBar.open('Solo se permiten archivos PDF o DOCX', 'Cerrar', { duration: 3000 });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo no puede superar 10MB', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isUploadingCv = true;
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result as string;
      this.subscriptions.add(
        this.uploadsService.uploadDoctorCv(base64, file.type).subscribe({
          next: (response) => {
            this.cvFileName = file.name;
            this.isUploadingCv = false;
            this.snackBar.open('CV subido exitosamente', 'Cerrar', { duration: 3000 });
            // Reload profile to get updated CV URL
            this.loadProfile();
          },
          error: (err) => {
            console.error('Error uploading CV:', err);
            this.isUploadingCv = false;
            this.snackBar.open('Error al subir el CV', 'Cerrar', { duration: 3000 });
          },
        })
      );
    };

    reader.readAsDataURL(file);
  }

  deleteCv(): void {
    this.subscriptions.add(
      this.uploadsService.deleteDoctorCv().subscribe({
        next: () => {
          this.cvFileName = '';
          if (this.doctorProfile) {
            this.doctorProfile.cvUrl = undefined;
          }
          this.snackBar.open('CV eliminado', 'Cerrar', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error deleting CV:', err);
          this.snackBar.open('Error al eliminar el CV', 'Cerrar', { duration: 3000 });
        },
      })
    );
  }

  // Save profile
  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.snackBar.open('Por favor complete los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    const formValue = this.profileForm.value;

    // Convert subspecialties string to array
    const updateData = {
      ...formValue,
      subspecialties: formValue.subspecialties ? formValue.subspecialties.split(',').map((s: string) => s.trim()) : [],
    };

    this.subscriptions.add(
      this.doctorsService.updateMyProfile(updateData).subscribe({
        next: (profile) => {
          this.doctorProfile = profile;
          this.isSaving = false;
          this.snackBar.open('Perfil actualizado exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error saving profile:', err);
          this.isSaving = false;
          this.snackBar.open('Error al guardar el perfil', 'Cerrar', { duration: 3000 });
        },
      })
    );
  }

  // Getters for display
  get displayFirstName(): string {
    return this.doctorProfile?.firstName || this.userName?.firstName || '';
  }

  get displayLastName(): string {
    return this.doctorProfile?.lastName || this.userName?.lastName || '';
  }

  // Track by functions
  trackByIndex(index: number): number {
    return index;
  }
}
