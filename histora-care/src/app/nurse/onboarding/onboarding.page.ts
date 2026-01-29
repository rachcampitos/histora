import { Component, OnInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { NurseOnboardingService } from '../../core/services/nurse-onboarding.service';
import { NurseApiService } from '../../core/services/nurse.service';
import { AuthService } from '../../core/services/auth.service';

type OnboardingStep = 'welcome' | 'payment-model' | 'payment-setup' | 'plans';

interface SlideConfig {
  id: OnboardingStep;
  mandatory: boolean;
}

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  standalone: false,
  styleUrls: ['./onboarding.page.scss'],
})
export class OnboardingPage implements OnInit {
  @ViewChild('swiperRef') swiperRef!: ElementRef;

  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private onboardingService = inject(NurseOnboardingService);
  private nurseApi = inject(NurseApiService);
  private authService = inject(AuthService);

  // Slides configuration
  readonly slides: SlideConfig[] = [
    { id: 'welcome', mandatory: true },
    { id: 'payment-model', mandatory: true },
    { id: 'payment-setup', mandatory: false },
    { id: 'plans', mandatory: false },
  ];

  // State
  currentIndex = signal(0);
  isLoading = signal(false);

  // Payment setup form
  yapeNumber = signal('');
  plinNumber = signal('');
  acceptsCash = signal(true);

  // User info
  userName = signal('');

  private swiper?: any;

  ngOnInit() {
    this.onboardingService.init();
    const user = this.authService.user();
    if (user) {
      this.userName.set(user.firstName || 'Enfermera');
    }
  }

  onSwiperInit(event: any) {
    this.swiper = event.detail[0];
  }

  onSlideChange() {
    if (this.swiper) {
      this.currentIndex.set(this.swiper.activeIndex);
      this.onboardingService.setCurrentStep(this.swiper.activeIndex);
    }
  }

  getCurrentSlide(): OnboardingStep {
    return this.slides[this.currentIndex()].id;
  }

  canSkip(): boolean {
    const currentSlide = this.slides[this.currentIndex()];
    return !currentSlide.mandatory;
  }

  nextSlide() {
    if (this.swiper && this.currentIndex() < this.slides.length - 1) {
      this.swiper.slideNext();
    }
  }

  prevSlide() {
    if (this.swiper && this.currentIndex() > 0) {
      this.swiper.slidePrev();
    }
  }

  // Payment setup handlers
  onYapeNumberChange(event: CustomEvent) {
    const value = event.detail.value || '';
    const cleaned = value.replace(/\D/g, '').slice(0, 9);
    this.yapeNumber.set(cleaned);
  }

  onPlinNumberChange(event: CustomEvent) {
    const value = event.detail.value || '';
    const cleaned = value.replace(/\D/g, '').slice(0, 9);
    this.plinNumber.set(cleaned);
  }

  onAcceptsCashChange(event: CustomEvent) {
    this.acceptsCash.set(event.detail.checked);
  }

  hasAnyPaymentMethod(): boolean {
    return !!(this.yapeNumber() || this.plinNumber() || this.acceptsCash());
  }

  async savePaymentMethods() {
    if (!this.hasAnyPaymentMethod()) {
      this.showToast('Configura al menos un metodo de pago', 'warning');
      return;
    }

    this.isLoading.set(true);

    try {
      await this.nurseApi.updateMyProfile({
        yapeNumber: this.yapeNumber() || undefined,
        plinNumber: this.plinNumber() || undefined,
        acceptsCash: this.acceptsCash(),
      }).toPromise();

      await this.onboardingService.updateChecklistItem('paymentMethods', true);
      this.showToast('Metodos de pago guardados', 'success');
      this.nextSlide();
    } catch (error) {
      console.error('Error saving payment methods:', error);
      this.showToast('Error al guardar', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  skipPaymentSetup() {
    this.onboardingService.markSkippedSetup();
    this.nextSlide();
  }

  async completeOnboarding() {
    await this.onboardingService.completeOnboarding();
    this.router.navigate(['/nurse/dashboard'], { replaceUrl: true });
  }

  async skipToEnd() {
    await this.onboardingService.markSkippedSetup();
    await this.onboardingService.completeOnboarding();
    this.router.navigate(['/nurse/dashboard'], { replaceUrl: true });
  }

  goToSubscription() {
    this.onboardingService.completeOnboarding();
    this.router.navigate(['/nurse/subscription'], { replaceUrl: true });
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
