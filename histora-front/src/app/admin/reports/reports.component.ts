import { Component, OnInit, OnDestroy, effect } from '@angular/core';
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
} from 'ng-apexcharts';

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
    FormsModule,
    NgApexchartsModule,
  ],
})
export class ReportsComponent implements OnInit {
  isLoading = true;
  selectedPeriod = '6months';
  private isDarkMode = false;

  periodOptions = [
    { value: '30days', label: 'Últimos 30 días' },
    { value: '3months', label: 'Últimos 3 meses' },
    { value: '6months', label: 'Últimos 6 meses' },
    { value: '1year', label: 'Último año' },
  ];

  // KPIs
  kpis = {
    totalRevenue: 0,
    revenueGrowth: 0,
    totalClinics: 0,
    clinicsGrowth: 0,
    totalUsers: 0,
    usersGrowth: 0,
    avgRevenuePerClinic: 0,
  };

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
  };

  clinicsGrowthChartOptions!: {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    stroke: ApexStroke;
    dataLabels: ApexDataLabels;
    colors: string[];
    theme: ApexTheme;
  };

  planDistributionChartOptions!: {
    series: ApexNonAxisChartSeries;
    chart: ApexChart;
    labels: string[];
    colors: string[];
    legend: ApexLegend;
    plotOptions: ApexPlotOptions;
    dataLabels: ApexDataLabels;
    theme: ApexTheme;
  };

  churnChartOptions!: {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    stroke: ApexStroke;
    dataLabels: ApexDataLabels;
    colors: string[];
    yaxis: ApexYAxis;
    theme: ApexTheme;
  };

  constructor(private themeService: ThemeService) {
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

  private initAllCharts(): void {
    this.initRevenueChart();
    this.initClinicsGrowthChart();
    this.initPlanDistributionChart();
    this.initChurnChart();
  }

  loadReportData(): void {
    setTimeout(() => {
      this.kpis = {
        totalRevenue: 245680,
        revenueGrowth: 15.3,
        totalClinics: 48,
        clinicsGrowth: 12,
        totalUsers: 3156,
        usersGrowth: 23,
        avgRevenuePerClinic: 5118,
      };

      this.initRevenueChart();
      this.initClinicsGrowthChart();
      this.initPlanDistributionChart();
      this.initChurnChart();

      this.isLoading = false;
    }, 500);
  }

  initRevenueChart(): void {
    this.revenueChartOptions = {
      series: [
        {
          name: 'Ingresos',
          data: [31000, 40000, 38000, 51000, 42000, 45680],
        },
        {
          name: 'Gastos Operativos',
          data: [15000, 18000, 17000, 20000, 19000, 18500],
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
      colors: ['#7c4dff', '#ff5252'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: {
        categories: ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'],
        labels: {
          style: { colors: this.getChartForeColor() },
        },
      },
      yaxis: {
        labels: {
          formatter: (val: number) => '$' + val.toLocaleString(),
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
          formatter: (val: number) => '$' + val.toLocaleString(),
        },
      },
    };
  }

  initClinicsGrowthChart(): void {
    this.clinicsGrowthChartOptions = {
      series: [
        {
          name: 'Nuevas Clínicas',
          data: [5, 8, 6, 10, 7, 12],
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
      colors: ['#00c853'],
      dataLabels: { enabled: false },
      stroke: { show: false },
      xaxis: {
        categories: ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'],
        labels: {
          style: { colors: this.getChartForeColor() },
        },
      },
    };
  }

  initPlanDistributionChart(): void {
    this.planDistributionChartOptions = {
      series: [25, 15, 6, 2],
      chart: {
        height: 300,
        type: 'donut',
        foreColor: this.getChartForeColor(),
        background: 'transparent',
      },
      theme: this.getChartTheme(),
      labels: ['Basic', 'Professional', 'Premium', 'Enterprise'],
      colors: ['#42a5f5', '#66bb6a', '#ffca28', '#7c4dff'],
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
                formatter: () => '48',
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

  initChurnChart(): void {
    this.churnChartOptions = {
      series: [
        {
          name: 'Tasa de Cancelación',
          data: [3.2, 2.8, 3.5, 2.1, 2.9, 2.5],
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
      colors: ['#ff5252'],
      dataLabels: {
        enabled: true,
        style: {
          colors: [this.isDarkMode ? '#ffffff' : '#2c3e50'],
        },
      },
      stroke: { curve: 'smooth', width: 3 },
      xaxis: {
        categories: ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'],
        labels: {
          style: { colors: this.getChartForeColor() },
        },
      },
      yaxis: {
        labels: {
          formatter: (val: number) => val.toFixed(1) + '%',
          style: { colors: [this.getChartForeColor()] },
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
  }
}
