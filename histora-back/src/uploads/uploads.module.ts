import { Module, forwardRef } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [UploadsController],
  providers: [UploadsService, CloudinaryProvider],
  exports: [UploadsService],
})
export class UploadsModule {}
