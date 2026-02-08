import { Component, OnInit, OnDestroy, AfterViewInit, signal, computed, effect, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController, Platform, ToastController } from '@ionic/angular';
import { MapboxService, WebSocketService, GeolocationService, ServiceRequestService, AuthService, NurseApiService, ThemeService } from '../../core/services';
import { ChatService } from '../../core/services/chat.service';
import { ServiceRequest } from '../../core/models';
import { ReviewModalComponent, ReviewSubmitData } from '../../shared/components/review-modal';
import { ChatModalComponent } from '../../shared/components/chat-modal';
import { environment } from '../../../environments/environment';
import { firstValueFrom, interval, Subscription } from 'rxjs';

type TrackingStatus = 'pending' | 'accepted' | 'on_the_way' | 'arrived' | 'in_progress' | 'completed';

interface NurseInfo {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  rating: number;
  totalReviews: number;
  // Payment methods
  yapeNumber?: string;
  plinNumber?: string;
  acceptsCash?: boolean;
}

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.page.html',
  standalone: false,
  styleUrls: ['./tracking.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingPage implements OnInit, OnDestroy, AfterViewInit {
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
  isRejected = signal(false);
  isCancelled = signal(false);
  hasReviewed = signal(false);
  showReviewModal = signal(false);
  copiedPayment = signal<'yape' | 'plin' | null>(null);
  chatUnreadCount = signal(0);
  private chatRoomId: string | null = null;

  // Alternative nurses (shown when rejected)
  alternativeNurses = signal<NurseInfo[]>([]);
  isLoadingAlternatives = signal(false);

  // Development mode flag
  private isDevelopment = !environment.production;
  private hasRealNurseLocation = false;
  private pollingSubscription?: Subscription;
  private chatNotificationSub?: Subscription;
  private simulationInterval?: ReturnType<typeof setInterval>;
  private previousStatus = signal<TrackingStatus | null>(null);

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

  @ViewChild('statusProgressContainer') statusProgressContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('trackingSheet', { static: false }) trackingSheet: any; // IonModal

  // Bottom sheet config
  private forceCloseSheet = signal(false);
  showBottomSheet = computed(() => {
    if (this.forceCloseSheet()) return false;
    return !this.isLoading() && !this.loadError() && !this.isRejected()
      && !this.isCancelled() && this.currentStatus() !== 'pending';
  });
  sheetBreakpoints = [0.15, 0.35, 0.75, 1];
  initialBreakpoint = 0.35;

  private mapInitialized = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private platform: Platform,
    private alertController: AlertController,
    private toastController: ToastController,
    public mapboxService: MapboxService,
    private wsService: WebSocketService,
    private geoService: GeolocationService,
    private requestService: ServiceRequestService,
    private authService: AuthService,
    private nurseApiService: NurseApiService,
    private modalController: ModalController,
    public themeService: ThemeService,
    private chatService: ChatService
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

    // React to status updates from WebSocket
    effect(() => {
      const status = this.wsService.statusUpdate();
      if (status && status.requestId === this.requestId()) {
        this.handleStatusChange(status.status as TrackingStatus);
        if (status.estimatedArrival) {
          this.eta.set(status.estimatedArrival);
        }
      }
    });

    // React to status changes and auto-show review modal
    effect(() => {
      const current = this.currentStatus();
      const previous = this.previousStatus();

      // Check if status just changed to completed
      if (current === 'completed' && previous && previous !== 'completed') {
        // Small delay to let UI update, then show review modal
        setTimeout(() => {
          if (!this.hasReviewed()) {
            this.showCompletionAndReview();
          }
        }, 2000);
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

  ngAfterViewInit() {
    // Initialize map after view is ready and data is loaded
    setTimeout(() => {
      if (!this.isLoading() && !this.loadError() && !this.mapInitialized) {
        this.initMap();
      }
    }, 500);
  }

  ionViewWillLeave() {
    // Force close the tracking sheet by setting isOpen to false via signal
    // This works even with canDismiss="false" since it uses the [isOpen] binding
    this.forceCloseSheet.set(true);
  }

  ngOnDestroy() {
    this.forceCloseSheet.set(true);
    this.stopPolling();
    this.stopSimulation();
    this.chatNotificationSub?.unsubscribe();
    this.wsService.leaveTrackingRoom(this.requestId());
    this.wsService.disconnect();
    this.mapboxService.destroy();
  }

  /**
   * Stop simulation interval
   */
  private stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = undefined;
    }
  }

  /**
   * Handle status change
   */
  private handleStatusChange(newStatus: TrackingStatus) {
    const currentStatus = this.currentStatus();
    if (currentStatus !== newStatus) {
      const wasWaitingForConfirmation = currentStatus === 'pending';
      this.previousStatus.set(currentStatus);
      this.currentStatus.set(newStatus);

      // If status changed from pending, the map container now exists
      // Initialize map after a delay to allow DOM to update
      if (wasWaitingForConfirmation && newStatus !== 'pending' && !this.mapInitialized) {
        setTimeout(() => this.initMap(), 500);
      }

      // Auto-scroll to the active step
      setTimeout(() => this.scrollToActiveStep(newStatus), 100);

      // Auto-expand bottom sheet on key status changes
      this.adjustSheetBreakpoint(newStatus);
    }
  }

  private adjustSheetBreakpoint(status: TrackingStatus) {
    setTimeout(() => {
      if (!this.trackingSheet) return;
      try {
        if (status === 'arrived' || status === 'completed') {
          this.trackingSheet.setCurrentBreakpoint(0.75);
        } else if (status === 'in_progress') {
          this.trackingSheet.setCurrentBreakpoint(0.35);
        }
      } catch (e) {
        // Sheet may not be ready yet
      }
    }, 300);
  }

  /**
   * Scroll the status progress to show the active step
   */
  private scrollToActiveStep(status: TrackingStatus) {
    const stepElement = document.getElementById(`step-${status}`);
    if (stepElement && this.statusProgressContainer?.nativeElement) {
      const container = this.statusProgressContainer.nativeElement;
      const stepRect = stepElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Calculate scroll position to center the active step
      const scrollLeft = stepElement.offsetLeft - (containerRect.width / 2) + (stepRect.width / 2);
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
    }
  }

  /**
   * Start polling for status updates (fallback when WebSocket is not available)
   */
  private startPolling() {
    // Poll every 10 seconds
    this.pollingSubscription = interval(10000).subscribe(async () => {
      await this.pollStatus();
    });
  }

  /**
   * Stop polling
   */
  private stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  /**
   * Poll for current status
   */
  private async pollStatus() {
    try {
      const request = await firstValueFrom(this.requestService.getById(this.requestId()));
      if (request && request.status !== this.currentStatus()) {
        this.handleStatusChange(request.status as TrackingStatus);

        // Update request data
        this.request.set(request);

        // Check if reviewed
        this.hasReviewed.set(!!request.rating);
      }
    } catch (error) {
      console.error('Error polling status:', error);
    }
  }

  /**
   * Show completion message and review modal
   */
  private async showCompletionAndReview() {
    // Show completion toast first
    const toast = await this.toastController.create({
      message: '¡Servicio completado! ✓',
      duration: 2000,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle'
    });
    await toast.present();

    // Wait for toast to finish, then show review modal
    await toast.onDidDismiss();
    this.openReviewModal();
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
        this.isCancelled.set(true);
        this.request.set(request);
        this.isLoading.set(false);
        return;
      }

      // Check if request was rejected
      if (request.status === 'rejected') {
        this.isRejected.set(true);
        this.request.set(request);
        // Load nurse info if available for context
        if (request.nurse && request.nurseId) {
          this.nurse.set({
            id: request.nurseId,
            firstName: request.nurse.firstName,
            lastName: request.nurse.lastName,
            avatar: request.nurse.avatar,
            phone: request.nurse.phone,
            rating: 0,
            totalReviews: 0
          });
        }
        this.isLoading.set(false);
        // Load alternative nurses
        this.loadAlternativeNurses(request);
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

      // Load chat unread count
      this.loadChatUnread(this.requestId());

      // Initialize map after data is loaded (only if not pending)
      if (this.currentStatus() !== 'pending') {
        setTimeout(() => this.initMap(), 300);
      }
    } catch (error) {
      console.error('Error loading request:', error);
      this.loadError.set('No se pudo cargar la información del servicio. Por favor, intenta de nuevo.');
      this.isLoading.set(false);
    }
  }

  /**
   * Load nurse details for rating and payment information
   */
  private async loadNurseDetails(nurseId: string) {
    try {
      const nurseDetails = await firstValueFrom(this.nurseApiService.getNurse(nurseId));
      if (nurseDetails && this.nurse()) {
        this.nurse.set({
          ...this.nurse()!,
          rating: nurseDetails.averageRating || 0,
          totalReviews: nurseDetails.totalReviews || 0,
          // Payment methods for P2P payments
          yapeNumber: nurseDetails.yapeNumber,
          plinNumber: nurseDetails.plinNumber,
          acceptsCash: nurseDetails.acceptsCash
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

    // Start polling as fallback for status updates
    this.startPolling();

    // Simulate nurse location when no real location is available (WebSocket disabled in production)
    // Wait a bit to see if we get real location from WebSocket
    setTimeout(() => {
      if (!this.hasRealNurseLocation && this.currentStatus() === 'on_the_way') {
        this.simulateNurseLocation();
      }
    }, 2000);
  }

  /**
   * Initialize Mapbox map
   */
  private initMap() {
    const patientLoc = this.patientLocation();
    if (!patientLoc) return;

    try {
      // Use dark map style when dark mode is enabled
      const mapStyle = this.themeService.isDarkMode()
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/streets-v12';

      this.mapboxService.initMap({
        container: 'tracking-map',
        center: patientLoc,
        zoom: 15,
        style: mapStyle
      });

      // Add patient marker
      this.mapboxService.addMarker('patient', patientLoc, {
        color: '#16a34a',
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

    // Stop any existing simulation
    this.stopSimulation();

    // Start nurse 2km away
    let nurseLat = patientLoc[1] + 0.015;
    let nurseLng = patientLoc[0] + 0.01;

    this.nurseLocation.set([nurseLng, nurseLat]);

    // Simulate movement every 3 seconds
    this.simulationInterval = setInterval(() => {
      if (this.currentStatus() === 'completed') {
        this.stopSimulation();
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
   * Copy payment number to clipboard
   */
  async copyPaymentNumber(number: string, type: 'yape' | 'plin') {
    try {
      await navigator.clipboard.writeText(number);
      this.copiedPayment.set(type);

      const toast = await this.toastController.create({
        message: 'Numero copiado al portapapeles',
        duration: 2000,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle'
      });
      await toast.present();

      setTimeout(() => this.copiedPayment.set(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }

  /**
   * Check if nurse has any payment method configured
   */
  hasPaymentMethods(): boolean {
    const nurseInfo = this.nurse();
    return !!(nurseInfo?.yapeNumber || nurseInfo?.plinNumber || nurseInfo?.acceptsCash);
  }

  /**
   * Open chat with nurse
   */
  async openChat() {
    const nurseInfo = this.nurse();
    if (!nurseInfo) {
      this.showInfo('No se pudo cargar la información de la enfermera');
      return;
    }

    const modal = await this.modalController.create({
      component: ChatModalComponent,
      componentProps: {
        serviceRequestId: this.requestId(),
        otherUserName: `${nurseInfo.firstName} ${nurseInfo.lastName}`,
        otherUserAvatar: nurseInfo.avatar,
        otherUserRole: 'nurse'
      },
      cssClass: 'chat-modal-fullscreen',
      presentingElement: await this.modalController.getTop(),
      canDismiss: true
    });

    await modal.present();
    await modal.onWillDismiss();
    this.chatUnreadCount.set(0);
  }

  private async loadChatUnread(requestId: string) {
    // Ensure chat WebSocket is connected
    await this.chatService.connect();

    try {
      const room = await this.chatService.getRoomByServiceRequest(requestId);
      if (room) {
        this.chatRoomId = room._id;
        const userId = this.authService.user()?.id;
        if (userId && room.unreadCount) {
          this.chatUnreadCount.set(room.unreadCount[userId] || 0);
        }
      }
    } catch (err) {
      // Non-critical, ignore
    }

    // Subscribe to room notifications for new messages
    this.chatNotificationSub?.unsubscribe();
    this.chatNotificationSub = this.chatService.onRoomNotification().subscribe(data => {
      if (data.roomId === this.chatRoomId) {
        this.chatUnreadCount.update(c => c + 1);
      }
    });

    // Also listen for new-message events (covers case when room was just created)
    this.chatService.onNewMessage().subscribe(msg => {
      const userId = this.authService.user()?.id;
      if (msg.senderId !== userId) {
        if (!this.chatRoomId) {
          this.chatService.getRoomByServiceRequest(requestId).then(room => {
            if (room) this.chatRoomId = room._id;
          });
        }
        this.chatUnreadCount.update(c => c + 1);
      }
    });
  }

  /**
   * Cancel request
   */
  async cancelRequest() {
    const alert = await this.alertController.create({
      cssClass: 'histora-alert histora-alert-danger',
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
   * Check if the progress line at index i is completed
   * Line i connects step[i] to step[i+1]
   * Completed when we've reached or passed step[i+1]
   */
  isLineCompleted(lineIndex: number): boolean {
    return lineIndex < this.getCurrentStepIndex();
  }

  /**
   * Check if the progress line at index i is actively animating
   * Active when we're AT step[i] (line to next step shows shimmer)
   */
  isLineActive(lineIndex: number): boolean {
    const currentIndex = this.getCurrentStepIndex();
    return lineIndex === currentIndex && currentIndex < this.statusSteps.length - 1;
  }

  /**
   * Navigate back
   */
  goBack() {
    this.router.navigate(['/patient/history']);
  }

  /**
   * Navigate to search for another nurse (from rejected/cancelled state)
   */
  searchAnotherNurse() {
    this.router.navigate(['/patient/tabs/map']);
  }

  /**
   * Load alternative nurses for rejected request
   */
  private async loadAlternativeNurses(request: ServiceRequest) {
    if (!request.location?.coordinates) {
      console.log('[TRACKING] No location available for alternatives');
      return;
    }

    this.isLoadingAlternatives.set(true);

    try {
      const [lng, lat] = request.location.coordinates;
      const category = request.service?.category;

      // Fetch nearby nurses (excluding the one who rejected)
      const results = await this.nurseApiService.searchNearby({
        latitude: lat,
        longitude: lng,
        radiusKm: 15,
        ...(category && { category: category as 'injection' | 'wound_care' | 'catheter' | 'vital_signs' | 'iv_therapy' | 'blood_draw' | 'medication' | 'elderly_care' | 'post_surgery' | 'other' })
      }).toPromise();

      if (results && results.length > 0) {
        // Filter out the nurse who rejected and take top 3
        const alternatives = results
          .filter(r => r.nurse._id !== request.nurseId)
          .slice(0, 3)
          .map(r => ({
            id: r.nurse._id || '',
            firstName: r.nurse.user?.firstName || '',
            lastName: r.nurse.user?.lastName || '',
            avatar: r.nurse.user?.avatar,
            phone: r.nurse.user?.phone,
            rating: r.nurse.averageRating || 0,
            totalReviews: r.nurse.totalReviews || 0
          }));

        this.alternativeNurses.set(alternatives);
      }
    } catch (error) {
      console.error('[TRACKING] Error loading alternatives:', error);
      // Don't show error - alternatives are optional
    } finally {
      this.isLoadingAlternatives.set(false);
    }
  }

  /**
   * Request service from an alternative nurse
   */
  requestAlternativeNurse(nurseId: string) {
    this.router.navigate(['/patient/request'], {
      queryParams: { nurseId }
    });
  }

  /**
   * Show error alert
   */
  private async showError(message: string) {
    const alert = await this.alertController.create({
      cssClass: 'histora-alert histora-alert-danger',
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
      cssClass: 'histora-alert histora-alert-primary',
      header: 'Información',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Open review modal using the ReviewModalComponent
   */
  async openReviewModal() {
    const nurseInfo = this.nurse();
    const nurseName = nurseInfo ? `${nurseInfo.firstName} ${nurseInfo.lastName}` : undefined;

    const modal = await this.modalController.create({
      component: ReviewModalComponent,
      componentProps: {
        nurseId: nurseInfo?.id || this.request()?.nurseId,
        serviceRequestId: this.requestId(),
        nurseName
      },
      // Modal flotante centrado - mejor para formularios
      cssClass: 'review-modal-floating',
      backdropDismiss: true,
      showBackdrop: true
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss<ReviewSubmitData>();

    if (role === 'submit' && data) {
      await this.submitReviewFromModal(data);
    } else if (role === 'skip') {
      // Service is completed, navigate to home even if skipped
      this.router.navigate(['/patient/tabs/home']);
    }
  }

  /**
   * Submit review from modal data
   * Makes two independent API calls and handles partial failures gracefully
   */
  private async submitReviewFromModal(reviewData: ReviewSubmitData) {
    const nurseId = this.nurse()?.id || this.request()?.nurseId;
    if (!nurseId) {
      this.showError('No se pudo identificar a la enfermera');
      return;
    }

    let nurseReviewSuccess = false;
    let serviceRateSuccess = false;

    // 1. Submit to nurse reviews API
    try {
      await firstValueFrom(this.nurseApiService.submitReview(nurseId, {
        rating: reviewData.rating,
        comment: reviewData.comment,
        serviceRequestId: this.requestId()
      }));
      nurseReviewSuccess = true;
    } catch (err: any) {
      // 409 = already reviewed - this is OK
      if (err?.status === 409) {
        nurseReviewSuccess = true;
        console.log('Nurse review already exists, continuing...');
      } else {
        console.error('Error submitting nurse review:', err);
      }
    }

    // 2. Update the service request rating
    try {
      await firstValueFrom(this.requestService.rate(
        this.requestId(),
        reviewData.rating,
        reviewData.comment || undefined
      ));
      serviceRateSuccess = true;
    } catch (err: any) {
      // 400 with "Already rated" - this is OK
      if (err?.status === 400 && err?.error?.message?.includes('rated')) {
        serviceRateSuccess = true;
        console.log('Service already rated, continuing...');
      } else {
        console.error('Error rating service request:', err);
      }
    }

    // Evaluate results
    if (nurseReviewSuccess || serviceRateSuccess) {
      this.hasReviewed.set(true);

      // Show success toast and navigate to home
      const toast = await this.toastController.create({
        message: '¡Gracias por tu calificación!',
        duration: 2500,
        position: 'bottom',
        color: 'success',
        icon: 'star',
      });
      await toast.present();
      await toast.onDidDismiss();
      this.router.navigate(['/patient/tabs/home']);
    } else {
      this.showError('No se pudo enviar tu calificación. Por favor, intenta de nuevo.');
    }
  }

  /**
   * Submit review to API
   * Makes two independent API calls and handles partial failures gracefully
   */
  async submitReview(rating: number, comment: string) {
    const nurseId = this.nurse()?.id;
    if (!nurseId) {
      this.showError('No se pudo identificar a la enfermera');
      return;
    }

    let nurseReviewSuccess = false;
    let serviceRateSuccess = false;

    // 1. Submit to nurse reviews API
    try {
      await firstValueFrom(this.nurseApiService.submitReview(nurseId, {
        rating,
        comment,
        serviceRequestId: this.requestId()
      }));
      nurseReviewSuccess = true;
    } catch (err: any) {
      // 409 = already reviewed - this is OK
      if (err?.status === 409) {
        nurseReviewSuccess = true;
        console.log('Nurse review already exists, continuing...');
      } else {
        console.error('Error submitting nurse review:', err);
      }
    }

    // 2. Update the service request rating
    try {
      await firstValueFrom(this.requestService.rate(
        this.requestId(),
        rating,
        comment || undefined
      ));
      serviceRateSuccess = true;
    } catch (err: any) {
      // 400 with "Already rated" - this is OK
      if (err?.status === 400 && err?.error?.message?.includes('rated')) {
        serviceRateSuccess = true;
        console.log('Service already rated, continuing...');
      } else {
        console.error('Error rating service request:', err);
      }
    }

    // Evaluate results
    if (nurseReviewSuccess || serviceRateSuccess) {
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
    } else {
      this.showError('No se pudo enviar tu calificación. Por favor, intenta de nuevo.');
    }
  }

  /**
   * Check if review should be shown
   */
  shouldShowReview(): boolean {
    return this.currentStatus() === 'completed' && !this.hasReviewed();
  }

  /**
   * Get human-readable label for time slot
   */
  getTimeSlotLabel(slot: string | undefined): string {
    if (!slot) return '';
    const labels: Record<string, string> = {
      morning: 'Mañana (8:00 - 12:00)',
      afternoon: 'Tarde (12:00 - 18:00)',
      evening: 'Noche (18:00 - 21:00)',
      flexible: 'Horario flexible'
    };
    return labels[slot] || slot;
  }
}
