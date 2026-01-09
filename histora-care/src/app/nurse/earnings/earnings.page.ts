import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RefresherCustomEvent, ToastController } from '@ionic/angular';
import { NurseApiService } from '../../core/services/nurse.service';
import { ServiceRequestService } from '../../core/services/service-request.service';
import { ServiceRequest } from '../../core/models';

interface EarningsSummary {
  total: number;
  commission: number;
  net: number;
  servicesCount: number;
}

type PeriodType = 'week' | 'month' | 'custom';

@Component({
  selector: 'app-earnings',
  templateUrl: './earnings.page.html',
  standalone: false,
  styleUrls: ['./earnings.page.scss'],
})
export class EarningsPage implements OnInit {
  private nurseApi = inject(NurseApiService);
  private requestService = inject(ServiceRequestService);
  private toastCtrl = inject(ToastController);

  // State signals
  earnings = signal<EarningsSummary | null>(null);
  completedServices = signal<ServiceRequest[]>([]);
  isLoading = signal(true);
  selectedPeriod = signal<PeriodType>('week');

  // Custom date range
  customStartDate = signal<string>(this.getDefaultStartDate('week'));
  customEndDate = signal<string>(this.formatDate(new Date()));
  showDatePicker = signal(false);

  // Computed values
  dateRange = computed(() => {
    const period = this.selectedPeriod();
    if (period === 'custom') {
      return {
        start: this.customStartDate(),
        end: this.customEndDate()
      };
    }
    return {
      start: this.getDefaultStartDate(period),
      end: this.formatDate(new Date())
    };
  });

  periodLabel = computed(() => {
    const period = this.selectedPeriod();
    switch (period) {
      case 'week':
        return 'Esta semana';
      case 'month':
        return 'Este mes';
      case 'custom':
        return 'Personalizado';
      default:
        return '';
    }
  });

  // Filter completed services by date range
  filteredServices = computed(() => {
    const services = this.completedServices();
    const range = this.dateRange();
    const startDate = new Date(range.start);
    const endDate = new Date(range.end);
    endDate.setHours(23, 59, 59, 999);

    return services.filter(service => {
      const completedDate = new Date(service.completedAt || service.updatedAt);
      return completedDate >= startDate && completedDate <= endDate;
    });
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    const range = this.dateRange();

    // Load earnings summary
    this.nurseApi.getEarnings(range.start, range.end).subscribe({
      next: (data) => {
        this.earnings.set(data);
      },
      error: (err) => {
        console.error('Error loading earnings:', err);
        this.showToast('Error al cargar ganancias', 'danger');
      },
    });

    // Load completed services
    this.requestService.getNurseRequests('completed').subscribe({
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

    if (period === 'custom') {
      this.showDatePicker.set(true);
    } else {
      this.showDatePicker.set(false);
      this.loadData();
    }
  }

  onStartDateChange(event: CustomEvent) {
    this.customStartDate.set(event.detail.value.split('T')[0]);
  }

  onEndDateChange(event: CustomEvent) {
    this.customEndDate.set(event.detail.value.split('T')[0]);
  }

  applyCustomDateRange() {
    this.showDatePicker.set(false);
    this.loadData();
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.loadData();
    setTimeout(() => event.target.complete(), 1000);
  }

  formatCurrency(amount: number): string {
    return `S/. ${amount.toFixed(2)}`;
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatDisplayDate(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatServiceDate(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  }

  getDefaultStartDate(period: 'week' | 'month'): string {
    const now = new Date();
    if (period === 'week') {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday start
      now.setDate(now.getDate() - diff);
    } else {
      now.setDate(1);
    }
    now.setHours(0, 0, 0, 0);
    return this.formatDate(now);
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
      return `${service.patient.firstName} ${service.patient.lastName}`;
    }
    return 'Paciente';
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
