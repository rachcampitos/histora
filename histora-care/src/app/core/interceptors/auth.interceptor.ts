import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, from, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Bypass service worker for auth endpoints (login/register) to prevent duplicate requests
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
      if (error.status === 401) {
        // Try to refresh token
        return from(authService.refreshToken()).pipe(
          switchMap(newToken => {
            if (newToken) {
              const authReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(authReq);
            }
            // Refresh failed, logout
            authService.logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
