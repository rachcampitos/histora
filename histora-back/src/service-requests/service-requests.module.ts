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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceRequest.name, schema: ServiceRequestSchema },
      { name: Nurse.name, schema: NurseSchema },
    ]),
    NursesModule,
  ],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
