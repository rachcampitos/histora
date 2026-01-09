import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to initialize
  while (authService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

export const noAuthGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to initialize
  while (authService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redirect based on role
  if (authService.isNurse()) {
    router.navigate(['/nurse/dashboard']);
  } else {
    router.navigate(['/patient/map']);
  }
  return false;
};

export const nurseGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  while (authService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (authService.isNurse()) {
    return true;
  }

  router.navigate(['/patient/map']);
  return false;
};

export const patientGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  while (authService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (authService.isPatient()) {
    return true;
  }

  router.navigate(['/nurse/dashboard']);
  return false;
};
