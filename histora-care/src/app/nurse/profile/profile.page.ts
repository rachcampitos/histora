import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, AlertController, ActionSheetController } from '@ionic/angular';
import { NurseApiService } from '../../core/services/nurse.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { UploadsService } from '../../core/services/uploads.service';
import { ProductTourService } from '../../core/services/product-tour.service';
import { PeruLocationsService, Departamento, Distrito } from '../../core/services/peru-locations.service';
import { Nurse } from '../../core/models';
import { calculateNurseTier, NurseTierInfo } from '../../core/utils/nurse-tier.util';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage implements OnInit {
  private nurseApi = inject(NurseApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private actionSheetCtrl = inject(ActionSheetController);
  private uploadsService = inject(UploadsService);
  private productTour = inject(ProductTourService);
  private peruLocations = inject(PeruLocationsService);
  themeService = inject(ThemeService);

  // State signals
  nurse = signal<Nurse | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  isUploadingAvatar = signal(false);
  justSaved = signal(false); // For showing success feedback

  // Form state signals
  bio = signal('');
  specialties = signal<string[]>([]);
  yearsOfExperience = signal(0);
  serviceRadius = signal(10);
  availableFrom = signal('08:00');
  availableTo = signal('18:00');
  availableDays = signal<number[]>([1, 2, 3, 4, 5]); // Mon-Fri by default

  // Payment methods
  yapeNumber = signal('');
  plinNumber = signal('');
  acceptsCash = signal(true);

  // New specialty input
  newSpecialty = signal('');

  // Original values for change detection
  private originalBio = signal('');
  private originalSpecialties = signal<string[]>([]);
  private originalYearsOfExperience = signal(0);
  private originalServiceRadius = signal(10);
  private originalAvailableFrom = signal('08:00');
  private originalAvailableTo = signal('18:00');
  private originalAvailableDays = signal<number[]>([1, 2, 3, 4, 5]);
  private originalYapeNumber = signal('');
  private originalPlinNumber = signal('');
  private originalAcceptsCash = signal(true);
  private originalLocationDistrict = signal('');
  private originalLocationCity = signal('');

  // Location signals
  departamentos = signal<Departamento[]>([]);
  selectedDepartamento = signal<string>('15'); // Lima by default
  selectedDistrito = signal<Distrito | null>(null);
  distritoSearch = signal('');
  showDistritoResults = signal(false);
  locationCity = signal('');
  locationDistrict = signal('');

  // Location computed
  filteredDistritos = computed(() => {
    const search = this.distritoSearch();
    const deptId = this.selectedDepartamento();
    if (!search || search.length < 2) return [];
    return this.peruLocations.buscarDistritos(search, deptId);
  });

  selectedDepartamentoNombre = computed(() => {
    const deptId = this.selectedDepartamento();
    const dept = this.departamentos().find(d => d.id === deptId);
    return dept?.nombre || 'Lima';
  });

  // Computed values
  user = this.authService.user;
  fullName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : 'Enfermera';
  });
  avatar = computed(() => this.user()?.avatar || null);
  cepNumber = computed(() => this.nurse()?.cepNumber || '');
  cepVerified = computed(() => this.nurse()?.cepVerified || false);
  nurseTier = computed<NurseTierInfo>(() => {
    const n = this.nurse();
    return calculateNurseTier({
      averageRating: n?.averageRating ?? 0,
      totalServicesCompleted: n?.totalServicesCompleted ?? 0,
      totalReviews: n?.totalReviews ?? 0,
    });
  });
  hasPaymentMethod = computed(() => {
    return !!(this.yapeNumber() || this.plinNumber() || this.acceptsCash());
  });

  // Detect if there are unsaved changes
  hasUnsavedChanges = computed(() => {
    if (this.isLoading()) return false;

    return (
      this.bio() !== this.originalBio() ||
      JSON.stringify(this.specialties()) !== JSON.stringify(this.originalSpecialties()) ||
      this.yearsOfExperience() !== this.originalYearsOfExperience() ||
      this.serviceRadius() !== this.originalServiceRadius() ||
      this.availableFrom() !== this.originalAvailableFrom() ||
      this.availableTo() !== this.originalAvailableTo() ||
      JSON.stringify(this.availableDays()) !== JSON.stringify(this.originalAvailableDays()) ||
      this.yapeNumber() !== this.originalYapeNumber() ||
      this.plinNumber() !== this.originalPlinNumber() ||
      this.acceptsCash() !== this.originalAcceptsCash() ||
      this.locationDistrict() !== this.originalLocationDistrict() ||
      this.locationCity() !== this.originalLocationCity()
    );
  });

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
    this.loadLocations();
    this.loadProfile();
  }

  ionViewWillLeave() {
    // Stop any active tour when leaving to prevent freezing
    this.productTour.forceStop();
  }

  loadLocations() {
    this.departamentos.set(this.peruLocations.getDepartamentos());
  }

  loadProfile() {
    this.isLoading.set(true);
    this.nurseApi.getMyProfile().subscribe({
      next: (nurse) => {
        this.nurse.set(nurse);
        // Initialize form values from nurse data
        const bioValue = nurse.bio || '';
        const specialtiesValue = [...(nurse.specialties || [])];
        const yearsValue = nurse.yearsOfExperience || 0;
        const radiusValue = nurse.serviceRadius || 10;
        const fromValue = nurse.availableFrom || '08:00';
        const toValue = nurse.availableTo || '18:00';
        const daysValue = [...(nurse.availableDays || [1, 2, 3, 4, 5])];
        const yapeValue = nurse.yapeNumber || '';
        const plinValue = nurse.plinNumber || '';
        const cashValue = nurse.acceptsCash !== false;

        // Set current values
        this.bio.set(bioValue);
        this.specialties.set(specialtiesValue);
        this.yearsOfExperience.set(yearsValue);
        this.serviceRadius.set(radiusValue);
        this.availableFrom.set(fromValue);
        this.availableTo.set(toValue);
        this.availableDays.set(daysValue);
        this.yapeNumber.set(yapeValue);
        this.plinNumber.set(plinValue);
        this.acceptsCash.set(cashValue);

        // Store original values for change detection
        this.originalBio.set(bioValue);
        this.originalSpecialties.set([...specialtiesValue]);
        this.originalYearsOfExperience.set(yearsValue);
        this.originalServiceRadius.set(radiusValue);
        this.originalAvailableFrom.set(fromValue);
        this.originalAvailableTo.set(toValue);
        this.originalAvailableDays.set([...daysValue]);
        this.originalYapeNumber.set(yapeValue);
        this.originalPlinNumber.set(plinValue);
        this.originalAcceptsCash.set(cashValue);

        // Location data
        let cityValue = '';
        let districtValue = '';
        if (nurse.location) {
          cityValue = nurse.location.city || '';
          districtValue = nurse.location.district || '';
          this.locationCity.set(cityValue);
          this.locationDistrict.set(districtValue);
          this.distritoSearch.set(districtValue);
          // Try to find departamento by city name
          const dept = this.departamentos().find(d => d.nombre === nurse.location?.city);
          if (dept) {
            this.selectedDepartamento.set(dept.id);
          }
        }
        this.originalLocationCity.set(cityValue);
        this.originalLocationDistrict.set(districtValue);

        this.isLoading.set(false);

        // Check for scroll-to-section query param
        this.route.queryParams.subscribe(params => {
          if (params['section']) {
            setTimeout(() => {
              this.scrollToSection(params['section']);
            }, 300);
          }
        });

        // Only start tour after a delay and if elements are ready
        // This prevents the tour from blocking navigation
        setTimeout(async () => {
          // Check if still on this page before starting tour
          if (!this.isLoading()) {
            await this.productTour.init();
            this.productTour.startTour('nurse_profile');
          }
        }, 1500);
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.showToast('Error al cargar perfil', 'danger');
        this.isLoading.set(false);
      },
    });
  }

  cancelChanges() {
    // Restore all values to their original state
    this.bio.set(this.originalBio());
    this.specialties.set([...this.originalSpecialties()]);
    this.yearsOfExperience.set(this.originalYearsOfExperience());
    this.serviceRadius.set(this.originalServiceRadius());
    this.availableFrom.set(this.originalAvailableFrom());
    this.availableTo.set(this.originalAvailableTo());
    this.availableDays.set([...this.originalAvailableDays()]);
    this.yapeNumber.set(this.originalYapeNumber());
    this.plinNumber.set(this.originalPlinNumber());
    this.acceptsCash.set(this.originalAcceptsCash());
    this.locationCity.set(this.originalLocationCity());
    this.locationDistrict.set(this.originalLocationDistrict());
    this.distritoSearch.set(this.originalLocationDistrict());
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

  onYapeNumberChange(event: CustomEvent) {
    const value = event.detail.value || '';
    // Only keep digits and limit to 9
    const cleaned = value.replace(/\D/g, '').slice(0, 9);
    this.yapeNumber.set(cleaned);
  }

  onPlinNumberChange(event: CustomEvent) {
    const value = event.detail.value || '';
    // Only keep digits and limit to 9
    const cleaned = value.replace(/\D/g, '').slice(0, 9);
    this.plinNumber.set(cleaned);
  }

  onAcceptsCashChange(event: CustomEvent) {
    this.acceptsCash.set(event.detail.checked);
  }

  // Location methods
  onDepartamentoChange(event: CustomEvent) {
    this.selectedDepartamento.set(event.detail.value);
    this.locationCity.set(this.selectedDepartamentoNombre());
    // Reset distrito when department changes
    this.selectedDistrito.set(null);
    this.distritoSearch.set('');
    this.locationDistrict.set('');
  }

  onDistritoSearchInput(event: CustomEvent) {
    const value = event.detail.value || '';
    this.distritoSearch.set(value);
    if (value.length >= 2) {
      this.showDistritoResults.set(true);
    } else {
      this.showDistritoResults.set(false);
    }
  }

  onDistritoSearchFocus() {
    if (this.distritoSearch().length >= 2) {
      this.showDistritoResults.set(true);
    }
  }

  onDistritoSearchBlur() {
    // Delay to allow click on results
    setTimeout(() => {
      this.showDistritoResults.set(false);
    }, 200);
  }

  selectDistrito(distrito: Distrito) {
    this.selectedDistrito.set(distrito);
    this.distritoSearch.set(distrito.nombre);
    this.locationDistrict.set(distrito.nombre);
    this.locationCity.set(this.selectedDepartamentoNombre());
    this.showDistritoResults.set(false);
  }

  clearDistrito() {
    this.selectedDistrito.set(null);
    this.distritoSearch.set('');
    this.locationDistrict.set('');
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
      // Payment methods
      yapeNumber: this.yapeNumber(),
      plinNumber: this.plinNumber(),
      acceptsCash: this.acceptsCash(),
    };

    // Include location if set and has valid coordinates
    if (this.locationDistrict()) {
      const distrito = this.selectedDistrito();
      if (distrito?.coordenadas?.lat && distrito?.coordenadas?.lng) {
        updateData.location = {
          type: 'Point',
          city: this.locationCity() || this.selectedDepartamentoNombre(),
          district: this.locationDistrict(),
          coordinates: [distrito.coordenadas.lng, distrito.coordenadas.lat],
        };
      } else {
        console.warn('District missing coordinates, location not updated:', distrito);
      }
    }

    this.nurseApi.updateMyProfile(updateData).subscribe({
      next: (updatedNurse) => {
        this.nurse.set(updatedNurse);

        // Update original values to match saved state
        this.originalBio.set(this.bio());
        this.originalSpecialties.set([...this.specialties()]);
        this.originalYearsOfExperience.set(this.yearsOfExperience());
        this.originalServiceRadius.set(this.serviceRadius());
        this.originalAvailableFrom.set(this.availableFrom());
        this.originalAvailableTo.set(this.availableTo());
        this.originalAvailableDays.set([...this.availableDays()]);
        this.originalYapeNumber.set(this.yapeNumber());
        this.originalPlinNumber.set(this.plinNumber());
        this.originalAcceptsCash.set(this.acceptsCash());
        this.originalLocationCity.set(this.locationCity());
        this.originalLocationDistrict.set(this.locationDistrict());

        // Show success feedback briefly
        this.justSaved.set(true);
        setTimeout(() => this.justSaved.set(false), 2000);

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
            const errorMsg = err?.error?.message || 'Error al subir la foto';
            this.showToast(errorMsg, 'danger');
            this.isUploadingAvatar.set(false);
          }
        });
      }
      // If photo is null, user cancelled - no action needed
    } catch (error: any) {
      console.error('Error changing avatar:', error);
      // Show user-friendly error message
      const message = error?.message?.includes('User denied')
        ? 'Permiso de cámara denegado'
        : 'Error al acceder a la cámara';
      this.showToast(message, 'danger');
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

  async replayTour() {
    // Reset all nurse tours and set dashboard tour as pending
    await this.productTour.resetToursByRole('nurse');
    await this.productTour.setPendingTour('nurse_dashboard');
    this.router.navigate(['/nurse/dashboard']);
    this.showToast('El tutorial comenzará en el dashboard', 'primary');
  }

  scrollToPaymentMethods() {
    this.scrollToSection('payment');
  }

  scrollToSection(section: string) {
    const sectionMap: Record<string, string> = {
      'availability': '#tour-schedule-section',
      'schedule': '#tour-schedule-section',
      'bio': '#tour-bio-section',
      'location': '#tour-location-section',
      'payment': '.payment-methods-section',
      'specialties': '#tour-specialties-section',
    };
    const selector = sectionMap[section] || `#${section}`;
    const element = document.querySelector(selector);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
