import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientVerificationService } from './patient-verification.service';
import { PatientVerificationController } from './patient-verification.controller';
import { PatientVerification, PatientVerificationSchema } from './schema/patient-verification.schema';
import { VerificationCode, VerificationCodeSchema } from './schema/verification-code.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatientVerification.name, schema: PatientVerificationSchema },
      { name: VerificationCode.name, schema: VerificationCodeSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [PatientVerificationController],
  providers: [PatientVerificationService],
  exports: [PatientVerificationService],
})
export class PatientVerificationModule {}
