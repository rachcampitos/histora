import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as UserRole[];

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (authService.hasRole(...requiredRoles)) {
    return true;
  }

  // Redirect to appropriate page based on role
  const role = authService.userRole();
  if (role === UserRole.PATIENT) {
    router.navigate(['/patient']);
  } else {
    router.navigate(['/dashboard']);
  }

  return false;
};

// Specific guards for common use cases
export const clinicStaffGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = [UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF];

  if (authService.hasRole(...allowedRoles)) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

export const doctorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isDoctor()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

export const patientGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isPatient()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};
