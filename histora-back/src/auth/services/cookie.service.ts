import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge: number;
  domain?: string;
}

@Injectable()
export class CookieService {
  private readonly isProduction: boolean;
  private readonly domain: string | undefined;

  // Cookie names
  static readonly ACCESS_TOKEN_COOKIE = 'access_token';
  static readonly REFRESH_TOKEN_COOKIE = 'refresh_token';

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    this.domain = this.isProduction
      ? this.configService.get<string>('COOKIE_DOMAIN', '.historahealth.com')
      : undefined;
  }

  /**
   * Get base cookie options for secure HttpOnly cookies
   */
  private getBaseCookieOptions(): Partial<CookieOptions> {
    return {
      httpOnly: true,
      secure: this.isProduction, // Only HTTPS in production
      sameSite: this.isProduction ? 'strict' : 'lax',
      path: '/',
      ...(this.domain && { domain: this.domain }),
    };
  }

  /**
   * Set access token cookie
   * @param res Express Response
   * @param token JWT access token
   * @param expiresInMs Token expiration in milliseconds
   */
  setAccessTokenCookie(res: Response, token: string, expiresInMs: number): void {
    res.cookie(CookieService.ACCESS_TOKEN_COOKIE, token, {
      ...this.getBaseCookieOptions(),
      maxAge: expiresInMs,
    });
  }

  /**
   * Set refresh token cookie
   * @param res Express Response
   * @param token Refresh token
   * @param expiresInDays Token expiration in days
   */
  setRefreshTokenCookie(res: Response, token: string, expiresInDays: number): void {
    const maxAge = expiresInDays * 24 * 60 * 60 * 1000; // Convert days to ms
    res.cookie(CookieService.REFRESH_TOKEN_COOKIE, token, {
      ...this.getBaseCookieOptions(),
      maxAge,
    });
  }

  /**
   * Set both access and refresh token cookies
   */
  setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    accessTokenExpiresInMs: number,
    refreshTokenExpiresInDays: number,
  ): void {
    this.setAccessTokenCookie(res, accessToken, accessTokenExpiresInMs);
    this.setRefreshTokenCookie(res, refreshToken, refreshTokenExpiresInDays);
  }

  /**
   * Clear all auth cookies (for logout)
   */
  clearAuthCookies(res: Response): void {
    const clearOptions = {
      ...this.getBaseCookieOptions(),
      maxAge: 0,
    };

    res.cookie(CookieService.ACCESS_TOKEN_COOKIE, '', clearOptions);
    res.cookie(CookieService.REFRESH_TOKEN_COOKIE, '', clearOptions);
  }

  /**
   * Extract access token from request cookies
   */
  getAccessTokenFromCookies(req: Request): string | undefined {
    return req.cookies?.[CookieService.ACCESS_TOKEN_COOKIE];
  }

  /**
   * Extract refresh token from request cookies
   */
  getRefreshTokenFromCookies(req: Request): string | undefined {
    return req.cookies?.[CookieService.REFRESH_TOKEN_COOKIE];
  }

  /**
   * Convert expiry string to milliseconds
   * Supports: '1h', '4h', '1d', '7d', '30d', etc.
   */
  parseExpiryToMs(expiry: string): number {
    const match = expiry.match(/^(\d+)([hdwmy])$/);
    if (!match) {
      return 3600000; // Default to 1 hour
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'w':
        return value * 7 * 24 * 60 * 60 * 1000;
      case 'm':
        return value * 30 * 24 * 60 * 60 * 1000;
      case 'y':
        return value * 365 * 24 * 60 * 60 * 1000;
      default:
        return 3600000;
    }
  }
}
