import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { NurseApiService } from '../../core/services/nurse.service';
import { ServiceRequestService } from '../../core/services/service-request.service';
import { GeolocationService, LocationCoordinates } from '../../core/services/geolocation.service';
import { MapboxService, AddressSuggestion } from '../../core/services/mapbox.service';
import { Nurse, NurseService, CreateServiceRequest } from '../../core/models';

interface TimeSlotOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-request',
  templateUrl: './request.page.html',
  standalone: false,
  styleUrls: ['./request.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private nurseService = inject(NurseApiService);
  private serviceRequestService = inject(ServiceRequestService);
  private geolocationService = inject(GeolocationService);
  private mapboxService = inject(MapboxService);

  // State signals
  nurse = signal<Nurse | null>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);
  error = signal<string | null>(null);
  formDirty = signal(false);

  // Form signals
  selectedServiceId = signal<string>('');
  useCurrentLocation = signal(true);
  manualAddress = signal('');
  manualDistrict = signal('');
  manualCity = signal('');
  addressReference = signal('');
  requestedDate = signal<string>(this.getMinDate());
  requestedTimeSlot = signal<string>('asap');
  patientNotes = signal('');

  // Location state
  currentLocation = signal<LocationCoordinates | null>(null);
  isLoadingLocation = signal(false);
  locationError = signal<string | null>(null);
  resolvedAddress = signal<string>('');
  resolvedDistrict = signal<string>('');
  resolvedCity = signal<string>('');

  // Retry service category (for auto-select after retry)
  private retryServiceCategory = signal<string>('');

  // Address autocomplete
  addressSuggestions = signal<AddressSuggestion[]>([]);
  isSearchingAddress = signal(false);
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Time slot options
  private allTimeSlotOptions: TimeSlotOption[] = [
    { value: 'asap', label: 'Lo antes posible', icon: 'flash-outline' },
    { value: 'morning', label: 'Manana (8:00 - 12:00)', icon: 'sunny-outline' },
    { value: 'afternoon', label: 'Tarde (12:00 - 18:00)', icon: 'partly-sunny-outline' },
    { value: 'evening', label: 'Noche (18:00 - 21:00)', icon: 'moon-outline' }
  ];

  availableTimeSlots = computed(() => {
    const selectedDate = this.requestedDate();
    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate.split('T')[0] === today;

    if (!isToday) return this.allTimeSlotOptions;

    const hour = new Date().getHours();
    return this.allTimeSlotOptions.filter(slot => {
      if (slot.value === 'asap') return true;
      if (slot.value === 'morning') return hour < 12;
      if (slot.value === 'afternoon') return hour < 18;
      if (slot.value === 'evening') return hour < 21;
      return true;
    });
  });

  // Computed signals
  availableServices = computed(() => {
    const nurseData = this.nurse();
    if (!nurseData?.services) return [];
    return nurseData.services.filter(s => s.isActive);
  });

  selectedService = computed(() => {
    const serviceId = this.selectedServiceId();
    const services = this.availableServices();
    return services.find(s => s._id === serviceId) || null;
  });

  isFormValid = computed(() => {
    const hasService = !!this.selectedServiceId();
    const hasLocation = this.useCurrentLocation()
      ? !!this.currentLocation()
      : !!(this.manualAddress() && this.manualDistrict() && this.manualCity());
    const hasDate = !!this.requestedDate();
    const hasTimeSlot = !!this.requestedTimeSlot();

    return hasService && hasLocation && hasDate && hasTimeSlot;
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const nurseId = params['nurseId'];
      if (nurseId) {
        this.loadNurseData(nurseId);
        this.loadCurrentLocation();

        // Pre-fill from retry params if present
        if (params['retryRequestId']) {
          this.prefillFromRetry(params);
        }
      } else {
        this.error.set('No se especifico una enfermera');
        this.isLoading.set(false);
      }
    });
  }

  async loadNurseData(nurseId: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando servicios...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const nurse = await this.nurseService.getNurse(nurseId).toPromise();
      this.nurse.set(nurse || null);

      // Auto-select first service if only one is available
      const services = this.availableServices();
      if (services.length === 1 && services[0]._id) {
        this.selectedServiceId.set(services[0]._id);
        this.showToast('Servicio seleccionado automaticamente', 'success');
      }

      // Auto-select service by category when retrying a rejected request
      const retryCategory = this.retryServiceCategory();
      if (retryCategory && services.length > 1 && !this.selectedServiceId()) {
        const match = services.find(s => s.category === retryCategory);
        if (match?._id) {
          this.selectedServiceId.set(match._id);
          this.showToast('Servicio seleccionado automaticamente', 'success');
        }
      }

      this.error.set(null);
    } catch (err) {
      console.error('Error loading nurse:', err);
      this.error.set('No se pudo cargar los datos de la enfermera');
      await this.showToast('Error al cargar los datos', 'danger');
    } finally {
      this.isLoading.set(false);
      await loading.dismiss();
    }
  }

  async loadCurrentLocation() {
    this.isLoadingLocation.set(true);
    this.locationError.set(null);

    try {
      // Check permissions first
      const permission = await this.geolocationService.checkPermissions();

      if (permission.location === 'denied') {
        // Request permission
        const requested = await this.geolocationService.requestPermissions();
        if (requested.location === 'denied') {
          this.locationError.set('Permiso de ubicacion denegado');
          this.useCurrentLocation.set(false);
          return;
        }
      }

      const coords = await this.geolocationService.getCurrentPosition();
      this.currentLocation.set(coords);

      // Reverse geocode to get real address from GPS coordinates
      const address = await this.mapboxService.reverseGeocode(coords.longitude, coords.latitude);
      if (address) {
        this.resolvedAddress.set(address.address);
        this.resolvedDistrict.set(address.district);
        this.resolvedCity.set(address.city);
      }
    } catch (err) {
      console.error('Error getting location:', err);
      this.locationError.set('No se pudo obtener la ubicacion');
      this.useCurrentLocation.set(false);
    } finally {
      this.isLoadingLocation.set(false);
    }
  }

  async refreshLocation() {
    await this.loadCurrentLocation();
  }

  toggleLocationMode() {
    this.useCurrentLocation.set(!this.useCurrentLocation());
    this.formDirty.set(true);
    if (this.useCurrentLocation() && !this.currentLocation()) {
      this.loadCurrentLocation();
    }
  }

  onServiceChange(event: CustomEvent) {
    this.selectedServiceId.set(event.detail.value);
    this.formDirty.set(true);
  }

  onDateChange(event: CustomEvent) {
    this.requestedDate.set(event.detail.value);
    this.formDirty.set(true);
  }

  onTimeSlotChange(value: string) {
    this.requestedTimeSlot.set(value);
    this.formDirty.set(true);
  }

  async submitRequest() {
    if (!this.isFormValid()) {
      await this.showToast('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    const nurseData = this.nurse();
    if (!nurseData) return;

    // Confirm submission
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-primary',
      header: 'Confirmar Solicitud',
      message: `Va a solicitar el servicio "${this.selectedService()?.name}" a ${nurseData.user?.firstName}. El costo es ${this.formatPrice(this.selectedService()?.price || 0, this.selectedService()?.currency || 'PEN')}. ¿Desea continuar?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => this.processSubmission()
        }
      ]
    });

    await alert.present();
  }

  private async processSubmission() {
    const nurseData = this.nurse();
    if (!nurseData) return;

    this.isSubmitting.set(true);

    const loading = await this.loadingCtrl.create({
      message: 'Enviando solicitud...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Prepare location data
      let locationData: CreateServiceRequest['location'];

      if (this.useCurrentLocation() && this.currentLocation()) {
        const coords = this.currentLocation()!;
        locationData = {
          coordinates: [coords.longitude, coords.latitude],
          address: this.resolvedAddress() || 'Ubicacion actual',
          reference: this.addressReference() || undefined,
          district: this.resolvedDistrict() || 'No especificado',
          city: this.resolvedCity() || 'Lima'
        };
      } else {
        // Geocode manual address to get real coordinates
        const geocoded = await this.mapboxService.geocodeAddress(
          this.manualAddress(), this.manualDistrict(), this.manualCity()
        );

        if (!geocoded) {
          await this.showToast('No pudimos encontrar esta direccion. Verifica los datos ingresados.', 'warning');
          this.isSubmitting.set(false);
          await loading.dismiss();
          return;
        }

        locationData = {
          coordinates: geocoded.coordinates,
          address: this.manualAddress(),
          reference: this.addressReference() || undefined,
          district: this.manualDistrict(),
          city: this.manualCity()
        };
      }

      const requestData: CreateServiceRequest = {
        nurseId: nurseData._id,
        serviceId: this.selectedServiceId(),
        location: locationData,
        requestedDate: this.formatDateForApi(this.requestedDate()),
        requestedTimeSlot: this.requestedTimeSlot(),
        patientNotes: this.patientNotes() || undefined
      };

      const result = await this.serviceRequestService.create(requestData).toPromise();

      await this.showToast('Solicitud creada. Procede a seleccionar tu método de pago.', 'success');
      this.formDirty.set(false);

      // Navigate to checkout page
      if (result?._id) {
        this.router.navigate(['/patient/checkout', result._id]);
      } else {
        this.router.navigate(['/patient/tabs/home']);
      }
    } catch (err: any) {
      console.error('Error creating request:', err);
      const message = err?.error?.message || 'Error al enviar la solicitud';
      await this.showToast(message, 'danger');
    } finally {
      this.isSubmitting.set(false);
      await loading.dismiss();
    }
  }

  goBack() {
    const nurseData = this.nurse();
    if (nurseData) {
      this.router.navigate(['/patient/search'], {
        queryParams: { nurseId: nurseData._id }
      });
    } else {
      this.router.navigate(['/patient/tabs/home']);
    }
  }

  onDistrictInput(value: string) {
    this.manualDistrict.set(value);
    this.formDirty.set(true);
  }

  onCityInput(value: string) {
    this.manualCity.set(value);
    this.formDirty.set(true);
  }

  onReferenceInput(value: string) {
    this.addressReference.set(value);
    this.formDirty.set(true);
  }

  onNotesInput(value: string) {
    this.patientNotes.set(value);
    this.formDirty.set(true);
  }

  // Helper methods
  getMinDate(): string {
    return new Date().toISOString();
  }

  getMaxDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 3); // Allow booking up to 3 months ahead
    return date.toISOString();
  }

  formatDateForApi(isoDate: string): string {
    // Convert to YYYY-MM-DD format
    return isoDate.split('T')[0];
  }

  formatPrice(price: number, currency: string = 'PEN'): string {
    return currency === 'PEN' ? `S/ ${price.toFixed(2)}` : `${currency} ${price.toFixed(2)}`;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      injection: 'Inyecciones',
      wound_care: 'Curaciones',
      catheter: 'Cateter/Sonda',
      vital_signs: 'Signos Vitales',
      iv_therapy: 'Terapia IV',
      blood_draw: 'Toma de Sangre',
      medication: 'Medicacion',
      elderly_care: 'Cuidado Adulto Mayor',
      post_surgery: 'Post-Operatorio',
      other: 'Otro'
    };
    return labels[category] || category;
  }

  /**
   * Search addresses for autocomplete (debounced)
   */
  onAddressInput(value: string) {
    this.manualAddress.set(value);
    this.formDirty.set(true);
    this.addressSuggestions.set([]);

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    if (!value || value.length < 3) return;

    this.searchDebounceTimer = setTimeout(async () => {
      this.isSearchingAddress.set(true);
      const proximity = this.currentLocation()
        ? [this.currentLocation()!.longitude, this.currentLocation()!.latitude] as [number, number]
        : this.mapboxService['defaultCenter'];
      const results = await this.mapboxService.searchAddresses(value, proximity);
      this.addressSuggestions.set(results);
      this.isSearchingAddress.set(false);
    }, 300);
  }

  /**
   * Select an address suggestion
   */
  selectSuggestion(suggestion: AddressSuggestion) {
    this.manualAddress.set(suggestion.address);
    this.manualDistrict.set(suggestion.district);
    this.manualCity.set(suggestion.city || 'Lima');
    this.addressSuggestions.set([]);
    this.formDirty.set(true);
  }

  /**
   * Pre-fill form from retry queryParams
   */
  private prefillFromRetry(params: { [key: string]: string }) {
    if (params['address']) {
      this.useCurrentLocation.set(false);
      this.manualAddress.set(params['address']);
    }
    if (params['district']) this.manualDistrict.set(params['district']);
    if (params['city']) this.manualCity.set(params['city']);
    if (params['date']) this.requestedDate.set(params['date']);
    if (params['timeSlot']) this.requestedTimeSlot.set(params['timeSlot']);
    if (params['notes']) this.patientNotes.set(params['notes']);
    if (params['serviceCategory']) this.retryServiceCategory.set(params['serviceCategory']);
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: color === 'danger' ? 4000 : 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
