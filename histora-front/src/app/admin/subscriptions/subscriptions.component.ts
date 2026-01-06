import { Component, OnInit, ViewChild } from '@angular/core';
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
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

interface Subscription {
  id: string;
  clinicName: string;
  plan: string;
  status: string;
  amount: number;
  billingCycle: string;
  startDate: Date;
  nextBillingDate: Date;
  paymentMethod: string;
}

interface Plan {
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  activeSubscriptions: number;
  color: string;
}

@Component({
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
    FormsModule,
  ],
})
export class SubscriptionsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true;
  displayedColumns = ['clinic', 'plan', 'status', 'amount', 'nextBilling', 'paymentMethod', 'actions'];
  dataSource = new MatTableDataSource<Subscription>([]);

  searchTerm = '';
  planFilter = '';
  statusFilter = '';

  plans: Plan[] = [];
  planOptions = ['Basic', 'Professional', 'Premium', 'Enterprise'];
  statusOptions = ['active', 'cancelled', 'past_due', 'trial'];

  // Summary stats
  totalRevenue = 0;
  activeSubscriptions = 0;
  trialSubscriptions = 0;
  churnRate = 2.5;

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadData(): void {
    setTimeout(() => {
      this.plans = [
        {
          name: 'Basic',
          price: 299,
          billingCycle: 'mes',
          features: ['Hasta 2 doctores', '100 pacientes', 'Soporte email'],
          activeSubscriptions: 25,
          color: '#42a5f5',
        },
        {
          name: 'Professional',
          price: 599,
          billingCycle: 'mes',
          features: ['Hasta 5 doctores', '500 pacientes', 'Soporte prioritario', 'Reportes avanzados'],
          activeSubscriptions: 15,
          color: '#66bb6a',
        },
        {
          name: 'Premium',
          price: 999,
          billingCycle: 'mes',
          features: ['Hasta 15 doctores', 'Pacientes ilimitados', 'Soporte 24/7', 'API access'],
          activeSubscriptions: 6,
          color: '#ffca28',
        },
        {
          name: 'Enterprise',
          price: 1999,
          billingCycle: 'mes',
          features: ['Doctores ilimitados', 'Pacientes ilimitados', 'Soporte dedicado', 'Custom features'],
          activeSubscriptions: 2,
          color: '#7c4dff',
        },
      ];

      const subscriptions: Subscription[] = [
        {
          id: '1',
          clinicName: 'Clínica San Rafael',
          plan: 'Premium',
          status: 'active',
          amount: 999,
          billingCycle: 'monthly',
          startDate: new Date('2023-06-15'),
          nextBillingDate: new Date('2024-02-15'),
          paymentMethod: 'Visa ****4242',
        },
        {
          id: '2',
          clinicName: 'Centro Médico Aurora',
          plan: 'Professional',
          status: 'active',
          amount: 599,
          billingCycle: 'monthly',
          startDate: new Date('2023-08-20'),
          nextBillingDate: new Date('2024-02-20'),
          paymentMethod: 'Mastercard ****5555',
        },
        {
          id: '3',
          clinicName: 'Hospital del Valle',
          plan: 'Enterprise',
          status: 'trial',
          amount: 0,
          billingCycle: 'monthly',
          startDate: new Date('2024-01-08'),
          nextBillingDate: new Date('2024-02-08'),
          paymentMethod: 'Pending',
        },
        {
          id: '4',
          clinicName: 'Clínica Familiar',
          plan: 'Basic',
          status: 'active',
          amount: 299,
          billingCycle: 'monthly',
          startDate: new Date('2023-11-05'),
          nextBillingDate: new Date('2024-02-05'),
          paymentMethod: 'PayPal',
        },
        {
          id: '5',
          clinicName: 'Centro Dental Plus',
          plan: 'Professional',
          status: 'trial',
          amount: 0,
          billingCycle: 'monthly',
          startDate: new Date('2024-01-02'),
          nextBillingDate: new Date('2024-02-02'),
          paymentMethod: 'Pending',
        },
        {
          id: '6',
          clinicName: 'Clínica Vida Sana',
          plan: 'Premium',
          status: 'active',
          amount: 999,
          billingCycle: 'monthly',
          startDate: new Date('2023-04-10'),
          nextBillingDate: new Date('2024-02-10'),
          paymentMethod: 'Visa ****1234',
        },
        {
          id: '7',
          clinicName: 'Centro Pediátrico Feliz',
          plan: 'Professional',
          status: 'past_due',
          amount: 599,
          billingCycle: 'monthly',
          startDate: new Date('2023-02-28'),
          nextBillingDate: new Date('2024-01-28'),
          paymentMethod: 'Mastercard ****9999',
        },
        {
          id: '8',
          clinicName: 'Dermaclínica Estética',
          plan: 'Basic',
          status: 'cancelled',
          amount: 0,
          billingCycle: 'monthly',
          startDate: new Date('2023-09-15'),
          nextBillingDate: new Date('2024-01-15'),
          paymentMethod: 'N/A',
        },
      ];

      this.dataSource.data = subscriptions;
      this.calculateStats(subscriptions);
      this.isLoading = false;
    }, 500);
  }

  calculateStats(subscriptions: Subscription[]): void {
    this.activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    this.trialSubscriptions = subscriptions.filter(s => s.status === 'trial').length;
    this.totalRevenue = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.amount, 0);
  }

  applyFilter(): void {
    this.dataSource.filterPredicate = (data: Subscription, filter: string) => {
      const searchStr = filter.toLowerCase();
      const matchesSearch = !this.searchTerm ||
        data.clinicName.toLowerCase().includes(searchStr);
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
      Basic: 'badge-plan-basic',
      Professional: 'badge-plan-professional',
      Premium: 'badge-plan-premium',
      Enterprise: 'badge-plan-enterprise',
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

  viewSubscription(sub: Subscription): void {
    console.log('View subscription:', sub);
  }

  editSubscription(sub: Subscription): void {
    console.log('Edit subscription:', sub);
  }

  cancelSubscription(sub: Subscription): void {
    console.log('Cancel subscription:', sub);
  }

  retryPayment(sub: Subscription): void {
    console.log('Retry payment:', sub);
  }
}
