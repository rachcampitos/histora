import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Centralized logging service
 * - Masks sensitive data automatically
 * - Only logs in development mode by default
 * - Provides consistent logging interface
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly isProduction = environment.production;

  /**
   * Log debug information (only in development)
   */
  debug(message: string, ...args: unknown[]): void {
    if (!this.isProduction) {
      console.debug(`[DEBUG] ${this.maskSensitiveData(message)}`, ...this.maskArgs(args));
    }
  }

  /**
   * Log general information
   */
  info(message: string, ...args: unknown[]): void {
    if (!this.isProduction) {
      console.info(`[INFO] ${this.maskSensitiveData(message)}`, ...this.maskArgs(args));
    }
  }

  /**
   * Log warnings
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${this.maskSensitiveData(message)}`, ...this.maskArgs(args));
  }

  /**
   * Log errors (always logged, even in production)
   */
  error(message: string, error?: unknown, ...args: unknown[]): void {
    const maskedMessage = this.maskSensitiveData(message);

    if (error instanceof Error) {
      console.error(`[ERROR] ${maskedMessage}`, {
        name: error.name,
        message: this.maskSensitiveData(error.message),
        stack: this.isProduction ? undefined : error.stack
      }, ...this.maskArgs(args));
    } else {
      console.error(`[ERROR] ${maskedMessage}`, error, ...this.maskArgs(args));
    }
  }

  /**
   * Log with custom context prefix
   */
  withContext(context: string): ContextLogger {
    return {
      debug: (message: string, ...args: unknown[]) => this.debug(`[${context}] ${message}`, ...args),
      info: (message: string, ...args: unknown[]) => this.info(`[${context}] ${message}`, ...args),
      warn: (message: string, ...args: unknown[]) => this.warn(`[${context}] ${message}`, ...args),
      error: (message: string, error?: unknown, ...args: unknown[]) => this.error(`[${context}] ${message}`, error, ...args)
    };
  }

  /**
   * Mask sensitive data in strings
   */
  private maskSensitiveData(text: string): string {
    if (!text) return text;

    let masked = text;

    // Mask email addresses
    masked = masked.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      (email) => {
        const [local, domain] = email.split('@');
        return `${local.slice(0, 2)}***@${domain}`;
      }
    );

    // Mask phone numbers (Peruvian format)
    masked = masked.replace(/\b9\d{8}\b/g, '9*******');

    // Mask DNI (8 digits)
    masked = masked.replace(/\b\d{8}\b/g, '****');

    // Mask JWT tokens
    masked = masked.replace(
      /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
      '[JWT]'
    );

    return masked;
  }

  /**
   * Mask sensitive data in arguments
   */
  private maskArgs(args: unknown[]): unknown[] {
    return args.map(arg => {
      if (typeof arg === 'string') {
        return this.maskSensitiveData(arg);
      }
      if (arg && typeof arg === 'object') {
        return this.maskObject(arg as Record<string, unknown>);
      }
      return arg;
    });
  }

  /**
   * Mask sensitive fields in objects
   */
  private maskObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret', 'apiKey', 'dni', 'otp'];
    const partialMaskFields = ['email', 'phone', 'telefono'];

    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      if (sensitiveFields.some(f => lowerKey.includes(f))) {
        masked[key] = '[REDACTED]';
      } else if (partialMaskFields.some(f => lowerKey.includes(f)) && typeof value === 'string') {
        masked[key] = this.maskSensitiveData(value);
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        masked[key] = this.maskObject(value as Record<string, unknown>);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }
}

interface ContextLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: unknown, ...args: unknown[]): void;
}
