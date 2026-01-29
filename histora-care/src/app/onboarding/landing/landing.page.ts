import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { OnboardingService } from '../../core/services/onboarding.service';

type UserType = 'patient' | 'nurse';

interface TabContent {
  headline: string;
  headlineSecond: string;
  subheadline: string;
  ctaText: string;
  ctaIcon: string;
  features: { icon: string; text: string }[];
}

// Intro animation configuration (UX recommended timing)
const INTRO_CONFIG = {
  logoDisplayDuration: 1000,   // Logo fade-in (400ms) + centered visible (600ms)
  contentFadeInDelay: 500,     // Content starts fading in
};

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage implements OnInit {
  activeTab = signal<UserType>('patient');

  // Intro animation state
  showIntro = signal(true);
  introExiting = signal(false);

  // Content for each tab - Optimized copy based on marketing audit
  readonly content: Record<UserType, TabContent> = {
    patient: {
      headline: 'Atencion profesional',
      headlineSecond: 'en la puerta de tu casa',
      subheadline: 'Enfermeras colegiadas y verificadas. Sin filas, sin esperas.',
      ctaText: 'Encontrar enfermera cerca',
      ctaIcon: 'search',
      features: [
        { icon: 'shield-checkmark', text: 'Colegiatura verificada en CEP' },
        { icon: 'flash', text: 'Atencion en menos de 2 horas' },
        { icon: 'wallet', text: 'Precios claros, sin sorpresas' },
      ],
    },
    nurse: {
      headline: 'Gana mas,',
      headlineSecond: 'trabaja cuando quieras',
      subheadline: 'Conecta con pacientes cerca de ti. Sin comisiones por servicio. Tu decides cuanto cobrar.',
      ctaText: 'Empezar a ganar hoy',
      ctaIcon: 'rocket',
      features: [
        { icon: 'cash', text: '100% de tus ganancias' },
        { icon: 'location', text: 'Pacientes en tu zona' },
        { icon: 'calendar', text: 'Tu eliges tus horarios' },
      ],
    },
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private onboardingService: OnboardingService
  ) {}

  ngOnInit(): void {
    // Check URL parameter for pre-selection
    this.route.queryParams.subscribe(params => {
      if (params['ref'] === 'enfermera' || params['ref'] === 'nurse') {
        this.activeTab.set('nurse');
      }
    });

    // Start intro animation sequence
    this.playIntroAnimation();
  }

  private async playIntroAnimation(): Promise<void> {
    // Wait for logo display duration
    await this.delay(INTRO_CONFIG.logoDisplayDuration);

    // Start exit animation (logo moves up, content fades in)
    this.introExiting.set(true);

    // Wait for animation to complete
    await this.delay(INTRO_CONFIG.contentFadeInDelay);

    // Intro complete
    this.showIntro.set(false);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setTab(tab: UserType): void {
    this.activeTab.set(tab);
  }

  get currentContent(): TabContent {
    return this.content[this.activeTab()];
  }

  async navigateToRegister(): Promise<void> {
    await this.onboardingService.markLandingSeen();

    if (this.activeTab() === 'nurse') {
      // Navigate to nurse registration
      this.router.navigate(['/auth/register'], { queryParams: { type: 'nurse' } });
    } else {
      // Navigate to patient registration
      this.router.navigate(['/auth/register'], { queryParams: { type: 'patient' } });
    }
  }

  async navigateToLogin(): Promise<void> {
    await this.onboardingService.markLandingSeen();
    this.router.navigate(['/auth/login']);
  }

  async navigateToBrowse(): Promise<void> {
    await this.onboardingService.markLandingSeen();
    this.router.navigate(['/browse']);
  }
}
