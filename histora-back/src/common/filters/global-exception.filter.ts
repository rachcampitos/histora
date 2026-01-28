import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

/**
 * Global exception filter to prevent internal error details from leaking
 * Logs full error details server-side while returning safe messages to clients
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ha ocurrido un error interno';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, any>;
        message = responseObj.message || message;
        error = responseObj.error || error;

        // Handle validation errors array
        if (Array.isArray(message)) {
          message = message.join(', ');
        }
      }
    } else if (exception instanceof Error) {
      // Log the actual error for debugging but don't expose to client
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        this.sanitizeStackTrace(exception.stack),
      );

      // Check for specific error types to provide better messages
      if (exception.name === 'MongoServerError') {
        const mongoError = exception as any;
        if (mongoError.code === 11000) {
          status = HttpStatus.CONFLICT;
          message = 'El registro ya existe';
          error = 'Conflict';
        }
      } else if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Error de validación';
        error = 'Bad Request';
      } else if (exception.name === 'CastError') {
        status = HttpStatus.BAD_REQUEST;
        message = 'ID inválido';
        error = 'Bad Request';
      }
    }

    // Log all errors with masked sensitive data
    const logMessage = `[${request.method}] ${request.url} - ${status} - ${this.maskSensitiveData(message)}`;
    if (status >= 500) {
      this.logger.error(logMessage);
    } else if (status >= 400) {
      this.logger.warn(logMessage);
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Mask sensitive data in error messages for logging
   */
  private maskSensitiveData(message: string): string {
    if (!message) return message;

    // Mask email addresses
    let masked = message.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      (email) => {
        const [local, domain] = email.split('@');
        return `${local.slice(0, 2)}***@${domain}`;
      },
    );

    // Mask phone numbers (Peruvian format)
    masked = masked.replace(/\b9\d{8}\b/g, '9***');

    // Mask DNI numbers (8 digits)
    masked = masked.replace(/\b\d{8}\b/g, '****');

    // Mask JWT tokens
    masked = masked.replace(
      /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
      '[JWT]',
    );

    return masked;
  }

  /**
   * Sanitize stack trace to remove sensitive paths
   */
  private sanitizeStackTrace(stack?: string): string {
    if (!stack) return '';

    // Remove absolute paths, keep only relative
    return stack.replace(/\/[^\s:]+\//g, '/****/');
  }
}
