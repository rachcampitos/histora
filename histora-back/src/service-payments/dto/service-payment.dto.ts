import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ServicePaymentMethod } from '../schema/service-payment.schema';

export class CreateServicePaymentDto {
  @ApiProperty({ description: 'Service request ID' })
  @IsString()
  serviceRequestId: string;

  @ApiProperty({ enum: ServicePaymentMethod, description: 'Payment method' })
  @IsEnum(ServicePaymentMethod)
  method: ServicePaymentMethod;

  @ApiProperty({ description: 'Customer email' })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ description: 'Customer name' })
  @IsString()
  customerName: string;

  @ApiPropertyOptional({ description: 'Customer phone' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  // For card payments
  @ApiPropertyOptional({ description: 'Culqi card token' })
  @IsOptional()
  @IsString()
  cardToken?: string;

  @ApiPropertyOptional({ description: 'Save card for future payments' })
  @IsOptional()
  @IsBoolean()
  saveCard?: boolean;

  // For Yape
  @ApiPropertyOptional({ description: 'Yape phone number' })
  @IsOptional()
  @IsString()
  yapeNumber?: string;
}

export class VerifyYapePaymentDto {
  @ApiProperty({ description: 'Yape operation number' })
  @IsString()
  operationNumber: string;
}

export class ChargeSavedCardDto {
  @ApiProperty({ description: 'Service request ID' })
  @IsString()
  serviceRequestId: string;

  @ApiProperty({ description: 'Saved card ID' })
  @IsString()
  cardId: string;

  @ApiProperty({ description: 'Customer email' })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ description: 'Customer name' })
  @IsString()
  customerName: string;

  @ApiPropertyOptional({ description: 'Customer phone' })
  @IsOptional()
  @IsString()
  customerPhone?: string;
}

export class RefundPaymentDto {
  @ApiProperty({ description: 'Reason for refund' })
  @IsString()
  reason: string;
}

export class PaymentSummaryResponse {
  @ApiProperty({ description: 'Service subtotal in cents' })
  subtotal: number;

  @ApiProperty({ description: 'Platform fee in cents' })
  serviceFee: number;

  @ApiProperty({ description: 'Discount in cents' })
  discount: number;

  @ApiProperty({ description: 'Total amount in cents' })
  total: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;
}

export class PaymentResponse {
  @ApiProperty({ description: 'Whether the payment was successful' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Payment details' })
  payment?: any;

  @ApiPropertyOptional({ description: 'Error details' })
  error?: {
    code: string;
    message: string;
    userMessage: string;
  };
}
