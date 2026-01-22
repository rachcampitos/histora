import { Injectable, inject, signal, computed, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, switchMap } from 'rxjs';
import { Browser } from '@capacitor/browser';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { environment } from '../../../environments/environment';
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
  private ngZone = inject(NgZone);

  // Signals for reactive state
  private userSignal = signal<AuthUser | null>(null);
  private loadingSignal = signal<boolean>(true);
  private googleAuthPendingSignal = signal<boolean>(false);

  // Public computed values
  user = this.userSignal.asReadonly();
  isAuthenticated = computed(() => !!this.userSignal());
  isNurse = computed(() => this.userSignal()?.role === 'nurse');
  isPatient = computed(() => this.userSignal()?.role === 'patient');
  isAdmin = computed(() => this.userSignal()?.role === 'platform_admin');
  loading = this.loadingSignal.asReadonly();
  googleAuthPending = this.googleAuthPendingSignal.asReadonly();

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

  // ============= Google OAuth Methods =============

  /**
   * Initialize deep link listener for OAuth callback
   * Should be called once when app starts
   */
  setupOAuthListener(): void {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      this.ngZone.run(() => {
        this.handleOAuthCallback(event.url);
      });
    });
  }

  /**
   * Start Google OAuth flow
   * Uses native browser on mobile, window.location on web
   */
  async loginWithGoogle(): Promise<void> {
    this.googleAuthPendingSignal.set(true);

    // Construct the OAuth URL - use apiUrl directly (includes /api prefix)
    const apiUrl = environment.apiUrl;

    // Check if running on native device or browser
    const isNative = this.isNativeApp();

    if (isNative) {
      // Mobile: Use Capacitor Browser with deep link callback
      const googleAuthUrl = `${apiUrl}/auth/google?platform=mobile`;
      try {
        await Browser.open({
          url: googleAuthUrl,
          presentationStyle: 'popover'
        });
      } catch (error) {
        console.error('Error opening browser for Google auth:', error);
        this.googleAuthPendingSignal.set(false);
        throw error;
      }
    } else {
      // Browser: Use window.location with web callback
      // The callback will redirect back to this app
      const callbackUrl = window.location.origin + '/auth/google/callback';
      const googleAuthUrl = `${apiUrl}/auth/google?platform=web&redirect_uri=${encodeURIComponent(callbackUrl)}`;

      // Navigate to Google auth (will redirect back)
      window.location.href = googleAuthUrl;
    }
  }

  /**
   * Check if running on native device (iOS/Android) vs web browser
   */
  private isNativeApp(): boolean {
    // Check for Capacitor native platform
    return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })?.Capacitor?.isNativePlatform?.();
  }

  /**
   * Handle OAuth callback from deep link
   */
  async handleOAuthCallback(url: string): Promise<void> {
    // Close the browser
    await Browser.close();
    this.googleAuthPendingSignal.set(false);

    try {
      // Parse URL params
      // URL format: historacare://oauth/callback?access_token=...&refresh_token=...&user=...
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search || urlObj.hash.split('?')[1]);

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const userJson = params.get('user');
      const isNewUser = params.get('is_new_user') === 'true';
      const error = params.get('error');

      if (error) {
        throw new Error(error);
      }

      if (!accessToken || !refreshToken || !userJson) {
        throw new Error('Missing auth data in callback');
      }

      // Parse user data
      const user: AuthUser = JSON.parse(decodeURIComponent(userJson));

      // Store auth data
      await this.storage.set(TOKEN_KEY, accessToken);
      await this.storage.set(REFRESH_TOKEN_KEY, refreshToken);
      await this.storage.set(USER_KEY, user);
      this.userSignal.set(user);

      // Navigate based on user role or if new user needs to complete registration
      if (isNewUser) {
        // New Google users need to select their role (nurse or patient)
        this.router.navigate(['/auth/complete-registration']);
      } else if (user.role === 'nurse') {
        this.router.navigate(['/nurse/dashboard']);
      } else if (user.role === 'patient') {
        this.router.navigate(['/patient/tabs/home']);
      } else {
        this.router.navigate(['/home']);
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      this.router.navigate(['/auth/login'], {
        queryParams: { error: 'google_auth_failed' }
      });
    }
  }

  /**
   * Handle Google auth callback from web (when running as PWA)
   * Called from route resolver when URL has auth params
   */
  async handleWebOAuthCallback(params: {
    access_token: string;
    refresh_token: string;
    user: string;
    is_new_user: string;
  }): Promise<void> {
    const user: AuthUser = JSON.parse(params.user);
    const isNewUser = params.is_new_user === 'true';

    await this.storage.set(TOKEN_KEY, params.access_token);
    await this.storage.set(REFRESH_TOKEN_KEY, params.refresh_token);
    await this.storage.set(USER_KEY, user);
    this.userSignal.set(user);

    if (isNewUser) {
      this.router.navigate(['/auth/complete-registration']);
    } else if (user.role === 'nurse') {
      this.router.navigate(['/nurse/dashboard']);
    } else if (user.role === 'patient') {
      this.router.navigate(['/patient/tabs/home']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  /**
   * Handle OAuth success from web callback page
   * Stores tokens and user data without navigation
   * Navigation is handled by the callback page
   */
  async handleOAuthSuccess(
    accessToken: string,
    refreshToken: string,
    user: AuthUser,
    isNewUser: boolean
  ): Promise<void> {
    this.googleAuthPendingSignal.set(false);
    await this.storage.set(TOKEN_KEY, accessToken);
    await this.storage.set(REFRESH_TOKEN_KEY, refreshToken);
    await this.storage.set(USER_KEY, user);
    this.userSignal.set(user);
  }

  /**
   * Update user avatar locally after upload
   */
  async updateUserAvatar(avatarUrl: string): Promise<void> {
    const currentUser = this.userSignal();
    if (currentUser) {
      const updatedUser = { ...currentUser, avatar: avatarUrl };
      await this.storage.set(USER_KEY, updatedUser);
      this.userSignal.set(updatedUser);
    }
  }

  // ============= Password Recovery Methods =============

  /**
   * Request password reset email (legacy - magic link)
   * @param email User's email address
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/forgot-password', {
      email,
      platform: 'histora-care'
    });
  }

  /**
   * Reset password with token from email (legacy - magic link)
   * @param token Reset token from email
   * @param newPassword New password
   */
  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/reset-password', { token, newPassword });
  }

  // ============= OTP-based Password Recovery =============

  /**
   * Request OTP for password reset
   * @param email User's email address
   */
  requestPasswordOtp(email: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/password-reset/request-otp', {
      email,
      platform: 'histora-care'
    });
  }

  /**
   * Verify OTP code
   * @param email User's email
   * @param otp 6-digit OTP code
   */
  verifyPasswordOtp(email: string, otp: string): Observable<{ valid: boolean; message: string }> {
    return this.api.post<{ valid: boolean; message: string }>('/auth/password-reset/verify-otp', {
      email,
      otp
    });
  }

  /**
   * Reset password with OTP
   * @param email User's email
   * @param otp 6-digit OTP code
   * @param newPassword New password
   */
  resetPasswordWithOtp(email: string, otp: string, newPassword: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/password-reset/reset-with-otp', {
      email,
      otp,
      newPassword
    });
  }
}
