import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController, ActionSheetController } from '@ionic/angular';
import { NurseApiService } from '../../core/services/nurse.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { UploadsService } from '../../core/services/uploads.service';
import { ProductTourService } from '../../core/services/product-tour.service';
import { Nurse } from '../../core/models';

interface DayOption {
  value: number;
  label: string;
  shortLabel: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  standalone: false,
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  private nurseApi = inject(NurseApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private actionSheetCtrl = inject(ActionSheetController);
  private uploadsService = inject(UploadsService);
  private productTour = inject(ProductTourService);
  themeService = inject(ThemeService);

  // State signals
  nurse = signal<Nurse | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  isUploadingAvatar = signal(false);

  // Form state signals
  bio = signal('');
  specialties = signal<string[]>([]);
  yearsOfExperience = signal(0);
  serviceRadius = signal(10);
  availableFrom = signal('08:00');
  availableTo = signal('18:00');
  availableDays = signal<number[]>([1, 2, 3, 4, 5]); // Mon-Fri by default

  // New specialty input
  newSpecialty = signal('');

  // Computed values
  user = this.authService.user;
  fullName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : 'Enfermera';
  });
  avatar = computed(() => this.user()?.avatar || null);
  cepNumber = computed(() => this.nurse()?.cepNumber || '');
  cepVerified = computed(() => this.nurse()?.cepVerified || false);

  // Day options for availability
  dayOptions: DayOption[] = [
    { value: 0, label: 'Domingo', shortLabel: 'Dom' },
    { value: 1, label: 'Lunes', shortLabel: 'Lun' },
    { value: 2, label: 'Martes', shortLabel: 'Mar' },
    { value: 3, label: 'Miércoles', shortLabel: 'Mié' },
    { value: 4, label: 'Jueves', shortLabel: 'Jue' },
    { value: 5, label: 'Viernes', shortLabel: 'Vie' },
    { value: 6, label: 'Sábado', shortLabel: 'Sáb' },
  ];

  // Common specialties for suggestions
  commonSpecialties = [
    'Enfermería General',
    'Cuidados Intensivos',
    'Pediatría',
    'Geriatría',
    'Oncología',
    'Cardiología',
    'Traumatología',
    'Rehabilitación',
    'Cuidados Paliativos',
    'Diabetes',
    'Heridas y Ostomías',
    'Salud Mental',
  ];

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.nurseApi.getMyProfile().subscribe({
      next: (nurse) => {
        this.nurse.set(nurse);
        // Initialize form values from nurse data
        this.bio.set(nurse.bio || '');
        this.specialties.set([...(nurse.specialties || [])]);
        this.yearsOfExperience.set(nurse.yearsOfExperience || 0);
        this.serviceRadius.set(nurse.serviceRadius || 10);
        this.availableFrom.set(nurse.availableFrom || '08:00');
        this.availableTo.set(nurse.availableTo || '18:00');
        this.availableDays.set([...(nurse.availableDays || [1, 2, 3, 4, 5])]);
        this.isLoading.set(false);
        // Start profile tour for first-time users
        this.productTour.startTour('nurse_profile');
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.showToast('Error al cargar perfil', 'danger');
        this.isLoading.set(false);
      },
    });
  }

  onBioChange(event: CustomEvent) {
    this.bio.set(event.detail.value || '');
  }

  onYearsChange(event: CustomEvent) {
    const value = parseInt(event.detail.value, 10);
    this.yearsOfExperience.set(isNaN(value) ? 0 : value);
  }

  onRadiusChange(event: CustomEvent) {
    this.serviceRadius.set(event.detail.value || 10);
  }

  onFromTimeChange(event: CustomEvent) {
    const value = event.detail.value;
    if (value) {
      // Extract HH:mm from ISO string if needed
      const time = typeof value === 'string' && value.includes('T')
        ? value.split('T')[1].substring(0, 5)
        : value;
      this.availableFrom.set(time);
    }
  }

  onToTimeChange(event: CustomEvent) {
    const value = event.detail.value;
    if (value) {
      // Extract HH:mm from ISO string if needed
      const time = typeof value === 'string' && value.includes('T')
        ? value.split('T')[1].substring(0, 5)
        : value;
      this.availableTo.set(time);
    }
  }

  toggleDay(day: number) {
    const current = this.availableDays();
    if (current.includes(day)) {
      this.availableDays.set(current.filter(d => d !== day));
    } else {
      this.availableDays.set([...current, day].sort());
    }
  }

  isDaySelected(day: number): boolean {
    return this.availableDays().includes(day);
  }

  onNewSpecialtyChange(event: CustomEvent) {
    this.newSpecialty.set(event.detail.value || '');
  }

  addSpecialty() {
    const specialty = this.newSpecialty().trim();
    if (specialty && !this.specialties().includes(specialty)) {
      this.specialties.set([...this.specialties(), specialty]);
      this.newSpecialty.set('');
    }
  }

  addCommonSpecialty(specialty: string) {
    if (!this.specialties().includes(specialty)) {
      this.specialties.set([...this.specialties(), specialty]);
    }
  }

  removeSpecialty(specialty: string) {
    this.specialties.set(this.specialties().filter(s => s !== specialty));
  }

  getAvailableCommonSpecialties(): string[] {
    const current = this.specialties();
    return this.commonSpecialties.filter(s => !current.includes(s));
  }

  // Pin formatter for radius slider
  radiusFormatter = (value: number) => `${value} km`;

  async saveProfile() {
    if (this.isSaving()) return;

    this.isSaving.set(true);

    const updateData: Partial<Nurse> = {
      bio: this.bio(),
      specialties: this.specialties(),
      yearsOfExperience: this.yearsOfExperience(),
      serviceRadius: this.serviceRadius(),
      availableFrom: this.availableFrom(),
      availableTo: this.availableTo(),
      availableDays: this.availableDays(),
    };

    this.nurseApi.updateMyProfile(updateData).subscribe({
      next: (updatedNurse) => {
        this.nurse.set(updatedNurse);
        this.showToast('Perfil actualizado correctamente', 'success');
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.showToast('Error al guardar perfil', 'danger');
        this.isSaving.set(false);
      },
    });
  }

  async changeAvatar() {
    if (this.isUploadingAvatar()) return;

    try {
      const photo = await this.uploadsService.promptAndGetPhoto();

      if (photo) {
        this.isUploadingAvatar.set(true);

        this.uploadsService.uploadProfilePhoto(photo.base64, photo.mimeType).subscribe({
          next: async (response) => {
            if (response.success && response.url) {
              await this.authService.updateUserAvatar(response.url);
              this.showToast('Foto actualizada correctamente', 'success');
            } else {
              this.showToast('Error al subir la foto', 'danger');
            }
            this.isUploadingAvatar.set(false);
          },
          error: (err) => {
            console.error('Error uploading avatar:', err);
            this.showToast('Error al subir la foto', 'danger');
            this.isUploadingAvatar.set(false);
          }
        });
      }
    } catch (error) {
      console.error('Error changing avatar:', error);
      this.showToast('Error al cambiar la foto', 'danger');
      this.isUploadingAvatar.set(false);
    }
  }

  async confirmLogout() {
    const alert = await this.alertCtrl.create({
      cssClass: 'logout-alert',
      header: 'Cerrar Sesión',
      message: '¿Estás segura de que deseas cerrar sesión? Deberás iniciar sesión nuevamente para acceder.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          role: 'destructive',
          handler: () => {
            this.logout();
          },
        },
      ],
    });
    await alert.present();
  }

  async logout() {
    await this.authService.logout();
  }

  async openThemeSelector() {
    const currentTheme = this.themeService.currentTheme();
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar Tema',
      buttons: [
        {
          text: 'Claro',
          icon: 'sunny-outline',
          cssClass: currentTheme === 'light' ? 'selected-theme' : '',
          handler: () => {
            this.themeService.setTheme('light');
          }
        },
        {
          text: 'Oscuro',
          icon: 'moon-outline',
          cssClass: currentTheme === 'dark' ? 'selected-theme' : '',
          handler: () => {
            this.themeService.setTheme('dark');
          }
        },
        {
          text: 'Automático',
          icon: 'phone-portrait-outline',
          cssClass: currentTheme === 'auto' ? 'selected-theme' : '',
          handler: () => {
            this.themeService.setTheme('auto');
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close-outline'
        }
      ]
    });
    await actionSheet.present();
  }

  goBack() {
    this.router.navigate(['/nurse/dashboard']);
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
