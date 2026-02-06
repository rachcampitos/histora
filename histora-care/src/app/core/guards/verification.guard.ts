import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PatientVerificationService } from '../services/patient-verification.service';
import { VerificationRequiredModalComponent } from '../../shared/components/verification-required-modal/verification-required-modal.component';

/**
 * Guard that checks if the patient has completed identity verification.
 * If not verified, shows a modal prompting the user to verify.
 * Used on routes that require verified identity (request, checkout).
 */
export const patientVerificationGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const verificationService = inject(PatientVerificationService);
  const modalCtrl = inject(ModalController);
  const router = inject(Router);

  // Wait for auth to initialize
  while (authService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Only apply to patients
  if (!authService.isPatient()) {
    return true;
  }

  try {
    // Check if patient can request services
    const response = await firstValueFrom(verificationService.canRequestService());

    if (response.allowed) {
      return true;
    }

    // Show verification required modal
    const modal = await modalCtrl.create({
      component: VerificationRequiredModalComponent,
      breakpoints: [0, 0.85],
      initialBreakpoint: 0.85,
      cssClass: 'verification-modal'
    });

    await modal.present();

    const { role } = await modal.onWillDismiss();

    if (role === 'verify') {
      // User chose to verify - navigation is handled by the modal
      return false;
    }

    // User dismissed - don't allow navigation
    return false;
  } catch (error) {
    console.error('Error checking verification status:', error);
    // On error, allow access but log the issue
    return true;
  }
};

/**
 * Soft verification check - doesn't block but can be used
 * to show verification prompts or badges.
 */
export const checkVerificationStatus = async (verificationService: PatientVerificationService) => {
  try {
    const status = await firstValueFrom(verificationService.getStatus());
    return status;
  } catch {
    return null;
  }
};
