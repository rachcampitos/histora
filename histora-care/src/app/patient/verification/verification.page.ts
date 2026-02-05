import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import {
  PatientVerificationService,
  VerificationStatus
} from '../../core/services/patient-verification.service';

export type VerificationStep = 'intro' | 'email' | 'dni' | 'selfie' | 'emergency-contacts' | 'complete';

interface StepInfo {
  id: VerificationStep;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
}

@Component({
  selector: 'app-verification',
  templateUrl: './verification.page.html',
  standalone: false,
  styleUrls: ['./verification.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationPage implements OnInit {
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private verificationService = inject(PatientVerificationService);

  // State signals
  currentStep = signal<VerificationStep>('intro');
  isLoading = signal(true);
  status = signal<VerificationStatus | null>(null);
  error = signal<string | null>(null);

  // Computed
  completionPercentage = computed(() => {
    const s = this.status();
    if (!s) return 0;
    return this.verificationService.getCompletionPercentage(s);
  });

  steps = computed<StepInfo[]>(() => {
    const s = this.status();
    return [
      {
        id: 'email' as VerificationStep,
        title: 'Correo',
        description: 'Verifica tu correo electronico',
        icon: 'mail-outline',
        completed: s?.phoneVerified ?? false, // Uses phoneVerified flag (backend marks it when email is verified)
      },
      {
        id: 'dni' as VerificationStep,
        title: 'DNI',
        description: 'Sube fotos de tu documento',
        icon: 'card-outline',
        completed: s?.dniVerified ?? false,
      },
      {
        id: 'selfie' as VerificationStep,
        title: 'Selfie',
        description: 'Tomate una foto con tu DNI',
        icon: 'camera-outline',
        completed: s?.selfieVerified ?? false,
      },
      {
        id: 'emergency-contacts' as VerificationStep,
        title: 'Contactos',
        description: 'Agrega contactos de emergencia',
        icon: 'people-outline',
        completed: (s?.emergencyContactsCount ?? 0) >= 2,
      },
    ];
  });

  isAllComplete = computed(() => {
    return this.completionPercentage() === 100;
  });

  ngOnInit() {
    this.loadVerificationStatus();
  }

  async loadVerificationStatus() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // First, ensure verification is initialized
      await this.verificationService.startVerification().toPromise();

      // Then get the status
      const status = await this.verificationService.getStatus().toPromise();
      this.status.set(status || null);

      // Determine current step based on status
      if (status) {
        this.determineCurrentStep(status);
      }
    } catch (err: any) {
      console.error('Error loading verification status:', err);
      this.error.set('Error al cargar el estado de verificacion');
    } finally {
      this.isLoading.set(false);
    }
  }

  private determineCurrentStep(status: VerificationStatus) {
    // If all complete, go to complete
    if (this.verificationService.getCompletionPercentage(status) === 100) {
      this.currentStep.set('complete');
      return;
    }

    // If nothing started, show intro
    if (!status.phoneVerified && !status.dniVerified && !status.selfieVerified && status.emergencyContactsCount === 0) {
      this.currentStep.set('intro');
      return;
    }

    // Find next incomplete step
    const nextStep = this.verificationService.getNextRequiredStep(status);
    if (nextStep) {
      this.currentStep.set(nextStep as VerificationStep);
    }
  }

  startVerification() {
    this.currentStep.set('email');
  }

  goToStep(step: VerificationStep) {
    this.currentStep.set(step);
  }

  onStepComplete(step: VerificationStep) {
    // Refresh status after each step
    this.refreshStatus();
  }

  async refreshStatus() {
    try {
      const status = await this.verificationService.getStatus().toPromise();
      this.status.set(status || null);

      if (status) {
        // Check if all complete
        if (this.verificationService.getCompletionPercentage(status) === 100) {
          this.currentStep.set('complete');
          return;
        }

        // Move to next step
        const nextStep = this.verificationService.getNextRequiredStep(status);
        if (nextStep) {
          this.currentStep.set(nextStep as VerificationStep);
        }
      }
    } catch (err) {
      console.error('Error refreshing status:', err);
    }
  }

  onVerificationComplete() {
    this.router.navigate(['/patient/tabs/home']);
  }

  goBack() {
    const step = this.currentStep();

    if (step === 'intro') {
      this.router.navigate(['/patient/tabs/home']);
      return;
    }

    if (step === 'complete') {
      this.router.navigate(['/patient/tabs/home']);
      return;
    }

    // Go back to intro or previous step
    const stepOrder: VerificationStep[] = ['intro', 'email', 'dni', 'selfie', 'emergency-contacts'];
    const currentIndex = stepOrder.indexOf(step);

    if (currentIndex > 0) {
      this.currentStep.set(stepOrder[currentIndex - 1]);
    } else {
      this.currentStep.set('intro');
    }
  }

  skipForNow() {
    this.router.navigate(['/patient/tabs/home']);
  }

  async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
