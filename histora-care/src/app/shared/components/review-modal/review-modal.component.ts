import { Component, Input, Output, EventEmitter, signal, computed, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { IonTextareaCustomEvent, TextareaInputEventDetail } from '@ionic/core';
import { HapticsService } from '../../../core/services';

export interface ReviewSubmitData {
  rating: number;
  comment: string;
  allowPublicUse: boolean;
}

/**
 * Review Modal Component - Compact Bottom Sheet Design
 *
 * Features:
 * - Compact layout (~280px height) - no scroll needed
 * - 32px stars with 8px gap
 * - 200 char limit on comments
 * - "Omitir por ahora" secondary action
 * - Dark mode support
 */
@Component({
  selector: 'app-review-modal',
  templateUrl: './review-modal.component.html',
  styleUrls: ['./review-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ReviewModalComponent {
  @Input() nurseId!: string;
  @Input() serviceRequestId?: string;
  @Input() nurseName?: string;
  @Output() reviewSubmit = new EventEmitter<ReviewSubmitData>();

  rating = signal<number>(0);
  comment = signal<string>('');
  isSubmitting = signal<boolean>(false);
  allowPublicUse = signal<boolean>(false);

  stars = [1, 2, 3, 4, 5];

  commentSuggestions = computed(() => {
    const r = this.rating();
    if (r <= 0) return [];
    if (r <= 2) return ['Llego tarde', 'Poca empatia', 'Mala comunicacion'];
    if (r === 3) return ['Puntualidad', 'Comunicacion', 'Profesionalismo'];
    return ['Muy puntual', 'Excelente trato', 'Muy profesional', 'La recomiendo'];
  });

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private haptics: HapticsService
  ) {}

  onStarClick(star: number): void {
    this.rating.set(star);
    this.haptics.selectionChanged();
  }

  togglePublicUse(): void {
    this.allowPublicUse.update(v => !v);
  }

  addSuggestion(text: string): void {
    const current = this.comment().trim();
    if (current) {
      this.comment.set(current + ', ' + text);
    } else {
      this.comment.set(text);
    }
    this.haptics.light();
  }

  getStarIcon(star: number): string {
    return star <= this.rating() ? 'star' : 'star-outline';
  }

  isStarFilled(star: number): boolean {
    return star <= this.rating();
  }

  updateComment(event: IonTextareaCustomEvent<TextareaInputEventDetail>): void {
    this.comment.set(event.detail.value ?? '');
  }

  canSubmit(): boolean {
    return this.rating() > 0 && !this.isSubmitting();
  }

  /**
   * Skip review - dismiss without submitting
   */
  async skip(): Promise<void> {
    await this.modalCtrl.dismiss(null, 'skip');
  }

  /**
   * Cancel review (alias for skip, for backwards compatibility)
   */
  async cancel(): Promise<void> {
    await this.skip();
  }

  /**
   * Submit review
   */
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
      comment: this.comment().trim(),
      allowPublicUse: this.allowPublicUse()
    };

    // Haptic feedback on successful submit
    this.haptics.success();

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
