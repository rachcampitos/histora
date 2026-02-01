import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminNotificationsGateway } from './admin-notifications.gateway';
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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    UploadsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminNotificationsGateway],
  exports: [AdminService, AdminNotificationsGateway],
})
export class AdminModule {}
