import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard, noAuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('Auth Guards', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'userRole']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/test' } as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

      expect(result).toBeTrue();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should deny access and redirect to login when not authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('noAuthGuard', () => {
    it('should allow access when user is not authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() => noAuthGuard(mockRoute, mockState));

      expect(result).toBeTrue();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to dashboard when authenticated as non-patient', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      authServiceSpy.userRole.and.returnValue('clinic_owner' as any);

      const result = TestBed.runInInjectionContext(() => noAuthGuard(mockRoute, mockState));

      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should redirect to patient portal when authenticated as patient', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      authServiceSpy.userRole.and.returnValue('patient' as any);

      const result = TestBed.runInInjectionContext(() => noAuthGuard(mockRoute, mockState));

      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/patient']);
    });
  });
});
