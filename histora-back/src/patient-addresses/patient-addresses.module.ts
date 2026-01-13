import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientAddressesService } from './patient-addresses.service';
import { PatientAddressesController } from './patient-addresses.controller';
import { PatientAddress, PatientAddressSchema } from './schema/patient-address.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatientAddress.name, schema: PatientAddressSchema },
    ]),
  ],
  controllers: [PatientAddressesController],
  providers: [PatientAddressesService],
  exports: [PatientAddressesService],
})
export class PatientAddressesModule {}
