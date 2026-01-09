import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import {
  RefresherCustomEvent,
  ToastController,
  AlertController,
  LoadingController
} from '@ionic/angular';
import { ServiceRequestService } from '../../core/services/service-request.service';
import { GeolocationService, LocationCoordinates } from '../../core/services/geolocation.service';
import { AuthService } from '../../core/services/auth.service';
import { ServiceRequest, ServiceRequestStatus } from '../../core/models';

type TabType = 'pending' | 'active' | 'history';

interface RequestWithDistance extends ServiceRequest {
  distance?: number;
}

@Component({
  selector: 'app-requests',
  templateUrl: './requests.page.html',
  standalone: false,
  styleUrls: ['./requests.page.scss'],
})
export class RequestsPage implements OnInit, OnDestroy {
  private requestService = inject(ServiceRequestService);
  private geoService = inject(GeolocationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);

  // State signals
  currentTab = signal<TabType>('pending');
  pendingRequests = signal<RequestWithDistance[]>([]);
  activeRequests = signal<RequestWithDistance[]>([]);
  historyRequests = signal<RequestWithDistance[]>([]);
  isLoading = signal(true);
  isRefreshing = signal(false);
  currentLocation = signal<LocationCoordinates | null>(null);

  // Computed values
  user = this.authService.user;

  currentRequests = computed(() => {
    const tab = this.currentTab();
    switch (tab) {
      case 'pending':
        return this.pendingRequests();
      case 'active':
        return this.activeRequests();
      case 'history':
        return this.historyRequests();
      default:
        return [];
    }
  });

  pendingCount = computed(() => this.pendingRequests().length);
  activeCount = computed(() => this.activeRequests().length);

  // Status flow for active requests
  private statusFlow: ServiceRequestStatus[] = [
    'accepted',
    'on_the_way',
    'arrived',
    'in_progress',
    'completed'
  ];

  ngOnInit() {
    this.initLocation();
    this.loadAllData();
  }

  ngOnDestroy() {
    this.geoService.stopWatching();
  }

  async initLocation() {
    try {
      const permission = await this.geoService.checkPermissions();
      if (permission.location !== 'granted') {
        await this.geoService.requestPermissions();
      }
      const position = await this.geoService.getCurrentPosition();
      this.currentLocation.set(position);
    } catch (error) {
      console.error('Error getting location:', error);
      this.showToast('No se pudo obtener ubicacion', 'warning');
    }
  }

