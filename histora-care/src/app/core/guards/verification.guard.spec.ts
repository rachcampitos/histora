import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PatientVerificationService } from '../services/patient-verification.service';
import { VerificationContextService } from '../services/verification-context.service';
import { patientVerificationGuard, checkVerificationStatus } from './verification.guard';
import {
  createMockAuthService,
  createMockRouter,
  createMockModalController,
  createMockPatientVerificationService,
  createMockVerificationContextService,
} from '../../../testing';

describe('Verification Guard', () => {
  let mockAuth: ReturnType<typeof createMockAuthService>;
  let mockRouter: ReturnType<typeof createMockRouter>;
  let mockModalCtrl: ReturnType<typeof createMockModalController>;
  let mockVerification: ReturnType<typeof createMockPatientVerificationService>;
  let mockVerificationContext: ReturnType<typeof createMockVerificationContextService>;

  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth = createMockAuthService();
    mockRouter = createMockRouter();
    mockModalCtrl = createMockModalController();
    mockVerification = createMockPatientVerificationService();
    mockVerificationContext = createMockVerificationContextService();

    mockRoute = {
      paramMap: { get: vi.fn().mockReturnValue(null), has: vi.fn().mockReturnValue(false) } as any,
    } as any;
    mockState = { url: '/patient/request/nurse-1' } as any;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: PatientVerificationService, useValue: mockVerification },
        { provide: VerificationContextService, useValue: mockVerificationContext },
      ],
    });
  });

  function runGuard() {
    return TestBed.runInInjectionContext(() =>
      patientVerificationGuard(mockRoute, mockState)
    );
  }

  // ============= patientVerificationGuard =============

  it('should allow non-patient users (nurses, admins)', async () => {
    mockAuth._setUser({ _id: '1', role: 'nurse' });
    const result = await runGuard();
    expect(result).toBe(true);
  });

  it('should allow verified patient', async () => {
    mockAuth._setUser({ _id: '1', role: 'patient' });
    mockVerification.canRequestService.mockReturnValue(of({ allowed: true }));
    const result = await runGuard();
    expect(result).toBe(true);
  });

  it('should show modal and block unverified patient', async () => {
    mockAuth._setUser({ _id: '1', role: 'patient' });
    mockVerification.canRequestService.mockReturnValue(of({ allowed: false, reason: 'not_verified' }));
    // Modal dismissed by user (cancel)
    mockModalCtrl._modal.onWillDismiss.mockResolvedValue({ role: 'cancel' });

    const result = await runGuard();

    expect(result).toBe(false);
    expect(mockModalCtrl.create).toHaveBeenCalled();
    expect(mockModalCtrl._modal.present).toHaveBeenCalled();
  });

  it('should save context before showing modal', async () => {
    mockAuth._setUser({ _id: '1', role: 'patient' });
    mockVerification.canRequestService.mockReturnValue(of({ allowed: false }));
    (mockRoute.paramMap.get as any).mockReturnValue('nurse-123');

    await runGuard();

    expect(mockVerificationContext.saveContext).toHaveBeenCalledWith({
      returnUrl: '/patient/request/nurse-1',
      nurseId: 'nurse-123',
    });
  });

  it('should block when user chooses to verify', async () => {
    mockAuth._setUser({ _id: '1', role: 'patient' });
    mockVerification.canRequestService.mockReturnValue(of({ allowed: false }));
    mockModalCtrl._modal.onWillDismiss.mockResolvedValue({ role: 'verify' });

    const result = await runGuard();
    expect(result).toBe(false);
  });

  it('should allow on API error (fail open)', async () => {
    mockAuth._setUser({ _id: '1', role: 'patient' });
    mockVerification.canRequestService.mockReturnValue(
      throwError(() => new Error('Server error'))
    );

    const result = await runGuard();
    expect(result).toBe(true);
  });

  // ============= checkVerificationStatus =============

  describe('checkVerificationStatus', () => {
    it('should return status on success', async () => {
      const status = { verified: true, step: 'completed' };
      mockVerification.getStatus.mockReturnValue(of(status));
      const result = await checkVerificationStatus(mockVerification as any);
      expect(result).toEqual(status);
    });

    it('should return null on error', async () => {
      mockVerification.getStatus.mockReturnValue(
        throwError(() => new Error('fail'))
      );
      const result = await checkVerificationStatus(mockVerification as any);
      expect(result).toBeNull();
    });
  });
});
