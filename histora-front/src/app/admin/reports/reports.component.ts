import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ThemeService } from '@core/service/theme.service';
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
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexTheme,
  ApexGrid,
} from 'ng-apexcharts';

interface ReportKPI {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: string;
  iconClass: string;
}

interface TopNurse {
  rank: number;
  name: string;
  cep: string;
  value: number;
  valueLabel: string;
  services?: number;
  rating?: number;
}

interface RegionData {
  region: string;
  services: number;
  revenue: number;
  nurses: number;
}

@Component({
  standalone: true,
  selector: 'app-admin-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  imports: [
    CommonModule,
    BreadcrumbComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatTabsModule,
    MatTooltipModule,
    FormsModule,
    NgApexchartsModule,
  ],
})
export class ReportsComponent implements OnInit {
  private themeService = inject(ThemeService);

  isLoading = true;
  selectedPeriod = '30days';
  private isDarkMode = false;

  periodOptions = [
    { value: '7days', label: 'Últimos 7 días' },
    { value: '30days', label: 'Últimos 30 días' },
    { value: '3months', label: 'Últimos 3 meses' },
    { value: '6months', label: 'Últimos 6 meses' },
    { value: '1year', label: 'Último año' },
  ];

  // Business KPIs
  businessKpis: ReportKPI[] = [];
  operationalKpis: ReportKPI[] = [];

  // Top performers
  topNursesByRevenue: TopNurse[] = [];
  topNursesByServices: TopNurse[] = [];
  regionData: RegionData[] = [];

  // Charts
  revenueChartOptions!: {
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
    theme: ApexTheme;
    grid: ApexGrid;
  };

  servicesChartOptions!: {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    stroke: ApexStroke;
    dataLabels: ApexDataLabels;
    colors: string[];
    theme: ApexTheme;
    plotOptions: ApexPlotOptions;
    grid: ApexGrid;
  };

  nurseDistributionChartOptions!: {
    series: ApexNonAxisChartSeries;
    chart: ApexChart;
    labels: string[];
    colors: string[];
    legend: ApexLegend;
    plotOptions: ApexPlotOptions;
    dataLabels: ApexDataLabels;
    theme: ApexTheme;
  };

  patientGrowthChartOptions!: {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    stroke: ApexStroke;
    dataLabels: ApexDataLabels;
    colors: string[];
    yaxis: ApexYAxis;
    theme: ApexTheme;
    fill: ApexFill;
    grid: ApexGrid;
  };

  constructor() {
    effect(() => {
      const theme = this.themeService.currentTheme();
      this.isDarkMode = theme === 'dark';
      if (!this.isLoading) {
        this.initAllCharts();
      }
    });
  }

  ngOnInit(): void {
    this.isDarkMode = this.themeService.currentTheme() === 'dark';
    this.loadReportData();
  }

  private getChartForeColor(): string {
    return this.isDarkMode ? '#b8c5d6' : '#9aa0ac';
  }

  private getChartTheme(): ApexTheme {
    return { mode: this.isDarkMode ? 'dark' : 'light' };
  }

  private getGridColor(): string {
    return this.isDarkMode ? '#2a3040' : '#f0f0f0';
  }

  private initAllCharts(): void {
    this.initRevenueChart();
    this.initServicesChart();
    this.initNurseDistributionChart();
    this.initPatientGrowthChart();
  }

