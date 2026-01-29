import { Component, Input, Output, EventEmitter, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { IonTextareaCustomEvent, TextareaInputEventDetail } from '@ionic/core';

export interface ReviewSubmitData {
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-review-modal',
  templateUrl: './review-modal.component.html',
  styleUrls: ['./review-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewModalComponent {
  @Input() nurseId!: string;
  @Input() serviceRequestId?: string;
  @Input() nurseName?: string;
  @Output() reviewSubmit = new EventEmitter<ReviewSubmitData>();

  rating = signal<number>(0);
  comment = signal<string>('');
  hoverRating = signal<number>(0);
  isSubmitting = signal<boolean>(false);

  stars = [1, 2, 3, 4, 5];

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  onStarClick(star: number): void {
    this.rating.set(star);
  }

  onStarHover(star: number): void {
    this.hoverRating.set(star);
  }

  onStarLeave(): void {
    this.hoverRating.set(0);
  }

  getStarIcon(star: number): string {
    const currentRating = this.hoverRating() || this.rating();
    return star <= currentRating ? 'star' : 'star-outline';
  }

  isStarFilled(star: number): boolean {
    const currentRating = this.hoverRating() || this.rating();
    return star <= currentRating;
  }

  updateComment(event: IonTextareaCustomEvent<TextareaInputEventDetail>): void {
    this.comment.set(event.detail.value ?? '');
  }

  canSubmit(): boolean {
    return this.rating() > 0 && !this.isSubmitting();
  }

  async cancel(): Promise<void> {
    await this.modalCtrl.dismiss(null, 'cancel');
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor selecciona una calificacion',
        duration: 2000,
        position: 'bottom',
        color: 'warning',
        icon: 'alert-circle-outline'
      });
      await toast.present();
      return;
    }

    this.isSubmitting.set(true);

    const reviewData: ReviewSubmitData = {
      rating: this.rating(),
      comment: this.comment().trim()
    };

    // Emit for parent component if needed
    this.reviewSubmit.emit(reviewData);

    // Close modal with data
    await this.modalCtrl.dismiss(reviewData, 'submit');
  }

  getRatingLabel(): string {
    const labels: Record<number, string> = {
      1: 'Muy malo',
      2: 'Malo',
      3: 'Regular',
      4: 'Bueno',
      5: 'Excelente'
    };
    return labels[this.rating()] || '';
  }
}
