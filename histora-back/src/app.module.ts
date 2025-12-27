import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
