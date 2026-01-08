import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RegisterPatientRequest,
  RefreshTokenRequest,
} from '@core/models/interface';
import { LocalStorageService } from '@shared/services';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private store: LocalStorageService
  ) {}

  login(email: string, password: string, rememberMe = false): Observable<AuthResponse | { status: number; error?: string }> {
    const loginData = { email, password, rememberMe };

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginData).pipe(
      map((response) => {
        // Transform response to include name property for compatibility
        const user = response.user;
        return {
          ...response,
          user: {
            ...user,
            name: `${user.firstName} ${user.lastName}`,
            roles: [
              {
                name: this.mapRoleToClinica(user.role as string),
                priority: this.getRolePriority(user.role as string),
              },
            ],
            permissions: this.getPermissionsForRole(user.role as string),
            avatar: user.avatar || this.getDefaultAvatar(user.role as string),
          },
          token: response.access_token,
          status: 200,
        };
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return of({
          status: error.status || 401,
          error: error.error?.message || 'Invalid credentials',
        });
      })
    );
  }

  register(registerData: RegisterRequest): Observable<AuthResponse | { status: number; error?: string }> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, registerData).pipe(
      map((response) => {
        const user = response.user;
        return {
          ...response,
          user: {
            ...user,
            name: `${user.firstName} ${user.lastName}`,
            roles: [
              {
                name: this.mapRoleToClinica(user.role as string),
                priority: this.getRolePriority(user.role as string),
              },
            ],
            permissions: this.getPermissionsForRole(user.role as string),
            avatar: user.avatar || this.getDefaultAvatar(user.role as string),
          },
          token: response.access_token,
          status: 201,
        };
      }),
      catchError((error) => {
        console.error('Register error:', error);
        return of({
          status: error.status || 400,
          error: error.error?.message || 'Registration failed',
        });
      })
    );
  }

  registerPatient(registerData: RegisterPatientRequest): Observable<AuthResponse | { status: number; error?: string }> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register/patient`, registerData).pipe(
      map((response) => {
        const user = response.user;
        return {
          ...response,
          user: {
            ...user,
            name: `${user.firstName} ${user.lastName}`,
            roles: [
              {
                name: 'PATIENT',
                priority: 3,
              },
            ],
            permissions: ['canRead'],
            avatar: user.avatar || 'patient.jpg',
          },
          token: response.access_token,
          status: 201,
        };
      }),
      catchError((error) => {
        console.error('Register patient error:', error);
        return of({
          status: error.status || 400,
          error: error.error?.message || 'Registration failed',
        });
      })
    );
  }

  refresh(refreshToken: string): Observable<AuthResponse | { status: number; body?: unknown }> {
    const refreshData: RefreshTokenRequest = { refresh_token: refreshToken };

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, refreshData).pipe(
      map((response) => ({
        ...response,
        status: 200,
        body: response.access_token,
      })),
      catchError((error) => {
        console.error('Refresh token error:', error);
        return of({ status: 401, body: {} });
      })
    );
  }

  logout(): Observable<{ success: boolean }> {
    this.store.clear();
    return of({ success: true });
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`);
  }

  forgotPassword(email: string): Observable<{ message: string } | { status: number; error?: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email }).pipe(
      map((response) => ({
        ...response,
        status: 200,
      })),
      catchError((error) => {
        console.error('Forgot password error:', error);
        return of({
          status: error.status || 400,
          error: error.error?.message || 'Error al procesar la solicitud',
        });
      })
    );
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string } | { status: number; error?: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, { token, newPassword }).pipe(
      map((response) => ({
        ...response,
        status: 200,
      })),
      catchError((error) => {
        console.error('Reset password error:', error);
        return of({
          status: error.status || 400,
          error: error.error?.message || 'Error al restablecer la contraseña',
        });
      })
    );
  }

  private mapRoleToClinica(role: string): string {
    const roleMap: Record<string, string> = {
      platform_admin: 'PLATFORM_ADMIN',
      clinic_owner: 'ADMIN',
      clinic_doctor: 'DOCTOR',
      clinic_staff: 'DOCTOR',
      patient: 'PATIENT',
    };
    return roleMap[role] || 'PATIENT';
  }

  private getRolePriority(role: string): number {
    const priorityMap: Record<string, number> = {
      platform_admin: 0,
      clinic_owner: 1,
      clinic_doctor: 2,
      clinic_staff: 2,
      patient: 3,
    };
    return priorityMap[role] ?? 3;
  }

  private getPermissionsForRole(role: string): string[] {
    const permissionMap: Record<string, string[]> = {
      platform_admin: ['canAdd', 'canDelete', 'canEdit', 'canRead'],
      clinic_owner: ['canAdd', 'canDelete', 'canEdit', 'canRead'],
      clinic_doctor: ['canAdd', 'canEdit', 'canRead'],
      clinic_staff: ['canAdd', 'canEdit', 'canRead'],
      patient: ['canRead'],
    };
    return permissionMap[role] || ['canRead'];
  }

  private getDefaultAvatar(role: string): string {
    const avatarMap: Record<string, string> = {
      platform_admin: 'admin.jpg',
      clinic_owner: 'doctor.jpg',
      clinic_doctor: 'doctor.jpg',
      clinic_staff: 'doctor.jpg',
      patient: 'patient.jpg',
    };
    return avatarMap[role] || 'patient.jpg';
  }
}
