import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '../service/token.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private tokenService: TokenService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Only add token to requests going to our API
    if (request.url.startsWith(environment.apiUrl)) {
      const bearerToken = this.tokenService.getBearerToken();

      if (bearerToken) {
        request = request.clone({
          setHeaders: {
            Authorization: bearerToken,
          },
        });
      }
    }

    return next.handle(request);
  }
}
