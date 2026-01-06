import { Role } from './role';

export interface User {
  [prop: string]: unknown;

  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  role?: Role | string;
  clinicId?: string;
  avatar?: string;
  roles?: UserRole[];
  permissions?: string[];
  isActive?: boolean;
}

export interface UserRole {
  name: string;
  priority: number;
  permissions?: string[];
}

export interface Token {
  [prop: string]: unknown;

  access_token: string;
  token_type?: string;
  expires_in?: number;
  exp?: number;
  refresh_token?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  clinicName: string;
  clinicPhone?: string;
}

export interface RegisterPatientRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}