  async loadAllData() {
    this.isLoading.set(true);
    try {
      await Promise.all([
        this.loadPendingRequests(),
        this.loadActiveRequests(),
        this.loadHistoryRequests()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      this.showToast('Error al cargar solicitudes', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadPendingRequests() {
    const location = this.currentLocation();
    if (!location) {
      // Try to get location again
      try {
        const position = await this.geoService.getCurrentPosition();
        this.currentLocation.set(position);
        this.loadPendingNearby(position.latitude, position.longitude);
      } catch {
        // Load without distance calculation
        this.requestService.getPendingNearby(0, 0, 50).subscribe({
          next: (requests) => this.pendingRequests.set(requests),
          error: (err) => console.error('Error loading pending:', err)
        });
      }
    } else {
      this.loadPendingNearby(location.latitude, location.longitude);
    }
  }

  private loadPendingNearby(lat: number, lng: number) {
    this.requestService.getPendingNearby(lat, lng, 20).subscribe({
      next: (requests) => {
        const withDistance = requests.map(request => ({
          ...request,
          distance: this.calculateDistanceForRequest(request, lat, lng)
        }));
        // Sort by distance
        withDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        this.pendingRequests.set(withDistance);
      },
      error: (err) => console.error('Error loading pending:', err)
    });
  }

  loadActiveRequests() {
    this.requestService.getNurseRequests().subscribe({
      next: (requests) => {
        const activeStatuses: ServiceRequestStatus[] = [
          'accepted',
          'on_the_way',
          'arrived',
          'in_progress'
        ];
        const active = requests.filter(r => activeStatuses.includes(r.status));
        const withDistance = this.addDistanceToRequests(active);
        this.activeRequests.set(withDistance);
      },
      error: (err) => console.error('Error loading active:', err)
    });
  }

  loadHistoryRequests() {
    this.requestService.getNurseRequests().subscribe({
      next: (requests) => {
        const historyStatuses: ServiceRequestStatus[] = [
          'completed',
          'cancelled',
          'rejected'
        ];
        const history = requests.filter(r => historyStatuses.includes(r.status));
        // Sort by most recent first
        history.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        this.historyRequests.set(history);
      },
      error: (err) => console.error('Error loading history:', err)
    });
  }

  private addDistanceToRequests(requests: ServiceRequest[]): RequestWithDistance[] {
    const location = this.currentLocation();
    if (!location) return requests;

    return requests.map(request => ({
      ...request,
      distance: this.calculateDistanceForRequest(
        request,
        location.latitude,
        location.longitude
      )
    }));
  }

  private calculateDistanceForRequest(
    request: ServiceRequest,
    lat: number,
    lng: number
  ): number {
    if (!request.location?.coordinates) return 0;
    const [reqLng, reqLat] = request.location.coordinates;
    return this.geoService.calculateDistance(lat, lng, reqLat, reqLng);
  }

  onTabChange(event: CustomEvent) {
    const tab = event.detail.value as TabType;
    this.currentTab.set(tab);
  }

  async handleRefresh(event: RefresherCustomEvent) {
    this.isRefreshing.set(true);
    await this.loadAllData();
    this.isRefreshing.set(false);
    event.target.complete();
  }

  // Accept a pending request
  async acceptRequest(request: ServiceRequest, event: Event) {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'Aceptar solicitud',
      message: `¿Deseas aceptar el servicio de ${request.service.name} para ${request.patient?.firstName || 'el paciente'}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aceptar',
          handler: () => this.doAcceptRequest(request)
        }
      ]
    });
    await alert.present();
  }

  private async doAcceptRequest(request: ServiceRequest) {
    const loading = await this.loadingCtrl.create({
      message: 'Aceptando solicitud...'
    });
    await loading.present();

    this.requestService.accept(request._id).subscribe({
      next: (updatedRequest) => {
        loading.dismiss();
        this.showToast('Solicitud aceptada', 'success');
        // Remove from pending and add to active
        this.pendingRequests.update(requests =>
          requests.filter(r => r._id !== request._id)
        );
        this.activeRequests.update(requests => [
          { ...updatedRequest, distance: (request as RequestWithDistance).distance },
          ...requests
        ]);
      },
      error: (err) => {
        loading.dismiss();
        console.error('Error accepting request:', err);
        this.showToast('Error al aceptar solicitud', 'danger');
      }
    });
  }

  // Reject a pending request
  async rejectRequest(request: ServiceRequest, event: Event) {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'Rechazar solicitud',
      message: '¿Estas segura de rechazar esta solicitud?',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Motivo del rechazo (opcional)'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Rechazar',
          cssClass: 'danger',
          handler: (data) => this.doRejectRequest(request, data.reason)
        }
      ]
    });
    await alert.present();
  }

  private async doRejectRequest(request: ServiceRequest, reason?: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Rechazando solicitud...'
    });
    await loading.present();

    this.requestService.reject(request._id, reason).subscribe({
      next: () => {
        loading.dismiss();
        this.showToast('Solicitud rechazada', 'success');
        // Remove from pending
        this.pendingRequests.update(requests =>
          requests.filter(r => r._id !== request._id)
        );
      },
      error: (err) => {
        loading.dismiss();
        console.error('Error rejecting request:', err);
        this.showToast('Error al rechazar solicitud', 'danger');
      }
    });
  }

  // Update status for active requests
  async updateStatus(request: ServiceRequest, newStatus: ServiceRequestStatus, event: Event) {
    event.stopPropagation();

    const statusLabels: Record<string, string> = {
      on_the_way: 'En camino',
      arrived: 'He llegado',
      in_progress: 'Iniciar servicio',
      completed: 'Completar servicio'
    };

    const confirmMessages: Record<string, string> = {
      on_the_way: '¿Confirmas que vas en camino hacia el paciente?',
      arrived: '¿Confirmas que has llegado a la ubicacion del paciente?',
      in_progress: '¿Confirmas que estas iniciando el servicio?',
      completed: '¿Confirmas que has completado el servicio?'
    };

    const alert = await this.alertCtrl.create({
      header: statusLabels[newStatus],
      message: confirmMessages[newStatus],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => this.doUpdateStatus(request, newStatus)
        }
      ]
    });
    await alert.present();
  }

  private async doUpdateStatus(request: ServiceRequest, newStatus: ServiceRequestStatus) {
    const loading = await this.loadingCtrl.create({
      message: 'Actualizando estado...'
    });
    await loading.present();

    this.requestService.updateStatus(request._id, newStatus).subscribe({
      next: (updatedRequest) => {
        loading.dismiss();
        this.showToast(`Estado actualizado: ${this.getStatusLabel(newStatus)}`, 'success');

        if (newStatus === 'completed') {
          // Move to history
          this.activeRequests.update(requests =>
            requests.filter(r => r._id !== request._id)
          );
          this.historyRequests.update(requests => [updatedRequest, ...requests]);
        } else {
          // Update in active list
          this.activeRequests.update(requests =>
            requests.map(r =>
              r._id === request._id
                ? { ...updatedRequest, distance: (r as RequestWithDistance).distance }
                : r
            )
          );
        }
      },
      error: (err) => {
        loading.dismiss();
        console.error('Error updating status:', err);
        this.showToast('Error al actualizar estado', 'danger');
      }
    });
  }

  // Get the next status in the flow
  getNextStatus(currentStatus: ServiceRequestStatus): ServiceRequestStatus | null {
    const currentIndex = this.statusFlow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= this.statusFlow.length - 1) {
      return null;
    }
    return this.statusFlow[currentIndex + 1];
  }

  // Get button label for next status
  getNextStatusButtonLabel(currentStatus: ServiceRequestStatus): string {
    const nextStatus = this.getNextStatus(currentStatus);
    if (!nextStatus) return '';

    const labels: Record<string, string> = {
      on_the_way: 'Ir en camino',
      arrived: 'He llegado',
      in_progress: 'Iniciar servicio',
      completed: 'Completar'
    };
    return labels[nextStatus] || nextStatus;
  }

  // Get button icon for next status
  getNextStatusIcon(currentStatus: ServiceRequestStatus): string {
    const nextStatus = this.getNextStatus(currentStatus);
    if (!nextStatus) return '';

    const icons: Record<string, string> = {
      on_the_way: 'car-outline',
      arrived: 'location-outline',
      in_progress: 'medical-outline',
      completed: 'checkmark-circle-outline'
    };
    return icons[nextStatus] || 'arrow-forward';
  }

  // Navigate to request detail
  viewRequest(request: ServiceRequest) {
    this.router.navigate(['/nurse/requests', request._id]);
  }

  // Open maps with directions
  openMaps(request: ServiceRequest, event: Event) {
    event.stopPropagation();
    if (!request.location?.coordinates) return;

    const [lng, lat] = request.location.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  }

  // Call patient
  callPatient(request: ServiceRequest, event: Event) {
    event.stopPropagation();
    if (!request.patient?.phone) {
      this.showToast('Numero de telefono no disponible', 'warning');
      return;
    }
    window.open(`tel:${request.patient.phone}`, '_self');
  }

  // Helper methods
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      on_the_way: 'En camino',
      arrived: 'Llego',
      in_progress: 'En progreso',
      completed: 'Completada',
      cancelled: 'Cancelada',
      rejected: 'Rechazada'
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
      rejected: 'danger'
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
      other: 'Otro'
    };
    return labels[category] || category;
  }

  getTimeSlotLabel(slot: string): string {
    const labels: Record<string, string> = {
      morning: 'Manana',
      afternoon: 'Tarde',
      evening: 'Noche',
      asap: 'Lo antes posible'
    };
    return labels[slot] || slot;
  }

  formatDistance(distance: number | undefined): string {
    if (!distance) return '--';
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
