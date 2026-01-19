import { Component, OnInit, OnDestroy, inject, signal, computed, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { RefresherCustomEvent, ToastController, AlertController } from '@ionic/angular';
import { NurseApiService } from '../../core/services/nurse.service';
import { ServiceRequestService } from '../../core/services/service-request.service';
import { AuthService } from '../../core/services/auth.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ProductTourService } from '../../core/services/product-tour.service';
import { Nurse, ServiceRequest } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: false,
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  private nurseApi = inject(NurseApiService);
  private requestService = inject(ServiceRequestService);
  private authService = inject(AuthService);
  private geoService = inject(GeolocationService);
  private wsService = inject(WebSocketService);
  private productTour = inject(ProductTourService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private destroyRef = inject(DestroyRef);

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
  }

  ngOnInit() {
    this.initializeWebSocket();
    this.loadData();
  }

  ionViewDidEnter() {
    // Refresh nurse profile to get latest verification status
    this.refreshNurseProfile();

    // Start tour after page is fully visible
    setTimeout(async () => {
      // First check if there's a pending tour (from replay)
      await this.productTour.checkAndStartPendingTour();
      // Then try to start the regular tour if not already completed
      this.productTour.startTour('nurse_dashboard');
    }, 500);
  }

  /**
   * Refresh only the nurse profile (for verification status updates)
   */
  private refreshNurseProfile() {
    this.nurseApi.getMyProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (nurse) => {
        const currentNurse = this.nurse();
        // Only update if verification status changed
        if (!currentNurse || currentNurse.verificationStatus !== nurse.verificationStatus) {
          this.nurse.set(nurse);
          // If newly approved, show a toast
          if (nurse.verificationStatus === 'approved' && currentNurse?.verificationStatus !== 'approved') {
            this.showToast('¡Tu cuenta ha sido verificada!', 'success');
          }
        } else {
          // Still update the nurse data for other potential changes
          this.nurse.set(nurse);
        }
      },
      error: (err) => {
        console.error('Error refreshing profile:', err);
      },
    });
  }

  ngOnDestroy() {
    this.stopLocationBroadcast();
    this.wsService.disconnect();
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
        this.nurse.set(updatedNurse);
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
    // Navigate to requests page with active tab selected
    const tab = ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(request.status)
      ? 'active'
      : request.status === 'pending'
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
        return { label: 'Iniciar servicio', action: () => this.beginService(request), color: 'tertiary' };
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
