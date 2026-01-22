import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { TrackingGateway } from './tracking.gateway';
import { ServiceTracking, ServiceTrackingSchema } from './schema/service-tracking.schema';
import { ServiceRequest, ServiceRequestSchema } from '../service-requests/schema/service-request.schema';
import { Nurse, NurseSchema } from '../nurses/schema/nurse.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceTracking.name, schema: ServiceTrackingSchema },
      { name: ServiceRequest.name, schema: ServiceRequestSchema },
      { name: Nurse.name, schema: NurseSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingGateway],
  exports: [TrackingService, TrackingGateway],
})
export class TrackingModule {}
