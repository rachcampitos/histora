import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
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

  private requireClinicId(user: CurrentUserData): string {
    if (!user.clinicId) {
      throw new ForbiddenException('User must belong to a clinic to access payments');
    }
    return user.clinicId;
  }

  @Post()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Create a new payment intent' })
  createPayment(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreatePaymentDto,
  ) {
    const clinicId = this.requireClinicId(user);
    return this.paymentsService.createPayment(dto, clinicId, user.userId);
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
    const clinicId = this.requireClinicId(user);
    return this.paymentsService.getPayments(clinicId, {
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
    const clinicId = this.requireClinicId(user);
    return this.paymentsService.getPaymentsSummary(
      clinicId,
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
    const clinicId = this.requireClinicId(user);
    return this.paymentsService.findPayment(paymentId, clinicId);
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
    const clinicId = this.requireClinicId(user);
    return this.paymentsService.processYapePayment(dto, clinicId);
  }

  @Post('card/process')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Process card payment with Culqi token' })
  processCardPayment(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ProcessCardPaymentDto,
  ) {
    const clinicId = this.requireClinicId(user);
    return this.paymentsService.processCardPayment(dto, clinicId);
  }

  @Post('plin/confirm')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Confirm Plin/bank transfer payment' })
  confirmPlinPayment(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ConfirmPlinPaymentDto,
  ) {
    const clinicId = this.requireClinicId(user);
    return this.paymentsService.confirmPlinPayment(dto, clinicId);
  }

  @Patch(':id/complete')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Manually complete a payment (cash, verified Yape, etc.)' })
  completePayment(
    @Param('id') paymentId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const clinicId = this.requireClinicId(user);
    return this.paymentsService.completePayment(paymentId, clinicId);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Cancel a pending payment' })
  cancelPayment(
    @Param('id') paymentId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const clinicId = this.requireClinicId(user);
    return this.paymentsService.cancelPayment(paymentId, clinicId);
  }

  @Post('refund')
  @Roles(UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Refund a completed payment' })
  refundPayment(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RefundPaymentDto,
  ) {
    const clinicId = this.requireClinicId(user);
    return this.paymentsService.refundPayment(dto, clinicId);
  }
}
