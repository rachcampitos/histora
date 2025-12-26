import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { User, UserRole, AuthResponse } from '../models';

describe('AuthService', () => {
  let service: AuthService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let storageServiceSpy: jasmine.SpyObj<StorageService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    _id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CLINIC_OWNER,
    clinicId: 'clinic-123',
    isActive: true,
    isEmailVerified: true,
  };

  const mockAuthResponse: AuthResponse = {
    access_token: 'mock-jwt-token',
    user: mockUser,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    storageServiceSpy = jasmine.createSpyObj('StorageService', [
      'init', 'getToken', 'setToken', 'removeToken', 'getUser', 'setUser', 'removeUser'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    storageServiceSpy.init.and.returnValue(Promise.resolve());
    storageServiceSpy.getToken.and.returnValue(Promise.resolve(null));
    storageServiceSpy.setToken.and.returnValue(Promise.resolve());
    storageServiceSpy.removeToken.and.returnValue(Promise.resolve());
    storageServiceSpy.getUser.and.returnValue(Promise.resolve(null));
    storageServiceSpy.setUser.and.returnValue(Promise.resolve());
    storageServiceSpy.removeUser.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('init', () => {
    it('should initialize storage and set user if token exists', fakeAsync(() => {
      storageServiceSpy.getToken.and.returnValue(Promise.resolve('valid-token'));
      storageServiceSpy.getUser.and.returnValue(Promise.resolve(mockUser));

      service.init();
      tick();

      expect(storageServiceSpy.init).toHaveBeenCalled();
      expect(service.user()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBeTrue();
    }));

    it('should not set user if no token exists', fakeAsync(() => {
      storageServiceSpy.getToken.and.returnValue(Promise.resolve(null));

      service.init();
      tick();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    }));
  });

  describe('login', () => {
    const credentials = { email: 'test@example.com', password: 'password123' };

    it('should login successfully and store auth data', fakeAsync(() => {
      apiServiceSpy.post.and.returnValue(of(mockAuthResponse));

      let result: AuthResponse | undefined;
      service.login(credentials).subscribe((res) => (result = res));
      tick();

      expect(apiServiceSpy.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(storageServiceSpy.setToken).toHaveBeenCalledWith(mockAuthResponse.access_token);
      expect(service.user()).toEqual(mockUser);
      expect(result).toEqual(mockAuthResponse);
    }));

    it('should handle login error', fakeAsync(() => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Invalid credentials')));

      let errorCaught = false;
      service.login(credentials).subscribe({
        error: () => (errorCaught = true),
      });
      tick();

      expect(errorCaught).toBeTrue();
      expect(service.user()).toBeNull();
    }));
  });

  describe('register', () => {
    const registerData = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Doe',
      clinicName: 'Test Clinic',
    };

    it('should register successfully', fakeAsync(() => {
      apiServiceSpy.post.and.returnValue(of(mockAuthResponse));

      let result: AuthResponse | undefined;
      service.register(registerData).subscribe((res) => (result = res));
      tick();

      expect(apiServiceSpy.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(mockAuthResponse);
    }));
  });

  describe('logout', () => {
    it('should clear auth data and navigate to login', fakeAsync(() => {
      service.logout();
      tick();

      expect(storageServiceSpy.removeToken).toHaveBeenCalled();
      expect(storageServiceSpy.removeUser).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    }));
  });

  describe('role checks', () => {
    beforeEach(fakeAsync(() => {
      storageServiceSpy.getToken.and.returnValue(Promise.resolve('token'));
      storageServiceSpy.getUser.and.returnValue(Promise.resolve(mockUser));
      service.init();
      tick();
    }));

    it('should correctly identify clinic owner role', () => {
      expect(service.isClinicOwner()).toBeTrue();
      expect(service.isDoctor()).toBeTrue();
      expect(service.isPatient()).toBeFalse();
    });

    it('should check hasRole correctly', () => {
      expect(service.hasRole(UserRole.CLINIC_OWNER)).toBeTrue();
      expect(service.hasRole(UserRole.PATIENT)).toBeFalse();
    });
  });
});
