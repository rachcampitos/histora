import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicePaymentsController } from './service-payments.controller';
import { ServicePaymentsService } from './service-payments.service';
import { ServicePayment, ServicePaymentSchema } from './schema/service-payment.schema';
import { ServiceRequest, ServiceRequestSchema } from '../service-requests/schema/service-request.schema';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServicePayment.name, schema: ServicePaymentSchema },
      { name: ServiceRequest.name, schema: ServiceRequestSchema },
    ]),
    PaymentsModule, // Import to use CulqiProvider
  ],
  controllers: [ServicePaymentsController],
  providers: [ServicePaymentsService],
  exports: [ServicePaymentsService],
})
export class ServicePaymentsModule {}