  loadReportData(): void {
    setTimeout(() => {
      // Business KPIs
      this.businessKpis = [
        {
          label: 'GMV (Valor Bruto)',
          value: 'S/. 45,680',
          change: 18.5,
          changeLabel: 'vs mes anterior',
          icon: 'payments',
          iconClass: 'gmv',
        },
        {
          label: 'MRR (Suscripciones)',
          value: 'S/. 2,350',
          change: 12.3,
          changeLabel: 'vs mes anterior',
          icon: 'trending_up',
          iconClass: 'mrr',
        },
        {
          label: 'Comisiones Generadas',
          value: 'S/. 6,852',
          change: 15.2,
          changeLabel: 'vs mes anterior',
          icon: 'account_balance',
          iconClass: 'commission',
        },
        {
          label: 'Ticket Promedio',
          value: 'S/. 85',
          change: 5.8,
          changeLabel: 'vs mes anterior',
          icon: 'receipt_long',
          iconClass: 'ticket',
        },
      ];

      // Operational KPIs
      this.operationalKpis = [
        {
          label: 'Servicios Completados',
          value: '537',
          change: 22.1,
          changeLabel: 'vs mes anterior',
          icon: 'medical_services',
          iconClass: 'services',
        },
        {
          label: 'Enfermeras Activas',
          value: '76',
          change: 8,
          changeLabel: 'nuevas este mes',
          icon: 'badge',
          iconClass: 'nurses',
        },
        {
          label: 'Pacientes Activos',
          value: '312',
          change: 15,
          changeLabel: 'nuevos este mes',
          icon: 'people',
          iconClass: 'patients',
        },
        {
          label: 'Tasa de Recompra',
          value: '68%',
          change: 4.2,
          changeLabel: 'vs mes anterior',
          icon: 'repeat',
          iconClass: 'retention',
        },
      ];

      // Top nurses by revenue
      this.topNursesByRevenue = [
        { rank: 1, name: 'Maria Claudia Chavez', cep: '108887', value: 4250, valueLabel: 'S/. 4,250', services: 48, rating: 4.9 },
        { rank: 2, name: 'Rosa Isabel Mendez', cep: '112456', value: 3890, valueLabel: 'S/. 3,890', services: 42, rating: 4.8 },
        { rank: 3, name: 'Ana Rosa Gutierrez', cep: '109234', value: 3420, valueLabel: 'S/. 3,420', services: 38, rating: 4.9 },
        { rank: 4, name: 'Carmen Elena Torres', cep: '115678', value: 2980, valueLabel: 'S/. 2,980', services: 35, rating: 4.7 },
        { rank: 5, name: 'Patricia Morales Silva', cep: '118901', value: 2650, valueLabel: 'S/. 2,650', services: 30, rating: 4.8 },
      ];

      // Top nurses by services
      this.topNursesByServices = [
        { rank: 1, name: 'Maria Claudia Chavez', cep: '108887', value: 48, valueLabel: '48 servicios', rating: 4.9 },
        { rank: 2, name: 'Rosa Isabel Mendez', cep: '112456', value: 42, valueLabel: '42 servicios', rating: 4.8 },
        { rank: 3, name: 'Lucia Fernanda Ramos', cep: '120345', value: 40, valueLabel: '40 servicios', rating: 4.6 },
        { rank: 4, name: 'Ana Rosa Gutierrez', cep: '109234', value: 38, valueLabel: '38 servicios', rating: 4.9 },
        { rank: 5, name: 'Gloria Martinez Lopez', cep: '117890', value: 36, valueLabel: '36 servicios', rating: 4.5 },
      ];

      // Region data
      this.regionData = [
        { region: 'Miraflores', services: 89, revenue: 7565, nurses: 12 },
        { region: 'San Isidro', services: 76, revenue: 6840, nurses: 10 },
        { region: 'Surco', services: 68, revenue: 5780, nurses: 11 },
        { region: 'La Molina', services: 52, revenue: 4680, nurses: 8 },
        { region: 'San Borja', services: 48, revenue: 4080, nurses: 7 },
        { region: 'Otros', services: 204, revenue: 16735, nurses: 28 },
      ];

      this.initAllCharts();
      this.isLoading = false;
    }, 500);
  }

