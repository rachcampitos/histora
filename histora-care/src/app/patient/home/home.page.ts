import { Component, OnInit, OnDestroy, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { ServiceRequestService } from '../../core/services/service-request.service';
import { ProductTourService } from '../../core/services/product-tour.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ServiceRequest } from '../../core/models';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  standalone: false,
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit, OnDestroy {
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private authService = inject(AuthService);
  private serviceRequestService = inject(ServiceRequestService);
  private productTourService = inject(ProductTourService);
  private wsService = inject(WebSocketService);

  user = this.authService.user;
  activeRequest = signal<ServiceRequest | null>(null);
  recentNurses = signal<{ nurseId: string; firstName: string; lastName: string; avatar?: string }[]>([]);
  isLoading = signal(false);

  constructor() {
    // React to WebSocket status updates
    effect(() => {
      const statusUpdate = this.wsService.statusUpdate();
      if (statusUpdate) {
        // Small delay to allow backend to persist the status change before querying
        setTimeout(() => this.loadActiveRequest(), 500);

        // Show arrival alert prompting patient to verify security code
        if (statusUpdate.status === 'arrived') {
          this.showNurseArrivedAlert(statusUpdate.requestId);
        }
      }
    });
  }

  async ngOnInit() {
    // Clear previous data before loading (in case user switched accounts)
    this.activeRequest.set(null);
    this.recentNurses.set([]);

    // Connect to WebSocket for real-time updates
    const token = await this.authService.getToken();
    if (token) {
      this.wsService.connect(token);
    }

    this.loadActiveRequest();
    this.loadRecentNurses();
  }

  ngOnDestroy() {
    // Don't disconnect WebSocket here - it's shared across the app
  }

  ionViewWillEnter() {
    // Refresh data when returning to this page
    this.loadActiveRequest();
    this.loadRecentNurses();
  }

  ionViewDidEnter() {
    // Start product tour if not completed
    // Use a longer delay (1 second) to ensure UI is fully rendered
    // This is especially important on first app load after registration
    setTimeout(async () => {
      // Initialize tour service (loads completed tours from backend)
      await this.productTourService.init();
      // First check if there's a pending tour (from replay)
      await this.productTourService.checkAndStartPendingTour();
      // Then try to start the regular tour if not already completed
      this.productTourService.startTour('patient_home');
    }, 1000);
  }

  ionViewWillLeave() {
    // Stop any active tour when leaving this page to prevent freezing
    this.productTourService.forceStop();
  }

  async loadActiveRequest() {
    this.isLoading.set(true);
    try {
      // Get all requests and filter for active ones
      const requests = await this.serviceRequestService.getMyRequests().toPromise();

      if (requests && requests.length > 0) {
        // Find active requests (pending, accepted, on_the_way, arrived, in_progress)
        // Include pending so user knows they have a request waiting for confirmation
        const activeStatuses = ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'];
        const activeRequest = requests.find(req => activeStatuses.includes(req.status));
        this.activeRequest.set(activeRequest || null);
      } else {
        this.activeRequest.set(null);
      }
    } catch (error) {
      console.error('Error loading active request:', error);
      this.activeRequest.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadRecentNurses() {
    try {
      // Get completed requests to find recent nurses
      const requests = await this.serviceRequestService.getMyRequests('completed').toPromise();

      if (requests && requests.length > 0) {
        // Extract unique nurses using nurseId as key
        const nursesMap = new Map<string, { nurseId: string; firstName: string; lastName: string; avatar?: string }>();
        requests.forEach((req: ServiceRequest) => {
          if (req.nurseId && req.nurse && !nursesMap.has(req.nurseId)) {
            nursesMap.set(req.nurseId, {
              nurseId: req.nurseId,
              firstName: req.nurse.firstName,
              lastName: req.nurse.lastName,
              avatar: req.nurse.avatar
            });
          }
        });
        this.recentNurses.set(Array.from(nursesMap.values()).slice(0, 4));
      } else {
        this.recentNurses.set([]);
      }
    } catch (error) {
      console.error('Error loading recent nurses:', error);
      this.recentNurses.set([]);
    }
  }

  goToMap() {
    this.router.navigate(['/patient/tabs/map']);
  }

  goToHistory() {
    this.router.navigate(['/patient/tabs/history']);
  }

  goToMyNurses() {
    this.showComingSoon('Equipo de Confianza');
  }

  goToSettings() {
    this.router.navigate(['/patient/tabs/settings']);
  }

  viewActiveRequest() {
    const request = this.activeRequest();
    if (request) {
      this.router.navigate(['/patient/tracking', request._id]);
    }
  }

  selectRecentNurse(nurse: { nurseId: string; firstName: string; lastName: string; avatar?: string }) {
    this.router.navigate(['/patient/search'], { queryParams: { nurseId: nurse.nurseId, origin: 'home' } });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'accepted': 'Aceptada',
      'on_the_way': 'En camino',
      'arrived': 'Ha llegado',
      'in_progress': 'En progreso',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
      'rejected': 'Rechazada'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'warning',
      'accepted': 'primary',
      'on_the_way': 'tertiary',
      'arrived': 'success',
      'in_progress': 'success',
      'completed': 'medium',
      'cancelled': 'danger',
      'rejected': 'danger'
    };
    return colors[status] || 'medium';
  }

  private async showNurseArrivedAlert(requestId: string) {
    const request = this.activeRequest();
    const nurseName = request?.nurse
      ? `${request.nurse.firstName} ${request.nurse.lastName}`
      : 'Tu enfermera';

    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-primary',
      header: 'Tu enfermera ha llegado',
      message: `${nurseName} esta en la puerta y necesita el codigo de seguridad para confirmar su identidad.`,
      backdropDismiss: false,
      buttons: [
        { text: 'Ahora no', role: 'cancel' },
        {
          text: 'Ver mi codigo',
          handler: () => {
            this.router.navigate(['/patient/tracking', requestId]);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showComingSoon(feature: string) {
    const toast = await this.toastCtrl.create({
      message: `${feature} estará disponible próximamente`,
      duration: 2000,
      position: 'bottom',
      color: 'primary',
      icon: 'time-outline'
    });
    await toast.present();
  }
}
