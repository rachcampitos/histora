import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexYAxis,
  ApexPlotOptions,
  ApexStroke,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexMarkers,
  ApexGrid,
  ApexTitleSubtitle,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgScrollbar } from 'ngx-scrollbar';
import { MedicineListComponent } from '@shared/components/medicine-list/medicine-list.component';
import { ReportListComponent } from '@shared/components/report-list/report-list.component';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '@core';
import {
  PatientPortalService,
  DashboardData,
  Medication,
} from '@core/service/patient-portal.service';

export type heartRateChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  colors: string[];
  yaxis: ApexYAxis;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  title: ApexTitleSubtitle;
};

export type radialChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  plotOptions: ApexPlotOptions;
};

export interface MedicineDisplay {
  name: string;
  icon: string;
  dosage: string;
  colorClass: string;
}

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule,
    BreadcrumbComponent,
    NgApexchartsModule,
    MatButtonModule,
    MatTabsModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    NgScrollbar,
    MedicineListComponent,
    ReportListComponent,
    TranslateModule,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('chart')
  chart!: ChartComponent;

  public heartRateChartOptions!: Partial<heartRateChartOptions>;
  public radialChartOptions!: Partial<radialChartOptions>;
  public restRateChartOptions!: Partial<heartRateChartOptions>;
  public performanceRateChartOptions!: Partial<heartRateChartOptions>;

  // Patient profile data
  patientName = '';
  patientAvatar = '';

  // Dashboard data
  dashboardData: DashboardData | null = null;
  isLoading = true;
  medicineDataSource: MedicineDisplay[] = [];

  // Vitals for display
  vitals: {
    heartRate: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
    bloodPressure: { systolic: number; diastolic: number; change: number; trend: 'up' | 'down' | 'stable' };
    bloodGlucose: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
    oxygenSaturation: number;
    temperature: number;
    weight: number;
    bmi: number;
  } = {
    heartRate: { value: 0, change: 0, trend: 'stable' },
    bloodPressure: { systolic: 0, diastolic: 0, change: 0, trend: 'stable' },
    bloodGlucose: { value: 0, change: 0, trend: 'stable' },
    oxygenSaturation: 0,
    temperature: 0,
    weight: 0,
    bmi: 0,
  };

  private subscriptions = new Subscription();

  // Reports list (static for now)
  reports = [
    { title: 'Blood Report', icon: 'far fa-file-pdf', colorClass: 'col-red' },
    { title: 'Mediclaim Documents', icon: 'far fa-file-word', colorClass: 'col-blue' },
    { title: 'Doctor Prescription', icon: 'far fa-file-alt', colorClass: 'col-black' },
    { title: 'X-Ray Files', icon: 'far fa-file-archive', colorClass: 'col-purple' },
    { title: 'Urine Report', icon: 'far fa-file-pdf', colorClass: 'col-red' },
    { title: 'Scanned Documents', icon: 'far fa-file-image', colorClass: 'col-teal' },
  ];

  constructor(
    private authService: AuthService,
    private patientPortalService: PatientPortalService
  ) {}

  ngOnInit() {
    this.subscribeToUserUpdates();
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private subscribeToUserUpdates() {
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        if (user && Object.keys(user).length > 0) {
          this.patientName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          if (user.avatar) {
            this.patientAvatar = user.avatar.startsWith('http')
              ? user.avatar
              : 'assets/images/user/' + user.avatar;
          }
        }
      })
    );
  }

  private loadDashboardData() {
    this.isLoading = true;
    this.subscriptions.add(
      this.patientPortalService.getDashboardData().subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.processVitals(data);
          this.processMedications(data.medications);
          this.initCharts(data);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading dashboard data:', err);
          this.isLoading = false;
          // Initialize with empty/demo data on error
          this.initChartsWithDemoData();
        },
      })
    );
  }

  private processVitals(data: DashboardData) {
    this.vitals = {
      heartRate: data.vitals.heartRate,
      bloodPressure: {
        systolic: data.vitals.bloodPressure.systolic.value,
        diastolic: data.vitals.bloodPressure.diastolic,
        change: data.vitals.bloodPressure.systolic.change,
        trend: data.vitals.bloodPressure.systolic.trend,
      },
      bloodGlucose: data.vitals.bloodGlucose,
      oxygenSaturation: data.vitals.oxygenSaturation,
      temperature: data.vitals.temperature,
      weight: data.vitals.weight,
      bmi: data.vitals.bmi,
    };
  }

  private processMedications(medications: Medication[]) {
    this.medicineDataSource = medications.map((med) => {
      const iconInfo = this.patientPortalService.getMedicationIcon(med);
      return {
        name: med.name,
        icon: iconInfo.icon + ' ' + iconInfo.colorClass,
        dosage: this.patientPortalService.formatDosage(med),
        colorClass: iconInfo.colorClass,
      };
    });

    // If no medications, show placeholder
    if (this.medicineDataSource.length === 0) {
      this.medicineDataSource = [
        {
          name: 'No hay medicamentos activos',
          icon: 'fas fa-info-circle col-gray',
          dosage: '',
          colorClass: 'col-gray',
        },
      ];
    }
  }

  private initCharts(data: DashboardData) {
    // Heart rate chart with real data
    const heartRateData = data.charts.heartRateHistory;
    const categories = heartRateData.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('es', { weekday: 'short' });
    });
    const values = heartRateData.map((d) => d.value);

    this.initHeartRateChart(categories, values);
    this.initRadialChart();
    this.initRestRateChart(categories, values);
    this.initPerformanceChart();
  }

  private initChartsWithDemoData() {
    const categories = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const values = [72, 75, 70, 73, 76, 74, 72];

    this.initHeartRateChart(categories, values);
    this.initRadialChart();
    this.initRestRateChart(categories, values);
    this.initPerformanceChart();

    // Demo medications
    this.medicineDataSource = [
      { name: 'Paracetamol 500mg', icon: 'fas fa-tablets col-green', dosage: '1 - 0 - 1', colorClass: 'col-green' },
      { name: 'Omeprazol 20mg', icon: 'fas fa-capsules col-red', dosage: '1 - 0 - 0', colorClass: 'col-red' },
      { name: 'Loratadina 10mg', icon: 'fas fa-pills col-purple', dosage: '0 - 0 - 1', colorClass: 'col-purple' },
    ];
  }

  private initHeartRateChart(categories: string[], values: number[]) {
    this.heartRateChartOptions = {
      series: [{ name: 'Frecuencia Cardíaca', data: values.length > 0 ? values : [72, 75, 70, 73, 76, 74, 72] }],
      chart: {
        height: 350,
        type: 'line',
        dropShadow: {
          enabled: true,
          color: '#000',
          top: 18,
          left: 7,
          blur: 10,
          opacity: 0.2,
        },
        foreColor: '#9aa0ac',
        toolbar: { show: false },
      },
      colors: ['#E91E63'],
      dataLabels: { enabled: true },
      stroke: { curve: 'smooth' },
      markers: { size: 1 },
      grid: {
        show: true,
        borderColor: '#9aa0ac',
        strokeDashArray: 1,
      },
      xaxis: {
        categories: categories.length > 0 ? categories : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        title: { text: 'Día' },
      },
      yaxis: { title: { text: 'BPM' }, min: 50, max: 120 },
      tooltip: { theme: 'dark', marker: { show: true }, x: { show: true } },
    };
  }

  private initRadialChart() {
    // This can show health metrics summary
    this.radialChartOptions = {
      series: [
        this.vitals.oxygenSaturation || 98,
        Math.min(100, Math.round((this.vitals.heartRate.value / 100) * 100)) || 72,
        this.vitals.bmi ? Math.min(100, Math.round((25 / this.vitals.bmi) * 100)) : 80,
      ],
      chart: { height: 265, type: 'radialBar' },
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: { fontSize: '22px' },
            value: { fontSize: '16px' },
            total: {
              show: true,
              label: 'Salud',
              formatter: () => 'Buena',
            },
          },
        },
      },
      colors: ['#4CAF50', '#E91E63', '#2196F3'],
      labels: ['SpO2', 'Cardíaco', 'IMC'],
    };
  }

  private initRestRateChart(categories: string[], values: number[]) {
    this.restRateChartOptions = {
      series: [{ name: 'Frecuencia en Reposo', data: values.length > 0 ? values : [69, 75, 72, 69, 75, 80, 87] }],
      chart: {
        height: 350,
        type: 'line',
        dropShadow: {
          enabled: true,
          color: '#000',
          top: 18,
          left: 7,
          blur: 10,
          opacity: 0.2,
        },
        foreColor: '#9aa0ac',
        toolbar: { show: false },
      },
      colors: ['#FCB939'],
      dataLabels: { enabled: true },
      stroke: { curve: 'smooth' },
      markers: { size: 1 },
      grid: {
        show: true,
        borderColor: '#9aa0ac',
        strokeDashArray: 1,
      },
      xaxis: {
        categories: categories.length > 0 ? categories : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        title: { text: 'Día' },
      },
      yaxis: { title: { text: 'BPM' } },
      tooltip: { theme: 'dark', marker: { show: true }, x: { show: true } },
    };
  }

  private initPerformanceChart() {
    // Blood pressure chart
    const systolic = this.vitals.bloodPressure.systolic || 120;
    const diastolic = this.vitals.bloodPressure.diastolic || 80;

    this.performanceRateChartOptions = {
      series: [
        { name: 'Sistólica', data: [systolic - 5, systolic, systolic + 3, systolic - 2, systolic + 1, systolic - 3, systolic] },
      ],
      chart: {
        height: 350,
        type: 'line',
        dropShadow: {
          enabled: true,
          color: '#000',
          top: 18,
          left: 7,
          blur: 10,
          opacity: 0.2,
        },
        foreColor: '#9aa0ac',
        toolbar: { show: false },
      },
      colors: ['#545454'],
      dataLabels: { enabled: true },
      stroke: { curve: 'smooth' },
      grid: {
        show: true,
        borderColor: '#9aa0ac',
        strokeDashArray: 1,
      },
      markers: { size: 1 },
      xaxis: {
        categories: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        title: { text: 'Día' },
      },
      yaxis: { title: { text: 'mmHg' } },
      tooltip: { theme: 'dark', marker: { show: true }, x: { show: true } },
    };
  }

  // Helper methods for template
  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      default:
        return 'trending_flat';
    }
  }

  getTrendColor(trend: string, isGoodWhenUp: boolean = false): string {
    if (trend === 'stable') return 'text-muted';
    if (isGoodWhenUp) {
      return trend === 'up' ? 'col-green' : 'col-red';
    }
    // For most vitals, lower is often better (blood pressure, etc.)
    return trend === 'down' ? 'col-green' : 'col-orange';
  }

  formatChange(change: number): string {
    if (change === 0) return 'Sin cambios';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}% vs mes anterior`;
  }
}
