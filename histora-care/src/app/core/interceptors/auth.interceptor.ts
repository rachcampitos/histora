import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, from, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Track if we're currently refreshing to prevent multiple simultaneous refresh calls
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip auth handling for auth endpoints that don't need token refresh
  const skipRefreshUrls = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
  const shouldSkipRefresh = skipRefreshUrls.some(url => req.url.includes(url));

  // Bypass service worker for auth endpoints to prevent duplicate requests
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    const bypassReq = req.clone({
      setHeaders: {
        'ngsw-bypass': 'true'
      }
    });
    return next(bypassReq);
  }

  return from(authService.getToken()).pipe(
    switchMap(token => {
      if (token) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      }
      return next(req);
    }),
    catchError((error: HttpErrorResponse) => {
      // Only try to refresh if:
      // 1. Error is 401
      // 2. Not already refreshing
      // 3. Not a request that should skip refresh (auth endpoints)
      if (error.status === 401 && !isRefreshing && !shouldSkipRefresh) {
        isRefreshing = true;

        return from(authService.refreshToken()).pipe(
          switchMap(newToken => {
            isRefreshing = false;
            if (newToken) {
              const authReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(authReq);
            }
            // Refresh failed, logout silently
            authService.logout();
            return throwError(() => error);
          }),
          catchError(refreshError => {
            isRefreshing = false;
            // Refresh request itself failed, logout
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
