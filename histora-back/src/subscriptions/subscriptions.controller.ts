import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { UpgradeSubscriptionDto, CancelSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/schema/user.schema';
import { Plan } from './schema/plan.schema';
import { Subscription } from './schema/subscription.schema';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  getPlans(): Promise<Plan[]> {
    return this.subscriptionsService.getAllPlans();
  }

  @Get('mine')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  async getMySubscription(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<Subscription> {
    if (!user.clinicId) {
      throw new Error('No clinic associated with your account');
    }
    return this.subscriptionsService.getActiveSubscription(user.clinicId);
  }

  @Get('mine/limits')
  @Roles(UserRole.CLINIC_OWNER)
  async getMyLimits(@CurrentUser() user: CurrentUserPayload) {
    if (!user.clinicId) {
      throw new Error('No clinic associated with your account');
    }
    return this.subscriptionsService.checkSubscriptionLimits(user.clinicId);
  }

  @Post('mine/upgrade')
  @Roles(UserRole.CLINIC_OWNER)
  async upgrade(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpgradeSubscriptionDto,
  ): Promise<Subscription | null> {
    if (!user.clinicId) {
      throw new Error('No clinic associated with your account');
    }
    return this.subscriptionsService.upgrade(user.clinicId, dto);
  }

  @Post('mine/cancel')
  @Roles(UserRole.CLINIC_OWNER)
  async cancel(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CancelSubscriptionDto,
  ): Promise<Subscription | null> {
    if (!user.clinicId) {
      throw new Error('No clinic associated with your account');
    }
    return this.subscriptionsService.cancel(user.clinicId, dto.reason);
  }

  // Admin endpoint to seed plans
  @Post('admin/seed-plans')
  @Roles(UserRole.PLATFORM_ADMIN)
  async seedPlans(): Promise<{ message: string }> {
    await this.subscriptionsService.seedPlans();
    return { message: 'Plans seeded successfully' };
  }
}
