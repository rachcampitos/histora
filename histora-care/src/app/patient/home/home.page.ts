import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { ServiceRequestService } from '../../core/services/service-request.service';
import { ProductTourService } from '../../core/services/product-tour.service';
import { ServiceRequest } from '../../core/models';

interface HealthTip {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  standalone: false,
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private authService = inject(AuthService);
  private serviceRequestService = inject(ServiceRequestService);
  private productTourService = inject(ProductTourService);

  user = this.authService.user;
  activeRequest = signal<ServiceRequest | null>(null);
  recentNurses = signal<{ nurseId: string; firstName: string; lastName: string; avatar?: string }[]>([]);
  isLoading = signal(false);

  healthTips: HealthTip[] = [
    {
      icon: 'fitness-outline',
      title: 'Mantente activo',
      description: 'Caminar 30 minutos al día mejora tu salud cardiovascular.'
    },
    {
      icon: 'water-outline',
      title: 'Hidratación',
      description: 'Bebe al menos 8 vasos de agua al día para mantenerte hidratado.'
    },
    {
      icon: 'medical-outline',
      title: 'Vacunas al día',
      description: 'Consulta con tu médico sobre las vacunas que necesitas.'
    },
    {
      icon: 'bed-outline',
      title: 'Descanso',
      description: 'Dormir 7-8 horas mejora tu sistema inmunológico.'
    }
  ];

  currentTip = signal<HealthTip>(this.healthTips[0]);

  ngOnInit() {
    this.loadActiveRequest();
    this.loadRecentNurses();
    this.setRandomTip();
  }

  ionViewWillEnter() {
    // Refresh data when returning to this page
    this.loadActiveRequest();
  }

  ionViewDidEnter() {
    // Start product tour if not completed (after a slight delay for smooth transition)
    setTimeout(() => {
      this.productTourService.startTour('patient_home');
    }, 500);
  }

  private setRandomTip() {
    const randomIndex = Math.floor(Math.random() * this.healthTips.length);
    this.currentTip.set(this.healthTips[randomIndex]);
  }

  async loadActiveRequest() {
    this.isLoading.set(true);
    try {
      // Get all requests and filter for active ones
      const requests = await this.serviceRequestService.getMyRequests().toPromise();

      if (requests && requests.length > 0) {
        // Find active requests (accepted, on_the_way, arrived, in_progress)
        const activeStatuses = ['accepted', 'on_the_way', 'arrived', 'in_progress'];
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

  goToFavorites() {
    this.showComingSoon('Favoritas');
  }

  viewActiveRequest() {
    const request = this.activeRequest();
    if (request) {
      this.router.navigate(['/patient/tracking', request._id]);
    }
  }

  selectRecentNurse(nurse: { nurseId: string; firstName: string; lastName: string; avatar?: string }) {
    this.router.navigate(['/patient/search'], { queryParams: { nurseId: nurse.nurseId } });
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
