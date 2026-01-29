import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/schema/user.schema';
import { Nurse, NurseSchema } from '../nurses/schema/nurse.schema';
import { NurseVerification, NurseVerificationSchema } from '../nurses/schema/nurse-verification.schema';
import { ReniecUsage, ReniecUsageSchema } from '../nurses/schema/reniec-usage.schema';
import { ServiceRequest, ServiceRequestSchema } from '../service-requests/schema/service-request.schema';
import { PanicAlert, PanicAlertSchema } from '../safety/schema/panic-alert.schema';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Nurse.name, schema: NurseSchema },
      { name: NurseVerification.name, schema: NurseVerificationSchema },
      { name: ReniecUsage.name, schema: ReniecUsageSchema },
      { name: ServiceRequest.name, schema: ServiceRequestSchema },
      { name: PanicAlert.name, schema: PanicAlertSchema },
    ]),
    UploadsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
