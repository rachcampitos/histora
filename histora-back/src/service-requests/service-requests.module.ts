import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';
import {
  ServiceRequest,
  ServiceRequestSchema,
} from './schema/service-request.schema';
import { Nurse, NurseSchema } from '../nurses/schema/nurse.schema';
import { NursesModule } from '../nurses/nurses.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User, UserSchema } from '../users/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceRequest.name, schema: ServiceRequestSchema },
      { name: Nurse.name, schema: NurseSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NursesModule,
    NotificationsModule,
  ],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
