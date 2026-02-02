import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// Query DTO for listing payments
export class PaymentQueryDto {
  @ApiPropertyOptional({ description: 'Search by patient/nurse name, reference' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['yape', 'card', 'cash'] })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ description: 'Start date for date range filter (ISO string)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date for date range filter (ISO string)' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Minimum amount in soles' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount in soles' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// Response DTO for payment list item
export class PaymentListItemDto {
  @ApiProperty() id: string;
  @ApiProperty() reference: string;
  @ApiProperty() status: string;
  @ApiProperty() method: string;
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
  @ApiProperty() serviceFee: number;
  @ApiProperty() nurseEarnings: number;
  @ApiProperty() patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  @ApiProperty() nurse: {
    id: string;
    firstName: string;
    lastName: string;
    cepNumber: string;
  };
  @ApiProperty() serviceRequestId: string;
  @ApiPropertyOptional() cardBrand?: string;
  @ApiPropertyOptional() cardLast4?: string;
  @ApiProperty() createdAt: Date;
  @ApiPropertyOptional() paidAt?: Date;
  @ApiPropertyOptional() refundedAt?: Date;
}

// Response DTO for payment detail
export class PaymentDetailDto extends PaymentListItemDto {
  @ApiPropertyOptional() culqiChargeId?: string;
  @ApiPropertyOptional() culqiOrderId?: string;
  @ApiPropertyOptional() yapeNumber?: string;
  @ApiPropertyOptional() yapeOperationNumber?: string;
  @ApiProperty() customerEmail: string;
  @ApiProperty() customerName: string;
  @ApiPropertyOptional() customerPhone?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() errorCode?: string;
  @ApiPropertyOptional() errorMessage?: string;
  @ApiPropertyOptional() metadata?: Record<string, any>;
  @ApiProperty() updatedAt: Date;
}

// Analytics DTOs
export class PaymentAnalyticsDto {
  @ApiProperty() summary: {
    totalTransactions: number;
    totalVolume: number;
    totalFees: number;
    totalNurseEarnings: number;
    pendingPayments: number;
    pendingAmount: number;
    refundedCount: number;
    refundedAmount: number;
  };
  @ApiProperty() byMethod: {
    method: string;
    count: number;
    amount: number;
  }[];
  @ApiProperty() byStatus: {
    status: string;
    count: number;
    amount: number;
  }[];
  @ApiProperty() dailyVolume: {
    date: string;
    count: number;
    amount: number;
    fees: number;
  }[];
}

// Admin refund action DTO
export class AdminRefundDto {
  @ApiPropertyOptional({ description: 'Reason for refund' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Partial refund amount (omit for full refund)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  partialAmount?: number;
}
