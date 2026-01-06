import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { LocalStorageService } from '@shared/services';
import { Role } from '@core/models/role';

/**
 * Guard that redirects users to their appropriate dashboard based on role.
 * - PlatformAdmin -> /admin/dashboard
 * - Admin/Doctor -> /doctor/dashboard
 * - Patient -> /patient/dashboard
 */
export const roleRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  const store = inject(LocalStorageService);

  const currentUser = store.get('currentUser');

  if (!currentUser) {
    router.navigate(['/authentication/signin']);
    return false;
  }

  const userRole = currentUser.roles?.[0]?.name;

  if (!userRole) {
    router.navigate(['/authentication/signin']);
    return false;
  }

  // Redirect based on role
  if (userRole === Role.PlatformAdmin || userRole === Role.PlatformAdminUI) {
    // Platform admin -> admin dashboard
    router.navigate(['/admin/dashboard']);
  } else if (userRole === Role.Patient || userRole === Role.PatientRole) {
    router.navigate(['/patient/dashboard']);
  } else {
    // ClinicOwner, ClinicDoctor, ClinicStaff, Admin, Doctor -> doctor dashboard
    router.navigate(['/doctor/dashboard']);
  }

  // Return false since we're redirecting (don't activate the empty route)
  return false;
};
