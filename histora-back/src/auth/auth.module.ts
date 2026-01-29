import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { AccountLockoutService } from './services/account-lockout.service';
import { CookieService } from './services/cookie.service';
import { LoginAttempt, LoginAttemptSchema } from './schema/login-attempt.schema';
import { UsersModule } from '../users/users.module';
import { NursesModule } from '../nurses/nurses.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailProvider } from '../notifications/providers/email.provider';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: LoginAttempt.name, schema: LoginAttemptSchema },
    ]),
    UsersModule,
    forwardRef(() => NursesModule),
    NotificationsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET must be defined in environment variables');
        }
        return {
          secret,
          signOptions: {
            expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '7d') as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, EmailProvider, AccountLockoutService, CookieService],
  exports: [AuthService, JwtModule, PassportModule, AccountLockoutService, CookieService],
})
export class AuthModule {}
