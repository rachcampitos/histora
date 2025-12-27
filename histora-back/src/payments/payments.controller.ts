import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schema/user.schema';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  ProcessYapePaymentDto,
  ProcessCardPaymentDto,
  ConfirmPlinPaymentDto,
  RefundPaymentDto,
} from './dto/create-payment.dto';
import { PaymentStatus, PaymentMethod, PaymentType } from './schema/payment.schema';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Create a new payment intent' })
  createPayment(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(dto, user.clinicId, user.userId);
  }

  @Get()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Get clinic payments' })
  @ApiQuery({ name: 'status', enum: PaymentStatus, required: false })
  @ApiQuery({ name: 'method', enum: PaymentMethod, required: false })
  @ApiQuery({ name: 'type', enum: PaymentType, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  getPayments(
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: PaymentStatus,
    @Query('method') method?: PaymentMethod,
    @Query('type') type?: PaymentType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.paymentsService.getPayments(user.clinicId, {
      status,
      method,
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('summary')
  @Roles(UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Get payments summary for dashboard' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getPaymentsSummary(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.paymentsService.getPaymentsSummary(
      user.clinicId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('yape-info')
  @ApiOperation({ summary: 'Get Yape payment information' })
  getYapeInfo() {
    return this.paymentsService.getYapeInfo();
  }

  @Get('plin-info')
  @ApiOperation({ summary: 'Get Plin/bank transfer information' })
  getPlinInfo() {
    return this.paymentsService.getPlinInfo();
  }

  @Get('culqi-key')
  @ApiOperation({ summary: 'Get Culqi public key for frontend' })
  getCulqiPublicKey() {
    return { publicKey: this.paymentsService.getCulqiPublicKey() };
  }

  @Get(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Get payment by ID' })
  getPayment(
    @Param('id') paymentId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.paymentsService.findPayment(paymentId, user.clinicId);
  }

  @Get('reference/:reference')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Get payment by reference number' })
  getPaymentByReference(@Param('reference') reference: string) {
    return this.paymentsService.getPaymentByReference(reference);
  }

  @Post('yape/process')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Process Yape payment with operation number' })
  processYapePayment(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ProcessYapePaymentDto,
  ) {
    return this.paymentsService.processYapePayment(dto, user.clinicId);
  }

  @Post('card/process')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Process card payment with Culqi token' })
  processCardPayment(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ProcessCardPaymentDto,
  ) {
    return this.paymentsService.processCardPayment(dto, user.clinicId);
  }

  @Post('plin/confirm')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Confirm Plin/bank transfer payment' })
  confirmPlinPayment(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ConfirmPlinPaymentDto,
  ) {
    return this.paymentsService.confirmPlinPayment(dto, user.clinicId);
  }

  @Patch(':id/complete')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Manually complete a payment (cash, verified Yape, etc.)' })
  completePayment(
    @Param('id') paymentId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.paymentsService.completePayment(paymentId, user.clinicId);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Cancel a pending payment' })
  cancelPayment(
    @Param('id') paymentId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.paymentsService.cancelPayment(paymentId, user.clinicId);
  }

  @Post('refund')
  @Roles(UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Refund a completed payment' })
  refundPayment(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentsService.refundPayment(dto, user.clinicId);
  }
}
