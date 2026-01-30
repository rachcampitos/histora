import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { NurseOnboardingService } from '../../core/services/nurse-onboarding.service';
import { NurseApiService } from '../../core/services/nurse.service';
import { AuthService } from '../../core/services/auth.service';
import { PeruLocationsService, Departamento, Distrito } from '../../core/services/peru-locations.service';
import { Nurse } from '../../core/models';

type OnboardingStep = 'welcome' | 'location' | 'payment-model' | 'payment-setup' | 'plans';

interface SlideConfig {
  id: OnboardingStep;
  mandatory: boolean;
}

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  standalone: false,
  styleUrls: ['./onboarding.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingPage implements OnInit, OnDestroy {
  @ViewChild('swiperRef') swiperRef!: ElementRef;

  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private onboardingService = inject(NurseOnboardingService);
  private nurseApi = inject(NurseApiService);
  private authService = inject(AuthService);
  private peruLocations = inject(PeruLocationsService);

  // Track if component is active to prevent Swiper errors
  private isActive = true;
  private swiperReady = false;

  // Slides configuration
  readonly slides: SlideConfig[] = [
    { id: 'welcome', mandatory: true },
    { id: 'location', mandatory: true },
    { id: 'payment-model', mandatory: true },
    { id: 'payment-setup', mandatory: false },
    { id: 'plans', mandatory: false },
  ];

  // State
  currentIndex = signal(0);
  isLoading = signal(false);

  // Payment setup form
  yapeNumber = signal('');
  plinNumber = signal('');
  acceptsCash = signal(true);

  // User info
  userName = signal('');

  // Location selection
  departamentos = signal<Departamento[]>([]);
  selectedDepartamento = signal<string>('15'); // Lima pre-selected
  selectedDistrito = signal<Distrito | null>(null);
  distritoSearch = signal('');
  showDistritoResults = signal(false);

  // Computed: filtered distritos based on search
  filteredDistritos = computed(() => {
    const search = this.distritoSearch();
    const deptId = this.selectedDepartamento();
    if (!search || search.length < 2) return [];
    return this.peruLocations.buscarDistritos(search, deptId);
  });

  // Computed: selected department name
  selectedDepartamentoNombre = computed(() => {
    return this.peruLocations.getDepartamentoNombre(this.selectedDepartamento());
  });

  private swiper: any = null;

  ngOnInit() {
    this.onboardingService.init();
    const user = this.authService.user();
    if (user) {
      this.userName.set(user.firstName || 'Enfermera');
    }

    // Load departamentos
    this.departamentos.set(this.peruLocations.getDepartamentos(true));
  }

  ngOnDestroy() {
    this.cleanupSwiper();
  }

  // Ionic lifecycle - called before view is shown (re-entering)
  ionViewWillEnter() {
    // Reset active state when entering the page
    this.isActive = true;
    this.swiperReady = false;
    console.log('[ONBOARDING] ionViewWillEnter - reset isActive to true');
  }

  // Ionic lifecycle - called after view is fully visible
  ionViewDidEnter() {
    // If Swiper wasn't initialized via event, try to get it from the element
    if (!this.swiperReady && this.swiperRef?.nativeElement) {
      console.log('[ONBOARDING] ionViewDidEnter - attempting to get Swiper from element');
      // Give the Swiper Web Component time to initialize
      setTimeout(() => {
        try {
          const swiperEl = this.swiperRef.nativeElement;
          if (swiperEl && swiperEl.swiper) {
            this.swiper = swiperEl.swiper;
            this.swiperReady = true;
            console.log('[ONBOARDING] Swiper obtained from element successfully');
          } else {
            console.warn('[ONBOARDING] Swiper not available on element');
          }
        } catch (error) {
          console.error('[ONBOARDING] Error getting Swiper from element:', error);
        }
      }, 100);
    }
  }

  // Ionic lifecycle - called before view is hidden
  ionViewWillLeave() {
    this.cleanupSwiper();
  }

  private cleanupSwiper() {
    this.isActive = false;
    this.swiperReady = false;
    // Destroy swiper instance to prevent memory leaks and DOM errors
    if (this.swiper) {
      try {
        // Remove all event listeners first
        this.swiper.off('slideChange');
        // Use safer destroy options
        this.swiper.destroy(false, false);
      } catch {
        // Ignore errors during cleanup
      }
      this.swiper = null;
    }
  }

  onSwiperInit(event: any) {
    if (!this.isActive) return;

    try {
      this.swiper = event.detail[0];
      if (this.swiper) {
        this.swiperReady = true;
        console.log('[ONBOARDING] Swiper initialized successfully');
      }
    } catch (error) {
      console.error('[ONBOARDING] Error initializing swiper:', error);
      this.swiperReady = false;
    }
  }

  onSlideChange() {
    if (!this.isActive || !this.swiperReady || !this.swiper) return;
    this.currentIndex.set(this.swiper.activeIndex);
    this.onboardingService.setCurrentStep(this.swiper.activeIndex);
  }

  getCurrentSlide(): OnboardingStep {
    return this.slides[this.currentIndex()].id;
  }

  canSkip(): boolean {
    const currentSlide = this.slides[this.currentIndex()];
    return !currentSlide.mandatory;
  }

  nextSlide() {
    if (!this.isActive || !this.swiperReady || !this.swiper) {
      console.warn('[ONBOARDING] nextSlide called but swiper not ready:', {
        isActive: this.isActive,
        swiperReady: this.swiperReady,
        hasSwiper: !!this.swiper
      });
      return;
    }
    if (this.currentIndex() < this.slides.length - 1) {
      try {
        this.swiper.slideNext();
      } catch (error) {
        console.error('[ONBOARDING] Error in slideNext:', error);
      }
    }
  }

  prevSlide() {
    if (!this.isActive || !this.swiperReady || !this.swiper) return;
    if (this.currentIndex() > 0) {
      try {
        this.swiper.slidePrev();
      } catch (error) {
        console.error('[ONBOARDING] Error in slidePrev:', error);
      }
    }
  }

  // Location handlers
  onDepartamentoChange(event: CustomEvent) {
    this.selectedDepartamento.set(event.detail.value);
    this.selectedDistrito.set(null);
    this.distritoSearch.set('');
  }

  onDistritoSearchInput(event: CustomEvent) {
    const value = event.detail.value || '';
    this.distritoSearch.set(value);
    this.showDistritoResults.set(value.length >= 2);
  }

  onDistritoSearchFocus() {
    if (this.distritoSearch().length >= 2) {
      this.showDistritoResults.set(true);
    }
  }

  onDistritoSearchBlur() {
    // Delay to allow click on result
    setTimeout(() => this.showDistritoResults.set(false), 200);
  }

  selectDistrito(distrito: Distrito) {
    this.selectedDistrito.set(distrito);
    this.distritoSearch.set(distrito.nombre);
    this.showDistritoResults.set(false);
  }

  clearDistrito() {
    this.selectedDistrito.set(null);
    this.distritoSearch.set('');
  }

  hasValidLocation(): boolean {
    return this.selectedDistrito() !== null;
  }

  async saveLocation() {
    const distrito = this.selectedDistrito();
    if (!distrito) {
      this.showToast('Selecciona tu distrito', 'warning');
      return;
    }

    this.isLoading.set(true);

    try {
      await this.nurseApi.updateMyProfile({
        location: {
          type: 'Point',
          city: this.selectedDepartamentoNombre(),
          district: distrito.nombre,
          coordinates: distrito.coordenadas
            ? [distrito.coordenadas.lng, distrito.coordenadas.lat]
            : [-77.0428, -12.0464], // Lima centro default
        }
      }).toPromise();

      this.showToast('Ubicacion guardada', 'success');
      this.nextSlide();
    } catch (error) {
      console.error('Error saving location:', error);
      this.showToast('Error al guardar ubicacion', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Payment setup handlers
  onYapeNumberChange(event: CustomEvent) {
    const value = event.detail.value || '';
    const cleaned = value.replace(/\D/g, '').slice(0, 9);
    this.yapeNumber.set(cleaned);
  }

  onPlinNumberChange(event: CustomEvent) {
    const value = event.detail.value || '';
    const cleaned = value.replace(/\D/g, '').slice(0, 9);
    this.plinNumber.set(cleaned);
  }

  onAcceptsCashChange(event: CustomEvent) {
    this.acceptsCash.set(event.detail.checked);
  }

  hasAnyPaymentMethod(): boolean {
    return !!(this.yapeNumber() || this.plinNumber() || this.acceptsCash());
  }

  async savePaymentMethods() {
    if (!this.hasAnyPaymentMethod()) {
      this.showToast('Configura al menos un metodo de pago', 'warning');
      return;
    }

    // Validate phone numbers are exactly 9 digits if provided
    const yape = this.yapeNumber();
    const plin = this.plinNumber();

    if (yape && yape.length !== 9) {
      this.showToast('El numero de Yape debe tener 9 digitos', 'warning');
      return;
    }

    if (plin && plin.length !== 9) {
      this.showToast('El numero de Plin debe tener 9 digitos', 'warning');
      return;
    }

    this.isLoading.set(true);

    try {
      // Only send yapeNumber/plinNumber if they are valid (9 digits) or empty
      const updateData: Record<string, unknown> = {
        acceptsCash: this.acceptsCash(),
      };

      // Only include if exactly 9 digits, otherwise don't send (keeps existing value)
      if (yape && yape.length === 9) {
        updateData['yapeNumber'] = yape;
      }
      if (plin && plin.length === 9) {
        updateData['plinNumber'] = plin;
      }

      await this.nurseApi.updateMyProfile(updateData as Partial<Nurse>).toPromise();

      await this.onboardingService.updateChecklistItem('paymentMethods', true);
      this.showToast('Metodos de pago guardados', 'success');
      this.nextSlide();
    } catch (error) {
      console.error('Error saving payment methods:', error);
      this.showToast('Error al guardar', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  skipPaymentSetup() {
    this.onboardingService.markSkippedSetup();
    this.nextSlide();
  }

  async completeOnboarding() {
    await this.onboardingService.completeOnboarding();
    this.router.navigate(['/nurse/dashboard'], { replaceUrl: true });
  }

  async skipToEnd() {
    await this.onboardingService.markSkippedSetup();
    await this.onboardingService.completeOnboarding();
    this.router.navigate(['/nurse/dashboard'], { replaceUrl: true });
  }

  goToSubscription() {
    this.onboardingService.completeOnboarding();
    this.router.navigate(['/nurse/subscription'], { replaceUrl: true });
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
