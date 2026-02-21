import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './services/whatsapp.service';
import { MetaApiService } from './services/meta-api.service';
import { AIChatService } from './services/ai-chat.service';
import { SessionService } from './services/session.service';
import { ToolHandlerService } from './services/tool-handler.service';
import {
  WhatsAppConversation,
  WhatsAppConversationSchema,
} from './entities/conversation.entity';
import { CacheModule } from '../common/cache';
import { NursesModule } from '../nurses/nurses.module';
import { ServiceRequestsModule } from '../service-requests/service-requests.module';
import { User, UserSchema } from '../users/schema/user.schema';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    CacheModule,
    NursesModule,
    ServiceRequestsModule,
    MongooseModule.forFeature([
      { name: WhatsAppConversation.name, schema: WhatsAppConversationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppService,
    MetaApiService,
    AIChatService,
    SessionService,
    ToolHandlerService,
  ],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
