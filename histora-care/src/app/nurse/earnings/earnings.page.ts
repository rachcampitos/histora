import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { RefresherCustomEvent, ToastController } from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NurseApiService } from '../../core/services/nurse.service';
import { ServiceRequestService } from '../../core/services/service-request.service';
import { ServiceRequest, Nurse } from '../../core/models';

interface ServiceStats {
  completedServices: number;
  completedThisMonth: number;
  totalHours: number;
  hoursThisMonth: number;
  uniquePatients: number;
  newPatientsThisMonth: number;
  averageRating: number;
  totalReviews: number;
}

type PeriodType = 'week' | 'month' | 'all';

@Component({
  selector: 'app-earnings',
  templateUrl: './earnings.page.html',
  standalone: false,
  styleUrls: ['./earnings.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EarningsPage implements OnInit {
  private nurseApi = inject(NurseApiService);
  private requestService = inject(ServiceRequestService);
  private toastCtrl = inject(ToastController);
  private destroyRef = inject(DestroyRef);

  // State signals
  nurse = signal<Nurse | null>(null);
  completedServices = signal<ServiceRequest[]>([]);
  isLoading = signal(true);
  selectedPeriod = signal<PeriodType>('month');

  // Computed stats
  stats = computed<ServiceStats>(() => {
    const services = this.completedServices();
    const nurse = this.nurse();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter services for this month
    const thisMonthServices = services.filter(s => {
      const completedDate = new Date(s.completedAt || s.updatedAt);
      return completedDate >= startOfMonth;
    });

    // Calculate total hours (assume 1 hour per service if not specified)
    const totalHours = services.reduce((sum, s) => {
      const duration = s.service?.durationMinutes || 60;
      return sum + (duration / 60);
    }, 0);

    const hoursThisMonth = thisMonthServices.reduce((sum, s) => {
      const duration = s.service?.durationMinutes || 60;
      return sum + (duration / 60);
    }, 0);

    // Calculate unique patients
    const allPatientIds = new Set(services.map(s => s.patientId));
    const thisMonthPatientIds = new Set(thisMonthServices.map(s => s.patientId));

    // Calculate returning patients (appeared more than once)
    const patientCounts = new Map<string, number>();
    services.forEach(s => {
      const count = patientCounts.get(s.patientId) || 0;
      patientCounts.set(s.patientId, count + 1);
    });

    return {
      completedServices: services.length,
      completedThisMonth: thisMonthServices.length,
      totalHours: Math.round(totalHours * 10) / 10,
      hoursThisMonth: Math.round(hoursThisMonth * 10) / 10,
      uniquePatients: allPatientIds.size,
      newPatientsThisMonth: thisMonthPatientIds.size,
      averageRating: nurse?.averageRating || 0,
      totalReviews: nurse?.totalReviews || 0,
    };
  });

  // Computed values
  dateRange = computed(() => {
    const period = this.selectedPeriod();
    const now = new Date();

    if (period === 'week') {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const start = new Date(now);
      start.setDate(start.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    } else if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: now };
    } else {
      // All time - last 12 months
      const start = new Date(now);
      start.setMonth(start.getMonth() - 12);
      return { start, end: now };
    }
  });

  periodLabel = computed(() => {
    const period = this.selectedPeriod();
    switch (period) {
      case 'week': return 'Esta semana';
      case 'month': return 'Este mes';
      case 'all': return 'Historico';
      default: return '';
    }
  });

  // Filter services by selected period
  filteredServices = computed(() => {
    const services = this.completedServices();
    const range = this.dateRange();

    return services.filter(service => {
      const completedDate = new Date(service.completedAt || service.updatedAt);
      return completedDate >= range.start && completedDate <= range.end;
    }).sort((a, b) => {
      // Sort by date descending
      const dateA = new Date(a.completedAt || a.updatedAt);
      const dateB = new Date(b.completedAt || b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    });
  });

  // Payment methods distribution
  paymentMethodStats = computed(() => {
    const services = this.filteredServices();
    const stats = { yape: 0, plin: 0, cash: 0 };

    services.forEach(s => {
      const method = s.paymentMethod || 'cash';
      if (method === 'yape') stats.yape++;
      else if (method === 'plin') stats.plin++;
      else stats.cash++;
    });

    const total = services.length || 1;
    return {
      yape: Math.round((stats.yape / total) * 100),
      plin: Math.round((stats.plin / total) * 100),
      cash: Math.round((stats.cash / total) * 100),
    };
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    // Load nurse profile for ratings
    this.nurseApi.getMyProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nurse) => {
          this.nurse.set(nurse);
        },
        error: (err) => {
          console.error('Error loading profile:', err);
        },
      });

    // Load completed services
    this.requestService.getNurseRequests('completed')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (services) => {
          this.completedServices.set(services);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading services:', err);
          this.showToast('Error al cargar servicios', 'danger');
          this.isLoading.set(false);
        },
      });
  }

  onPeriodChange(event: CustomEvent) {
    const period = event.detail.value as PeriodType;
    this.selectedPeriod.set(period);
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.loadData();
    setTimeout(() => event.target.complete(), 1000);
  }

  formatCurrency(amount: number): string {
    return `S/ ${amount.toFixed(2)}`;
  }

  formatServiceDate(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  }

  formatServiceTime(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatDuration(minutes: number): string {
    if (!minutes || minutes < 60) {
      return '1 hora';
    }
    const hours = Math.round(minutes / 60);
    return hours === 1 ? '1 hora' : `${hours} horas`;
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

  getPatientName(service: ServiceRequest): string {
    if (service.patient) {
      const lastName = service.patient.lastName || '';
      const initial = lastName.charAt(0).toUpperCase();
      return `${service.patient.firstName} ${initial}.`;
    }
    return 'Paciente';
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      yape: 'Yape',
      plin: 'Plin',
      cash: 'Efectivo',
    };
    return labels[method] || 'Efectivo';
  }

  getPaymentMethodIcon(method: string): string {
    const icons: Record<string, string> = {
      yape: 'phone-portrait-outline',
      plin: 'phone-portrait-outline',
      cash: 'cash-outline',
    };
    return icons[method] || 'cash-outline';
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: color === 'danger' ? 4000 : 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
