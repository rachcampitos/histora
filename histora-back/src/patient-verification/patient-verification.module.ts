import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientVerificationService } from './patient-verification.service';
import { PatientVerificationController } from './patient-verification.controller';
import { PatientVerification, PatientVerificationSchema } from './schema/patient-verification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatientVerification.name, schema: PatientVerificationSchema },
    ]),
  ],
  controllers: [PatientVerificationController],
  providers: [PatientVerificationService],
  exports: [PatientVerificationService],
})
export class PatientVerificationModule {}
