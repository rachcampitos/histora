import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { escapeHtml, stripHtmlTags, sanitizeMongoQuery } from '../utils/security.util';

/**
 * Interceptor that sanitizes incoming request body to prevent XSS attacks
 * Escapes HTML characters in string fields
 */
@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  // Fields that should be stripped of all HTML (plain text only)
  private readonly stripHtmlFields = [
    'name',
    'firstName',
    'lastName',
    'title',
    'specialty',
    'phone',
    'dni',
    'cepNumber',
  ];

  // Fields that should preserve some content but escape HTML
  private readonly escapeHtmlFields = [
    'bio',
    'description',
    'comment',
    'notes',
    'content',
    'message',
    'address',
  ];

  // Fields to skip entirely (passwords, tokens, etc.)
  private readonly skipFields = [
    'password',
    'confirmPassword',
    'currentPassword',
    'newPassword',
    'token',
    'refresh_token',
    'access_token',
    'email', // Validated by class-validator
    'url', // May contain special characters
    'photoUrl',
    'avatarUrl',
    'imageUrl',
    'selfieUrl',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body && typeof request.body === 'object') {
      // First sanitize NoSQL injection attempts (remove $ operators)
      request.body = sanitizeMongoQuery(request.body);
      // Then sanitize XSS
      request.body = this.sanitizeObject(request.body);
    }

    // Also sanitize query parameters (in-place to avoid read-only property error)
    if (request.query && typeof request.query === 'object') {
      const sanitizedQuery = sanitizeMongoQuery(request.query);
      // Modify in place instead of reassigning (request.query is read-only in newer Express)
      for (const key of Object.keys(request.query)) {
        if (!(key in sanitizedQuery)) {
          delete request.query[key];
        }
      }
      for (const [key, value] of Object.entries(sanitizedQuery)) {
        request.query[key] = value;
      }
    }

    return next.handle();
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized = { ...obj };

    for (const [key, value] of Object.entries(sanitized)) {
      // Skip certain fields
      if (this.skipFields.includes(key)) {
        continue;
      }

      if (typeof value === 'string') {
        if (this.stripHtmlFields.includes(key)) {
          // Strip all HTML tags
          sanitized[key] = stripHtmlTags(value);
        } else if (this.escapeHtmlFields.includes(key)) {
          // Escape HTML but preserve content
          sanitized[key] = escapeHtml(value);
        } else {
          // Default: strip dangerous tags but allow basic content
          sanitized[key] = this.sanitizeString(value);
        }
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) => {
          if (typeof item === 'string') {
            return this.sanitizeString(item);
          }
          if (item && typeof item === 'object') {
            return this.sanitizeObject(item as Record<string, unknown>);
          }
          return item;
        });
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
      }
    }

    return sanitized;
  }

  /**
   * Basic string sanitization - removes script tags and event handlers
   */
  private sanitizeString(input: string): string {
    if (!input) return input;

    let result = input;

    // Remove script tags
    result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers (onclick, onerror, etc.)
    result = result.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: URLs
    result = result.replace(/javascript:/gi, '');

    // Remove data: URLs that could contain scripts
    result = result.replace(/data:\s*text\/html/gi, '');

    return result.trim();
  }
}
