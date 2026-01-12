import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController, Platform } from '@ionic/angular';
import { MapboxService, WebSocketService, GeolocationService, ServiceRequestService, AuthService, NurseApiService } from '../../core/services';
import { ServiceRequest } from '../../core/models';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

type TrackingStatus = 'accepted' | 'on_the_way' | 'arrived' | 'in_progress' | 'completed';

interface NurseInfo {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  rating: number;
  totalReviews: number;
}

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.page.html',
  standalone: false,
  styleUrls: ['./tracking.page.scss'],
})
export class TrackingPage implements OnInit, OnDestroy {
  // Request data
  requestId = signal<string>('');
  request = signal<ServiceRequest | null>(null);
  nurse = signal<NurseInfo | null>(null);

  // Location data
  patientLocation = signal<[number, number] | null>(null);
  nurseLocation = signal<[number, number] | null>(null);

  // Route info
  distance = signal<number>(0); // meters
  duration = signal<number>(0); // seconds
  eta = signal<Date | null>(null);

  // Status
  currentStatus = signal<TrackingStatus>('accepted');
  isLoading = signal(true);
  isMapReady = signal(false);
  loadError = signal<string | null>(null);
  hasReviewed = signal(false);
  showReviewModal = signal(false);

  // Development mode flag
  private isDevelopment = !environment.production;
  private hasRealNurseLocation = false;

  // Computed values
  formattedDistance = computed(() => this.mapboxService.formatDistance(this.distance()));
  formattedDuration = computed(() => this.mapboxService.formatDuration(this.duration()));
  formattedEta = computed(() => {
    const etaDate = this.eta();
    if (!etaDate) return '--:--';
    return etaDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  });

  statusSteps: { key: TrackingStatus; label: string; icon: string }[] = [
    { key: 'accepted', label: 'Aceptado', icon: 'checkmark-circle' },
    { key: 'on_the_way', label: 'En camino', icon: 'navigate' },
    { key: 'arrived', label: 'Llegó', icon: 'location' },
    { key: 'in_progress', label: 'En servicio', icon: 'medical' },
    { key: 'completed', label: 'Completado', icon: 'checkmark-done' }
  ];

