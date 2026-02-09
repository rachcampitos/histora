import { Component, OnInit, OnDestroy, inject, signal, computed, effect, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { RefresherCustomEvent, ToastController, AlertController } from '@ionic/angular';
import { NurseApiService } from '../../core/services/nurse.service';
import { ServiceRequestService } from '../../core/services/service-request.service';
import { AuthService } from '../../core/services/auth.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ProductTourService } from '../../core/services/product-tour.service';
import { NurseOnboardingService } from '../../core/services/nurse-onboarding.service';
import { CelebrationService } from '../../core/services/celebration.service';
import { Nurse, ServiceRequest } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: false,
  styleUrls: ['./dashboard.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit, OnDestroy {
  private nurseApi = inject(NurseApiService);
  private requestService = inject(ServiceRequestService);
  private authService = inject(AuthService);
  private geoService = inject(GeolocationService);
  private wsService = inject(WebSocketService);
  private productTour = inject(ProductTourService);
  private nurseOnboarding = inject(NurseOnboardingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private destroyRef = inject(DestroyRef);
  private celebrationService = inject(CelebrationService);

  // State signals
  nurse = signal<Nurse | null>(null);
  pendingRequests = signal<ServiceRequest[]>([]);
  activeRequests = signal<ServiceRequest[]>([]);
  isLoading = signal(true);
  isTogglingAvailability = signal(false);
  isBroadcastingLocation = signal(false);

  // Location broadcasting
  private locationBroadcastInterval: ReturnType<typeof setInterval> | null = null;
  private currentActiveRequest = signal<ServiceRequest | null>(null);

  // Verification polling
  private verificationPollingInterval: ReturnType<typeof setInterval> | null = null;
  private readonly VERIFICATION_POLL_INTERVAL = 15000; // 15 seconds

  // Computed values
  user = this.authService.user;
  isAvailable = computed(() => this.nurse()?.isAvailable ?? false);
  rating = computed(() => this.nurse()?.averageRating ?? 0);
  totalServices = computed(() => this.nurse()?.totalServicesCompleted ?? 0);
  totalReviews = computed(() => this.nurse()?.totalReviews ?? 0);
  verificationStatus = computed(() => this.nurse()?.verificationStatus || 'pending');
  isVerified = computed(() => this.verificationStatus() === 'approved');
  needsVerification = computed(() => !this.isVerified());

  // Check if we have an active "on_the_way" request
  hasActiveTracking = computed(() => {
    const active = this.activeRequests();
    return active.some(r => r.status === 'on_the_way');
  });

  /**
   * Get the most important active request for the prominent banner
   * Priority: in_progress > on_the_way > arrived > accepted
   */
  getActiveInProgressRequest(): ServiceRequest | null {
    const active = this.activeRequests();
    const priorityOrder = ['in_progress', 'on_the_way', 'arrived', 'accepted'];

    for (const status of priorityOrder) {
      const found = active.find(r => r.status === status);
      if (found) return found;
    }
    return null;
  }

  constructor() {
    // React to active request changes
    effect(() => {
      const requests = this.activeRequests();
      const onTheWayRequest = requests.find(r => r.status === 'on_the_way');

      if (onTheWayRequest) {
        this.currentActiveRequest.set(onTheWayRequest);
        this.startLocationBroadcast();
      } else {
        this.stopLocationBroadcast();
        this.currentActiveRequest.set(null);
      }
    });

    // React to new request notifications (real-time)
    effect(() => {
      const newRequest = this.wsService.newRequest();
      if (newRequest) {
        // Show toast notification
        this.showNewRequestNotification(newRequest);
        // Refresh pending requests list
        this.refreshPendingRequests();
        // Clear the notification after handling
        this.wsService.clearNewRequest();
      }
    });

    // React to status updates (for active requests)
    effect(() => {
      const statusUpdate = this.wsService.statusUpdate();
      if (statusUpdate) {
        if (statusUpdate.status === 'cancelled') {
          const name = statusUpdate.patientName || 'Un paciente';
          const service = statusUpdate.serviceName ? ` de ${statusUpdate.serviceName}` : '';
          this.showToast(`${name} cancelo su solicitud${service}`, 'warning');
        }
        // Small delay to allow backend to persist the status change before querying
        setTimeout(() => {
          const nurseId = this.nurse()?._id;
          if (nurseId) {
            this.loadRequests(nurseId);
          }
        }, 500);
      }
    });
  }

  /**
   * Show notification for new nearby request
   */
  private async showNewRequestNotification(request: { service: { name: string }; location: { district?: string } }) {
    const toast = await this.toastCtrl.create({
      message: `Nueva solicitud: ${request.service.name} en ${request.location.district || 'tu zona'}`,
      duration: 5000,
      position: 'top',
      color: 'primary',
      buttons: [
        {
          text: 'Ver',
          handler: () => {
            this.goToRequests();
          }
        }
      ]
    });
    await toast.present();
  }

  /**
   * Refresh only pending requests (for real-time updates)
   */
  private async refreshPendingRequests() {
    try {
      const position = await this.geoService.getCurrentPosition();
      if (position) {
        this.requestService
          .getPendingNearby(position.latitude, position.longitude, 10)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (requests) => this.pendingRequests.set(requests.slice(0, 5)),
            error: (err) => console.error('Error refreshing pending:', err),
          });
      }
    } catch (error) {
      console.error('Error getting position for refresh:', error);
    }
  }

  async ngOnInit() {
    // Check if nurse has completed business onboarding
    await this.nurseOnboarding.init();
    if (!this.nurseOnboarding.isCompleted()) {
      this.router.navigate(['/nurse/onboarding'], { replaceUrl: true });
      return;
    }

    this.initializeWebSocket();
    this.loadData();
  }

  ionViewDidEnter() {
    // Refresh nurse profile to get latest verification status
    this.refreshNurseProfile();

    // Refresh active requests to show latest service status
    const nurseId = this.nurse()?._id;
    if (nurseId) {
      this.loadRequests(nurseId);
    }

    // Handle review notification queryParams
    this.handleReviewQueryParams();

    // Start verification polling if not yet approved
    this.startVerificationPolling();

    // Start tour after page is fully visible
    // Use a longer delay (1 second) to ensure UI is fully rendered
    setTimeout(async () => {
      // Guard: Only start tour if we're actually on the dashboard route
      // This prevents the tour from starting when navigating away from verification
      if (!this.router.url.includes('/nurse/dashboard')) {
        return;
      }

      // Initialize tour service (loads completed tours from backend)
      await this.productTour.init();
      // First check if there's a pending tour (from replay)
      await this.productTour.checkAndStartPendingTour();
      // Then try to start the regular tour if not already completed
      this.productTour.startTour('nurse_dashboard');
    }, 1000);
  }

  ionViewWillLeave() {
    // Stop any active tour when leaving this page to prevent freezing
    this.productTour.forceStop();

    // Stop verification polling when leaving
    this.stopVerificationPolling();
  }

  /**
   * Refresh only the nurse profile (for verification status updates)
   */
  private refreshNurseProfile() {
    this.nurseApi.getMyProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (nurse) => {
        const currentNurse = this.nurse();
        const previousStatus = currentNurse?.verificationStatus;

        // Update nurse data
        this.nurse.set(nurse);

        // If status changed to approved, stop polling
        // Note: The verification page handles showing the celebration modal
        // We don't show it here to prevent duplicates
        if (nurse.verificationStatus === 'approved' && previousStatus !== 'approved') {
          this.stopVerificationPolling();
        }
      },
      error: (err) => {
        console.error('Error refreshing profile:', err);
      },
    });
  }

  /**
   * Start polling for verification status updates
   */
  private startVerificationPolling() {
    // Only poll if verification is pending or under review
    const status = this.verificationStatus();
    if (status === 'approved' || status === 'rejected') {
      return;
    }

    // Clear any existing interval
    this.stopVerificationPolling();

    // Poll every 15 seconds
    this.verificationPollingInterval = setInterval(() => {
      const currentStatus = this.verificationStatus();
      // Stop polling if already approved or rejected
      if (currentStatus === 'approved' || currentStatus === 'rejected') {
        this.stopVerificationPolling();
        return;
      }
      this.refreshNurseProfile();
    }, this.VERIFICATION_POLL_INTERVAL);
  }

  /**
   * Stop polling for verification status
   */
  private stopVerificationPolling() {
    if (this.verificationPollingInterval) {
      clearInterval(this.verificationPollingInterval);
      this.verificationPollingInterval = null;
    }
  }

  /**
   * Show celebration when verification is approved
   */
  private async showVerificationCelebration() {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-success verification-celebration',
      header: '🎉 ¡Felicidades!',
      message: 'Tu cuenta ha sido verificada. Ahora puedes recibir solicitudes de pacientes y comenzar a ofrecer tus servicios.',
      buttons: [
        {
          text: '¡Empezar!',
          handler: () => {
            // Refresh data to show updated UI
            this.loadData();
          }
        }
      ],
      backdropDismiss: false
    });
    await alert.present();
  }

  private handleReviewQueryParams() {
    const params = this.route.snapshot.queryParams;
    if (params['showReview'] !== 'true') return;

    const rating = Number(params['rating']) || 0;

    // Clear queryParams to avoid re-triggering on re-enter
    this.router.navigate([], { queryParams: {}, replaceUrl: true });

    // Small delay so the page is fully visible before showing the celebration
    setTimeout(() => {
      if (rating >= 5) {
        this.celebrationService.triggerConfetti();
        this.showToast('Un paciente califico tu servicio con 5 estrellas. Servicio excepcional!', 'success');
      } else if (rating === 4) {
        this.showToast('Un paciente califico tu servicio con 4 estrellas. Muy buen trabajo!', 'success');
      } else {
        this.showToast('Tienes una nueva resena de un paciente', 'primary');
      }
    }, 300);
  }

  ngOnDestroy() {
    this.stopLocationBroadcast();
    this.stopVerificationPolling();
  }

  /**
   * Initialize WebSocket connection
   */
  private async initializeWebSocket() {
    const token = await this.authService.getToken();
    if (token) {
      this.wsService.connect(token);
    }
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      // Load nurse profile
      this.nurseApi.getMyProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (nurse) => {
          this.nurse.set(nurse);
          this.loadRequests(nurse._id);
        },
        error: (err) => {
          console.error('Error loading profile:', err);
          this.showToast('Error al cargar perfil', 'danger');
        },
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  loadRequests(nurseId: string) {
    // Load pending nearby requests
    this.geoService.getCurrentPosition().then((position) => {
      if (position) {
        this.requestService
          .getPendingNearby(position.latitude, position.longitude, 10)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (requests) => this.pendingRequests.set(requests.slice(0, 5)),
            error: (err) => console.error('Error loading pending:', err),
          });
      }
    });

    // Load active requests (accepted, on_the_way, arrived, in_progress)
    this.requestService.getNurseRequests().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (requests) => {
        const active = requests.filter((r) =>
          ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(r.status)
        );
        this.activeRequests.set(active);
      },
      error: (err) => console.error('Error loading active:', err),
    });
  }

  /**
   * Start broadcasting location for active service
   */
  private async startLocationBroadcast() {
    if (this.locationBroadcastInterval) return;

    const request = this.currentActiveRequest();
    if (!request || request.status !== 'on_the_way') return;

    this.isBroadcastingLocation.set(true);

    // Join the tracking room so patient can receive updates
    this.wsService.joinTrackingRoom(request._id);

    // Broadcast immediately
    await this.broadcastCurrentLocation();

    // Then every 5 seconds
    this.locationBroadcastInterval = setInterval(async () => {
      await this.broadcastCurrentLocation();
    }, 5000);
  }

  /**
   * Stop broadcasting location
   */
  private stopLocationBroadcast() {
    if (this.locationBroadcastInterval) {
      clearInterval(this.locationBroadcastInterval);
      this.locationBroadcastInterval = null;
    }

    // Leave the tracking room
    const request = this.currentActiveRequest();
    if (request) {
      this.wsService.leaveTrackingRoom(request._id);
    }

    this.isBroadcastingLocation.set(false);
  }

  /**
   * Broadcast current location to WebSocket
   */
  private async broadcastCurrentLocation() {
    const request = this.currentActiveRequest();
    const nurse = this.nurse();

    if (!request || !nurse) return;

    try {
      const position = await this.geoService.getCurrentPosition();
      if (position) {
        this.wsService.sendLocationUpdate({
          nurseId: nurse._id,
          requestId: request._id,
          latitude: position.latitude,
          longitude: position.longitude,
          heading: position.heading ?? undefined,
          speed: position.speed ?? undefined
        });

        // Also update on the server
        this.nurseApi.updateLocation(position.latitude, position.longitude).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      }
    } catch (error) {
      console.error('Error broadcasting location:', error);
    }
  }

  /**
   * Start service - mark as "on the way"
   */
  async startService(request: ServiceRequest) {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-primary',
      header: 'Iniciar Servicio',
      message: '¿Confirmas que vas en camino al paciente?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => {
            this.requestService.updateStatus(request._id, 'on_the_way').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
              next: () => {
                this.showToast('En camino al paciente', 'success');
                // Refresh requests to trigger location broadcasting
                this.loadRequests(this.nurse()?._id || '');
              },
              error: () => this.showToast('Error al actualizar estado', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Mark arrival at patient location
   */
  async markArrival(request: ServiceRequest) {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-primary',
      header: 'Llegada',
      message: '¿Confirmas que llegaste al domicilio del paciente?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => {
            this.requestService.updateStatus(request._id, 'arrived').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
              next: () => {
                // Notify via WebSocket
                this.wsService.notifyArrival(request._id);
                this.showToast('Llegada confirmada', 'success');
                this.loadRequests(this.nurse()?._id || '');
              },
              error: () => this.showToast('Error al actualizar estado', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Start the actual service (begin procedure)
   */
  async beginService(request: ServiceRequest) {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-primary',
      header: 'Iniciar Procedimiento',
      message: '¿Confirmas que inicias el procedimiento?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => {
            this.requestService.updateStatus(request._id, 'in_progress').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
              next: () => {
                // Notify via WebSocket
                this.wsService.notifyServiceStarted(request._id);
                this.showToast('Servicio en progreso', 'success');
                this.loadRequests(this.nurse()?._id || '');
              },
              error: () => this.showToast('Error al actualizar estado', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Complete the service
   */
  async completeService(request: ServiceRequest) {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-success',
      header: 'Completar Servicio',
      message: '¿Confirmas que completaste el servicio?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Completar',
          handler: () => {
            this.requestService.updateStatus(request._id, 'completed').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
              next: () => {
                // Notify via WebSocket
                this.wsService.notifyServiceCompleted(request._id);
                this.showToast('Servicio completado', 'success');
                this.loadRequests(this.nurse()?._id || '');
              },
              error: () => this.showToast('Error al completar servicio', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async toggleAvailability() {
    const nurse = this.nurse();
    if (!nurse) return;

    this.isTogglingAvailability.set(true);
    const newStatus = !nurse.isAvailable;

    this.nurseApi.setAvailability(newStatus).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updatedNurse) => {
        // Preserve existing user data (including avatar) if not returned by API
        const mergedNurse = {
          ...updatedNurse,
          user: updatedNurse.user || nurse.user,
        };
        this.nurse.set(mergedNurse);
        this.showToast(
          newStatus ? 'Ahora estás disponible' : 'Ya no estás disponible',
          'success'
        );
        this.isTogglingAvailability.set(false);
      },
      error: (err) => {
        console.error('Error toggling availability:', err);
        this.showToast('Error al cambiar disponibilidad', 'danger');
        this.isTogglingAvailability.set(false);
      },
    });
  }

  async updateLocation() {
    const position = await this.geoService.getCurrentPosition();
    if (position) {
      this.nurseApi.updateLocation(position.latitude, position.longitude).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.showToast('Ubicación actualizada', 'success'),
        error: () => this.showToast('Error al actualizar ubicación', 'danger'),
      });
    } else {
      this.showToast('No se pudo obtener ubicación', 'warning');
    }
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.loadData();
    setTimeout(() => event.target.complete(), 1000);
  }

  viewRequest(request: ServiceRequest) {
    // Navigate to active-service page for active services (including accepted)
    const activeStatuses = ['accepted', 'on_the_way', 'arrived', 'in_progress'];
    if (activeStatuses.includes(request.status)) {
      this.router.navigate(['/nurse/active-service', request._id]);
      return;
    }

    // Navigate to requests page for other statuses
    const tab = request.status === 'pending'
      ? 'pending'
      : 'history';
    this.router.navigate(['/nurse/requests'], { queryParams: { tab, requestId: request._id } });
  }

  goToRequests() {
    this.router.navigate(['/nurse/requests']);
  }

  goToServices() {
    this.router.navigate(['/nurse/services']);
  }

  goToEarnings() {
    this.router.navigate(['/nurse/earnings']);
  }

  goToProfile() {
    this.router.navigate(['/nurse/profile']);
  }

  goToVerification() {
    this.router.navigate(['/nurse/verification']);
  }

  // Avatar helpers
  getInitials(): string {
    const user = this.user();
    if (!user?.firstName) return '';
    const first = user.firstName[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase();
  }

  getAvatarColor(): string {
    const colors = [
      '#4A90E2', // Blue
      '#7B68EE', // Purple
      '#50C878', // Green
      '#FF6B6B', // Coral
      '#4ECDC4', // Turquoise
      '#4a9d9a', // NurseLite teal
    ];

    const name = this.user()?.firstName || '';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      on_the_way: 'En camino',
      arrived: 'Llegó',
      in_progress: 'En progreso',
      completed: 'Completada',
      cancelled: 'Cancelada',
      rejected: 'Rechazada',
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'warning',
      accepted: 'primary',
      on_the_way: 'tertiary',
      arrived: 'secondary',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'danger',
      rejected: 'danger',
    };
    return colors[status] || 'medium';
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      injection: 'Inyectables',
      wound_care: 'Curaciones',
      catheter: 'Sondas',
      vital_signs: 'Signos vitales',
      iv_therapy: 'Terapia IV',
      blood_draw: 'Toma de muestras',
      medication: 'Medicamentos',
      elderly_care: 'Adulto mayor',
      post_surgery: 'Post-operatorio',
      other: 'Otro',
    };
    return labels[category] || category;
  }

  /**
   * Get the next action for a request based on its status
   */
  getNextAction(request: ServiceRequest): { label: string; action: () => void; color: string } | null {
    switch (request.status) {
      case 'accepted':
        return { label: 'Ir al paciente', action: () => this.startService(request), color: 'primary' };
      case 'on_the_way':
        return { label: 'Llegué', action: () => this.markArrival(request), color: 'secondary' };
      case 'arrived':
        // Navigate to active-service to enforce security code verification
        return { label: 'Verificar codigo', action: () => this.router.navigate(['/nurse/active-service', request._id]), color: 'tertiary' };
      case 'in_progress':
        return { label: 'Completar', action: () => this.completeService(request), color: 'success' };
      default:
        return null;
    }
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
