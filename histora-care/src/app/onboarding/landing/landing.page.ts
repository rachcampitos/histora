import { Component, OnInit, signal } from '@angular/core';
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

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: false,
})
export class LandingPage implements OnInit {
  activeTab = signal<UserType>('patient');

  // Content for each tab
  readonly content: Record<UserType, TabContent> = {
    patient: {
      headline: 'Cuida a quien mas quieres,',
      headlineSecond: 'aunque no puedas estar ahi',
      subheadline: 'Enfermeras verificadas llegan a tu domicilio en menos de 2 horas',
      ctaText: 'Solicitar enfermera ahora',
      ctaIcon: 'search',
      features: [
        { icon: 'shield-checkmark', text: 'Verificadas CEP + RENIEC' },
        { icon: 'time', text: 'Disponibles en 2 horas' },
        { icon: 'card', text: 'Pago seguro en la app' },
      ],
    },
    nurse: {
      headline: 'Tu practica profesional,',
      headlineSecond: 'tus reglas',
      subheadline: 'Define tu tarifa, elige tus horarios y trabaja con libertad. Sin suscripciones.',
      ctaText: 'Registrarme como profesional',
      ctaIcon: 'person-add',
      features: [
        { icon: 'cash', text: 'Tu defines tu precio' },
        { icon: 'close-circle', text: 'Sin cuotas mensuales' },
        { icon: 'calendar', text: 'Horarios flexibles' },
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
      this.router.navigate(['/auth/register']);
    }
  }

  async navigateToLogin(): Promise<void> {
    await this.onboardingService.markLandingSeen();
    this.router.navigate(['/auth/login']);
  }
}
