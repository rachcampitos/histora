import { Component, Input, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { environment } from '../../../../environments/environment';

export interface PatientRatingData {
  serviceRequestId: string;
  patientId: string;
  patientName: string;
}

export interface RatingCategory {
  id: string;
  label: string;
  description: string;
  value: number;
}

export interface PatientRatingSubmission {
  serviceRequestId: string;
  patientId: string;
  respectRating: number;
  safeEnvironmentRating: number;
  communicationRating: number;
  paymentRating: number;
  overallRating: number;
  comment?: string;
}

@Component({
  selector: 'app-patient-rating-modal',
  templateUrl: './patient-rating-modal.component.html',
  styleUrls: ['./patient-rating-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientRatingModalComponent {
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private http = inject(HttpClient);

  @Input() data!: PatientRatingData;

  // State
  isLoading = signal(false);
  comment = signal('');

  // Rating categories
  categories = signal<RatingCategory[]>([
    {
      id: 'respect',
      label: 'Respeto',
      description: 'Trato respetuoso durante el servicio',
      value: 0,
    },
    {
      id: 'safeEnvironment',
      label: 'Ambiente Seguro',
      description: 'El lugar era seguro y adecuado',
      value: 0,
    },
    {
      id: 'communication',
      label: 'Comunicacion',
      description: 'Comunicacion clara y oportuna',
      value: 0,
    },
    {
      id: 'payment',
      label: 'Pago',
      description: 'Pago sin problemas',
      value: 0,
    },
  ]);

  get overallRating(): number {
    const cats = this.categories();
    const rated = cats.filter(c => c.value > 0);
    if (rated.length === 0) return 0;

    const sum = rated.reduce((acc, c) => acc + c.value, 0);
    return Math.round((sum / rated.length) * 10) / 10;
  }

  get canSubmit(): boolean {
    return this.categories().every(c => c.value > 0);
  }

  get allRated(): boolean {
    return this.categories().every(c => c.value > 0);
  }

  setRating(categoryId: string, value: number) {
    const cats = this.categories();
    const updated = cats.map(c =>
      c.id === categoryId ? { ...c, value } : c
    );
    this.categories.set(updated);

    // Haptic feedback
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  }

  getRatingLabel(value: number): string {
    switch (value) {
      case 1: return 'Malo';
      case 2: return 'Regular';
      case 3: return 'Bueno';
      case 4: return 'Muy bueno';
      case 5: return 'Excelente';
      default: return '';
    }
  }

  async submit() {
    if (!this.canSubmit) {
      this.showToast('Por favor califica todas las categorias', 'warning');
      return;
    }

    this.isLoading.set(true);

    const cats = this.categories();
    const submission: PatientRatingSubmission = {
      serviceRequestId: this.data.serviceRequestId,
      patientId: this.data.patientId,
      respectRating: cats.find(c => c.id === 'respect')?.value || 0,
      safeEnvironmentRating: cats.find(c => c.id === 'safeEnvironment')?.value || 0,
      communicationRating: cats.find(c => c.id === 'communication')?.value || 0,
      paymentRating: cats.find(c => c.id === 'payment')?.value || 0,
      overallRating: this.overallRating,
      comment: this.comment() || undefined,
    };

    try {
      await this.http.post(
        `${environment.apiUrl}/patient-ratings`,
        submission
      ).toPromise();

      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      this.showToast('Calificacion enviada', 'success');
      this.modalCtrl.dismiss({ submitted: true });
    } catch (error) {
      console.error('Error submitting rating:', error);
      this.showToast('Error al enviar calificacion', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  skip() {
    this.modalCtrl.dismiss({ submitted: false, skipped: true });
  }

  dismiss() {
    this.modalCtrl.dismiss({ submitted: false });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'top',
      color,
    });
    await toast.present();
  }
}
