import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { createMockApiService } from '../../../testing';
import { of } from 'rxjs';
import {
  PatientVerificationService,
  VerificationStatus,
  VerificationResponse,
} from './patient-verification.service';

describe('PatientVerificationService', () => {
  let service: PatientVerificationService;
  let mockApi: ReturnType<typeof createMockApiService>;

  const basePath = '/patient-verification';

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi = createMockApiService();

    TestBed.configureTestingModule({
      providers: [
        PatientVerificationService,
        { provide: ApiService, useValue: mockApi },
      ],
    });

    service = TestBed.inject(PatientVerificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= API Methods =============

  describe('startVerification', () => {
    it('should POST to /patient-verification/start', () => {
      const mockResponse: VerificationResponse = { success: true, verificationLevel: 1 };
      mockApi.post.mockReturnValue(of(mockResponse));

      service.startVerification().subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      expect(mockApi.post).toHaveBeenCalledWith(`${basePath}/start`, {});
    });
  });

  describe('getStatus', () => {
    it('should GET /patient-verification/status', () => {
      const mockStatus = { phoneVerified: true } as VerificationStatus;
      mockApi.get.mockReturnValue(of(mockStatus));

      service.getStatus().subscribe((result) => {
        expect(result).toEqual(mockStatus);
      });

      expect(mockApi.get).toHaveBeenCalledWith(`${basePath}/status`);
    });
  });

  describe('canRequestService', () => {
    it('should GET /patient-verification/can-request', () => {
      const mockResponse = { allowed: true };
      mockApi.get.mockReturnValue(of(mockResponse));

      service.canRequestService().subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      expect(mockApi.get).toHaveBeenCalledWith(`${basePath}/can-request`);
    });
  });

  describe('sendPhoneCode', () => {
    it('should POST dto to /patient-verification/phone/send', () => {
      const dto = { phone: '987654321' };
      mockApi.post.mockReturnValue(of({ success: true }));

      service.sendPhoneCode(dto).subscribe();

      expect(mockApi.post).toHaveBeenCalledWith(`${basePath}/phone/send`, dto);
    });
  });

  describe('verifyPhoneCode', () => {
    it('should POST dto to /patient-verification/phone/verify', () => {
      const dto = { phone: '987654321', code: '123456' };
      mockApi.post.mockReturnValue(of({ success: true }));

      service.verifyPhoneCode(dto).subscribe();

      expect(mockApi.post).toHaveBeenCalledWith(`${basePath}/phone/verify`, dto);
    });
  });

  describe('sendEmailCode', () => {
    it('should POST dto to /patient-verification/email/send', () => {
      const dto = { email: 'test@example.com', userName: 'Juan' };
      mockApi.post.mockReturnValue(of({ success: true }));

      service.sendEmailCode(dto).subscribe();

      expect(mockApi.post).toHaveBeenCalledWith(`${basePath}/email/send`, dto);
    });
  });

  describe('verifyEmailCode', () => {
    it('should POST dto to /patient-verification/email/verify', () => {
      const dto = { email: 'test@example.com', code: '654321' };
      mockApi.post.mockReturnValue(of({ success: true }));

      service.verifyEmailCode(dto).subscribe();

      expect(mockApi.post).toHaveBeenCalledWith(`${basePath}/email/verify`, dto);
    });
  });

  describe('uploadDni', () => {
    it('should POST dto to /patient-verification/dni', () => {
      const dto = {
        dniNumber: '44119536',
        frontPhotoUrl: 'https://example.com/front.jpg',
        backPhotoUrl: 'https://example.com/back.jpg',
      };
      mockApi.post.mockReturnValue(of({ success: true }));

      service.uploadDni(dto).subscribe();

      expect(mockApi.post).toHaveBeenCalledWith(`${basePath}/dni`, dto);
    });
  });

  describe('uploadSelfie', () => {
    it('should POST dto to /patient-verification/selfie', () => {
      const dto = { selfiePhotoUrl: 'https://example.com/selfie.jpg' };
      mockApi.post.mockReturnValue(of({ success: true }));

      service.uploadSelfie(dto).subscribe();

      expect(mockApi.post).toHaveBeenCalledWith(`${basePath}/selfie`, dto);
    });
  });

  describe('verifyPaymentMethod', () => {
    it('should POST dto to /patient-verification/payment', () => {
      const dto = { type: 'yape' as const, last4: '1234' };
      mockApi.post.mockReturnValue(of({ success: true }));

      service.verifyPaymentMethod(dto).subscribe();

      expect(mockApi.post).toHaveBeenCalledWith(`${basePath}/payment`, dto);
    });
  });

  describe('setEmergencyContacts', () => {
    it('should POST dto to /patient-verification/emergency-contacts', () => {
      const dto = {
        contacts: [
          { name: 'Maria', phone: '999888777', relationship: 'madre' },
          { name: 'Jose', phone: '999777666', relationship: 'padre' },
        ],
      };
      mockApi.post.mockReturnValue(of({ success: true }));

      service.setEmergencyContacts(dto).subscribe();

      expect(mockApi.post).toHaveBeenCalledWith(`${basePath}/emergency-contacts`, dto);
    });
  });

  // ============= Pure Logic Methods =============

  describe('getNextRequiredStep', () => {
    const baseStatus: VerificationStatus = {
      verificationLevel: 0,
      status: 'pending',
      trustScore: 0,
      phoneVerified: false,
      dniVerified: false,
      selfieVerified: false,
      paymentVerified: false,
      emergencyContactsCount: 0,
      totalServices: 0,
      averageRating: 0,
      flagsCount: { yellow: 0, red: 0 },
    };

    it('should return "email" when phone is not verified', () => {
      expect(service.getNextRequiredStep({ ...baseStatus, phoneVerified: false })).toBe('email');
    });

    it('should return "dni" when phone verified but DNI not verified', () => {
      expect(service.getNextRequiredStep({ ...baseStatus, phoneVerified: true, dniVerified: false })).toBe('dni');
    });

    it('should return "selfie" when phone and DNI verified but selfie not verified', () => {
      expect(service.getNextRequiredStep({
        ...baseStatus,
        phoneVerified: true,
        dniVerified: true,
        selfieVerified: false,
      })).toBe('selfie');
    });

    it('should return "emergency-contacts" when all verified but fewer than 2 contacts', () => {
      expect(service.getNextRequiredStep({
        ...baseStatus,
        phoneVerified: true,
        dniVerified: true,
        selfieVerified: true,
        emergencyContactsCount: 1,
      })).toBe('emergency-contacts');
    });

    it('should return null when all steps are complete', () => {
      expect(service.getNextRequiredStep({
        ...baseStatus,
        phoneVerified: true,
        dniVerified: true,
        selfieVerified: true,
        emergencyContactsCount: 2,
      })).toBeNull();
    });
  });

  describe('getCompletionPercentage', () => {
    const baseStatus: VerificationStatus = {
      verificationLevel: 0,
      status: 'pending',
      trustScore: 0,
      phoneVerified: false,
      dniVerified: false,
      selfieVerified: false,
      paymentVerified: false,
      emergencyContactsCount: 0,
      totalServices: 0,
      averageRating: 0,
      flagsCount: { yellow: 0, red: 0 },
    };

    it('should return 0 when nothing is verified', () => {
      expect(service.getCompletionPercentage(baseStatus)).toBe(0);
    });

    it('should return 25 when 1 of 4 criteria met', () => {
      expect(service.getCompletionPercentage({ ...baseStatus, phoneVerified: true })).toBe(25);
    });

    it('should return 50 when 2 of 4 criteria met', () => {
      expect(service.getCompletionPercentage({
        ...baseStatus,
        phoneVerified: true,
        dniVerified: true,
      })).toBe(50);
    });

    it('should return 75 when 3 of 4 criteria met', () => {
      expect(service.getCompletionPercentage({
        ...baseStatus,
        phoneVerified: true,
        dniVerified: true,
        selfieVerified: true,
      })).toBe(75);
    });

    it('should return 100 when all 4 criteria met', () => {
      expect(service.getCompletionPercentage({
        ...baseStatus,
        phoneVerified: true,
        dniVerified: true,
        selfieVerified: true,
        emergencyContactsCount: 3,
      })).toBe(100);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 9-digit Peru number starting with 9', () => {
      expect(service.formatPhoneNumber('987654321')).toBe('+51987654321');
    });

    it('should format number already starting with 51', () => {
      expect(service.formatPhoneNumber('51987654321')).toBe('+51987654321');
    });

    it('should handle number with non-digit characters', () => {
      expect(service.formatPhoneNumber('987-654-321')).toBe('+51987654321');
    });

    it('should handle number with spaces', () => {
      expect(service.formatPhoneNumber('987 654 321')).toBe('+51987654321');
    });

    it('should return original phone for short invalid numbers', () => {
      expect(service.formatPhoneNumber('12345')).toBe('12345');
    });

    it('should add + prefix to numbers >= 10 digits without country code', () => {
      expect(service.formatPhoneNumber('1234567890')).toBe('+1234567890');
    });
  });
});
