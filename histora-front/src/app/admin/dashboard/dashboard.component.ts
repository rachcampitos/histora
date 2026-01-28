import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  NgApexchartsModule,
  ApexChart,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexLegend,
  ApexFill,
  ApexTooltip,
} from 'ng-apexcharts';
import {
  AdminService,
  DashboardStats,
  PanicAlert,
  ActivityItem,
  PendingVerification,
  ServiceChartData,
  LowRatedReview,
  ExpiringVerification,
} from '@core/service/admin.service';
import { forkJoin } from 'rxjs';

interface KpiCard {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  subtitle?: string;
  badge?: number;
  badgeColor?: string;
  progress?: number;
  progressMax?: number;
  route?: string;
}

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule,
    BreadcrumbComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatBadgeModule,
    MatChipsModule,
    RouterLink,
    NgApexchartsModule,
    TranslateModule,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  isLoading = true;
  stats: DashboardStats | null = null;

  // KPI Cards
  kpiCards: KpiCard[] = [];

  // Dashboard Data
  panicAlerts: PanicAlert[] = [];
  recentActivity: ActivityItem[] = [];
  pendingVerifications: PendingVerification[] = [];
  serviceChartData: ServiceChartData[] = [];
  lowRatedReviews: LowRatedReview[] = [];
  expiringVerifications: ExpiringVerification[] = [];

  // Table columns
  verificationColumns = ['nurse', 'cep', 'waitingDays', 'status', 'actions'];

  // Charts
  servicesChartOptions: {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    stroke: ApexStroke;
    dataLabels: ApexDataLabels;
    yaxis: ApexYAxis;
    legend: ApexLegend;
    fill: ApexFill;
    tooltip: ApexTooltip;
    colors: string[];
  };

  constructor(private adminService: AdminService) {
    this.servicesChartOptions = this.getServicesChartOptions([]);
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.adminService.startPolling();
  }

  ngOnDestroy(): void {
    this.adminService.stopPolling();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    forkJoin({
      stats: this.adminService.getDashboardStats(),
      alerts: this.adminService.getActivePanicAlerts(),
      activity: this.adminService.getRecentActivity(15),
      verifications: this.adminService.getPendingVerificationsList(),
      chartData: this.adminService.getServiceChartData(),
      lowRated: this.adminService.getLowRatedReviews(),
      expiring: this.adminService.getExpiringVerifications(),
    }).subscribe({
      next: (data) => {
        this.stats = data.stats;
        this.panicAlerts = data.alerts;
        this.recentActivity = data.activity;
        this.pendingVerifications = data.verifications;
        this.serviceChartData = data.chartData;
        this.lowRatedReviews = data.lowRated;
        this.expiringVerifications = data.expiring;

        this.buildKpiCards();
        this.servicesChartOptions = this.getServicesChartOptions(data.chartData);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.isLoading = false;
      },
    });
  }

  buildKpiCards(): void {
    if (!this.stats) return;

    this.kpiCards = [
      {
        title: 'Enfermeras Activas',
        value: this.stats.nurses.available,
        icon: 'medical_services',
        color: 'success',
        subtitle: `${this.stats.nurses.verified} verificadas de ${this.stats.nurses.total}`,
        route: '/admin/nurses',
      },
      {
        title: 'Servicios en Progreso',
        value: this.stats.services.inProgress + this.stats.services.accepted,
        icon: 'local_hospital',
        color: 'primary',
        subtitle: `${this.stats.services.completedToday} completados hoy`,
      },
      {
        title: 'Verificaciones Pendientes',
        value: this.stats.nurses.pendingVerification,
        icon: 'verified_user',
        color: this.stats.nurses.pendingVerification > 0 ? 'warning' : 'info',
        badge: this.stats.nurses.pendingVerification > 5 ? this.stats.nurses.pendingVerification : undefined,
        badgeColor: 'warn',
        route: '/admin/nurse-verifications',
      },
      {
        title: 'Alertas de Seguridad',
        value: this.stats.safety.activePanicAlerts,
        icon: 'warning',
        color: this.stats.safety.activeEmergencies > 0 ? 'danger' : 'info',
        badge: this.stats.safety.activeEmergencies > 0 ? this.stats.safety.activeEmergencies : undefined,
        badgeColor: 'warn',
        subtitle: this.stats.safety.activeEmergencies > 0
          ? `${this.stats.safety.activeEmergencies} emergencia(s) activa(s)`
          : 'Sin emergencias activas',
      },
      {
        title: 'Calificacion Promedio',
        value: this.stats.ratings.averageRating.toFixed(1),
        icon: 'star',
        color: this.stats.ratings.averageRating >= 4 ? 'success' : 'warning',
        subtitle: `${this.stats.ratings.totalReviews} resenas totales`,
      },
    ];
  }

  getServicesChartOptions(data: ServiceChartData[]) {
    const dates = data.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' });
    });

    return {
      series: [
        {
          name: 'Completados',
          data: data.map(d => d.completed),
        },
        {
          name: 'Cancelados',
          data: data.map(d => d.cancelled),
        },
      ],
      chart: {
        height: 280,
        type: 'area' as const,
        toolbar: { show: false },
        foreColor: '#9aa0ac',
      },
      colors: ['#00c853', '#ff5252'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth' as const, width: 2 },
      xaxis: {
        categories: dates,
      },
      yaxis: {
        labels: {
          formatter: (val: number) => Math.round(val).toString(),
        },
      },
      legend: { position: 'top' as const, horizontalAlign: 'right' as const },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => val + ' servicios',
        },
      },
    };
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'service_completed': 'check_circle',
      'service_cancelled': 'cancel',
      'new_service_request': 'add_circle',
      'verification_approved': 'verified',
      'verification_rejected': 'gpp_bad',
      'new_verification': 'pending',
      'panic_alert': 'warning',
      'low_review': 'star_border',
    };
    return icons[type] || 'info';
  }

  getActivityColor(severity?: string): string {
    const colors: Record<string, string> = {
      'info': 'primary',
      'warning': 'accent',
      'critical': 'warn',
    };
    return colors[severity || 'info'] || 'primary';
  }

  getSeverityClass(severity?: string): string {
    const classes: Record<string, string> = {
      'info': 'activity-info',
      'warning': 'activity-warning',
      'critical': 'activity-critical',
    };
    return classes[severity || 'info'] || 'activity-info';
  }

  getVerificationStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'pending': 'badge-solid-orange',
      'under_review': 'badge-solid-blue',
      'approved': 'badge-solid-green',
      'rejected': 'badge-solid-red',
    };
    return classes[status] || 'badge-solid-gray';
  }

  getVerificationStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'under_review': 'En revision',
      'approved': 'Aprobada',
      'rejected': 'Rechazada',
    };
    return labels[status] || status;
  }

  getAlertLevelClass(level: string): string {
    return level === 'emergency' ? 'alert-emergency' : 'alert-help';
  }

  getAlertLevelLabel(level: string): string {
    return level === 'emergency' ? 'EMERGENCIA' : 'Ayuda';
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  }

  getProgressColor(used: number, max: number): string {
    const percentage = (used / max) * 100;
    if (percentage >= 85) return 'warn';
    if (percentage >= 60) return 'accent';
    return 'primary';
  }

  navigateToAlert(alert: PanicAlert): void {
    // TODO: Navigate to alert detail or open map
  }

  acknowledgeAlert(alert: PanicAlert): void {
    // TODO: Call API to acknowledge
  }

  reviewVerification(verification: PendingVerification): void {
    // TODO: Navigate to verification review
  }

  hasEmergencyAlerts(): boolean {
    return this.panicAlerts.some(a => a.level === 'emergency');
  }
}
