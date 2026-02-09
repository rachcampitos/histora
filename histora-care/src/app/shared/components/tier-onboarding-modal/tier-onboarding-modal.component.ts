import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

interface TierSlide {
  title: string;
  description: string;
  icon: string;
  items?: { icon: string; color: string; label: string; detail: string }[];
  benefits?: { icon: string; text: string }[];
}

@Component({
  selector: 'app-tier-onboarding-modal',
  templateUrl: './tier-onboarding-modal.component.html',
  styleUrls: ['./tier-onboarding-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class TierOnboardingModalComponent {
  private modalCtrl = inject(ModalController);

  currentSlide = 0;

  slides: TierSlide[] = [
    {
      title: 'Sistema de Niveles',
      description: 'Destaca entre las enfermeras y recibe mas solicitudes de pacientes.',
      icon: 'shield-checkmark',
      items: [
        { icon: 'checkmark-circle', color: '#94a3b8', label: 'Certificada', detail: 'Nivel inicial' },
        { icon: 'star', color: '#2d5f8a', label: 'Destacada', detail: '10+ servicios' },
        { icon: 'ribbon', color: '#7B68EE', label: 'Experimentada', detail: '30+ servicios' },
        { icon: 'trophy', color: '#FFD700', label: 'Elite', detail: '50+ servicios' },
      ],
    },
    {
      title: 'Como subir de nivel',
      description: 'Tu nivel sube automaticamente al cumplir los requisitos.',
      icon: 'trending-up',
      items: [
        { icon: 'medical-outline', color: '#4a9d9a', label: 'Completa servicios', detail: 'Mas servicios, mayor nivel' },
        { icon: 'star-outline', color: '#f59e0b', label: 'Manten un buen rating', detail: '4.0+ para subir' },
        { icon: 'chatbubble-outline', color: '#7B68EE', label: 'Recibe reseñas', detail: '10+ para Experimentada' },
      ],
    },
    {
      title: 'Beneficios de subir',
      description: 'Un nivel mas alto te da mayor visibilidad ante los pacientes.',
      icon: 'eye',
      benefits: [
        { icon: 'search-outline', text: 'Apareces primero en busquedas' },
        { icon: 'shield-checkmark-outline', text: 'Badge exclusivo en tu perfil' },
        { icon: 'people-outline', text: 'Mayor confianza de los pacientes' },
        { icon: 'trending-up-outline', text: 'Mas solicitudes de servicio' },
      ],
    },
  ];

  get isLastSlide(): boolean {
    return this.currentSlide === this.slides.length - 1;
  }

  get progress(): number {
    return ((this.currentSlide + 1) / this.slides.length) * 100;
  }

  nextSlide() {
    if (this.isLastSlide) {
      this.dismiss(true);
    } else {
      this.currentSlide++;
    }
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    }
  }

  skip() {
    this.dismiss(true);
  }

  private dismiss(completed: boolean) {
    this.modalCtrl.dismiss({ completed });
  }
}