  private mapInitialized = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private platform: Platform,
    private alertController: AlertController,
    public mapboxService: MapboxService,
    private wsService: WebSocketService,
    private geoService: GeolocationService,
    private requestService: ServiceRequestService,
    private authService: AuthService,
    private nurseApiService: NurseApiService,
    private modalController: ModalController
  ) {
    // React to WebSocket location updates
    effect(() => {
      const location = this.wsService.nurseLocation();
      if (location && location.requestId === this.requestId()) {
        this.hasRealNurseLocation = true;
        this.nurseLocation.set([location.longitude, location.latitude]);
        this.updateNurseMarker();
        this.updateRoute();
      }
    });

    // React to status updates
    effect(() => {
      const status = this.wsService.statusUpdate();
      if (status && status.requestId === this.requestId()) {
        this.currentStatus.set(status.status as TrackingStatus);
        if (status.estimatedArrival) {
          this.eta.set(status.estimatedArrival);
        }
      }
    });
  }

  async ngOnInit() {
    // Get request ID from route
    const id = this.route.snapshot.paramMap.get('requestId');
    if (!id) {
      this.router.navigate(['/patient/history']);
      return;
    }
    this.requestId.set(id);

    await this.platform.ready();
    await this.loadRequestData();
    await this.initializeTracking();
  }

  ngOnDestroy() {
    this.wsService.leaveTrackingRoom(this.requestId());
    this.wsService.disconnect();
    this.mapboxService.destroy();
  }

  /**
   * Load request data from API
   */
  async loadRequestData() {
    try {
      this.loadError.set(null);

      // Call the real API
      const request = await firstValueFrom(this.requestService.getById(this.requestId()));

      // Validate the request exists and is valid
      if (!request) {
        this.loadError.set('No se encontró el servicio solicitado');
        this.isLoading.set(false);
        return;
      }

      // Check if request was cancelled
      if (request.status === 'cancelled') {
        this.loadError.set('Este servicio ha sido cancelado');
        this.isLoading.set(false);
        return;
      }

      // Check if request was rejected
      if (request.status === 'rejected') {
        this.loadError.set('Este servicio fue rechazado');
        this.isLoading.set(false);
        return;
      }

      this.request.set(request);

      // Extract nurse information from the request
      if (request.nurse && request.nurseId) {
        this.nurse.set({
          id: request.nurseId,
          firstName: request.nurse.firstName,
          lastName: request.nurse.lastName,
          avatar: request.nurse.avatar,
          phone: request.nurse.phone,
          rating: 0, // Will be updated if we fetch nurse details
          totalReviews: 0
        });

        // Optionally fetch full nurse details for rating info
        this.loadNurseDetails(request.nurseId);
      }

      this.currentStatus.set(request.status as TrackingStatus || 'accepted');

      // Check if already reviewed
      this.hasReviewed.set(!!request.rating);

      // Set patient location from request - coordinates are [lng, lat]
      const coords = request.location?.coordinates;
      if (coords) {
        this.patientLocation.set([coords[0], coords[1]]);
      }

      this.isLoading.set(false);
    } catch (error) {
      console.error('Error loading request:', error);
      this.loadError.set('No se pudo cargar la información del servicio. Por favor, intenta de nuevo.');
      this.isLoading.set(false);
    }
  }

  /**
   * Load nurse details for rating information
   */
  private async loadNurseDetails(nurseId: string) {
    try {
      const nurseDetails = await firstValueFrom(this.nurseApiService.getNurse(nurseId));
      if (nurseDetails && this.nurse()) {
        this.nurse.set({
          ...this.nurse()!,
          rating: nurseDetails.averageRating || 0,
          totalReviews: nurseDetails.totalReviews || 0
        });
      }
    } catch (error) {
      console.error('Error loading nurse details:', error);
      // Non-critical error, we already have basic nurse info
    }
  }

  /**
   * Retry loading request data
   */
  async retryLoadRequest() {
    this.isLoading.set(true);
    await this.loadRequestData();
    if (!this.loadError()) {
      await this.initializeTracking();
    }
  }

  /**
   * Initialize map and WebSocket tracking
   */
  async initializeTracking() {
    // Get user's current location
    try {
      const position = await this.geoService.getCurrentPosition();
      if (!this.patientLocation()) {
        this.patientLocation.set([position.longitude, position.latitude]);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }

    // Connect to WebSocket
    const token = await this.authService.getToken();
    if (token) {
      this.wsService.connect(token);
      this.wsService.joinTrackingRoom(this.requestId());
    }

    // Only simulate nurse location in development mode and when no real location is available
    if (this.isDevelopment && !this.hasRealNurseLocation) {
      // Wait a bit to see if we get real location from WebSocket
      setTimeout(() => {
        if (!this.hasRealNurseLocation) {
          console.log('[DEV] No real nurse location received, starting simulation');
          this.simulateNurseLocation();
        }
      }, 2000);
    }
  }

  /**
   * Initialize map after view is ready
   */
  onMapContainerReady() {
    if (this.mapInitialized) return;

    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  /**
   * Initialize Mapbox map
   */
  private initMap() {
    const patientLoc = this.patientLocation();
    if (!patientLoc) return;

    try {
      this.mapboxService.initMap({
        container: 'tracking-map',
        center: patientLoc,
        zoom: 15,
        style: 'mapbox://styles/mapbox/streets-v12'
      });

      // Add patient marker
      this.mapboxService.addMarker('patient', patientLoc, {
        color: '#10b981',
        popup: '<strong>Tu ubicación</strong>'
      });

      // Add nurse marker if available
      if (this.nurseLocation()) {
        this.updateNurseMarker();
      }

      this.mapInitialized = true;
      this.isMapReady.set(true);

      // Initial route calculation
      this.updateRoute();
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  /**
   * Update nurse marker on map
   */
  private updateNurseMarker() {
    const nurseLoc = this.nurseLocation();
    if (!nurseLoc || !this.isMapReady()) return;

    const existingMarker = this.mapboxService.getMap()?.getSource('nurse-marker');
    if (existingMarker) {
      this.mapboxService.updateMarkerPosition('nurse', nurseLoc);
    } else {
      const nurseElement = this.mapboxService.createNurseMarkerElement();
      this.mapboxService.addMarker('nurse', nurseLoc, {
        element: nurseElement,
        popup: `<strong>${this.nurse()?.firstName || 'Enfermera'}</strong>`
      });
    }
  }

  /**
   * Update route between nurse and patient
   */
  private async updateRoute() {
    const nurseLoc = this.nurseLocation();
    const patientLoc = this.patientLocation();

    if (!nurseLoc || !patientLoc || !this.isMapReady()) return;

    try {
      const route = await this.mapboxService.getDirections(nurseLoc, patientLoc, 'driving');

      if (route) {
        this.distance.set(route.distance);
        this.duration.set(route.duration);

        // Calculate ETA
        const etaDate = new Date();
        etaDate.setSeconds(etaDate.getSeconds() + route.duration);
        this.eta.set(etaDate);

        // Draw route on map
        this.mapboxService.drawRoute(route.geometry.coordinates as [number, number][]);

        // Fit map to show both markers
        this.mapboxService.fitBounds([nurseLoc, patientLoc], 80);
      }
    } catch (error) {
      console.error('Error updating route:', error);
    }
  }

  /**
   * Simulate nurse movement for testing
   */
  private simulateNurseLocation() {
    const patientLoc = this.patientLocation();
    if (!patientLoc) return;

    // Start nurse 2km away
    let nurseLat = patientLoc[1] + 0.015;
    let nurseLng = patientLoc[0] + 0.01;

    this.nurseLocation.set([nurseLng, nurseLat]);

    // Simulate movement every 3 seconds
    const interval = setInterval(() => {
      if (this.currentStatus() === 'completed') {
        clearInterval(interval);
        return;
      }

      // Move nurse closer to patient
      const currentLoc = this.nurseLocation();
      if (!currentLoc) return;

      const targetLoc = this.patientLocation();
      if (!targetLoc) return;

      const latDiff = targetLoc[1] - currentLoc[1];
      const lngDiff = targetLoc[0] - currentLoc[0];

      // Move 10% closer each time
      nurseLat = currentLoc[1] + latDiff * 0.1;
      nurseLng = currentLoc[0] + lngDiff * 0.1;

      this.nurseLocation.set([nurseLng, nurseLat]);
      this.updateNurseMarker();
      this.updateRoute();

      // Check if arrived (within 50 meters)
      const distance = this.geoService.calculateDistance(
        currentLoc[1], currentLoc[0],
        targetLoc[1], targetLoc[0]
      ) * 1000; // Convert to meters

      if (distance < 50 && this.currentStatus() === 'on_the_way') {
        this.currentStatus.set('arrived');
      }
    }, 3000);
  }

  /**
   * Center map on current location
   */
  centerOnPatient() {
    const loc = this.patientLocation();
    if (loc) {
      this.mapboxService.centerOn(loc, 16);
    }
  }

  /**
   * Center map to show full route
   */
  showFullRoute() {
    const nurseLoc = this.nurseLocation();
    const patientLoc = this.patientLocation();
    if (nurseLoc && patientLoc) {
      this.mapboxService.fitBounds([nurseLoc, patientLoc], 80);
    }
  }

  /**
   * Call nurse
   */
  async callNurse() {
    const phone = this.nurse()?.phone;
    if (phone) {
      window.open(`tel:${phone}`, '_system');
    }
  }

  /**
   * Open chat with nurse
   */
  openChat() {
    // TODO: Implement in-app chat
    this.showInfo('Chat próximamente disponible');
  }

  /**
   * Cancel request
   */
  async cancelRequest() {
    const alert = await this.alertController.create({
      header: 'Cancelar servicio',
      message: '¿Estás seguro de que deseas cancelar este servicio?',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Motivo de cancelación (opcional)'
        }
      ],
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí, cancelar',
          role: 'destructive',
          handler: async (data) => {
            try {
              await firstValueFrom(this.requestService.cancel(this.requestId(), data.reason || undefined));
              this.router.navigate(['/patient/history']);
            } catch (error) {
              console.error('Error cancelling request:', error);
              this.showError('No se pudo cancelar el servicio. Por favor, intenta de nuevo.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Get current step index for progress bar
   */
  getCurrentStepIndex(): number {
    return this.statusSteps.findIndex(s => s.key === this.currentStatus());
  }

  /**
   * Check if a step is completed
   */
  isStepCompleted(stepKey: TrackingStatus): boolean {
    const currentIndex = this.getCurrentStepIndex();
    const stepIndex = this.statusSteps.findIndex(s => s.key === stepKey);
    return stepIndex < currentIndex;
  }

  /**
   * Check if a step is active
   */
  isStepActive(stepKey: TrackingStatus): boolean {
    return this.currentStatus() === stepKey;
  }

  /**
   * Navigate back
   */
  goBack() {
    this.router.navigate(['/patient/history']);
  }

  /**
   * Show error alert
   */
  private async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Show info alert
   */
  private async showInfo(message: string) {
    const alert = await this.alertController.create({
      header: 'Información',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Open review modal/alert
   */
  async openReviewModal() {
    const nurseInfo = this.nurse();
    const alert = await this.alertController.create({
      header: 'Calificar servicio',
      subHeader: nurseInfo ? `${nurseInfo.firstName} ${nurseInfo.lastName}` : 'Enfermera',
      message: 'Tu opinión ayuda a mejorar nuestro servicio',
      inputs: [
        {
          name: 'rating',
          type: 'number',
          min: 1,
          max: 5,
          placeholder: 'Calificación (1-5 estrellas)',
          attributes: {
            inputmode: 'numeric'
          }
        },
        {
          name: 'comment',
          type: 'textarea',
          placeholder: 'Escribe tu comentario (opcional)'
        }
      ],
      buttons: [
        { text: 'Más tarde', role: 'cancel' },
        {
          text: 'Enviar',
          handler: async (data) => {
            const rating = parseInt(data.rating, 10);
            if (!rating || rating < 1 || rating > 5) {
              this.showError('Por favor, ingresa una calificación entre 1 y 5');
              return false;
            }
            await this.submitReview(rating, data.comment || '');
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Submit review to API
   */
  async submitReview(rating: number, comment: string) {
    const nurseId = this.nurse()?.id;
    if (!nurseId) {
      this.showError('No se pudo identificar a la enfermera');
      return;
    }

    try {
      await firstValueFrom(this.nurseApiService.submitReview(nurseId, {
        rating,
        comment,
        serviceRequestId: this.requestId()
      }));

      this.hasReviewed.set(true);

      const successAlert = await this.alertController.create({
        header: 'Gracias',
        message: 'Tu calificación ha sido enviada exitosamente.',
        buttons: [
          {
            text: 'Ver historial',
            handler: () => {
              this.router.navigate(['/patient/history']);
            }
          },
          {
            text: 'Cerrar',
            role: 'cancel'
          }
        ]
      });
      await successAlert.present();
    } catch (error) {
      console.error('Error submitting review:', error);
      this.showError('No se pudo enviar tu calificación. Por favor, intenta de nuevo.');
    }
  }

  /**
   * Check if review should be shown
   */
  shouldShowReview(): boolean {
    return this.currentStatus() === 'completed' && !this.hasReviewed();
  }
}
