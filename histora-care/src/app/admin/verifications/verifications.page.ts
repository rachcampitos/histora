import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController, AlertController, ModalController } from '@ionic/angular';
import { AdminService, VerificationStats } from '../../core/services/admin.service';
import { NurseVerification, VerificationStatus } from '../../core/models';

@Component({
  selector: 'app-verifications',
  templateUrl: './verifications.page.html',
  standalone: false,
  styleUrls: ['./verifications.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationsPage implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private modalCtrl = inject(ModalController);

  // State
  stats = signal<VerificationStats | null>(null);
  verifications = signal<NurseVerification[]>([]);
  selectedVerification = signal<NurseVerification | null>(null);
  isLoading = signal(true);
  isProcessing = signal(false);

  // Filters
  statusFilter = signal<VerificationStatus | 'all'>('all');
  currentPage = signal(1);
  totalPages = signal(1);

  // Computed
  filteredVerifications = computed(() => {
    const filter = this.statusFilter();
    const list = this.verifications();
    if (filter === 'all') return list;
    return list.filter(v => v.status === filter);
  });

  statusOptions: { value: VerificationStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'under_review', label: 'En Revision' },
    { value: 'approved', label: 'Aprobados' },
    { value: 'rejected', label: 'Rechazados' },
  ];

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      // Load stats and verifications in parallel
      const [stats, verificationResponse] = await Promise.all([
        this.adminService.getVerificationStats().toPromise(),
        this.adminService.getVerifications({
          status: this.statusFilter() === 'all' ? undefined : this.statusFilter() as VerificationStatus,
          page: this.currentPage(),
          limit: 20
        }).toPromise()
      ]);

      if (stats) this.stats.set(stats);
      if (verificationResponse) {
        this.verifications.set(verificationResponse.verifications);
        this.totalPages.set(verificationResponse.totalPages);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.showToast('Error al cargar datos', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  onStatusFilterChange(event: CustomEvent) {
    this.statusFilter.set(event.detail.value);
    this.currentPage.set(1);
    this.loadData();
  }

  selectVerification(verification: NurseVerification) {
    this.selectedVerification.set(verification);
  }

  closeDetail() {
    this.selectedVerification.set(null);
  }

  async markUnderReview(verification: NurseVerification) {
    if (verification.status !== 'pending') return;

    this.isProcessing.set(true);
    try {
      const updated = await this.adminService.markUnderReview(verification.id).toPromise();
      if (updated) {
        this.updateVerificationInList(updated);
        this.selectedVerification.set(updated);
        this.showToast('Verificacion marcada en revision', 'primary');
        // Reload stats
        const stats = await this.adminService.getVerificationStats().toPromise();
        if (stats) this.stats.set(stats);
      }
    } catch (error) {
      console.error('Error:', error);
      this.showToast('Error al actualizar estado', 'danger');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async approveVerification(verification: NurseVerification) {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-success',
      header: 'Aprobar Verificacion',
      message: `Confirmas que la enfermera ha sido verificada correctamente?`,
      inputs: [
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Notas de revision (opcional)'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aprobar',
          handler: (data) => this.doReview(verification, 'approved', data.notes)
        }
      ]
    });
    await alert.present();
  }

  async rejectVerification(verification: NurseVerification) {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-danger',
      header: 'Rechazar Verificacion',
      message: 'Indica el motivo del rechazo:',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Motivo del rechazo (requerido)'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          role: 'destructive',
          handler: (data) => {
            if (!data.reason?.trim()) {
              this.showToast('Debes indicar el motivo del rechazo', 'warning');
              return false;
            }
            this.doReview(verification, 'rejected', undefined, data.reason);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async doReview(
    verification: NurseVerification,
    status: 'approved' | 'rejected',
    notes?: string,
    reason?: string
  ) {
    this.isProcessing.set(true);
    try {
      const updated = await this.adminService.reviewVerification(verification.id, {
        status,
        reviewNotes: notes,
        rejectionReason: reason
      }).toPromise();

      if (updated) {
        this.updateVerificationInList(updated);
        this.selectedVerification.set(updated);
        this.showToast(
          status === 'approved' ? 'Verificacion aprobada' : 'Verificacion rechazada',
          status === 'approved' ? 'success' : 'danger'
        );
        // Reload stats
        const stats = await this.adminService.getVerificationStats().toPromise();
        if (stats) this.stats.set(stats);
      }
    } catch (error) {
      console.error('Error:', error);
      this.showToast('Error al procesar verificacion', 'danger');
    } finally {
      this.isProcessing.set(false);
    }
  }

  private updateVerificationInList(updated: NurseVerification) {
    const list = [...this.verifications()];
    const index = list.findIndex(v => v.id === updated.id);
    if (index !== -1) {
      list[index] = updated;
      this.verifications.set(list);
    }
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  getStatusLabel(status: VerificationStatus): string {
    const labels: Record<VerificationStatus, string> = {
      pending: 'Pendiente',
      under_review: 'En Revision',
      approved: 'Aprobado',
      rejected: 'Rechazado'
    };
    return labels[status] || status;
  }

  getStatusColor(status: VerificationStatus): string {
    const colors: Record<VerificationStatus, string> = {
      pending: 'warning',
      under_review: 'primary',
      approved: 'success',
      rejected: 'danger'
    };
    return colors[status] || 'medium';
  }

  getDocumentLabel(type: string): string {
    const labels: Record<string, string> = {
      cep_front: 'CEP Frente',
      cep_back: 'CEP Reverso',
      dni_front: 'DNI Frente',
      dni_back: 'DNI Reverso',
      selfie_with_dni: 'Selfie con DNI'
    };
    return labels[type] || type;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: color === 'danger' ? 4000 : 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
