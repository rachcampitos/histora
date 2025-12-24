import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PlanName, BillingCycle } from '../schema/plan.schema';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  clinicId: string;

  @IsEnum(PlanName)
  @IsNotEmpty()
  plan: PlanName;

  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;
}

export class UpgradeSubscriptionDto {
  @IsEnum(PlanName)
  @IsNotEmpty()
  plan: PlanName;

  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;
}

export class CancelSubscriptionDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
