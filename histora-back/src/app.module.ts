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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URL ||
        'mongodb+srv://histora:historaApp2025@histora.pcb3mhu.mongodb.net/histora_db?retryWrites=true&w=majority',
    ),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
