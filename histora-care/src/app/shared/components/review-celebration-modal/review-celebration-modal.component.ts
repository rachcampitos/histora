import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { CelebrationService } from '../../../core/services/celebration.service';

@Component({
  selector: 'app-review-celebration-modal',
  templateUrl: './review-celebration-modal.component.html',
  styleUrls: ['./review-celebration-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ReviewCelebrationModalComponent implements OnInit, OnDestroy {
  @Input() rating = 5;
  @Input() patientName = '';
  @Input() serviceName = '';
  @Input() comment = '';

  title = '';
  subtitle = '';
  ctaText = '';
  stars: number[] = [];

  private readonly fiveStarTitles = [
    'Felicidades por tu excelente servicio!',
    'Tu cuidado marco la diferencia!',
    'Tu vocacion brilla con 5 estrellas!',
  ];

  constructor(
    private modalCtrl: ModalController,
    private celebrationService: CelebrationService,
  ) {}

  ngOnInit() {
    this.stars = Array(this.rating).fill(0);
    this.setupContent();

    if (this.rating >= 5) {
      this.celebrationService.startContinuousConfetti();
    } else if (this.rating === 4) {
      this.celebrationService.triggerConfetti();
    }
  }

  ngOnDestroy() {
    this.celebrationService.stopContinuousConfetti();
  }

  private setupContent() {
    if (this.rating >= 5) {
      this.title = this.fiveStarTitles[Math.floor(Math.random() * this.fiveStarTitles.length)];
      this.subtitle = this.patientName
        ? `${this.patientName} te califico con 5 estrellas. Tu profesionalismo y dedicacion no pasaron desapercibidos.`
        : 'Un paciente te califico con 5 estrellas. Tu profesionalismo y dedicacion no pasaron desapercibidos.';
      this.ctaText = 'Seguir haciendo la diferencia';
    } else if (this.rating === 4) {
      this.title = 'Tu esfuerzo fue reconocido!';
      this.subtitle = this.patientName
        ? `${this.patientName} te califico con 4 estrellas. Tu compromiso con el cuidado de calidad es evidente.`
        : 'Un paciente te califico con 4 estrellas. Tu compromiso con el cuidado de calidad es evidente.';
      this.ctaText = 'Seguir creciendo';
    } else {
      this.title = 'Gracias por tu servicio';
      this.subtitle = 'Cada experiencia es una oportunidad para reflexionar y crecer. Si necesitas apoyo, nuestro equipo esta aqui para ti.';
      this.ctaText = 'Seguir adelante';
    }
  }

  dismiss() {
    this.celebrationService.stopContinuousConfetti();
    this.modalCtrl.dismiss();
  }
}
