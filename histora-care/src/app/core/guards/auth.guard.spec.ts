import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard, noAuthGuard, nurseGuard, patientGuard, adminGuard } from './auth.guard';
import { createMockAuthService, createMockRouter } from '../../../testing';

describe('Auth Guards', () => {
  let mockAuth: ReturnType<typeof createMockAuthService>;
  let mockRouter: ReturnType<typeof createMockRouter>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth = createMockAuthService();
    mockRouter = createMockRouter();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  function runGuard(guard: any) {
    return TestBed.runInInjectionContext(() =>
      guard({} as any, {} as any)
    );
  }

  // ============= authGuard =============

  describe('authGuard', () => {
    it('should allow access when authenticated', async () => {
      mockAuth._setUser({ _id: '1', role: 'patient' });
      const result = await runGuard(authGuard);
      expect(result).toBe(true);
    });

    it('should redirect to login when not authenticated', async () => {
      const result = await runGuard(authGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  // ============= noAuthGuard =============

  describe('noAuthGuard', () => {
    it('should allow access when not authenticated', async () => {
      const result = await runGuard(noAuthGuard);
      expect(result).toBe(true);
    });

    it('should redirect admin to /admin/verifications', async () => {
      mockAuth._setUser({ _id: '1', role: 'platform_admin' });
      const result = await runGuard(noAuthGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/verifications']);
    });

    it('should redirect nurse to /nurse/dashboard', async () => {
      mockAuth._setUser({ _id: '1', role: 'nurse' });
      const result = await runGuard(noAuthGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/nurse/dashboard']);
    });

    it('should redirect patient to /patient/tabs/home', async () => {
      mockAuth._setUser({ _id: '1', role: 'patient' });
      const result = await runGuard(noAuthGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/patient/tabs/home']);
    });
  });

  // ============= nurseGuard =============

  describe('nurseGuard', () => {
    it('should allow access for nurse', async () => {
      mockAuth._setUser({ _id: '1', role: 'nurse' });
      const result = await runGuard(nurseGuard);
      expect(result).toBe(true);
    });

    it('should redirect non-nurse to patient home', async () => {
      mockAuth._setUser({ _id: '1', role: 'patient' });
      const result = await runGuard(nurseGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/patient/tabs/home']);
    });

    it('should redirect unauthenticated user', async () => {
      const result = await runGuard(nurseGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/patient/tabs/home']);
    });
  });

  // ============= patientGuard =============

  describe('patientGuard', () => {
    it('should allow access for patient', async () => {
      mockAuth._setUser({ _id: '1', role: 'patient' });
      const result = await runGuard(patientGuard);
      expect(result).toBe(true);
    });

    it('should redirect nurse to nurse dashboard', async () => {
      mockAuth._setUser({ _id: '1', role: 'nurse' });
      const result = await runGuard(patientGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/nurse/dashboard']);
    });
  });

  // ============= adminGuard =============

  describe('adminGuard', () => {
    it('should allow access for admin', async () => {
      mockAuth._setUser({ _id: '1', role: 'platform_admin' });
      const result = await runGuard(adminGuard);
      expect(result).toBe(true);
    });

    it('should redirect nurse to nurse dashboard', async () => {
      mockAuth._setUser({ _id: '1', role: 'nurse' });
      const result = await runGuard(adminGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/nurse/dashboard']);
    });

    it('should redirect patient to patient home', async () => {
      mockAuth._setUser({ _id: '1', role: 'patient' });
      const result = await runGuard(adminGuard);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/patient/tabs/home']);
    });
  });
});
