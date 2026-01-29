import { Component, OnInit, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ThemeService } from '@core/service/theme.service';
import { ConfirmDialogComponent } from '../users/dialogs/confirm-dialog.component';
import {
  NgApexchartsModule,
  ApexChart,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexLegend,
  ApexTheme,
  ApexDataLabels,
} from 'ng-apexcharts';

interface Subscription {
  id: string;
  nurseName: string;
  nurseEmail: string;
  plan: string;
  status: string;
  amount: number;
  billingCycle: string;
  startDate: Date;
  nextBillingDate: Date;
  paymentMethod: string;
  paymentIcon: string;
}

interface Plan {
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  activeSubscriptions: number;
  revenue: number;
  color: string;
  icon: string;
}

interface SubscriptionStats {
  mrr: number;
  mrrGrowth: number;
  arr: number;
  arpu: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  conversionRate: number;
  churnRate: number;
  pastDueAmount: number;
}

@Component({
  standalone: true,
  selector: 'app-admin-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss'],
  imports: [
    CommonModule,
    BreadcrumbComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatTabsModule,
    MatDialogModule,
    MatSnackBarModule,
    FormsModule,
    NgApexchartsModule,
  ],
})
export class SubscriptionsComponent implements OnInit {
  private themeService = inject(ThemeService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true;
  private isDarkMode = false;
  displayedColumns = ['nurse', 'plan', 'status', 'amount', 'nextBilling', 'paymentMethod', 'actions'];
  dataSource = new MatTableDataSource<Subscription>([]);

  searchTerm = '';
  planFilter = '';
  statusFilter = '';

  plans: Plan[] = [];
  planOptions = ['Basico', 'Profesional', 'Premium'];
  statusOptions = ['active', 'cancelled', 'past_due', 'trial'];

  // Stats
  stats: SubscriptionStats = {
    mrr: 0,
    mrrGrowth: 0,
    arr: 0,
    arpu: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    conversionRate: 0,
    churnRate: 0,
    pastDueAmount: 0,
  };

  // Payment distribution chart
  paymentChartOptions!: {
    series: ApexNonAxisChartSeries;
    chart: ApexChart;
    labels: string[];
    colors: string[];
    legend: ApexLegend;
    plotOptions: ApexPlotOptions;
    dataLabels: ApexDataLabels;
    theme: ApexTheme;
  };

  // Plan distribution chart
  planChartOptions!: {
    series: ApexNonAxisChartSeries;
    chart: ApexChart;
    labels: string[];
    colors: string[];
    legend: ApexLegend;
    plotOptions: ApexPlotOptions;
    dataLabels: ApexDataLabels;
    theme: ApexTheme;
  };

  constructor() {
    effect(() => {
      const theme = this.themeService.currentTheme();
      this.isDarkMode = theme === 'dark';
      if (!this.isLoading) {
        this.initCharts();
      }
    });
  }

  ngOnInit(): void {
    this.isDarkMode = this.themeService.currentTheme() === 'dark';
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private getChartForeColor(): string {
    return this.isDarkMode ? '#b8c5d6' : '#9aa0ac';
  }

  private getChartTheme(): ApexTheme {
    return { mode: this.isDarkMode ? 'dark' : 'light' };
  }

  loadData(): void {
    setTimeout(() => {
      this.plans = [
        {
          name: 'Basico',
          price: 0,
          billingCycle: 'mes',
          features: ['Perfil visible en mapa', 'Hasta 10 servicios/mes', 'Soporte email'],
          activeSubscriptions: 45,
          revenue: 0,
          color: '#42a5f5',
          icon: 'star_border',
        },
        {
          name: 'Profesional',
          price: 29,
          billingCycle: 'mes',
          features: ['Servicios ilimitados', 'Posicion destacada', 'Badge verificado', 'Estadisticas'],
          activeSubscriptions: 23,
          revenue: 667,
          color: '#4a9d9a',
          icon: 'star_half',
        },
        {
          name: 'Premium',
          price: 59,
          billingCycle: 'mes',
          features: ['Todo Profesional', 'Prioridad en busquedas', 'Soporte 24/7', 'Promociones exclusivas'],
          activeSubscriptions: 8,
          revenue: 472,
          color: '#1e3a5f',
          icon: 'star',
        },
      ];

      const subscriptions: Subscription[] = [
        {
          id: '1',
          nurseName: 'Maria Claudia Chavez',
          nurseEmail: 'maria.chavez@email.com',
          plan: 'Premium',
          status: 'active',
          amount: 59,
          billingCycle: 'monthly',
          startDate: new Date('2023-06-15'),
          nextBillingDate: new Date('2024-02-15'),
          paymentMethod: 'Visa ****4242',
          paymentIcon: 'credit_card',
        },
        {
          id: '2',
          nurseName: 'Ana Rosa Gutierrez',
          nurseEmail: 'ana.gutierrez@email.com',
          plan: 'Profesional',
          status: 'active',
          amount: 29,
          billingCycle: 'monthly',
          startDate: new Date('2023-08-20'),
          nextBillingDate: new Date('2024-02-20'),
          paymentMethod: 'Yape',
          paymentIcon: 'smartphone',
        },
        {
          id: '3',
          nurseName: 'Carmen Elena Torres',
          nurseEmail: 'carmen.torres@email.com',
          plan: 'Profesional',
          status: 'trial',
          amount: 0,
          billingCycle: 'monthly',
          startDate: new Date('2024-01-08'),
          nextBillingDate: new Date('2024-02-08'),
          paymentMethod: 'Pendiente',
          paymentIcon: 'hourglass_empty',
        },
        {
          id: '4',
          nurseName: 'Lucia Fernanda Ramos',
          nurseEmail: 'lucia.ramos@email.com',
          plan: 'Basico',
          status: 'active',
          amount: 0,
          billingCycle: 'monthly',
          startDate: new Date('2023-11-05'),
          nextBillingDate: new Date('2024-02-05'),
          paymentMethod: 'Gratis',
          paymentIcon: 'check_circle',
        },
        {
          id: '5',
          nurseName: 'Patricia Morales Silva',
          nurseEmail: 'patricia.morales@email.com',
          plan: 'Profesional',
          status: 'trial',
          amount: 0,
          billingCycle: 'monthly',
          startDate: new Date('2024-01-02'),
          nextBillingDate: new Date('2024-02-02'),
          paymentMethod: 'Pendiente',
          paymentIcon: 'hourglass_empty',
        },
        {
          id: '6',
          nurseName: 'Rosa Isabel Mendez',
          nurseEmail: 'rosa.mendez@email.com',
          plan: 'Premium',
          status: 'active',
          amount: 59,
          billingCycle: 'monthly',
          startDate: new Date('2023-04-10'),
          nextBillingDate: new Date('2024-02-10'),
          paymentMethod: 'Plin',
          paymentIcon: 'smartphone',
        },
        {
          id: '7',
          nurseName: 'Gloria Martinez Lopez',
          nurseEmail: 'gloria.martinez@email.com',
          plan: 'Profesional',
          status: 'past_due',
          amount: 29,
          billingCycle: 'monthly',
          startDate: new Date('2023-02-28'),
          nextBillingDate: new Date('2024-01-28'),
          paymentMethod: 'Mastercard ****9999',
          paymentIcon: 'credit_card',
        },
        {
          id: '8',
          nurseName: 'Sofia Diaz Vargas',
          nurseEmail: 'sofia.diaz@email.com',
          plan: 'Basico',
          status: 'cancelled',
          amount: 0,
          billingCycle: 'monthly',
          startDate: new Date('2023-09-15'),
          nextBillingDate: new Date('2024-01-15'),
          paymentMethod: 'N/A',
          paymentIcon: 'block',
        },
        {
          id: '9',
          nurseName: 'Elena Castro Rivera',
          nurseEmail: 'elena.castro@email.com',
          plan: 'Premium',
          status: 'active',
          amount: 59,
          billingCycle: 'monthly',
          startDate: new Date('2023-09-01'),
          nextBillingDate: new Date('2024-02-01'),
          paymentMethod: 'Visa ****1234',
          paymentIcon: 'credit_card',
        },
        {
          id: '10',
          nurseName: 'Isabel Flores Gomez',
          nurseEmail: 'isabel.flores@email.com',
          plan: 'Profesional',
          status: 'active',
          amount: 29,
          billingCycle: 'monthly',
          startDate: new Date('2023-10-15'),
          nextBillingDate: new Date('2024-02-15'),
          paymentMethod: 'Yape',
          paymentIcon: 'smartphone',
        },
      ];

      this.dataSource.data = subscriptions;
      this.calculateStats(subscriptions);
      this.initCharts();
      this.isLoading = false;
    }, 500);
  }

  calculateStats(subscriptions: Subscription[]): void {
    const active = subscriptions.filter(s => s.status === 'active');
    const trials = subscriptions.filter(s => s.status === 'trial');
    const pastDue = subscriptions.filter(s => s.status === 'past_due');
    const cancelled = subscriptions.filter(s => s.status === 'cancelled');

    const mrr = active.reduce((sum, s) => sum + s.amount, 0);

    this.stats = {
      mrr: mrr,
      mrrGrowth: 12.5,
      arr: mrr * 12,
      arpu: active.length > 0 ? mrr / active.length : 0,
      activeSubscriptions: active.length,
      trialSubscriptions: trials.length,
      conversionRate: 68.5,
      churnRate: 2.5,
      pastDueAmount: pastDue.reduce((sum, s) => sum + s.amount, 0),
    };
  }

  initCharts(): void {
    // Payment method distribution
    this.paymentChartOptions = {
      series: [35, 28, 22, 15],
      chart: {
        height: 280,
        type: 'donut',
        foreColor: this.getChartForeColor(),
        background: 'transparent',
      },
      theme: this.getChartTheme(),
      labels: ['Tarjeta', 'Yape', 'Plin', 'Otros'],
      colors: ['#667eea', '#4a9d9a', '#f093fb', '#42a5f5'],
      legend: {
        position: 'bottom',
        labels: { colors: this.getChartForeColor() },
        itemMargin: { horizontal: 8, vertical: 4 },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '55%',
            labels: {
              show: true,
              name: { color: this.getChartForeColor() },
              value: { color: this.getChartForeColor() },
              total: {
                show: true,
                label: 'Total',
                color: this.getChartForeColor(),
                formatter: () => '31',
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
    };

    // Plan distribution
    this.planChartOptions = {
      series: [45, 23, 8],
      chart: {
        height: 280,
        type: 'donut',
        foreColor: this.getChartForeColor(),
        background: 'transparent',
      },
      theme: this.getChartTheme(),
      labels: ['Basico', 'Profesional', 'Premium'],
      colors: ['#42a5f5', '#4a9d9a', '#1e3a5f'],
      legend: {
        position: 'bottom',
        labels: { colors: this.getChartForeColor() },
        itemMargin: { horizontal: 8, vertical: 4 },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '55%',
            labels: {
              show: true,
              name: { color: this.getChartForeColor() },
              value: { color: this.getChartForeColor() },
              total: {
                show: true,
                label: 'Total',
                color: this.getChartForeColor(),
                formatter: () => '76',
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
    };
  }

  applyFilter(): void {
    this.dataSource.filterPredicate = (data: Subscription, filter: string) => {
      const searchStr = filter.toLowerCase();
      const matchesSearch = !this.searchTerm ||
        data.nurseName.toLowerCase().includes(searchStr) ||
        data.nurseEmail.toLowerCase().includes(searchStr);
      const matchesPlan = !this.planFilter || data.plan === this.planFilter;
      const matchesStatus = !this.statusFilter || data.status === this.statusFilter;
      return matchesSearch && matchesPlan && matchesStatus;
    };
    this.dataSource.filter = this.searchTerm.toLowerCase();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.planFilter = '';
    this.statusFilter = '';
    this.dataSource.filter = '';
  }

  getPlanClass(plan: string): string {
    const classes: Record<string, string> = {
      Basico: 'badge-plan-basic',
      Profesional: 'badge-plan-professional',
      Premium: 'badge-plan-premium',
    };
    return classes[plan] || 'badge-plan-basic';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'badge-solid-green',
      cancelled: 'badge-solid-gray',
      past_due: 'badge-solid-red',
      trial: 'badge-solid-blue',
    };
    return classes[status] || 'badge-solid-gray';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      cancelled: 'Cancelado',
      past_due: 'Vencido',
      trial: 'Prueba',
    };
    return labels[status] || status;
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  viewSubscription(sub: Subscription): void {
    this.snackBar.open(`Detalles de suscripcion de ${sub.nurseName}`, 'Ver', { duration: 3000 });
  }

  editSubscription(sub: Subscription): void {
    this.snackBar.open(`Cambiar plan de ${sub.nurseName}`, 'Editar', { duration: 3000 });
  }

  cancelSubscription(sub: Subscription): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Cancelar Suscripcion',
        message: `¿Cancelar la suscripcion de ${sub.nurseName}? La enfermera perdera acceso a las funciones del plan ${sub.plan}.`,
        confirmText: 'Cancelar Suscripcion',
        confirmColor: 'warn',
        icon: 'cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.snackBar.open('Suscripcion cancelada', 'Cerrar', { duration: 3000 });
        this.loadData();
      }
    });
  }

  retryPayment(sub: Subscription): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Reintentar Cobro',
        message: `¿Reintentar el cobro de S/. ${sub.amount} a ${sub.nurseName}?`,
        confirmText: 'Reintentar',
        confirmColor: 'primary',
        icon: 'refresh',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.snackBar.open('Reintento de cobro iniciado', 'Cerrar', { duration: 3000 });
      }
    });
  }

  upgradePlan(sub: Subscription): void {
    this.snackBar.open(`Upgrade de plan para ${sub.nurseName}`, 'Proceder', { duration: 3000 });
  }
}
