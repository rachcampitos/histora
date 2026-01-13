import { Module } from '@nestjs/common';
import { AIAssistantService } from './ai-assistant.service';
import { AIAssistantController } from './ai-assistant.controller';

@Module({
  providers: [AIAssistantService],
  controllers: [AIAssistantController],
  exports: [AIAssistantService],
})
export class AIAssistantModule {}
