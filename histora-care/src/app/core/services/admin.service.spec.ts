import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { AdminService } from './admin.service';
import { ApiService } from './api.service';
import { createMockApiService } from '../../../testing';
import { of } from 'rxjs';

describe('AdminService', () => {
  let service: AdminService;
  let mockApi: ReturnType<typeof createMockApiService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi = createMockApiService();

    TestBed.configureTestingModule({
      providers: [
        AdminService,
        { provide: ApiService, useValue: mockApi },
      ],
    });

    service = TestBed.inject(AdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= getVerificationStats =============

  it('getVerificationStats() should GET /nurses/admin/verifications/stats', () => {
    const mockStats = { pending: 3, underReview: 1, approved: 20, rejected: 2, total: 26 };
    mockApi.get.mockReturnValue(of(mockStats));

    service.getVerificationStats().subscribe(result => {
      expect(result).toEqual(mockStats);
      expect(result.total).toBe(26);
    });

    expect(mockApi.get).toHaveBeenCalledWith('/nurses/admin/verifications/stats');
  });

  // ============= getVerifications =============

  it('getVerifications() should GET /nurses/admin/verifications with params', () => {
    const mockResponse = {
      verifications: [{ _id: 'v-1', status: 'pending' }],
      total: 1,
      page: 1,
      totalPages: 1,
    };
    mockApi.get.mockReturnValue(of(mockResponse));

    service.getVerifications({ status: 'pending' as any, page: 1, limit: 20 }).subscribe(result => {
      expect(result.verifications).toHaveLength(1);
    });

    expect(mockApi.get).toHaveBeenCalledWith('/nurses/admin/verifications', {
      status: 'pending',
      page: 1,
      limit: 20,
    });
  });

  it('getVerifications() should work with empty params', () => {
    mockApi.get.mockReturnValue(of({ verifications: [], total: 0, page: 1, totalPages: 0 }));

    service.getVerifications({}).subscribe();

    expect(mockApi.get).toHaveBeenCalledWith('/nurses/admin/verifications', {});
  });

  // ============= getVerificationDetail =============

  it('getVerificationDetail() should GET /nurses/admin/verifications/:id', () => {
    const mockDetail = {
      _id: 'v-1',
      status: 'pending',
      nurseId: 'nurse-1',
      dniNumber: '44119536',
      cepNumber: '108887',
    };
    mockApi.get.mockReturnValue(of(mockDetail));

    service.getVerificationDetail('v-1').subscribe(result => {
      expect((result as any)._id).toBe('v-1');
    });

    expect(mockApi.get).toHaveBeenCalledWith('/nurses/admin/verifications/v-1');
  });

  // ============= markUnderReview =============

  it('markUnderReview() should PATCH /nurses/admin/verifications/:id/under-review', () => {
    const mockResult = { _id: 'v-1', status: 'under_review' };
    mockApi.patch.mockReturnValue(of(mockResult));

    service.markUnderReview('v-1').subscribe(result => {
      expect(result.status).toBe('under_review');
    });

    expect(mockApi.patch).toHaveBeenCalledWith('/nurses/admin/verifications/v-1/under-review', {});
  });

  // ============= reviewVerification =============

  it('reviewVerification() should PATCH with approval data', () => {
    const reviewData = {
      status: 'approved' as const,
      reviewNotes: 'Documentos validos, CEP verificado',
    };
    mockApi.patch.mockReturnValue(of({ _id: 'v-1', status: 'approved' }));

    service.reviewVerification('v-1', reviewData).subscribe();

    expect(mockApi.patch).toHaveBeenCalledWith('/nurses/admin/verifications/v-1/review', reviewData);
  });

  it('reviewVerification() should PATCH with rejection data', () => {
    const reviewData = {
      status: 'rejected' as const,
      rejectionReason: 'Foto de DNI ilegible',
      reviewNotes: 'Solicitar nueva foto',
    };
    mockApi.patch.mockReturnValue(of({ _id: 'v-1', status: 'rejected' }));

    service.reviewVerification('v-1', reviewData).subscribe();

    expect(mockApi.patch).toHaveBeenCalledWith('/nurses/admin/verifications/v-1/review', reviewData);
  });
});
