import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

// ==================== Interfaces ====================

export interface VerificationStatus {
  verificationLevel: number;
  status: 'pending' | 'level1' | 'level2' | 'suspended';
  trustScore: number;
  phoneVerified: boolean;
  dniVerified: boolean;
  selfieVerified: boolean;
  paymentVerified: boolean;
  emergencyContactsCount: number;
  totalServices: number;
  averageRating: number;
  flagsCount: { yellow: number; red: number };
  verifiedAt?: Date;
}

export interface CanRequestResponse {
  allowed: boolean;
  reason?: string;
  requiredSteps?: string[];
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface SendPhoneCodeDto {
  phone: string;
}

export interface VerifyPhoneCodeDto {
  phone: string;
  code: string;
}

export interface SendEmailCodeDto {
  email: string;
  userName?: string;
}

export interface VerifyEmailCodeDto {
  email: string;
  code: string;
}

export interface UploadDniDto {
  dniNumber: string;
  frontPhotoUrl: string;
  frontPhotoPublicId?: string;
  backPhotoUrl: string;
  backPhotoPublicId?: string;
}

export interface UploadSelfieDto {
  selfiePhotoUrl: string;
  selfiePhotoPublicId?: string;
}

export interface VerifyPaymentMethodDto {
  type: 'card' | 'yape' | 'plin' | 'other';
  last4?: string;
  paymentReference?: string;
}

export interface SetEmergencyContactsDto {
  contacts: EmergencyContact[];
}

export interface VerificationResponse {
  success: boolean;
  message?: string;
  verificationLevel?: number;
  trustScore?: number;
}

// ==================== Service ====================

@Injectable({
  providedIn: 'root'
})
export class PatientVerificationService {
  private api = inject(ApiService);
  private basePath = '/patient-verification';

  /**
   * Initialize verification process for current patient
   */
  startVerification(): Observable<VerificationResponse> {
    return this.api.post<VerificationResponse>(`${this.basePath}/start`, {});
  }

  /**
   * Get current verification status
   */
  getStatus(): Observable<VerificationStatus> {
    return this.api.get<VerificationStatus>(`${this.basePath}/status`);
  }

  /**
   * Check if patient can request a service
   */
  canRequestService(): Observable<CanRequestResponse> {
    return this.api.get<CanRequestResponse>(`${this.basePath}/can-request`);
  }

  /**
   * Send phone verification code via SMS
   */
  sendPhoneCode(dto: SendPhoneCodeDto): Observable<VerificationResponse> {
    return this.api.post<VerificationResponse>(`${this.basePath}/phone/send`, dto);
  }

  /**
   * Verify phone code
   */
  verifyPhoneCode(dto: VerifyPhoneCodeDto): Observable<VerificationResponse> {
    return this.api.post<VerificationResponse>(`${this.basePath}/phone/verify`, dto);
  }

  /**
   * Send email verification code
   */
  sendEmailCode(dto: SendEmailCodeDto): Observable<VerificationResponse> {
    return this.api.post<VerificationResponse>(`${this.basePath}/email/send`, dto);
  }

  /**
   * Verify email code
   */
  verifyEmailCode(dto: VerifyEmailCodeDto): Observable<VerificationResponse> {
    return this.api.post<VerificationResponse>(`${this.basePath}/email/verify`, dto);
  }

  /**
   * Upload DNI photos
   */
  uploadDni(dto: UploadDniDto): Observable<VerificationResponse> {
    return this.api.post<VerificationResponse>(`${this.basePath}/dni`, dto);
  }

  /**
   * Upload selfie with DNI
   */
  uploadSelfie(dto: UploadSelfieDto): Observable<VerificationResponse> {
    return this.api.post<VerificationResponse>(`${this.basePath}/selfie`, dto);
  }

  /**
   * Verify payment method
   */
  verifyPaymentMethod(dto: VerifyPaymentMethodDto): Observable<VerificationResponse> {
    return this.api.post<VerificationResponse>(`${this.basePath}/payment`, dto);
  }

  /**
   * Set emergency contacts
   */
  setEmergencyContacts(dto: SetEmergencyContactsDto): Observable<VerificationResponse> {
    return this.api.post<VerificationResponse>(`${this.basePath}/emergency-contacts`, dto);
  }

  /**
   * Get the next required step based on current status
   */
  getNextRequiredStep(status: VerificationStatus): string | null {
    if (!status.phoneVerified) return 'email'; // Email verification (backend uses phoneVerified flag)
    if (!status.dniVerified) return 'dni';
    if (!status.selfieVerified) return 'selfie';
    if (status.emergencyContactsCount < 2) return 'emergency-contacts';
    return null;
  }

  /**
   * Calculate completion percentage
   */
  getCompletionPercentage(status: VerificationStatus): number {
    let completed = 0;
    const total = 4;

    if (status.phoneVerified) completed++;
    if (status.dniVerified) completed++;
    if (status.selfieVerified) completed++;
    if (status.emergencyContactsCount >= 2) completed++;

    return Math.round((completed / total) * 100);
  }

  /**
   * Format phone number to E.164 format
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // If starts with 51, assume it's already with country code
    if (cleaned.startsWith('51') && cleaned.length >= 11) {
      return `+${cleaned}`;
    }

    // If 9 digits starting with 9, add Peru country code
    if (cleaned.length === 9 && cleaned.startsWith('9')) {
      return `+51${cleaned}`;
    }

    // Return as-is with + prefix if it looks valid
    if (cleaned.length >= 10) {
      return `+${cleaned}`;
    }

    return phone;
  }
}
