import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';
import { ComplaintsApiService, ComplaintResponse } from '../../../core/services/complaints.service';

@Component({
  selector: 'app-complaints-list',
  templateUrl: './complaints-list.page.html',
  standalone: false,
  styleUrls: ['./complaints-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintsListPage implements OnInit {
  private location = inject(Location);
  private complaintsApi = inject(ComplaintsApiService);

  complaints = signal<ComplaintResponse[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadComplaints();
  }

  loadComplaints() {
    this.loading.set(true);
    this.complaintsApi.getMyComplaints().subscribe({
      next: (data) => {
        this.complaints.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in_review':
        return 'En revision';
      case 'resolved':
        return 'Resuelto';
      default:
        return status;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_review':
        return 'primary';
      case 'resolved':
        return 'success';
      default:
        return 'medium';
    }
  }

  goBack() {
    this.location.back();
  }
}
