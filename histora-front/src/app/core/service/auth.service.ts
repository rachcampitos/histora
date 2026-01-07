import { Injectable } from '@angular/core';
import { BehaviorSubject, merge, Observable, of, share, switchMap } from 'rxjs';
import { User, AuthResponse } from '@core/models/interface';
import { TokenService } from './token.service';
import { LoginService } from './login.service';
import { LocalStorageService } from '@shared/services';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$ = new BehaviorSubject<User>({});

  private change$ = merge(this.tokenService.change()).pipe(
    switchMap(() => {
      return this.assignUser(this.user$);
    }),
    share()
  );

  constructor(
    private tokenService: TokenService,
    private loginService: LoginService,
    private store: LocalStorageService
  ) {
    // Initialize user$ from localStorage on service creation
    const storedUser = this.store.get('currentUser');
    if (storedUser && Object.keys(storedUser).length > 0) {
      this.user$.next(storedUser);
    }
  }

  public get currentUserValue(): User {
    return this.store.get('currentUser');
  }

  change() {
    return this.change$;
  }

  login(username: string, password: string, rememberMe = false) {
    return this.loginService.login(username, password, rememberMe).pipe(
      switchMap((response) => {
        // Check if login was successful
        if (!this.isAuthResponse(response)) {
          return of(response);
        }

        // Set the token
        this.tokenService.set({ access_token: response.access_token });

        // Get role data
        const roleData = response.user.roles || [];
        const sortedRoles = [...roleData].sort((a, b) => {
          return (a.priority || 0) - (b.priority || 0);
        });

        this.tokenService.roleArray = sortedRoles as [];
        this.tokenService.permissionArray = response.user.permissions || [];

        // Update user state
        this.user$.next(response.user);
        this.store.set('currentUser', response.user);

        // Store role names
        const roleNames = sortedRoles.map((role) => role.name);
        this.store.set('roleNames', JSON.stringify(roleNames));

        // Store refresh token
        if (response.refresh_token) {
          this.store.set('refreshToken', response.refresh_token);
        }

        return of(response);
      })
    );
  }

  check() {
    return this.tokenService.valid();
  }

  logout() {
    this.store.clear();
    this.user$.next({});
    return of({ success: true });
  }

  assignUser(_user: BehaviorSubject<User>): Observable<User> {
    this.user$.next(this.currentUserValue);
    return this.user$.asObservable();
  }

  private isAuthResponse(response: unknown): response is AuthResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      'access_token' in response &&
      'user' in response
    );
  }

  updateUserAvatar(avatarUrl: string): void {
    const currentUser = this.currentUserValue;
    if (currentUser) {
      const updatedUser = { ...currentUser, avatar: avatarUrl };
      this.store.set('currentUser', updatedUser);
      this.user$.next(updatedUser);
    }
  }

  handleGoogleCallback(accessToken: string, refreshToken: string, user: User): void {
    // Set the token
    this.tokenService.set({ access_token: accessToken });

    // Store refresh token
    this.store.set('refreshToken', refreshToken);

    // Build roles and permissions like normal login
    const role = user.role as string;
    const roleData = this.buildRolesForUser(role);
    const permissions = this.getPermissionsForRole(role);

    // Create enriched user object
    const enrichedUser = {
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      roles: roleData,
      permissions,
    };

    // Set token service arrays
    this.tokenService.roleArray = roleData as [];
    this.tokenService.permissionArray = permissions;

    // Update user state
    this.user$.next(enrichedUser);
    this.store.set('currentUser', enrichedUser);

    // Store role names
    const roleNames = roleData.map((r) => r.name);
    this.store.set('roleNames', JSON.stringify(roleNames));
  }

  private buildRolesForUser(role: string): { name: string; priority: number }[] {
    const roleMap: Record<string, { name: string; priority: number }> = {
      platform_admin: { name: 'PLATFORM_ADMIN', priority: 0 },
      clinic_owner: { name: 'ADMIN', priority: 1 },
      clinic_doctor: { name: 'DOCTOR', priority: 2 },
      clinic_staff: { name: 'DOCTOR', priority: 2 },
      patient: { name: 'PATIENT', priority: 3 },
    };
    return [roleMap[role] || { name: 'PATIENT', priority: 3 }];
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

  getDefaultRouteForRole(role?: string): string {
    switch (role) {
      case 'platform_admin':
        return '/admin/dashboard';
      case 'clinic_owner':
      case 'clinic_doctor':
        return '/doctor/dashboard';
      case 'patient':
        return '/patient/dashboard';
      default:
        return '/dashboard';
    }
  }

  loginWithGoogle(): void {
    // Redirect to backend Google OAuth endpoint
    const backendUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://api.historahealth.com';
    window.location.href = `${backendUrl}/auth/google`;
  }
}
