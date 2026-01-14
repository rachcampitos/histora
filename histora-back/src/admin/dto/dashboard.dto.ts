import { ApiProperty } from '@nestjs/swagger';

export class NurseStats {
  @ApiProperty() total: number;
  @ApiProperty() active: number;
  @ApiProperty() available: number;
  @ApiProperty() pendingVerification: number;
  @ApiProperty() verified: number;
}

export class ServiceStats {
  @ApiProperty() total: number;
  @ApiProperty() pending: number;
  @ApiProperty() accepted: number;
  @ApiProperty() inProgress: number;
  @ApiProperty() completedToday: number;
  @ApiProperty() cancelledToday: number;
  @ApiProperty() completedThisWeek: number;
  @ApiProperty() revenueThisWeek: number;
}

export class SafetyStats {
  @ApiProperty() activePanicAlerts: number;
  @ApiProperty() activeEmergencies: number;
  @ApiProperty() pendingIncidents: number;
  @ApiProperty() resolvedThisMonth: number;
}

export class RatingsStats {
  @ApiProperty() averageRating: number;
  @ApiProperty() totalReviews: number;
  @ApiProperty() lowRatedCount: number;
  @ApiProperty() excellentCount: number;
}

export class ReniecStats {
  @ApiProperty() used: number;
  @ApiProperty() limit: number;
  @ApiProperty() remaining: number;
  @ApiProperty() provider: string;
}

export class DashboardStatsDto {
  @ApiProperty() nurses: NurseStats;
  @ApiProperty() services: ServiceStats;
  @ApiProperty() safety: SafetyStats;
  @ApiProperty() ratings: RatingsStats;
  @ApiProperty() reniec: ReniecStats;
}

export class PanicAlertDto {
  @ApiProperty() id: string;
  @ApiProperty() nurseId: string;
  @ApiProperty() nurseName: string;
  @ApiProperty() nurseAvatar: string;
  @ApiProperty() level: string;
  @ApiProperty() status: string;
  @ApiProperty() location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  @ApiProperty() message?: string;
  @ApiProperty() serviceRequestId?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() policeContacted: boolean;
}

export class ActivityItemDto {
  @ApiProperty() id: string;
  @ApiProperty() type: string;
  @ApiProperty() title: string;
  @ApiProperty() description: string;
  @ApiProperty() timestamp: Date;
  @ApiProperty() severity?: 'info' | 'warning' | 'critical';
  @ApiProperty() actionUrl?: string;
  @ApiProperty() metadata?: Record<string, any>;
}

export class PendingVerificationDto {
  @ApiProperty() id: string;
  @ApiProperty() nurseId: string;
  @ApiProperty() nurseName: string;
  @ApiProperty() nurseAvatar: string;
  @ApiProperty() cepNumber: string;
  @ApiProperty() dniNumber: string;
  @ApiProperty() status: string;
  @ApiProperty() waitingDays: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() hasCepValidation: boolean;
  @ApiProperty() cepPhotoUrl?: string;
}

export class ServiceChartDataDto {
  @ApiProperty() date: string;
  @ApiProperty() completed: number;
  @ApiProperty() cancelled: number;
  @ApiProperty() revenue: number;
}

export class LowRatedReviewDto {
  @ApiProperty() id: string;
  @ApiProperty() serviceRequestId: string;
  @ApiProperty() patientName: string;
  @ApiProperty() nurseName: string;
  @ApiProperty() rating: number;
  @ApiProperty() review: string;
  @ApiProperty() reviewedAt: Date;
  @ApiProperty() hasResponse: boolean;
}

export class ExpiringVerificationDto {
  @ApiProperty() nurseId: string;
  @ApiProperty() nurseName: string;
  @ApiProperty() cepNumber: string;
  @ApiProperty() lastVerifiedAt: Date;
  @ApiProperty() daysUntilExpiry: number;
  @ApiProperty() hasActiveServices: boolean;
}
