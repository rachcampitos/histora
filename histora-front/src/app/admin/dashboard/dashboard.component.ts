import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  NgApexchartsModule,
  ApexChart,
  ApexNonAxisChartSeries,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexLegend,
  ApexFill,
  ApexTooltip,
  ApexPlotOptions,
} from 'ng-apexcharts';

interface KpiCard {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  change?: number;
  changeLabel?: string;
}

interface RecentClinic {
  name: string;
  owner: string;
  plan: string;
  status: string;
  createdAt: Date;
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
    RouterLink,
    NgApexchartsModule,
    TranslateModule,
  ],
})
export class DashboardComponent implements OnInit {
  isLoading = true;

  // KPI Cards
  kpiCards: KpiCard[] = [];

  // Charts
  revenueChartOptions: {
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

  clinicsChartOptions: {
    series: ApexNonAxisChartSeries;
    chart: ApexChart;
    labels: string[];
    colors: string[];
    legend: ApexLegend;
    plotOptions: ApexPlotOptions;
    dataLabels: ApexDataLabels;
  };

  // Recent clinics table
  recentClinicsColumns = ['name', 'owner', 'plan', 'status', 'createdAt', 'actions'];
  recentClinics: RecentClinic[] = [];

  constructor() {
    this.revenueChartOptions = this.getRevenueChartOptions();
    this.clinicsChartOptions = this.getClinicsChartOptions();
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Simulated data - replace with API calls
    setTimeout(() => {
      this.kpiCards = [
        {
          title: 'Total Clínicas',
          value: 48,
          icon: 'business',
          color: 'primary',
          change: 12,
          changeLabel: 'este mes',
        },
        {
          title: 'Doctores Activos',
          value: 156,
          icon: 'medical_services',
          color: 'success',
          change: 8,
          changeLabel: 'esta semana',
        },
        {
          title: 'Pacientes Registrados',
          value: '2,847',
          icon: 'people',
          color: 'info',
          change: 23,
          changeLabel: 'este mes',
        },
        {
          title: 'Ingresos Mensuales',
          value: '$45,680',
          icon: 'payments',
          color: 'warning',
          change: 15,
          changeLabel: 'vs mes anterior',
        },
      ];

      this.recentClinics = [
        {
          name: 'Clínica San Rafael',
          owner: 'Dr. Carlos Méndez',
          plan: 'Premium',
          status: 'active',
          createdAt: new Date('2024-01-15'),
        },
        {
          name: 'Centro Médico Aurora',
          owner: 'Dra. María López',
          plan: 'Professional',
          status: 'active',
          createdAt: new Date('2024-01-10'),
        },
        {
          name: 'Hospital del Valle',
          owner: 'Dr. Juan Hernández',
          plan: 'Enterprise',
          status: 'pending',
          createdAt: new Date('2024-01-08'),
        },
        {
          name: 'Clínica Familiar',
          owner: 'Dra. Ana García',
          plan: 'Basic',
          status: 'active',
          createdAt: new Date('2024-01-05'),
        },
        {
          name: 'Centro Dental Plus',
          owner: 'Dr. Roberto Sánchez',
          plan: 'Professional',
          status: 'trial',
          createdAt: new Date('2024-01-02'),
        },
      ];

      this.isLoading = false;
    }, 500);
  }

  getRevenueChartOptions() {
    return {
      series: [
        {
          name: 'Ingresos',
          data: [31000, 40000, 28000, 51000, 42000, 45680],
        },
        {
          name: 'Nuevas Suscripciones',
          data: [11000, 32000, 45000, 32000, 34000, 38000],
        },
      ],
      chart: {
        height: 300,
        type: 'area' as const,
        toolbar: { show: false },
        foreColor: '#9aa0ac',
      },
      colors: ['#7c4dff', '#00c853'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth' as const, width: 2 },
      xaxis: {
        categories: ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'],
      },
      yaxis: {
        labels: {
          formatter: (val: number) => '$' + val.toLocaleString(),
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
          formatter: (val: number) => '$' + val.toLocaleString(),
        },
      },
    };
  }

  getClinicsChartOptions() {
    return {
      series: [25, 15, 6, 2],
      chart: {
        height: 280,
        type: 'donut' as const,
      },
      labels: ['Basic', 'Professional', 'Premium', 'Enterprise'],
      colors: ['#42a5f5', '#66bb6a', '#ffca28', '#7c4dff'],
      legend: {
        position: 'bottom' as const,
      },
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: () => '48',
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

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'badge-solid-green',
      pending: 'badge-solid-orange',
      trial: 'badge-solid-blue',
      suspended: 'badge-solid-red',
    };
    return classes[status] || 'badge-solid-gray';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      pending: 'Pendiente',
      trial: 'Prueba',
      suspended: 'Suspendido',
    };
    return labels[status] || status;
  }
}
