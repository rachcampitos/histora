import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './services/whatsapp.service';
import { MetaApiService } from './services/meta-api.service';
import { AIChatService } from './services/ai-chat.service';
import { SessionService } from './services/session.service';
import {
  WhatsAppConversation,
  WhatsAppConversationSchema,
} from './entities/conversation.entity';
import { CacheModule } from '../common/cache';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    CacheModule,
    MongooseModule.forFeature([
      { name: WhatsAppConversation.name, schema: WhatsAppConversationSchema },
    ]),
  ],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppService,
    MetaApiService,
    AIChatService,
    SessionService,
  ],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
