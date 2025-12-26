import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, tap, switchMap, of } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { User, AuthResponse, LoginDto, RegisterDto, UserRole } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private api = inject(ApiService);
  private storage = inject(StorageService);
  private router = inject(Router);

  private userSignal = signal<User | null>(null);
  private loadingSignal = signal(false);

  readonly user = computed(() => this.userSignal());
  readonly isAuthenticated = computed(() => !!this.userSignal());
  readonly isLoading = computed(() => this.loadingSignal());
  readonly userRole = computed(() => this.userSignal()?.role);

  // Role checks
  readonly isAdmin = computed(() => this.userSignal()?.role === UserRole.PLATFORM_ADMIN);
  readonly isClinicOwner = computed(() => this.userSignal()?.role === UserRole.CLINIC_OWNER);
  readonly isDoctor = computed(() =>
    this.userSignal()?.role === UserRole.CLINIC_OWNER ||
    this.userSignal()?.role === UserRole.CLINIC_DOCTOR
  );
  readonly isStaff = computed(() => this.userSignal()?.role === UserRole.CLINIC_STAFF);
  readonly isPatient = computed(() => this.userSignal()?.role === UserRole.PATIENT);

  async init(): Promise<void> {
    await this.storage.init();
    const token = await this.storage.getToken();
    if (token) {
      const user = await this.storage.getUser<User>();
      if (user) {
        this.userSignal.set(user);
      } else {
        // Token exists but no user, try to fetch
        this.loadCurrentUser().subscribe({
          error: () => this.logout(),
        });
      }
    }
  }

  login(credentials: LoginDto): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      switchMap((response) =>
        from(this.handleAuthSuccess(response)).pipe(
          switchMap(() => of(response))
        )
      ),
      tap({
        finalize: () => this.loadingSignal.set(false),
      })
    );
  }

  register(data: RegisterDto): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.api.post<AuthResponse>('/auth/register', data).pipe(
      switchMap((response) =>
        from(this.handleAuthSuccess(response)).pipe(
          switchMap(() => of(response))
        )
      ),
      tap({
        finalize: () => this.loadingSignal.set(false),
      })
    );
  }

  logout(): void {
    from(this.clearAuth()).subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }

  loadCurrentUser(): Observable<User> {
    return this.api.get<User>('/auth/me').pipe(
      tap((user) => {
        this.userSignal.set(user);
        this.storage.setUser(user);
      })
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.api.post('/auth/forgot-password', { email });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.api.post('/auth/reset-password', { token, password });
  }

  hasRole(...roles: UserRole[]): boolean {
    const currentRole = this.userSignal()?.role;
    return currentRole ? roles.includes(currentRole) : false;
  }

  private async handleAuthSuccess(response: AuthResponse): Promise<void> {
    await this.storage.setToken(response.access_token);
    await this.storage.setUser(response.user);
    this.userSignal.set(response.user);
  }

  private async clearAuth(): Promise<void> {
    await this.storage.removeToken();
    await this.storage.removeUser();
    this.userSignal.set(null);
  }
}
