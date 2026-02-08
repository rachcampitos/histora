import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= GET =============

  it('get() should send GET request to correct URL', () => {
    const mockResponse = { id: '1', name: 'Test' };

    service.get('/nurses/me').subscribe(result => {
      expect(result).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/nurses/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('get() should append query params correctly', () => {
    service.get('/nurses/search', { lat: -12.04, lng: -77.04, radius: 10 }).subscribe();

    const req = httpMock.expectOne(r =>
      r.url === `${baseUrl}/nurses/search` &&
      r.params.get('lat') === '-12.04' &&
      r.params.get('lng') === '-77.04' &&
      r.params.get('radius') === '10'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('get() should skip null and undefined params', () => {
    service.get('/items', { status: 'active', category: undefined as any, tag: null as any }).subscribe();

    const req = httpMock.expectOne(r => r.url === `${baseUrl}/items`);
    expect(req.request.params.get('status')).toBe('active');
    expect(req.request.params.has('category')).toBe(false);
    expect(req.request.params.has('tag')).toBe(false);
    req.flush([]);
  });

  it('get() should work without params', () => {
    service.get('/health').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/health`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ status: 'ok' });
  });

  it('get() should convert boolean params to string', () => {
    service.get('/nurses/search', { availableNow: true }).subscribe();

    const req = httpMock.expectOne(r => r.url === `${baseUrl}/nurses/search`);
    expect(req.request.params.get('availableNow')).toBe('true');
    req.flush([]);
  });

  // ============= POST =============

  it('post() should send POST request with body', () => {
    const body = { name: 'Servicio A', price: 50 };
    const mockResponse = { _id: 'abc', ...body };

    service.post('/service-requests', body).subscribe(result => {
      expect(result).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/service-requests`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockResponse);
  });

  // ============= PATCH =============

  it('patch() should send PATCH request with body', () => {
    const body = { status: 'accepted' };

    service.patch('/service-requests/req-1/accept', body).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/service-requests/req-1/accept`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(body);
    req.flush({ _id: 'req-1', status: 'accepted' });
  });

  // ============= PUT =============

  it('put() should send PUT request with body', () => {
    const body = { name: 'Updated Name', bio: 'Updated bio' };

    service.put('/nurses/me', body).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/nurses/me`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush({});
  });

  // ============= DELETE =============

  it('delete() should send DELETE request without body', () => {
    service.delete('/nurses/me/services/svc-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/nurses/me/services/svc-1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toBeNull();
    req.flush({});
  });

  it('delete() should send DELETE request with body when provided', () => {
    const body = { reason: 'No longer needed' };

    service.delete('/items/item-1', { body }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/items/item-1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual(body);
    req.flush({});
  });

  // ============= Error handling =============

  it('should propagate HTTP error responses', () => {
    let errorResponse: any;

    service.get('/not-found').subscribe({
      error: (err) => { errorResponse = err; },
    });

    const req = httpMock.expectOne(`${baseUrl}/not-found`);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(errorResponse).toBeTruthy();
    expect(errorResponse.status).toBe(404);
  });

  afterEach(() => {
    httpMock.verify();
  });
});
