export enum Role {
  // Backend roles
  PlatformAdmin = 'platform_admin',
  ClinicOwner = 'clinic_owner',
  ClinicDoctor = 'clinic_doctor',
  ClinicStaff = 'clinic_staff',
  PatientRole = 'patient',
  // UI roles (mapped from backend roles by LoginService)
  Admin = 'ADMIN',
  Doctor = 'DOCTOR',
  Patient = 'PATIENT',
  PlatformAdminUI = 'PLATFORM_ADMIN',
}
