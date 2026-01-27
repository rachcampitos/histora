export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'nurse' | 'patient' | 'platform_admin';

// The user object returned by authentication endpoints
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  clinicId?: string;
  avatar?: string;
}

// Session information returned by auth endpoints
export interface SessionInfo {
  expiresAt: number;           // Timestamp when access token expires
  refreshExpiresAt: number;    // Timestamp when refresh token expires
  inactivityTimeout: number;   // Milliseconds of inactivity before logout
  warningBefore: number;       // Milliseconds before expiry to show warning
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
  session?: SessionInfo;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterNurseRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  cepNumber: string; // Colegio de Enfermeros del Peru
  specialties?: string[];
  termsAccepted: boolean;
  professionalDisclaimerAccepted: boolean;
}

export interface RegisterPatientRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  termsAccepted: boolean;
}
