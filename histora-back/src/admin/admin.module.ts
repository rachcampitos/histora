import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/schema/user.schema';
import { Clinic, ClinicSchema } from '../clinics/schema/clinic.schema';
import { Nurse, NurseSchema } from '../nurses/schema/nurse.schema';
import { NurseVerification, NurseVerificationSchema } from '../nurses/schema/nurse-verification.schema';
import { ReniecUsage, ReniecUsageSchema } from '../nurses/schema/reniec-usage.schema';
import { ServiceRequest, ServiceRequestSchema } from '../service-requests/schema/service-request.schema';
import { PanicAlert, PanicAlertSchema } from '../safety/schema/panic-alert.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Clinic.name, schema: ClinicSchema },
      { name: Nurse.name, schema: NurseSchema },
      { name: NurseVerification.name, schema: NurseVerificationSchema },
      { name: ReniecUsage.name, schema: ReniecUsageSchema },
      { name: ServiceRequest.name, schema: ServiceRequestSchema },
      { name: PanicAlert.name, schema: PanicAlertSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
