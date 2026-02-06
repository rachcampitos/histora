import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PatientVerificationService } from '../services/patient-verification.service';
import { VerificationContextService } from '../services/verification-context.service';
import { VerificationRequiredModalComponent } from '../../shared/components/verification-required-modal/verification-required-modal.component';

/**
 * Guard that checks if the patient has completed identity verification.
 * If not verified, shows a modal prompting the user to verify.
 * Used on routes that require verified identity (request, checkout).
 */
export const patientVerificationGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const verificationService = inject(PatientVerificationService);
  const verificationContext = inject(VerificationContextService);
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

    // Save context for returning after verification
    const nurseId = route.paramMap.get('nurseId') || route.paramMap.get('id');
    verificationContext.saveContext({
      returnUrl: state.url,
      nurseId: nurseId || undefined,
    });

    // Show verification required modal
    const modal = await modalCtrl.create({
      component: VerificationRequiredModalComponent,
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      cssClass: 'verification-modal',
      handle: false
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
