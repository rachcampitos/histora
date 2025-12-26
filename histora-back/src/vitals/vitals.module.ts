import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VitalsService } from './vitals.service';
import { VitalsController } from './vitals.controller';
import { Vitals, VitalsSchema } from './schema/vitals.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vitals.name, schema: VitalsSchema }]),
  ],
  controllers: [VitalsController],
  providers: [VitalsService],
  exports: [VitalsService],
})
export class VitalsModule {}
