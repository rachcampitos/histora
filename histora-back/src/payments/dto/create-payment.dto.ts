import { IsString, IsEnum, IsOptional, IsNumber, IsMongoId, IsEmail, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentType, Currency } from '../schema/payment.schema';

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentType, description: 'Type of payment' })
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ description: 'Amount in cents (100 = S/ 1.00)' })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiPropertyOptional({ enum: Currency, default: 'PEN' })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ description: 'Payment description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Subscription ID if subscription payment' })
  @IsOptional()
  @IsMongoId()
  subscriptionId?: string;

  @ApiPropertyOptional({ description: 'Consultation ID if consultation payment' })
  @IsOptional()
  @IsMongoId()
  consultationId?: string;

  @ApiPropertyOptional({ description: 'Appointment ID if appointment payment' })
  @IsOptional()
  @IsMongoId()
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'Patient ID' })
  @IsOptional()
  @IsMongoId()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Customer email' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Customer phone' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Customer name' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ProcessYapePaymentDto {
  @ApiProperty({ description: 'Payment ID' })
  @IsMongoId()
  paymentId: string;

  @ApiProperty({ description: 'Yape operation number' })
  @IsString()
  operationNumber: string;

  @ApiPropertyOptional({ description: 'Phone number used for Yape' })
  @IsOptional()
  @IsString()
  yapeNumber?: string;
}

export class ProcessCardPaymentDto {
  @ApiProperty({ description: 'Payment ID' })
  @IsMongoId()
  paymentId: string;

  @ApiProperty({ description: 'Culqi card token' })
  @IsString()
  cardToken: string;

  @ApiPropertyOptional({ description: 'Customer email for receipt' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ConfirmPlinPaymentDto {
  @ApiProperty({ description: 'Payment ID' })
  @IsMongoId()
  paymentId: string;

  @ApiProperty({ description: 'Plin operation number from bank' })
  @IsString()
  operationNumber: string;

  @ApiPropertyOptional({ description: 'Bank name' })
  @IsOptional()
  @IsString()
  bank?: string;
}

export class RefundPaymentDto {
  @ApiProperty({ description: 'Payment ID to refund' })
  @IsMongoId()
  paymentId: string;

  @ApiPropertyOptional({ description: 'Reason for refund' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Amount to refund (partial refund)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}
