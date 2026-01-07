import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

export interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  googleId: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') || '';
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET') || '';
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/auth/google/callback';

    const options: StrategyOptions = {
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    };

    super(options);

    console.log('GoogleStrategy initialized with:');
    console.log('  clientID:', clientID ? clientID.substring(0, 20) + '...' : 'NOT SET');
    console.log('  clientSecret:', clientSecret ? 'SET' : 'NOT SET');
    console.log('  callbackURL:', callbackURL);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, name, emails, photos } = profile;

    const user: GoogleUser = {
      email: emails?.[0]?.value || '',
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value,
      googleId: id,
    };

    done(null, user);
  }
}
