import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
} from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';
import { createMockAuthService } from '../../../testing';

/** Flush microtasks so from(promise) in the interceptor resolves */
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let mockAuth: ReturnType<typeof createMockAuthService>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth = createMockAuthService();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ============= Token injection =============

  it('should add Authorization header when token exists', async () => {
    mockAuth.getToken.mockResolvedValue('test-token');

    http.get('/api/nurses/me').subscribe();
    await flush();

    const req = httpMock.expectOne('/api/nurses/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('should not add Authorization header when no token', async () => {
    mockAuth.getToken.mockResolvedValue(null);

    http.get('/api/health').subscribe();
    await flush();

    const req = httpMock.expectOne('/api/health');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  // ============= Auth endpoint bypass =============

  it('should add ngsw-bypass header for login requests', () => {
    http.post('/api/auth/login', { email: 'test@test.com', password: '123' }).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.get('ngsw-bypass')).toBe('true');
    req.flush({});
  });

  it('should add ngsw-bypass header for register requests', () => {
    http.post('/api/auth/register', { email: 'test@test.com' }).subscribe();

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.headers.get('ngsw-bypass')).toBe('true');
    req.flush({});
  });

  // ============= 401 Token refresh =============

  it('should attempt token refresh on 401', async () => {
    mockAuth.getToken.mockResolvedValue('expired-token');
    mockAuth.refreshToken.mockResolvedValue('new-token');

    http.get('/api/nurses/me').subscribe();
    await flush();

    const req = httpMock.expectOne('/api/nurses/me');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Wait for refreshToken promise + from() to resolve
    await flush();

    const retryReq = httpMock.expectOne('/api/nurses/me');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({});
  });

  it('should logout when refresh returns null', async () => {
    mockAuth.getToken.mockResolvedValue('expired-token');
    mockAuth.refreshToken.mockResolvedValue(null);

    let error: any;
    http.get('/api/nurses/me').subscribe({ error: (e) => { error = e; } });
    await flush();

    const req = httpMock.expectOne('/api/nurses/me');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    await flush();

    expect(mockAuth.logout).toHaveBeenCalled();
  });

  it('should logout when refresh throws', async () => {
    mockAuth.getToken.mockResolvedValue('expired-token');
    mockAuth.refreshToken.mockRejectedValue(new Error('Refresh failed'));

    let error: any;
    http.get('/api/nurses/me').subscribe({ error: (e) => { error = e; } });
    await flush();

    const req = httpMock.expectOne('/api/nurses/me');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    await flush();

    expect(mockAuth.logout).toHaveBeenCalled();
  });

  it('should not refresh on 401 for auth/refresh endpoint', async () => {
    mockAuth.getToken.mockResolvedValue('some-token');

    http.post('/api/auth/refresh', {}).subscribe({ error: () => {} });
    await flush();

    const req = httpMock.expectOne('/api/auth/refresh');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    await flush();

    expect(mockAuth.refreshToken).not.toHaveBeenCalled();
  });

  // ============= Non-401 errors =============

  it('should propagate non-401 errors without refresh', async () => {
    mockAuth.getToken.mockResolvedValue('token');
    let error: any;

    http.get('/api/something').subscribe({ error: (e) => { error = e; } });
    await flush();

    const req = httpMock.expectOne('/api/something');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(error).toBeTruthy();
    expect(error.status).toBe(500);
    expect(mockAuth.refreshToken).not.toHaveBeenCalled();
  });
});
