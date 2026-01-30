import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  Logger,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { WhatsAppService } from './services/whatsapp.service';
import { MetaApiService } from './services/meta-api.service';
import { WebhookPayload } from './dto/webhook.dto';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);
  private readonly verifyToken: string;

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly metaApiService: MetaApiService,
    private readonly configService: ConfigService,
  ) {
    this.verifyToken = this.configService.get<string>('WA_VERIFY_TOKEN') || '';
  }

  /**
   * Webhook verification endpoint (GET)
   * Meta sends this to verify our webhook URL
   */
  @Get('webhook')
  @ApiOperation({ summary: 'Verify WhatsApp webhook' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string | number {
    this.logger.log('Webhook verification request received');

    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }

    this.logger.warn('Webhook verification failed');
    return 'Verification failed';
  }

  /**
   * Webhook receiver endpoint (POST)
   * Receives all WhatsApp events from Meta
   */
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive WhatsApp webhook events' })
  async receiveWebhook(
    @Body() body: WebhookPayload,
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<string> {
    // Verify signature if app secret is configured
    const rawBody = req.rawBody?.toString();
    if (rawBody && signature) {
      const isValid = this.metaApiService.verifyWebhookSignature(
        signature,
        rawBody,
      );
      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        return 'Invalid signature';
      }
    }

    // Process webhook asynchronously (respond immediately to Meta)
    this.whatsappService.processWebhook(body).catch((error) => {
      this.logger.error('Error processing webhook:', error);
    });

    return 'EVENT_RECEIVED';
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({ summary: 'WhatsApp module health check' })
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
