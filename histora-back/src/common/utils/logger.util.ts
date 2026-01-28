import { Logger } from '@nestjs/common';

/**
 * GDPR-compliant logger utility
 * Automatically masks sensitive data before logging
 */
export class SecureLogger {
  private readonly logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  /**
   * Mask sensitive data in any input (string, object, or array)
   */
  private maskSensitive(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return this.maskString(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.maskSensitive(item));
    }

    if (typeof data === 'object') {
      return this.maskObject(data as Record<string, unknown>);
    }

    return data;
  }

  /**
   * Mask sensitive patterns in strings
   */
  private maskString(str: string): string {
    let masked = str;

    // Mask email addresses
    masked = masked.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      (email) => {
        const [local, domain] = email.split('@');
        return `${local.slice(0, 2)}***@${domain}`;
      },
    );

    // Mask phone numbers (Peruvian format: 9xxxxxxxx)
    masked = masked.replace(/\b9\d{8}\b/g, '9*******');

    // Mask DNI numbers (8 digits)
    masked = masked.replace(/\b\d{8}\b/g, '****');

    // Mask CEP numbers (typically 5-6 digits)
    masked = masked.replace(/\bCEP\s*[:=]?\s*\d{5,6}\b/gi, 'CEP: ***');

    // Mask JWT tokens
    masked = masked.replace(
      /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
      '[JWT]',
    );

    // Mask MongoDB ObjectIds when they appear in specific patterns
    masked = masked.replace(
      /password['":\s]+[a-zA-Z0-9$./]{20,}/gi,
      'password: [REDACTED]',
    );

    // Mask credit card numbers (basic patterns)
    masked = masked.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '****-****-****-****');

    return masked;
  }

  /**
   * Mask sensitive fields in objects
   */
  private maskObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = [
      'password',
      'passwordHash',
      'refreshToken',
      'accessToken',
      'token',
      'secret',
      'apiKey',
      'privateKey',
      'creditCard',
      'cardNumber',
      'cvv',
      'ssn',
      'dni',
      'otp',
      'pin',
    ];

    const partialMaskFields = [
      'email',
      'phone',
      'telefono',
      'celular',
      'mobile',
    ];

    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Fully redact sensitive fields
      if (sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()))) {
        masked[key] = '[REDACTED]';
        continue;
      }

      // Partially mask certain fields
      if (partialMaskFields.some((field) => lowerKey.includes(field.toLowerCase()))) {
        if (typeof value === 'string') {
          masked[key] = this.maskString(value);
        } else {
          masked[key] = '[REDACTED]';
        }
        continue;
      }

      // Recursively mask nested objects and arrays
      masked[key] = this.maskSensitive(value);
    }

    return masked;
  }

  /**
   * Log with automatic sensitive data masking
   */
  log(message: string, ...optionalParams: unknown[]): void {
    const maskedMessage = this.maskString(message);
    const maskedParams = optionalParams.map((p) => this.maskSensitive(p));
    this.logger.log(maskedMessage, ...maskedParams);
  }

  /**
   * Warning log with automatic sensitive data masking
   */
  warn(message: string, ...optionalParams: unknown[]): void {
    const maskedMessage = this.maskString(message);
    const maskedParams = optionalParams.map((p) => this.maskSensitive(p));
    this.logger.warn(maskedMessage, ...maskedParams);
  }

  /**
   * Error log with automatic sensitive data masking
   */
  error(message: string, trace?: string, ...optionalParams: unknown[]): void {
    const maskedMessage = this.maskString(message);
    const maskedTrace = trace ? this.maskString(trace) : undefined;
    const maskedParams = optionalParams.map((p) => this.maskSensitive(p));
    this.logger.error(maskedMessage, maskedTrace, ...maskedParams);
  }

  /**
   * Debug log with automatic sensitive data masking
   */
  debug(message: string, ...optionalParams: unknown[]): void {
    const maskedMessage = this.maskString(message);
    const maskedParams = optionalParams.map((p) => this.maskSensitive(p));
    this.logger.debug(maskedMessage, ...maskedParams);
  }

  /**
   * Verbose log with automatic sensitive data masking
   */
  verbose(message: string, ...optionalParams: unknown[]): void {
    const maskedMessage = this.maskString(message);
    const maskedParams = optionalParams.map((p) => this.maskSensitive(p));
    this.logger.verbose(maskedMessage, ...maskedParams);
  }
}

/**
 * Standalone function to mask sensitive data
 * Useful for one-off masking needs
 */
export function maskSensitiveData(data: unknown): unknown {
  const secureLogger = new SecureLogger('');
  return (secureLogger as any).maskSensitive(data);
}

/**
 * Mask identifier for logging (emails, IPs, phones)
 * GDPR compliant masking for user identifiers
 */
export function maskIdentifier(identifier: string): string {
  if (!identifier) return identifier;

  // Email masking
  if (identifier.includes('@')) {
    const [local, domain] = identifier.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
  }

  // IP address masking (last two octets)
  const ipParts = identifier.split('.');
  if (ipParts.length === 4 && ipParts.every((p) => /^\d{1,3}$/.test(p))) {
    return `${ipParts[0]}.${ipParts[1]}.***.***`;
  }

  // Phone number masking
  if (/^9\d{8}$/.test(identifier)) {
    return '9*******';
  }

  // Generic masking (show first 4 chars)
  return identifier.slice(0, 4) + '***';
}