  initRevenueChart(): void {
    this.revenueChartOptions = {
      series: [
        {
          name: 'GMV',
          data: [32000, 38000, 35000, 42000, 40000, 45680],
        },
        {
          name: 'Comisiones',
          data: [4800, 5700, 5250, 6300, 6000, 6852],
        },
      ],
      chart: {
        height: 350,
        type: 'area',
        toolbar: { show: true },
        foreColor: this.getChartForeColor(),
        background: 'transparent',
      },
      theme: this.getChartTheme(),
      colors: ['#4a9d9a', '#667eea'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      grid: {
        borderColor: this.getGridColor(),
      },
      xaxis: {
        categories: ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'],
        labels: {
          style: { colors: this.getChartForeColor() },
        },
      },
      yaxis: {
        labels: {
          formatter: (val: number) => 'S/. ' + val.toLocaleString(),
          style: { colors: [this.getChartForeColor()] },
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        labels: { colors: this.getChartForeColor() },
        itemMargin: { horizontal: 10, vertical: 5 },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
        },
      },
      tooltip: {
        theme: this.isDarkMode ? 'dark' : 'light',
        y: {
          formatter: (val: number) => 'S/. ' + val.toLocaleString(),
        },
      },
    };
  }

  initServicesChart(): void {
    this.servicesChartOptions = {
      series: [
        {
          name: 'Servicios',
          data: [420, 485, 450, 510, 495, 537],
        },
      ],
      chart: {
        height: 300,
        type: 'bar',
        toolbar: { show: false },
        foreColor: this.getChartForeColor(),
        background: 'transparent',
      },
      theme: this.getChartTheme(),
      colors: ['#4a9d9a'],
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '60%',
        },
      },
      dataLabels: { enabled: false },
      stroke: { show: false },
      grid: {
        borderColor: this.getGridColor(),
      },
      xaxis: {
        categories: ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'],
        labels: {
          style: { colors: this.getChartForeColor() },
        },
      },
    };
  }

  initNurseDistributionChart(): void {
    this.nurseDistributionChartOptions = {
      series: [45, 23, 8],
      chart: {
        height: 300,
        type: 'donut',
        foreColor: this.getChartForeColor(),
        background: 'transparent',
      },
      theme: this.getChartTheme(),
      labels: ['Plan Básico', 'Plan Profesional', 'Plan Premium'],
      colors: ['#42a5f5', '#4a9d9a', '#1e3a5f'],
      legend: {
        position: 'bottom',
        labels: { colors: this.getChartForeColor() },
        itemMargin: { horizontal: 8, vertical: 4 },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: true,
              name: {
                color: this.getChartForeColor(),
              },
              value: {
                color: this.getChartForeColor(),
              },
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
        enabled: true,
        formatter: (val: number) => val.toFixed(0) + '%',
        style: {
          colors: ['#ffffff'],
        },
        dropShadow: { enabled: false },
      },
    };
  }

  initPatientGrowthChart(): void {
    this.patientGrowthChartOptions = {
      series: [
        {
          name: 'Pacientes Nuevos',
          data: [45, 52, 48, 60, 55, 68],
        },
        {
          name: 'Pacientes Recurrentes',
          data: [180, 195, 210, 225, 240, 244],
        },
      ],
      chart: {
        height: 300,
        type: 'line',
        toolbar: { show: false },
        foreColor: this.getChartForeColor(),
        background: 'transparent',
      },
      theme: this.getChartTheme(),
      colors: ['#667eea', '#4a9d9a'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      grid: {
        borderColor: this.getGridColor(),
      },
      xaxis: {
        categories: ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'],
        labels: {
          style: { colors: this.getChartForeColor() },
        },
      },
      yaxis: {
        labels: {
          style: { colors: [this.getChartForeColor()] },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.3,
          opacityTo: 0.1,
        },
      },
    };
  }

  onPeriodChange(): void {
    this.isLoading = true;
    this.loadReportData();
  }

  exportReport(format: string): void {
    console.log('Export report as:', format);
    // TODO: Implement export functionality
  }

  getRatingStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  hasHalfStar(rating: number): boolean {
    return rating % 1 >= 0.5;
  }
}
