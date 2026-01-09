import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { RefresherCustomEvent, ToastController } from '@ionic/angular';
import { NurseApiService } from '../../core/services/nurse.service';
import { ServiceRequestService } from '../../core/services/service-request.service';
import { AuthService } from '../../core/services/auth.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { Nurse, ServiceRequest } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: false,
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  private nurseApi = inject(NurseApiService);
  private requestService = inject(ServiceRequestService);
  private authService = inject(AuthService);
  private geoService = inject(GeolocationService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  // State signals
  nurse = signal<Nurse | null>(null);
  pendingRequests = signal<ServiceRequest[]>([]);
  activeRequests = signal<ServiceRequest[]>([]);
  isLoading = signal(true);
  isTogglingAvailability = signal(false);

  // Computed values
  user = this.authService.user;
  isAvailable = computed(() => this.nurse()?.isAvailable ?? false);
  rating = computed(() => this.nurse()?.averageRating ?? 0);
  totalServices = computed(() => this.nurse()?.totalServicesCompleted ?? 0);
  totalReviews = computed(() => this.nurse()?.totalReviews ?? 0);

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      // Load nurse profile
      this.nurseApi.getMyProfile().subscribe({
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
          .subscribe({
            next: (requests) => this.pendingRequests.set(requests.slice(0, 5)),
            error: (err) => console.error('Error loading pending:', err),
          });
      }
    });

    // Load active requests (accepted, on_the_way, arrived, in_progress)
    this.requestService.getNurseRequests().subscribe({
      next: (requests) => {
        const active = requests.filter((r) =>
          ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(r.status)
        );
        this.activeRequests.set(active);
      },
      error: (err) => console.error('Error loading active:', err),
    });
  }

  async toggleAvailability() {
    const nurse = this.nurse();
    if (!nurse) return;

    this.isTogglingAvailability.set(true);
    const newStatus = !nurse.isAvailable;

    this.nurseApi.setAvailability(newStatus).subscribe({
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
      this.nurseApi.updateLocation(position.latitude, position.longitude).subscribe({
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
    this.router.navigate(['/nurse/requests', request._id]);
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
