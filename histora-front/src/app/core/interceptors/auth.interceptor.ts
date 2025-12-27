import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, catchError, throwError, Observable } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';

// Track if we're currently refreshing to avoid duplicate calls
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const authService = inject(AuthService);

  // Skip auth header for public endpoints
  const publicEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/refresh', '/public/'];
  const isPublicEndpoint = publicEndpoints.some((endpoint) => req.url.includes(endpoint));

  if (isPublicEndpoint) {
    return next(req);
  }

  return from(storage.getToken()).pipe(
    switchMap((token) => {
      const authReq = token
        ? req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          })
        : req;

      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401 && !isPublicEndpoint) {
            return handleUnauthorizedError(req, next, authService, storage);
          }
          return throwError(() => error);
        })
      );
    })
  );
};

function handleUnauthorizedError(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  storage: StorageService
): Observable<any> {
  if (isRefreshing) {
    // If already refreshing, wait and retry with new token
    return from(storage.getToken()).pipe(
      switchMap((token) => {
        if (token) {
          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          });
          return next(retryReq);
        }
        return throwError(() => new Error('No token after refresh'));
      })
    );
  }

  isRefreshing = true;

  return authService.refreshToken().pipe(
    switchMap((response) => {
      isRefreshing = false;
      // Retry the original request with new token
      const retryReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${response.access_token}`,
        },
      });
      return next(retryReq);
    }),
    catchError((error) => {
      isRefreshing = false;
      // Refresh failed, logout will be handled by AuthService
      return throwError(() => error);
    })
  );
}
