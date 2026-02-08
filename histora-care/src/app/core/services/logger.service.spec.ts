import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { LoggerService } from './logger.service';

// Mock the environment module to control production flag
vi.mock('../../../environments/environment', () => ({
  environment: {
    production: false,
  },
}));

import { environment } from '../../../environments/environment';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to non-production
    (environment as { production: boolean }).production = false;
    service = new LoggerService();
  });

  // ---- Data masking ----

  describe('data masking', () => {
    it('should mask email addresses', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      service.debug('User test@example.com logged in');
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('te***@example.com'),
      );
      expect(spy).toHaveBeenCalledWith(
        expect.not.stringContaining('test@example.com'),
      );
    });

    it('should mask Peruvian phone numbers (9 digits starting with 9)', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      service.debug('Phone: 987654321');
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('9*******'),
      );
      expect(spy).toHaveBeenCalledWith(
        expect.not.stringContaining('987654321'),
      );
    });

    it('should mask DNI (8 digit numbers)', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      service.debug('DNI: 44119536');
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('****'),
      );
      expect(spy).toHaveBeenCalledWith(
        expect.not.stringContaining('44119536'),
      );
    });

    it('should mask JWT tokens', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      service.debug(`Token: ${jwt}`);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('[JWT]'),
      );
      expect(spy).toHaveBeenCalledWith(
        expect.not.stringContaining('eyJhbGci'),
      );
    });

    it('should mask sensitive object fields (password, token)', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      service.debug('User data', { password: 'secret123', token: 'abc', name: 'Maria' });

      const secondArg = spy.mock.calls[0][1] as Record<string, unknown>;
      expect(secondArg['password']).toBe('[REDACTED]');
      expect(secondArg['token']).toBe('[REDACTED]');
      expect(secondArg['name']).toBe('Maria');
    });

    it('should partially mask email fields in objects', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      service.debug('Data', { email: 'test@example.com' });

      const secondArg = spy.mock.calls[0][1] as Record<string, unknown>;
      expect(secondArg['email']).toBe('te***@example.com');
    });

    it('should mask nested sensitive object fields', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      service.debug('Data', { user: { password: 'secret', name: 'Juan' } });

      const secondArg = spy.mock.calls[0][1] as Record<string, unknown>;
      const user = secondArg['user'] as Record<string, unknown>;
      expect(user['password']).toBe('[REDACTED]');
      expect(user['name']).toBe('Juan');
    });
  });

  // ---- Log levels and production behavior ----

  describe('log levels', () => {
    it('should log debug in development', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      service.debug('test message');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
    });

    it('should log info in development', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      service.info('test info');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    });

    it('should NOT log debug in production', () => {
      (environment as { production: boolean }).production = true;
      const prodService = new LoggerService();
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      prodService.debug('should not appear');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should NOT log info in production', () => {
      (environment as { production: boolean }).production = true;
      const prodService = new LoggerService();
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      prodService.info('should not appear');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should log warn in production', () => {
      (environment as { production: boolean }).production = true;
      const prodService = new LoggerService();
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      prodService.warn('warning message');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'));
    });

    it('should log error in production', () => {
      (environment as { production: boolean }).production = true;
      const prodService = new LoggerService();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      prodService.error('error message');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'), undefined);
    });
  });

  // ---- Error handling ----

  describe('error handling', () => {
    it('should handle Error instances with name and message', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const err = new TypeError('something broke');
      service.error('Operation failed', err);

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Operation failed'),
        expect.objectContaining({
          name: 'TypeError',
          message: 'something broke',
        }),
      );
    });

    it('should include stack in non-production error logs', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const err = new Error('with stack');
      service.error('fail', err);

      const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
      expect(errorObj['stack']).toBeDefined();
    });

    it('should exclude stack in production error logs', () => {
      (environment as { production: boolean }).production = true;
      const prodService = new LoggerService();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const err = new Error('with stack');
      prodService.error('fail', err);

      const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
      expect(errorObj['stack']).toBeUndefined();
    });

    it('should pass non-Error values as-is in error()', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      service.error('failed', 'string error');

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] failed'),
        'string error',
      );
    });
  });

  // ---- withContext ----

  describe('withContext', () => {
    it('should prefix messages with context', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const logger = service.withContext('AuthService');
      logger.debug('user logged in');
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('[AuthService] user logged in'),
      );
    });

    it('should support all log levels through context logger', () => {
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const logger = service.withContext('TestCtx');
      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');

      expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('[TestCtx] d'));
      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('[TestCtx] i'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[TestCtx] w'));
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[TestCtx] e'), undefined);
    });
  });
});
