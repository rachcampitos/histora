import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService, ApiError } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
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

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get', () => {
    it('should make GET request to correct endpoint', () => {
      const mockData = { id: 1, name: 'Test' };

      service.get<typeof mockData>('/test').subscribe((data) => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should include query params when provided', () => {
      const params = { page: 1, limit: 10, active: true };

      service.get('/test', params).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/test`);
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('10');
      expect(req.request.params.get('active')).toBe('true');
      req.flush({});
    });

    it('should handle server error', () => {
      let error: ApiError | undefined;

      service.get('/test').subscribe({
        error: (err) => (error = err),
      });

      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush(
        { message: 'Not Found', error: 'Not Found' },
        { status: 404, statusText: 'Not Found' }
      );

      expect(error).toBeDefined();
      expect(error!.statusCode).toBe(404);
      expect(error!.message).toBe('Not Found');
    });
  });

  describe('post', () => {
    it('should make POST request with body', () => {
      const requestBody = { name: 'Test', value: 123 };
      const mockResponse = { id: 1, ...requestBody };

      service.post<typeof mockResponse>('/test', requestBody).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(requestBody);
      req.flush(mockResponse);
    });

    it('should handle validation error', () => {
      let error: ApiError | undefined;

      service.post('/test', {}).subscribe({
        error: (err) => (error = err),
      });

      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush(
        { message: 'Validation failed' },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(error).toBeDefined();
      expect(error!.statusCode).toBe(400);
    });
  });

  describe('patch', () => {
    it('should make PATCH request', () => {
      const requestBody = { name: 'Updated' };

      service.patch('/test/1', requestBody).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(requestBody);
      req.flush({});
    });
  });

  describe('delete', () => {
    it('should make DELETE request', () => {
      service.delete('/test/1').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
