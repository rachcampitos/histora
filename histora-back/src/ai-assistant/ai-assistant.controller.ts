import { Controller, Post, Delete, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AIAssistantService, ConversationContext } from './ai-assistant.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsObject, IsNumber, IsArray } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsObject()
  serviceContext?: {
    serviceId?: string;
    patientName?: string;
    nurseName?: string;
    serviceType?: string;
  };
}

export class PreTriageDto {
  @IsString()
  symptoms: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsArray()
  conditions?: string[];
}

@ApiTags('AI Assistant')
@Controller('ai-assistant')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AIAssistantController {
  constructor(private readonly aiService: AIAssistantService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message to the AI assistant' })
  @ApiResponse({ status: 200, description: 'AI response with suggestions' })
  async chat(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChatMessageDto,
  ) {
    const context: ConversationContext = {
      userId: user.userId,
      userRole: this.mapRole(user.role),
      language: dto.language || 'es',
      serviceContext: dto.serviceContext,
    };

    return this.aiService.chat(user.userId, dto.message, context);
  }

  @Post('quick')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a quick response without conversation history' })
  @ApiResponse({ status: 200, description: 'Quick AI response' })
  async quickResponse(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChatMessageDto,
  ) {
    const context: ConversationContext = {
      userId: user.userId,
      userRole: this.mapRole(user.role),
      language: dto.language || 'es',
      serviceContext: dto.serviceContext,
    };

    return this.aiService.quickResponse(dto.message, context);
  }

  @Post('pre-triage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get symptom pre-triage assessment' })
  @ApiResponse({ status: 200, description: 'Pre-triage assessment with urgency level' })
  async preTriage(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: PreTriageDto,
  ) {
    return this.aiService.preTriage(dto.symptoms, {
      age: dto.age,
      gender: dto.gender,
      conditions: dto.conditions,
    });
  }

  @Delete('conversation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear conversation history' })
  @ApiResponse({ status: 204, description: 'Conversation cleared' })
  clearConversation(@CurrentUser() user: CurrentUserPayload) {
    this.aiService.clearConversation(user.userId, this.mapRole(user.role));
  }

  private mapRole(role: string): 'patient' | 'nurse' | 'admin' {
    if (role === 'nurse') return 'nurse';
    if (role === 'platform_admin' || role === 'clinic_owner') return 'admin';
    return 'patient';
  }
}
