import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, from, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import {
  AuthUser,
  AuthResponse,
  LoginRequest,
  RegisterNurseRequest,
  RegisterPatientRequest
} from '../models';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private storage = inject(StorageService);
  private router = inject(Router);

  // Signals for reactive state
  private userSignal = signal<AuthUser | null>(null);
  private loadingSignal = signal<boolean>(true);

  // Public computed values
  user = this.userSignal.asReadonly();
  isAuthenticated = computed(() => !!this.userSignal());
  isNurse = computed(() => this.userSignal()?.role === 'nurse');
  isPatient = computed(() => this.userSignal()?.role === 'patient');
  loading = this.loadingSignal.asReadonly();

  async initialize(): Promise<void> {
    try {
      const token = await this.storage.get<string>(TOKEN_KEY);
      const user = await this.storage.get<AuthUser>(USER_KEY);

      if (token && user) {
        this.userSignal.set(user);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      switchMap(response => from(this.handleAuthResponse(response)))
    );
  }

  registerNurse(data: RegisterNurseRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register/nurse', data).pipe(
      switchMap(response => from(this.handleAuthResponse(response)))
    );
  }

  registerPatient(data: RegisterPatientRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register/patient', data).pipe(
      switchMap(response => from(this.handleAuthResponse(response)))
    );
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      await this.api.post('/auth/logout', {}).toPromise();
    } catch {
      // Ignore errors on logout
    } finally {
      await this.clearSession();
      this.router.navigate(['/auth/login']);
    }
  }

  async refreshToken(): Promise<string | null> {
    const refreshToken = await this.storage.get<string>(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await this.api.post<AuthResponse>('/auth/refresh', {
        refresh_token: refreshToken
      }).toPromise();

      if (response) {
        await this.handleAuthResponse(response);
        return response.access_token;
      }
      return null;
    } catch {
      await this.clearSession();
      return null;
    }
  }

  async getToken(): Promise<string | null> {
    return this.storage.get<string>(TOKEN_KEY);
  }

  private async handleAuthResponse(response: AuthResponse): Promise<AuthResponse> {
    await this.storage.set(TOKEN_KEY, response.access_token);
    await this.storage.set(REFRESH_TOKEN_KEY, response.refresh_token);
    await this.storage.set(USER_KEY, response.user);
    this.userSignal.set(response.user);
    return response;
  }

  private async clearSession(): Promise<void> {
    await this.storage.remove(TOKEN_KEY);
    await this.storage.remove(REFRESH_TOKEN_KEY);
    await this.storage.remove(USER_KEY);
    this.userSignal.set(null);
  }
}
