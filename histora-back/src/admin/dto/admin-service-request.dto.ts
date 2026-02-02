import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// Query DTO for listing service requests
export class ServiceRequestQueryDto {
  @ApiPropertyOptional({ description: 'Search by patient/nurse name, service name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled', 'rejected'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['pending', 'paid', 'refunded', 'failed'] })
  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @ApiPropertyOptional({ description: 'Filter by service category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by district' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Start date for date range filter (ISO string)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date for date range filter (ISO string)' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum rating' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum rating' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  maxRating?: number;

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

// Response DTO for service request list item
export class ServiceRequestListItemDto {
  @ApiProperty() id: string;
  @ApiProperty() status: string;
  @ApiProperty() paymentStatus: string;
  @ApiProperty() service: {
    name: string;
    category: string;
    price: number;
    currency: string;
  };
  @ApiProperty() patient: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  @ApiProperty() nurse: {
    id: string;
    firstName: string;
    lastName: string;
    cepNumber: string;
    avatar?: string;
  } | null;
  @ApiProperty() location: {
    district: string;
    city: string;
    address: string;
  };
  @ApiProperty() requestedDate: Date;
  @ApiProperty() requestedTimeSlot: string;
  @ApiPropertyOptional() rating?: number;
  @ApiProperty() createdAt: Date;
  @ApiPropertyOptional() completedAt?: Date;
  @ApiPropertyOptional() cancelledAt?: Date;
}

// Response DTO for service request detail
export class ServiceRequestDetailDto {
  @ApiProperty() id: string;
  @ApiProperty() status: string;
  @ApiProperty() paymentStatus: string;
  @ApiPropertyOptional() paymentMethod?: string;
  @ApiPropertyOptional() paymentId?: string;
  @ApiProperty() service: {
    name: string;
    category: string;
    price: number;
    currency: string;
    durationMinutes: number;
  };
  @ApiProperty() patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  @ApiProperty() nurse: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    cepNumber: string;
    phone: string;
    avatar?: string;
    averageRating: number;
  } | null;
  @ApiProperty() location: {
    coordinates: number[];
    address: string;
    reference?: string;
    district: string;
    city: string;
  };
  @ApiProperty() requestedDate: Date;
  @ApiProperty() requestedTimeSlot: string;
  @ApiPropertyOptional() scheduledAt?: Date;
  @ApiPropertyOptional() patientNotes?: string;
  @ApiPropertyOptional() nurseNotes?: string;
  @ApiPropertyOptional() rating?: number;
  @ApiPropertyOptional() review?: string;
  @ApiPropertyOptional() reviewedAt?: Date;
  @ApiPropertyOptional() completedAt?: Date;
  @ApiPropertyOptional() cancelledAt?: Date;
  @ApiPropertyOptional() cancellationReason?: string;
  @ApiProperty() statusHistory: {
    status: string;
    changedAt: Date;
    changedBy?: string;
    note?: string;
  }[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

// Analytics DTOs
export class ServiceAnalyticsDto {
  @ApiProperty() summary: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    rejected: number;
  };
  @ApiProperty() revenue: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    pending: number;
    paid: number;
    refunded: number;
  };
  @ApiProperty() performance: {
    averageRating: number;
    completionRate: number;
    cancellationRate: number;
    averageResponseTime: number;
  };
  @ApiProperty() byCategory: {
    category: string;
    count: number;
    revenue: number;
  }[];
  @ApiProperty() byDistrict: {
    district: string;
    count: number;
    revenue: number;
  }[];
  @ApiProperty() byTimeSlot: {
    timeSlot: string;
    count: number;
  }[];
}

// Admin action DTO
export class AdminServiceActionDto {
  @ApiPropertyOptional({ enum: ['cancel', 'refund'] })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Reason for admin action' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
