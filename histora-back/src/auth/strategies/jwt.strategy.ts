import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { CookieService } from '../services/cookie.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  clinicId?: string;
  nurseId?: string;
}

/**
 * Custom extractor that tries cookies first, then falls back to Authorization header
 * This provides backwards compatibility while prioritizing secure HttpOnly cookies
 */
const cookieOrHeaderExtractor = (req: Request): string | null => {
  // First, try to extract from HttpOnly cookie (more secure)
  const tokenFromCookie = req.cookies?.[CookieService.ACCESS_TOKEN_COOKIE];
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  // Fallback to Authorization header for mobile apps and backwards compatibility
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET must be defined in environment variables');
    }
    super({
      jwtFromRequest: cookieOrHeaderExtractor,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findByEmail(payload.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      clinicId: payload.clinicId,
      nurseId: payload.nurseId,
    };
  }
}
