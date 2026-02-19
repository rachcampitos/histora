import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { validate } from './config/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadsModule } from './uploads/uploads.module';
import { NursesModule } from './nurses/nurses.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { AdminModule } from './admin/admin.module';
import { PatientVerificationModule } from './patient-verification/patient-verification.module';
import { PatientAddressesModule } from './patient-addresses/patient-addresses.module';
import { PatientRatingsModule } from './patient-ratings/patient-ratings.module';
import { SafetyModule } from './safety/safety.module';
import { TrackingModule } from './tracking/tracking.module';
import { ChatModule } from './chat/chat.module';
import { ServicePaymentsModule } from './service-payments/service-payments.module';
import { HealthModule } from './health/health.module';
import { CacheModule } from './common/cache';
import { EncryptionModule } from './common/encryption';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { ComplaintsModule } from './complaints/complaints.module';

@Module({
  imports: [
    // Sentry module for error tracking - must be first
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
      cache: true,
    }),
    ScheduleModule.forRoot(),
    // Rate limiting: 100 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 1000, // 1000 requests per hour
      },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URL'),
      }),
    }),
    UsersModule,
    AuthModule,
    NotificationsModule,
    UploadsModule,
    NursesModule,
    ServiceRequestsModule,
    AdminModule,
    PatientVerificationModule,
    PatientAddressesModule,
    PatientRatingsModule,
    SafetyModule,
    TrackingModule,
    ChatModule,
    ServicePaymentsModule,
    HealthModule,
    CacheModule,
    EncryptionModule,
    WhatsAppModule,
    ComplaintsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Sentry global exception filter - captures all unhandled exceptions
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
