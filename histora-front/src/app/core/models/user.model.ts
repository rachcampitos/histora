export enum UserRole {
  PLATFORM_ADMIN = 'platform_admin',
  CLINIC_OWNER = 'clinic_owner',
  CLINIC_DOCTOR = 'clinic_doctor',
  CLINIC_STAFF = 'clinic_staff',
  PATIENT = 'patient',
}

export interface User {
  id?: string;
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  clinicId?: string;
  doctorProfileId?: string;
  patientProfileId?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  clinicName: string;
  clinicAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}
