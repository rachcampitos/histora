import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument, SubscriptionStatus } from './schema/subscription.schema';
import { Plan, PlanDocument, PlanName, BillingCycle } from './schema/plan.schema';
import { CreateSubscriptionDto, UpgradeSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  private readonly TRIAL_DAYS = 14;

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name)
    private planModel: Model<PlanDocument>,
  ) {}

  async createTrialSubscription(clinicId: string, plan: PlanName = PlanName.PROFESSIONAL): Promise<Subscription> {
    const existingSubscription = await this.findByClinic(clinicId);
    if (existingSubscription) {
      throw new BadRequestException('Clinic already has a subscription');
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + this.TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const subscription = new this.subscriptionModel({
      clinicId,
      plan,
      billingCycle: BillingCycle.MONTHLY,
      status: SubscriptionStatus.TRIAL,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      trialEndsAt: trialEnd,
    });

    return subscription.save();
  }

  async findByClinic(clinicId: string): Promise<Subscription | null> {
    return this.subscriptionModel.findOne({ clinicId }).exec();
  }

  async getActiveSubscription(clinicId: string): Promise<Subscription> {
    const subscription = await this.subscriptionModel.findOne({
      clinicId,
      status: { $in: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE] },
    }).exec();

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    return subscription;
  }

  async upgrade(clinicId: string, dto: UpgradeSubscriptionDto): Promise<Subscription> {
    const subscription = await this.getActiveSubscription(clinicId);

    const plan = await this.planModel.findOne({ name: dto.plan, isActive: true });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const now = new Date();
    const billingCycle = dto.billingCycle || subscription.billingCycle;

    let periodEnd: Date;
    switch (billingCycle) {
      case BillingCycle.ANNUAL:
        periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        break;
      case BillingCycle.SEMIANNUAL:
        periodEnd = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
        break;
      default:
        periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    return this.subscriptionModel.findByIdAndUpdate(
      subscription['_id'],
      {
        plan: dto.plan,
        billingCycle,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      { new: true },
    ).exec();
  }

  async cancel(clinicId: string, reason?: string): Promise<Subscription> {
    const subscription = await this.getActiveSubscription(clinicId);

    return this.subscriptionModel.findByIdAndUpdate(
      subscription['_id'],
      {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      { new: true },
    ).exec();
  }

  async checkSubscriptionLimits(clinicId: string): Promise<{
    canAddDoctor: boolean;
    canAddPatient: boolean;
    maxDoctors: number;
    maxPatients: number;
    currentDoctors: number;
    currentPatients: number;
  }> {
    const subscription = await this.getActiveSubscription(clinicId);
    const plan = await this.planModel.findOne({ name: subscription.plan });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // TODO: Implement actual counts from doctors and patients collections
    const currentDoctors = 0;
    const currentPatients = 0;

    return {
      canAddDoctor: currentDoctors < plan.maxDoctors,
      canAddPatient: plan.maxPatients === -1 || currentPatients < plan.maxPatients,
      maxDoctors: plan.maxDoctors,
      maxPatients: plan.maxPatients,
      currentDoctors,
      currentPatients,
    };
  }

  async isSubscriptionActive(clinicId: string): Promise<boolean> {
    const subscription = await this.subscriptionModel.findOne({
      clinicId,
      status: { $in: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE] },
      currentPeriodEnd: { $gt: new Date() },
    }).exec();

    return !!subscription;
  }

  // Plans management
  async getAllPlans(): Promise<Plan[]> {
    return this.planModel.find({ isActive: true }).sort({ sortOrder: 1 }).exec();
  }

  async getPlan(name: PlanName): Promise<Plan> {
    const plan = await this.planModel.findOne({ name, isActive: true });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  async seedPlans(): Promise<void> {
    const plans = [
      {
        name: PlanName.BASIC,
        displayName: 'Plan Básico',
        description: 'Ideal para consultorios individuales',
        priceMonthly: 2900, // $29.00
        priceSemiannual: 15660, // $156.60 (10% off)
        priceAnnual: 27840, // $278.40 (20% off)
        maxDoctors: 1,
        maxPatients: 100,
        features: [
          'Gestión de pacientes',
          'Agenda de citas',
          'Historial clínico básico',
          'Soporte por email',
        ],
        sortOrder: 1,
      },
      {
        name: PlanName.PROFESSIONAL,
        displayName: 'Plan Profesional',
        description: 'Para consultorios en crecimiento',
        priceMonthly: 5900, // $59.00
        priceSemiannual: 31860, // $318.60 (10% off)
        priceAnnual: 56640, // $566.40 (20% off)
        maxDoctors: 3,
        maxPatients: 500,
        features: [
          'Todo lo del Plan Básico',
          'Hasta 3 médicos',
          'Recetas electrónicas',
          'Reportes avanzados',
          'Soporte prioritario',
        ],
        sortOrder: 2,
      },
      {
        name: PlanName.CLINIC,
        displayName: 'Plan Clínica',
        description: 'Para clínicas y centros médicos',
        priceMonthly: 9900, // $99.00
        priceSemiannual: 53460, // $534.60 (10% off)
        priceAnnual: 95040, // $950.40 (20% off)
        maxDoctors: 10,
        maxPatients: -1, // Ilimitado
        features: [
          'Todo lo del Plan Profesional',
          'Hasta 10 médicos',
          'Pacientes ilimitados',
          'Multi-sucursal',
          'API access',
          'Soporte 24/7',
        ],
        sortOrder: 3,
      },
    ];

    for (const planData of plans) {
      await this.planModel.findOneAndUpdate(
        { name: planData.name },
        planData,
        { upsert: true, new: true },
      );
    }
  }
}
