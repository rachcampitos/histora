import { Component, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingService } from '../../core/services/onboarding.service';
import { AuthService } from '../../core/services/auth.service';

interface OnboardingSlide {
  id: number;
  icon: string;
  gradient: string;
  title: string;
  description: string;
  features?: { icon: string; text: string }[];
}

/**
 * POST-AUTH ONBOARDING TUTORIAL
 *
 * This component is shown AFTER successful registration.
 * Purpose: Security education + feature discovery
 *
 * Based on "Commitment & Consistency" (Cialdini):
 * Users are more receptive to learning after making a commitment (registration)
 */
@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.page.html',
  styleUrls: ['./tutorial.page.scss'],
  standalone: false,
})
export class TutorialPage {
  currentSlide = 0;
  touchStartX = 0;
  touchEndX = 0;

  /**
   * 5 SLIDES - POST-AUTH SECURITY EDUCATION
   *
   * Slide 1: Welcome + Platform Overview
   * Slide 2: Security Overview
   * Slide 3: Verification Process (CEP, RENIEC, Biometria)
   * Slide 4: Continuous Protection
   * Slide 5: Call to Action
   */
  slides: OnboardingSlide[] = [
    {
      id: 1,
      icon: 'flash',
      gradient: 'gradient-primary',
      title: 'Bienvenido a NurseLite',
      description:
        'Tu cuenta ha sido creada exitosamente. Conoce como protegemos tu seguridad y la de tu familia.',
    },
    {
      id: 2,
      icon: 'shield-checkmark',
      gradient: 'gradient-success',
      title: 'Tu seguridad es nuestra prioridad',
      description:
        'Implementamos multiples capas de verificacion para garantizar que recibas atencion de profesionales confiables.',
      features: [
        { icon: 'ribbon', text: 'Identidad verificada' },
        { icon: 'checkmark-circle', text: 'Certificaciones validadas' },
        { icon: 'location', text: 'Seguimiento GPS' },
      ],
    },
    {
      id: 3,
      icon: 'shield',
      gradient: 'gradient-info',
      title: 'Enfermeras 100% verificadas',
      description:
        'Cada profesional pasa por un riguroso proceso de validacion antes de poder ofrecer servicios.',
      features: [
        { icon: 'ribbon', text: 'CEP validado con el colegio' },
        { icon: 'finger-print', text: 'DNI verificado con RENIEC' },
        { icon: 'scan', text: 'Comparacion biometrica IA' },
      ],
    },
    {
      id: 4,
      icon: 'lock-closed',
      gradient: 'gradient-warning',
      title: 'Proteccion durante el servicio',
      description:
        'Monitoreo en tiempo real, calificaciones verificadas y boton de panico para tu tranquilidad.',
      features: [
        { icon: 'star', text: 'Calificaciones reales' },
        { icon: 'time', text: 'Monitoreo en vivo' },
        { icon: 'warning', text: 'Boton de panico 24/7' },
      ],
    },
    {
      id: 5,
      icon: 'bulb',
      gradient: 'gradient-danger',
      title: 'Listo para comenzar',
      description:
        'Ya formas parte de la comunidad NurseLite. Explora enfermeras verificadas y agenda tu primer servicio.',
    },
  ];

  constructor(
    private router: Router,
    private onboardingService: OnboardingService,
    private authService: AuthService
  ) {}

  // Touch handling for swipe gestures
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].clientX;
    this.handleSwipe();
  }

  private handleSwipe(): void {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && this.currentSlide < this.slides.length - 1) {
        // Swipe left - next slide
        this.next();
      } else if (diff < 0 && this.currentSlide > 0) {
        // Swipe right - previous slide
        this.previous();
      }
    }
  }

  next(): void {
    if (this.currentSlide < this.slides.length - 1) {
      this.currentSlide++;
    }
  }

  previous(): void {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    }
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  /**
   * Skip onboarding and go to dashboard
   * Marks as completed with skipped=true for analytics
   */
  async skip(): Promise<void> {
    await this.onboardingService.completeOnboarding(true);
    this.navigateToDashboard();
  }

  /**
   * Complete onboarding and navigate to dashboard
   * Called from the last slide CTA button
   */
  async completeAndStart(): Promise<void> {
    await this.onboardingService.completeOnboarding(false);
    this.navigateToDashboard();
  }

  /**
   * Navigate to the appropriate dashboard based on user role
   */
  private navigateToDashboard(): void {
    const user = this.authService.user();

    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Navigate based on role
    switch (user.role) {
      case 'nurse':
        this.router.navigate(['/nurse/dashboard']);
        break;
      case 'patient':
        this.router.navigate(['/patient/tabs/home']);
        break;
      case 'platform_admin':
        this.router.navigate(['/admin/verifications']);
        break;
      default:
        this.router.navigate(['/auth/login']);
    }
  }

  get isLastSlide(): boolean {
    return this.currentSlide === this.slides.length - 1;
  }

  get totalSlides(): number {
    return this.slides.length;
  }
}
