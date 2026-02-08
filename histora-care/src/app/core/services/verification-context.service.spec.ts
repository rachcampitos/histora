import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { VerificationContextService } from './verification-context.service';

describe('VerificationContextService', () => {
  let service: VerificationContextService;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    service = new VerificationContextService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save context with timestamp', () => {
    const now = 1700000000000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    service.saveContext({
      returnUrl: '/nurse/123',
      nurseId: '123',
      nurseName: 'Maria',
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'verification_context',
      JSON.stringify({
        returnUrl: '/nurse/123',
        nurseId: '123',
        nurseName: 'Maria',
        timestamp: now,
      })
    );
  });

  it('should get saved context', () => {
    const now = Date.now();
    const context = {
      returnUrl: '/nurse/123',
      nurseId: '123',
      nurseName: 'Maria',
      timestamp: now,
    };

    // Manually set in localStorage mock
    localStorage.setItem('verification_context', JSON.stringify(context));
    vi.clearAllMocks(); // Clear the setItem call from setup

    const result = service.getContext();
    expect(result).toEqual(context);
  });

  it('should return null when no context is stored', () => {
    const result = service.getContext();
    expect(result).toBeNull();
  });

  it('should return null for expired context (>30 min)', () => {
    const thirtyOneMinutesAgo = Date.now() - 31 * 60 * 1000;
    const context = {
      returnUrl: '/nurse/123',
      timestamp: thirtyOneMinutesAgo,
    };

    localStorage.setItem('verification_context', JSON.stringify(context));

    const result = service.getContext();
    expect(result).toBeNull();
    // Should have been cleared
    expect(localStorage.removeItem).toHaveBeenCalledWith('verification_context');
  });

  it('should return null for invalid JSON', () => {
    localStorage.setItem('verification_context', '{invalid-json');

    const result = service.getContext();
    expect(result).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('verification_context');
  });

  it('should clear context', () => {
    localStorage.setItem('verification_context', '{}');
    service.clearContext();
    expect(localStorage.removeItem).toHaveBeenCalledWith('verification_context');
  });

  it('should return true for hasContext when valid context exists', () => {
    const context = {
      returnUrl: '/nurse/123',
      timestamp: Date.now(),
    };
    localStorage.setItem('verification_context', JSON.stringify(context));

    expect(service.hasContext()).toBe(true);
  });

  it('should return false for hasContext when no context', () => {
    expect(service.hasContext()).toBe(false);
  });

  it('should return false for hasContext when context is expired', () => {
    const context = {
      returnUrl: '/nurse/123',
      timestamp: Date.now() - 31 * 60 * 1000,
    };
    localStorage.setItem('verification_context', JSON.stringify(context));

    expect(service.hasContext()).toBe(false);
  });

  describe('getCTAText', () => {
    it('should return nurse name text when nurseName is present', () => {
      const context = {
        returnUrl: '/nurse/123',
        nurseName: 'Maria',
        timestamp: Date.now(),
      };
      localStorage.setItem('verification_context', JSON.stringify(context));

      expect(service.getCTAText()).toBe('Continuar con Maria');
    });

    it('should return "Continuar" when returnUrl exists but no nurseName', () => {
      const context = {
        returnUrl: '/nurse/123',
        timestamp: Date.now(),
      };
      localStorage.setItem('verification_context', JSON.stringify(context));

      expect(service.getCTAText()).toBe('Continuar');
    });

    it('should return "Buscar enfermeras" when no context', () => {
      expect(service.getCTAText()).toBe('Buscar enfermeras');
    });
  });
});
