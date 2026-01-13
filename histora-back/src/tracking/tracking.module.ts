import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { ServiceTracking, ServiceTrackingSchema } from './schema/service-tracking.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceTracking.name, schema: ServiceTrackingSchema },
    ]),
  ],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
