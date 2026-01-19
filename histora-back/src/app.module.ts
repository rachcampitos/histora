import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { ClinicalHistoryModule } from './clinical-history/clinical-history.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ClinicsModule } from './clinics/clinics.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { VitalsModule } from './vitals/vitals.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { PatientPortalModule } from './patient-portal/patient-portal.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PublicDirectoryModule } from './public-directory/public-directory.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { UploadsModule } from './uploads/uploads.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { NursesModule } from './nurses/nurses.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { AdminModule } from './admin/admin.module';
import { PatientVerificationModule } from './patient-verification/patient-verification.module';
import { PatientAddressesModule } from './patient-addresses/patient-addresses.module';
import { PatientRatingsModule } from './patient-ratings/patient-ratings.module';
import { SafetyModule } from './safety/safety.module';
import { TrackingModule } from './tracking/tracking.module';
import { AIAssistantModule } from './ai-assistant/ai-assistant.module';
import { ChatModule } from './chat/chat.module';
import { ServicePaymentsModule } from './service-payments/service-payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
    MongooseModule.forRoot(process.env.MONGO_URL!),
    UsersModule,
    AuthModule,
    ClinicsModule,
    SubscriptionsModule,
    PatientsModule,
    DoctorsModule,
    ClinicalHistoryModule,
    AppointmentsModule,
    VitalsModule,
    ConsultationsModule,
    PatientPortalModule,
    ReviewsModule,
    PublicDirectoryModule,
    NotificationsModule,
    PaymentsModule,
    UploadsModule,
    ChatbotModule,
    NursesModule,
    ServiceRequestsModule,
    AdminModule,
    PatientVerificationModule,
    PatientAddressesModule,
    PatientRatingsModule,
    SafetyModule,
    TrackingModule,
    AIAssistantModule,
    ChatModule,
    ServicePaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
