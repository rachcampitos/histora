import { Component, HostListener, OnInit, ViewChild, ElementRef } from '@angular/core';
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
  ctaText?: string; // Custom CTA text for last slide
}

/**
 * POST-AUTH ONBOARDING TUTORIAL
 *
 * This component is shown AFTER successful registration.
 * Implements DIFFERENTIATED onboarding based on user role:
 * - Nurses: Focus on income, flexibility, CEP verification
 * - Patients: Focus on trust, convenience, easy booking
 *
 * Based on UX best practices for two-sided healthcare marketplaces
 */
@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.page.html',
  styleUrls: ['./tutorial.page.scss'],
  standalone: false,
})
export class TutorialPage implements OnInit {
  @ViewChild('introVideo') introVideoRef!: ElementRef<HTMLVideoElement>;

  currentSlide = 0;
  touchStartX = 0;
  touchEndX = 0;
  userRole: 'nurse' | 'patient' | 'unknown' = 'unknown';

  // Intro video states
  showIntroVideo = true;
  videoEnded = false;
  showLogoAfterVideo = false;

  /**
   * NURSE SLIDES (4 slides)
   * Focus: Income opportunity, flexibility, CEP verification, support
   */
  private nurseSlides: OnboardingSlide[] = [
    {
      id: 1,
      icon: 'time',
      gradient: 'gradient-primary',
      title: 'Trabaja en tus propios horarios',
      description:
        'Bienvenida a NurseLite. Gana dinero brindando cuidado de enfermeria a domicilio con total flexibilidad.',
      features: [
        { icon: 'calendar', text: 'Horarios flexibles' },
        { icon: 'wallet', text: 'Ingresos adicionales' },
        { icon: 'home', text: 'Servicios a domicilio' },
      ],
    },
    {
      id: 2,
      icon: 'ribbon',
      gradient: 'gradient-success',
      title: 'Tu profesionalismo respaldado',
      description:
        'Tu verificacion CEP garantiza confianza y seguridad. Los pacientes prefieren enfermeras verificadas.',
      features: [
        { icon: 'shield-checkmark', text: 'CEP verificado oficialmente' },
        { icon: 'star', text: 'Perfil profesional destacado' },
        { icon: 'people', text: 'Red de pacientes confiables' },
      ],
    },
    {
      id: 3,
      icon: 'list',
      gradient: 'gradient-info',
      title: 'Comienza en 3 pasos',
      description:
        'Empieza a recibir solicitudes de servicios de manera rapida y sencilla.',
      features: [
        { icon: 'checkmark-circle', text: '1. Verifica tu CEP' },
        { icon: 'person', text: '2. Completa tu perfil' },
        { icon: 'cash', text: '3. Acepta solicitudes y gana' },
      ],
    },
    {
      id: 4,
      icon: 'shield',
      gradient: 'gradient-warning',
      title: 'Trabaja con tranquilidad',
      description:
        'Te acompanamos en cada servicio con herramientas de seguridad y soporte.',
      features: [
        { icon: 'card', text: 'Pagos seguros y puntuales' },
        { icon: 'headset', text: 'Soporte tecnico 24/7' },
        { icon: 'warning', text: 'Boton de panico de emergencia' },
      ],
      ctaText: 'Comenzar Verificacion',
    },
  ];

  /**
   * PATIENT SLIDES (4 slides)
   * Focus: Trust, verified professionals, easy booking, safety
   */
  private patientSlides: OnboardingSlide[] = [
    {
      id: 1,
      icon: 'medkit',
      gradient: 'gradient-primary',
      title: 'Enfermeria profesional en tu hogar',
      description:
        'Bienvenido a NurseLite. Encuentra enfermeras verificadas cuando las necesites, en la comodidad de tu hogar.',
      features: [
        { icon: 'home', text: 'Atencion a domicilio' },
        { icon: 'time', text: 'Disponibilidad inmediata' },
        { icon: 'shield-checkmark', text: 'Profesionales verificados' },
      ],
    },
    {
      id: 2,
      icon: 'shield-checkmark',
      gradient: 'gradient-success',
      title: 'Solo profesionales verificados',
      description:
        'Todas nuestras enfermeras cuentan con CEP vigente y HABIL, verificado directamente con el Colegio de Enfermeros.',
      features: [
        { icon: 'ribbon', text: 'CEP validado oficialmente' },
        { icon: 'finger-print', text: 'Identidad confirmada' },
        { icon: 'star', text: 'Calificaciones verificadas' },
      ],
    },
    {
      id: 3,
      icon: 'calendar',
      gradient: 'gradient-info',
      title: 'Agenda en minutos',
      description:
        'Solicitar un servicio de enfermeria nunca fue tan facil y rapido.',
      features: [
        { icon: 'create', text: '1. Describe lo que necesitas' },
        { icon: 'people', text: '2. Elige tu enfermera' },
        { icon: 'checkmark-circle', text: '3. Confirma fecha y hora' },
      ],
    },
    {
      id: 4,
      icon: 'heart',
      gradient: 'gradient-warning',
      title: 'Estamos contigo',
      description:
        'Tu tranquilidad es nuestra prioridad. Monitoreo en tiempo real y soporte cuando lo necesites.',
      features: [
        { icon: 'location', text: 'Seguimiento GPS en vivo' },
        { icon: 'card', text: 'Pagos 100% seguros' },
        { icon: 'headset', text: 'Atencion al cliente 24/7' },
      ],
      ctaText: 'Buscar Enfermera',
    },
  ];

  // Active slides based on user role
  slides: OnboardingSlide[] = [];

  constructor(
    private router: Router,
    private onboardingService: OnboardingService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeSlides();
  }

  // ============================================================
  // INTRO VIDEO METHODS
  // ============================================================

  /**
   * Called when the intro video finishes playing
   * Triggers the shrink animation sequence
   */
  onVideoEnded(): void {
    this.videoEnded = true;

    // After shrink animation (800ms), show the logo
    setTimeout(() => {
      this.showLogoAfterVideo = true;
    }, 800);
  }

  /**
   * Skip the intro video and go directly to the shrink animation
   */
  skipIntro(): void {
    if (this.videoEnded) return; // Already ended, ignore click

    // Pause the video
    if (this.introVideoRef?.nativeElement) {
      this.introVideoRef.nativeElement.pause();
    }

    // Trigger the end animation
    this.onVideoEnded();
  }

  /**
   * Continue to the tutorial slides after the intro
   */
  startTutorial(event: Event): void {
    event.stopPropagation(); // Prevent skipIntro from being called
    this.showIntroVideo = false;
  }

  /**
   * Initialize slides based on user role
   */
  private initializeSlides(): void {
    const user = this.authService.user();

    if (user?.role === 'nurse') {
      this.userRole = 'nurse';
      this.slides = this.nurseSlides;
    } else if (user?.role === 'patient') {
      this.userRole = 'patient';
      this.slides = this.patientSlides;
    } else {
      // Fallback to patient slides for unknown roles
      this.userRole = 'unknown';
      this.slides = this.patientSlides;
    }
  }

  /**
   * Get the CTA text for the last slide based on user role
   */
  get lastSlideCta(): string {
    const lastSlide = this.slides[this.slides.length - 1];
    return lastSlide?.ctaText || 'Comenzar';
  }

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
