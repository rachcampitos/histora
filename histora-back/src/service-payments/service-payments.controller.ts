import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schema/user.schema';
import { ServicePaymentsService } from './service-payments.service';
import {
  CreateServicePaymentDto,
  VerifyYapePaymentDto,
  RefundPaymentDto,
} from './dto/service-payment.dto';

@ApiTags('Service Payments')
@ApiBearerAuth('JWT-auth')
@Controller('service-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicePaymentsController {
  constructor(private readonly servicePaymentsService: ServicePaymentsService) {}

  @Post('create')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Create a payment for a service request' })
  async createPayment(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateServicePaymentDto,
  ) {
    return this.servicePaymentsService.createPayment(dto, user.userId);
  }

  @Get('summary/:serviceRequestId')
  @Roles(UserRole.PATIENT, UserRole.NURSE)
  @ApiOperation({ summary: 'Get payment summary for a service request' })
  @ApiParam({ name: 'serviceRequestId', description: 'Service request ID' })
  async getPaymentSummary(@Param('serviceRequestId') serviceRequestId: string) {
    return this.servicePaymentsService.getPaymentSummary(serviceRequestId);
  }

  @Get('by-request/:serviceRequestId')
  @Roles(UserRole.PATIENT, UserRole.NURSE)
  @ApiOperation({ summary: 'Get payment by service request ID' })
  @ApiParam({ name: 'serviceRequestId', description: 'Service request ID' })
  async getPaymentByServiceRequest(@Param('serviceRequestId') serviceRequestId: string) {
    return this.servicePaymentsService.getPaymentByServiceRequest(serviceRequestId);
  }

  @Get('history')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get payment history for current patient' })
  async getPaymentHistory(@CurrentUser() user: CurrentUserData) {
    return this.servicePaymentsService.getPatientPaymentHistory(user.userId);
  }

  @Get('nurse/earnings')
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Get earnings for current nurse' })
  async getNurseEarnings(@CurrentUser() user: CurrentUserData) {
    return this.servicePaymentsService.getNurseEarnings(user.userId);
  }

  @Post(':paymentId/verify-yape')
  @Roles(UserRole.PATIENT, UserRole.NURSE)
  @ApiOperation({ summary: 'Verify Yape payment with operation number' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  async verifyYapePayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: VerifyYapePaymentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.servicePaymentsService.verifyYapePayment(paymentId, dto, user.userId);
  }

  @Post(':paymentId/refund')
  @Roles(UserRole.PATIENT, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Request refund for a payment' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  async requestRefund(
    @Param('paymentId') paymentId: string,
    @Body() dto: RefundPaymentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.servicePaymentsService.requestRefund(paymentId, dto.reason, user.userId);
  }

  // Saved cards endpoints (placeholder for future implementation)
  @Get('cards')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get saved cards for current user (future)' })
  async getSavedCards() {
    // TODO: Implement saved cards with Culqi customers
    return [];
  }
}
