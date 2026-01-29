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
  BusinessMetrics,
  ModerationStats,
  AtRiskUser,
} from '@core/service/admin.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
  trend?: number;
  trendLabel?: string;
}

interface SemaphoreAlert {
  id: string;
  level: 'critical' | 'important' | 'informative';
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
  timestamp: Date;
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

  // KPI Cards - Split into sections
  businessKpis: KpiCard[] = [];
  operationalKpis: KpiCard[] = [];

  // Dashboard Data
  panicAlerts: PanicAlert[] = [];
  recentActivity: ActivityItem[] = [];
  pendingVerifications: PendingVerification[] = [];
  serviceChartData: ServiceChartData[] = [];
  lowRatedReviews: LowRatedReview[] = [];
  expiringVerifications: ExpiringVerification[] = [];
  businessMetrics: BusinessMetrics | null = null;
  moderationStats: ModerationStats | null = null;
  atRiskUsers: AtRiskUser[] = [];

  // Semaphore Alerts
  semaphoreAlerts: SemaphoreAlert[] = [];

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
      business: this.adminService.getBusinessMetrics().pipe(catchError(() => of(null))),
      moderation: this.adminService.getModerationStats().pipe(catchError(() => of(null))),
      atRisk: this.adminService.getAtRiskUsers(5).pipe(catchError(() => of([]))),
    }).subscribe({
      next: (data) => {
        this.stats = data.stats;
        this.panicAlerts = data.alerts;
        this.recentActivity = data.activity;
        this.pendingVerifications = data.verifications;
        this.serviceChartData = data.chartData;
        this.lowRatedReviews = data.lowRated;
        this.expiringVerifications = data.expiring;
        this.businessMetrics = data.business;
        this.moderationStats = data.moderation;
        this.atRiskUsers = data.atRisk;

        this.buildKpiCards();
        this.buildSemaphoreAlerts();
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

    // Business KPIs - Top Row (metrics that matter for growth)
    this.businessKpis = [];

    if (this.businessMetrics) {
      this.businessKpis.push(
        {
          title: 'GMV del Mes',
          value: this.formatCurrency(this.businessMetrics.gmv),
          icon: 'payments',
          color: 'success',
          trend: this.businessMetrics.gmvGrowth,
          trendLabel: 'vs mes anterior',
        },
        {
          title: 'Usuarios Totales',
          value: this.businessMetrics.totalUsers,
          icon: 'group',
          color: 'primary',
          subtitle: `+${this.businessMetrics.newUsersThisMonth} este mes`,
        }
      );
    }

    this.businessKpis.push(
      {
        title: 'Enfermeras Activas',
        value: this.stats.nurses.available,
        icon: 'medical_services',
        color: 'info',
        subtitle: `${this.stats.nurses.verified} verificadas de ${this.stats.nurses.total}`,
        route: '/admin/nurses',
      },
      {
        title: 'Servicios Hoy',
        value: this.stats.services.inProgress + this.stats.services.accepted,
        icon: 'local_hospital',
        color: 'primary',
        subtitle: `${this.stats.services.completedToday} completados`,
      },
      {
        title: 'Satisfaccion',
        value: this.stats.ratings.averageRating.toFixed(1),
        icon: 'star',
        color: this.stats.ratings.averageRating >= 4 ? 'success' : 'warning',
        subtitle: `${this.stats.ratings.totalReviews} resenas`,
      }
    );

    // Operational KPIs - Require Attention
    this.operationalKpis = [
      {
        title: 'Verificaciones',
        value: this.stats.nurses.pendingVerification,
        icon: 'verified_user',
        color: this.stats.nurses.pendingVerification > 5 ? 'danger' : this.stats.nurses.pendingVerification > 0 ? 'warning' : 'success',
        badge: this.stats.nurses.pendingVerification > 5 ? this.stats.nurses.pendingVerification : undefined,
        badgeColor: 'warn',
        route: '/admin/nurse-verifications',
        subtitle: this.stats.nurses.pendingVerification > 0 ? 'pendientes' : 'al dia',
      },
      {
        title: 'Alertas',
        value: this.stats.safety.activePanicAlerts,
        icon: 'warning',
        color: this.stats.safety.activeEmergencies > 0 ? 'danger' : 'success',
        badge: this.stats.safety.activeEmergencies > 0 ? this.stats.safety.activeEmergencies : undefined,
        badgeColor: 'warn',
        subtitle: this.stats.safety.activeEmergencies > 0
          ? `${this.stats.safety.activeEmergencies} emergencia(s)`
          : 'Sin emergencias',
      },
    ];

    if (this.moderationStats) {
      this.operationalKpis.push({
        title: 'Moderacion',
        value: this.moderationStats.atRiskNurses + this.moderationStats.atRiskPatients,
        icon: 'gavel',
        color: this.moderationStats.pendingReports > 0 ? 'warning' : 'success',
        subtitle: this.moderationStats.pendingReports > 0
          ? `${this.moderationStats.pendingReports} reportes`
          : 'Sin reportes',
        route: '/admin/moderation',
      });
    }

    this.operationalKpis.push({
      title: 'Vencimientos',
      value: this.expiringVerifications.length,
      icon: 'schedule',
      color: this.expiringVerifications.length > 3 ? 'warning' : 'info',
      subtitle: this.expiringVerifications.length > 0
        ? 'proximas a vencer'
        : 'sin vencimientos',
    });
  }

  buildSemaphoreAlerts(): void {
    this.semaphoreAlerts = [];

    // Critical - Emergencies
    if (this.stats?.safety.activeEmergencies && this.stats.safety.activeEmergencies > 0) {
      this.semaphoreAlerts.push({
        id: 'emergency',
        level: 'critical',
        title: 'Emergencia Activa',
        description: `${this.stats.safety.activeEmergencies} enfermera(s) han activado boton de panico`,
        actionLabel: 'Ver Alertas',
        actionRoute: '/admin/safety',
        timestamp: new Date(),
      });
    }

    // Critical - Panic alerts
    const emergencyAlerts = this.panicAlerts.filter(a => a.level === 'emergency' && a.status === 'active');
    if (emergencyAlerts.length > 0) {
      this.semaphoreAlerts.push({
        id: 'panic',
        level: 'critical',
        title: 'Alertas de Panico Sin Atender',
        description: `${emergencyAlerts.length} alerta(s) requieren atencion inmediata`,
        actionLabel: 'Atender',
        actionRoute: '/admin/safety',
        timestamp: emergencyAlerts[0]?.createdAt || new Date(),
      });
    }

    // Important - Pending verifications > 3 days
    const urgentVerifications = this.pendingVerifications.filter(v => v.waitingDays > 3);
    if (urgentVerifications.length > 0) {
      this.semaphoreAlerts.push({
        id: 'verifications',
        level: 'important',
        title: 'Verificaciones Retrasadas',
        description: `${urgentVerifications.length} enfermera(s) esperan mas de 3 dias`,
        actionLabel: 'Revisar',
        actionRoute: '/admin/nurse-verifications',
        timestamp: new Date(),
      });
    }

    // Important - Low rated nurses
    const criticalReviews = this.lowRatedReviews.filter(r => r.rating <= 2);
    if (criticalReviews.length > 0) {
      this.semaphoreAlerts.push({
        id: 'reviews',
        level: 'important',
        title: 'Resenas Criticas',
        description: `${criticalReviews.length} resena(s) de 1-2 estrellas requieren revision`,
        actionLabel: 'Revisar',
        actionRoute: '/admin/moderation',
        timestamp: new Date(),
      });
    }

    // Important - At risk users
    if (this.atRiskUsers.length > 0) {
      this.semaphoreAlerts.push({
        id: 'atrisk',
        level: 'important',
        title: 'Usuarios en Riesgo',
        description: `${this.atRiskUsers.length} usuario(s) requieren moderacion`,
        actionLabel: 'Ver Detalle',
        actionRoute: '/admin/moderation',
        timestamp: new Date(),
      });
    }

    // Informative - Expiring verifications
    const soonExpiring = this.expiringVerifications.filter(v => v.daysUntilExpiry <= 7);
    if (soonExpiring.length > 0) {
      this.semaphoreAlerts.push({
        id: 'expiring',
        level: 'informative',
        title: 'Verificaciones por Vencer',
        description: `${soonExpiring.length} enfermera(s) con verificacion proxima a vencer`,
        actionLabel: 'Ver Lista',
        actionRoute: '/admin/nurses',
        timestamp: new Date(),
      });
    }

    // Sort by severity
    const severityOrder = { critical: 0, important: 1, informative: 2 };
    this.semaphoreAlerts.sort((a, b) => severityOrder[a.level] - severityOrder[b.level]);
  }

  formatCurrency(value: number): string {
    if (value >= 1000) {
      return `S/ ${(value / 1000).toFixed(1)}k`;
    }
    return `S/ ${value.toFixed(0)}`;
  }

  getTrendClass(trend?: number): string {
    if (!trend) return '';
    return trend >= 0 ? 'trend-up' : 'trend-down';
  }

  getTrendIcon(trend?: number): string {
    if (!trend) return '';
    return trend >= 0 ? 'trending_up' : 'trending_down';
  }

  getSemaphoreClass(level: string): string {
    return `semaphore-${level}`;
  }

  getRiskScoreClass(score: number): string {
    if (score >= 70) return 'risk-high';
    if (score >= 40) return 'risk-medium';
    return 'risk-low';
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
