import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { VirtualEscortService, ActiveShare, EmergencyContact } from './virtual-escort.service';
import { environment } from '../../../environments/environment';

describe('VirtualEscortService', () => {
  let service: VirtualEscortService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        VirtualEscortService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(VirtualEscortService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= shareTracking =============

  describe('shareTracking', () => {
    it('should POST contact to /tracking/:id/share', () => {
      const contact: EmergencyContact = {
        name: 'Maria',
        phone: '999888777',
        relationship: 'madre',
      };
      const mockResponse = {
        tracking: {},
        shareUrl: 'https://app.nurse-lite.com/track/abc',
        token: 'tok-123',
      };

      service.shareTracking('req-1', contact).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/tracking/req-1/share`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(contact);
      req.flush(mockResponse);
    });

    it('should add share to activeShares$ on success', () => {
      const contact: EmergencyContact = {
        name: 'Maria',
        phone: '999888777',
        relationship: 'madre',
      };
      const mockResponse = {
        tracking: {},
        shareUrl: 'https://app.nurse-lite.com/track/abc',
        token: 'tok-123',
      };

      service.shareTracking('req-1', contact).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/tracking/req-1/share`);
      req.flush(mockResponse);

      expect(service.getActiveSharesCount()).toBe(1);
    });

    it('should not add duplicate share if phone already exists', () => {
      const contact: EmergencyContact = {
        name: 'Maria',
        phone: '999888777',
        relationship: 'madre',
      };
      const mockResponse = {
        tracking: {},
        shareUrl: 'https://app.nurse-lite.com/track/abc',
        token: 'tok-123',
      };

      // First share
      service.shareTracking('req-1', contact).subscribe();
      httpMock.expectOne(`${apiUrl}/tracking/req-1/share`).flush(mockResponse);

      // Second share with same phone
      service.shareTracking('req-1', contact).subscribe();
      httpMock.expectOne(`${apiUrl}/tracking/req-1/share`).flush(mockResponse);

      expect(service.getActiveSharesCount()).toBe(1);
    });
  });

  // ============= revokeShare =============

  describe('revokeShare', () => {
    it('should DELETE /tracking/:id/share with phone query param', () => {
      service.revokeShare('req-1', '999888777').subscribe();

      const req = httpMock.expectOne(
        (r) =>
          r.url === `${apiUrl}/tracking/req-1/share` &&
          r.params.get('phone') === '999888777'
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should remove share from activeShares$ on success', () => {
      // Set up an active share first
      service.setActiveShares([
        { name: 'Maria', phone: '999888777', relationship: 'madre', trackingUrl: 'url1', isActive: true },
        { name: 'Jose', phone: '999777666', relationship: 'padre', trackingUrl: 'url2', isActive: true },
      ]);

      expect(service.getActiveSharesCount()).toBe(2);

      service.revokeShare('req-1', '999888777').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === `${apiUrl}/tracking/req-1/share`
      );
      req.flush(null);

      expect(service.getActiveSharesCount()).toBe(1);
    });
  });

  // ============= generateWhatsAppShareLink =============

  describe('generateWhatsAppShareLink', () => {
    it('should build WhatsApp URL with Peru country code for 9-digit number', () => {
      const contact: EmergencyContact = {
        name: 'Maria',
        phone: '999888777',
        relationship: 'madre',
      };

      const result = service.generateWhatsAppShareLink(
        contact,
        'https://app.nurse-lite.com/track/abc',
        'Ana Lopez'
      );

      expect(result).toContain('https://wa.me/51999888777');
      expect(result).toContain('text=');
      expect(result).toContain('Maria');
      expect(result).toContain('Ana%20Lopez');
    });

    it('should not add country code when phone already starts with 51', () => {
      const contact: EmergencyContact = {
        name: 'Jose',
        phone: '51999888777',
        relationship: 'padre',
      };

      const result = service.generateWhatsAppShareLink(contact, 'https://track.url', 'Ana');

      expect(result).toContain('https://wa.me/51999888777');
      // Should NOT be 5151999888777
      expect(result).not.toContain('5151');
    });

    it('should strip non-digit characters from phone', () => {
      const contact: EmergencyContact = {
        name: 'Maria',
        phone: '+51 999-888-777',
        relationship: 'madre',
      };

      const result = service.generateWhatsAppShareLink(contact, 'https://track.url', 'Ana');

      expect(result).toContain('https://wa.me/51999888777');
    });
  });

  // ============= setActiveShares =============

  describe('setActiveShares', () => {
    it('should filter only active shares', () => {
      const shares: ActiveShare[] = [
        { name: 'Maria', phone: '999888777', relationship: 'madre', trackingUrl: 'url1', isActive: true },
        { name: 'Jose', phone: '999777666', relationship: 'padre', trackingUrl: 'url2', isActive: false },
      ];

      service.setActiveShares(shares);

      expect(service.getActiveSharesCount()).toBe(1);
    });

    it('should emit filtered shares on activeShares$ observable', () => {
      const shares: ActiveShare[] = [
        { name: 'Maria', phone: '999888777', relationship: 'madre', trackingUrl: 'url1', isActive: true },
      ];

      let emittedShares: ActiveShare[] = [];
      service.activeShares$.subscribe((s) => (emittedShares = s));

      service.setActiveShares(shares);

      expect(emittedShares.length).toBe(1);
      expect(emittedShares[0].name).toBe('Maria');
    });
  });

  // ============= clearShares =============

  describe('clearShares', () => {
    it('should empty all active shares', () => {
      service.setActiveShares([
        { name: 'Maria', phone: '999888777', relationship: 'madre', trackingUrl: 'url1', isActive: true },
      ]);

      expect(service.getActiveSharesCount()).toBe(1);

      service.clearShares();

      expect(service.getActiveSharesCount()).toBe(0);
    });
  });

  // ============= getActiveSharesCount =============

  describe('getActiveSharesCount', () => {
    it('should return 0 initially', () => {
      expect(service.getActiveSharesCount()).toBe(0);
    });

    it('should return correct count after setting shares', () => {
      service.setActiveShares([
        { name: 'A', phone: '1', relationship: 'r', trackingUrl: 'u', isActive: true },
        { name: 'B', phone: '2', relationship: 'r', trackingUrl: 'u', isActive: true },
        { name: 'C', phone: '3', relationship: 'r', trackingUrl: 'u', isActive: true },
      ]);

      expect(service.getActiveSharesCount()).toBe(3);
    });
  });
});
