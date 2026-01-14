import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { ServiceRequestService } from '../../core/services/service-request.service';
import { NurseApiService } from '../../core/services/nurse.service';
import { ServiceRequest, ServiceRequestStatus } from '../../core/models';
import { ReviewModalComponent, ReviewSubmitData } from '../../shared/components/review-modal';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

interface TabOption {
  value: FilterTab;
  label: string;
}

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  standalone: false,
  styleUrls: ['./history.page.scss'],
})
export class HistoryPage implements OnInit {
  private router = inject(Router);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);
  private toastController = inject(ToastController);
  private serviceRequestService = inject(ServiceRequestService);
  private nurseApiService = inject(NurseApiService);

  // State signals
  allRequests = signal<ServiceRequest[]>([]);
  isLoading = signal(true);
  isRefreshing = signal(false);
  error = signal<string | null>(null);
  selectedTab = signal<FilterTab>('all');

  // Tabs configuration
  tabs: TabOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'completed', label: 'Completados' },
    { value: 'cancelled', label: 'Cancelados' }
  ];

  // Active statuses
  private activeStatuses: ServiceRequestStatus[] = ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'];

  // Filtered requests based on selected tab
  filteredRequests = computed(() => {
    const requests = this.allRequests();
    const tab = this.selectedTab();

    switch (tab) {
      case 'active':
        return requests.filter(r => this.activeStatuses.includes(r.status));
      case 'completed':
        return requests.filter(r => r.status === 'completed');
      case 'cancelled':
        return requests.filter(r => r.status === 'cancelled' || r.status === 'rejected');
      default:
        return requests;
    }
  });

  // Counts for badges
  activeCount = computed(() =>
    this.allRequests().filter(r => this.activeStatuses.includes(r.status)).length
  );

  completedCount = computed(() =>
    this.allRequests().filter(r => r.status === 'completed').length
  );

  cancelledCount = computed(() =>
    this.allRequests().filter(r => r.status === 'cancelled' || r.status === 'rejected').length
  );

  ngOnInit() {
    this.loadRequests();
  }

  ionViewWillEnter() {
    // Refresh data when returning to this page
    this.loadRequests();
  }

  /**
   * Load all service requests
   */
  async loadRequests() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const requests = await this.serviceRequestService.getMyRequests().toPromise();

      if (requests) {
        // Sort by date (most recent first)
        const sorted = requests.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.allRequests.set(sorted);
      } else {
        this.allRequests.set([]);
      }
    } catch (err) {
      console.error('Error loading requests:', err);
      this.error.set('No se pudieron cargar tus servicios. Intenta de nuevo.');
      this.allRequests.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Pull-to-refresh handler
   */
  async handleRefresh(event: any) {
    this.isRefreshing.set(true);

    try {
      const requests = await this.serviceRequestService.getMyRequests().toPromise();

      if (requests) {
        const sorted = requests.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.allRequests.set(sorted);
      }
    } catch (err) {
      console.error('Error refreshing requests:', err);
      await this.showToast('Error al actualizar', 'danger');
    } finally {
      this.isRefreshing.set(false);
      event.target.complete();
    }
  }

  /**
   * Change tab selection
   */
  onTabChange(tab: FilterTab) {
    this.selectedTab.set(tab);
  }

  /**
   * Navigate to request detail/tracking
   */
  viewRequest(request: ServiceRequest) {
    this.router.navigate(['/patient/tracking', request._id]);
  }

  /**
   * Show rating modal for completed services without review
   */
  async rateService(request: ServiceRequest, event: Event) {
    event.stopPropagation();

    const nurseName = request.nurse
      ? `${request.nurse.firstName} ${request.nurse.lastName}`
      : undefined;

    const modal = await this.modalController.create({
      component: ReviewModalComponent,
      componentProps: {
        nurseId: request.nurseId,
        serviceRequestId: request._id,
        nurseName
      },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
      handle: true,
      cssClass: 'review-modal'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss<ReviewSubmitData>();

    if (role === 'submit' && data) {
      await this.submitReview(request, data);
    }
  }

  /**
   * Submit review to the API
   */
  private async submitReview(request: ServiceRequest, reviewData: ReviewSubmitData) {
    try {
      // Submit to nurse reviews API
      if (request.nurseId) {
        await this.nurseApiService.submitReview(request.nurseId, {
          rating: reviewData.rating,
          comment: reviewData.comment,
          serviceRequestId: request._id
        }).toPromise();
      }

      // Also update the service request rating
      await this.serviceRequestService.rate(
        request._id,
        reviewData.rating,
        reviewData.comment || undefined
      ).toPromise();

      // Update local state
      const updated = this.allRequests().map(r =>
        r._id === request._id
          ? { ...r, rating: reviewData.rating, review: reviewData.comment || undefined, reviewedAt: new Date() }
          : r
      );
      this.allRequests.set(updated);

      await this.showToast('Gracias por tu calificacion', 'success');
    } catch (err) {
      console.error('Error submitting review:', err);
      await this.showToast('No se pudo enviar tu calificacion. Intenta de nuevo.', 'danger');
    }
  }

  /**
   * Get status label in Spanish
   */
  getStatusLabel(status: ServiceRequestStatus): string {
    const labels: Record<ServiceRequestStatus, string> = {
      'pending': 'Pendiente',
      'accepted': 'Aceptado',
      'on_the_way': 'En camino',
      'arrived': 'Llego',
      'in_progress': 'En progreso',
      'completed': 'Completado',
      'cancelled': 'Cancelado',
      'rejected': 'Rechazado'
    };
    return labels[status] || status;
  }

  /**
   * Get status color for badge
   */
  getStatusColor(status: ServiceRequestStatus): string {
    const colors: Record<ServiceRequestStatus, string> = {
      'pending': 'warning',
      'accepted': 'primary',
      'on_the_way': 'tertiary',
      'arrived': 'secondary',
      'in_progress': 'success',
      'completed': 'success',
      'cancelled': 'danger',
      'rejected': 'danger'
    };
    return colors[status] || 'medium';
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: ServiceRequestStatus): string {
    const icons: Record<ServiceRequestStatus, string> = {
      'pending': 'time-outline',
      'accepted': 'checkmark-circle-outline',
      'on_the_way': 'navigate-outline',
      'arrived': 'location-outline',
      'in_progress': 'medical-outline',
      'completed': 'checkmark-done-outline',
      'cancelled': 'close-circle-outline',
      'rejected': 'close-circle-outline'
    };
    return icons[status] || 'ellipse-outline';
  }

  /**
   * Format date in Spanish
   */
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-PE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Format time
   */
  formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format price with currency
   */
  formatPrice(price: number, currency: string): string {
    const symbol = currency === 'PEN' ? 'S/' : '$';
    return `${symbol} ${price.toFixed(2)}`;
  }

  /**
   * Check if service can be rated
   */
  canRate(request: ServiceRequest): boolean {
    return request.status === 'completed' && !request.rating;
  }

  /**
   * Check if service is active (can be tracked)
   */
  isActive(request: ServiceRequest): boolean {
    return this.activeStatuses.includes(request.status);
  }

  /**
   * Get nurse full name
   */
  getNurseName(request: ServiceRequest): string {
    if (request.nurse) {
      return `${request.nurse.firstName} ${request.nurse.lastName}`;
    }
    return 'Enfermera asignada';
  }

  /**
   * Get nurse initials for avatar placeholder
   */
  getNurseInitials(request: ServiceRequest): string {
    if (request.nurse) {
      const first = request.nurse.firstName?.charAt(0) || '';
      const last = request.nurse.lastName?.charAt(0) || '';
      return (first + last).toUpperCase();
    }
    return 'E';
  }

  /**
   * View existing review
   */
  async viewReview(request: ServiceRequest, event: Event) {
    event.stopPropagation();

    const alert = await this.alertController.create({
      header: 'Tu Reseña',
      subHeader: `${request.rating} de 5 estrellas`,
      message: request.review || 'Sin comentario',
      buttons: ['Cerrar'],
      cssClass: 'view-review-alert'
    });
    await alert.present();
  }

  /**
   * Show toast message
   */
  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color
    });
    await toast.present();
  }

  /**
   * Retry loading after error
   */
  retry() {
    this.loadRequests();
  }

  /**
   * Navigate to search for a new service
   */
  goToSearch() {
    this.router.navigate(['/patient/tabs/map']);
  }
}
