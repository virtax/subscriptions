import { UsersService } from './../users/users.service';
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Subscription } from './entities/subscription.entity';
import { LessThan, Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { plainToClass } from 'class-transformer';
import moment from 'moment';
import { TimeService } from 'src/time/time.service';
import { isPostgresConflictError } from 'src/common/errors';
import { FilterSubscriptionDto } from './dto/filter-subscription.dto';
import { User } from 'src/users/entities/user.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BillingService } from 'src/billing/billing.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject('SUBSCRIPTIONS_REPOSITORY')
    private subscriptionsRepository: Repository<Subscription>,
    @Inject('PLANS_REPOSITORY')
    private plansRepository: Repository<Plan>,
    @Inject(UsersService)
    private usersService: UsersService,
    @Inject(TimeService)
    private timeService: TimeService,
    @Inject(forwardRef(() => BillingService))
    private billingService: BillingService,
  ) {}

  entityToDto(subscription: Subscription): UpdateSubscriptionDto {
    const subscriptionDto = plainToClass(UpdateSubscriptionDto, subscription);

    if (subscription.user) {
      subscriptionDto.user_id = subscription.user.id;
    }
    if (subscription.plan) {
      subscriptionDto.plan_id = subscription.plan.id;
    }
    delete subscriptionDto['user'];
    delete subscriptionDto['plan'];
    return subscriptionDto;
  }

  async dtoToEntity(
    subscriptionDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const { plan_id, user_id } = subscriptionDto;

    let user: User;
    if (user_id) {
      const userDto = await this.usersService.findOne(user_id);
      if (!userDto) {
        throw new NotFoundException(`User ID ${user_id} not found.`);
      }
      user = await this.usersService.dtoToEntity(userDto);
    }

    let plan: Plan;
    if (plan_id) {
      plan = (await this.plansRepository.findOne({
        where: { id: plan_id },
      })) as Plan;
      if (!plan) {
        throw new NotFoundException(`Plan ID ${plan_id} not found.`);
      }
    }

    let subscription: Subscription | undefined;
    if (!subscriptionDto.id) {
      subscription = this.subscriptionsRepository.create(subscriptionDto);
    } else {
      const existingSubscription = await this.subscriptionsRepository.findOneBy(
        { id: subscriptionDto.id },
      ); // load existingSubscription.plan_id and existingSubscription.user_id which can be empty in subscriptionDto: UpdateSubscriptionDto
      if (!existingSubscription) {
        throw new NotFoundException(
          `Subscription with ID "${subscriptionDto.id}" not found`,
        );
      }
      subscription = await this.subscriptionsRepository.preload({
        ...existingSubscription,
        ...subscriptionDto,
      });
    }

    if (user_id) {
      subscription!.user = user!;
    }
    if (plan_id) {
      subscription!.plan = plan!;
    }

    return subscription!;
  }

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    if (!createSubscriptionDto.plan_start_date) {
      createSubscriptionDto.plan_start_date = this.timeService.getCurrentTime();
    }
    if (!createSubscriptionDto.billing_cycle_start_date) {
      createSubscriptionDto.billing_cycle_start_date =
        createSubscriptionDto.plan_start_date;
    }
    if (!createSubscriptionDto.billing_cycle_end_date) {
      createSubscriptionDto.billing_cycle_end_date =
        createSubscriptionDto.billing_cycle_end_date = moment(
          createSubscriptionDto.plan_start_date,
        )
          .add(1, 'month')
          .subtract(1, 'day')
          .toDate();
    }

    const subscription: Subscription = await this.dtoToEntity(
      createSubscriptionDto,
    );

    try {
      const savedSubscription =
        await this.subscriptionsRepository.save(subscription);
      await this.billingService.charge(savedSubscription);

      return this.entityToDto(savedSubscription);
    } catch (error) {
      if (isPostgresConflictError(error)) {
        throw new ConflictException('User already has an active subscription.');
      }
      throw error;
    }
  }

  async findAll(filterDto: FilterSubscriptionDto) {
    const where = {};
    if (filterDto.id) {
      where['id'] = filterDto.id;
    }
    const subscriptions = await this.subscriptionsRepository.find({
      where,
    });
    return subscriptions.map((subscription) => this.entityToDto(subscription));
  }

  async findOne(id: number) {
    const subscription = await this.subscriptionsRepository.findOneBy({ id });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }
    return this.entityToDto(subscription);
  }

  async update(id: number, updateSubscriptionDto: UpdateSubscriptionDto) {
    const subscription = await this.dtoToEntity({
      id: id,
      ...updateSubscriptionDto,
    });

    this.validateQRCodeUsageLimit(subscription);
    await this.checkAndProcessDowngrade(subscription);

    const savedSubscription =
      await this.subscriptionsRepository.save(subscription);
    return this.entityToDto(savedSubscription);
  }

  async updateToNextBillingCycle(
    id: number,
    billingCycleStartDate: Date,
    //outstandingCredit: number,
  ) {
    const nextCycleStartDate = moment(billingCycleStartDate)
      .add(1, 'months')
      .toDate();

    const nextCycleEndDate = moment(nextCycleStartDate)
      .add(1, 'month')
      .subtract(1, 'day')
      .toDate();

    const updateDto: Partial<Subscription> = {
      billing_cycle_start_date: nextCycleStartDate,
      billing_cycle_end_date: nextCycleEndDate,
      // outstanding_credit: outstandingCredit,
    };
    return await this.update(id, updateDto);
  }

  private validateQRCodeUsageLimit(subscription: Subscription) {
    if (subscription.plan.qr_code_limit < subscription.current_qrcode_usage) {
      throw new BadRequestException(
        `QR Code usage limit exceed.
Current usage: ${subscription.current_qrcode_usage}
New plan limit: ${subscription.plan.qr_code_limit}.`,
      );
    }
  }

  private async checkAndProcessDowngrade(subscription: Subscription) {
    const oldSubscription = await this.subscriptionsRepository.findOneBy({
      id: subscription.id,
    });
    if (oldSubscription!.plan.id !== subscription.plan.id) {
      // - Days remaining: 15
      // - Pro plan daily rate: $25/30 = $0.833
      // - Basic plan daily rate: $10/30 = $0.333
      // - Credit due: ($0.833 - $0.333) x 15 = $7.50
      const currentTime = this.timeService.getCurrentTime();
      const dayRemaining = moment(subscription.billing_cycle_end_date).diff(
        moment(currentTime),
        'days',
      );
      const billingCycleDays =
        1 +
        moment(oldSubscription!.billing_cycle_end_date).diff(
          moment(oldSubscription?.billing_cycle_start_date),
          'days',
        ); // include edge dates: 1..30 = 30-1+1 = 30 days

      const oldPlanDailyRate =
        oldSubscription!.plan.price_per_month / billingCycleDays;
      const newPlanDailyRate =
        subscription.plan.price_per_month / billingCycleDays;
      if (newPlanDailyRate > oldPlanDailyRate) {
        // Upgrade - not our case
        return;
      }
      // Downgrade
      const CreditDue = (oldPlanDailyRate - newPlanDailyRate) * dayRemaining;
      subscription.outstanding_credit = +CreditDue.toFixed(2);
    }
  }

  async remove(id: number) {
    const result = await this.subscriptionsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }
  }

  async findDueSubscriptions(): Promise<Subscription[]> {
    const startOfToday = moment(this.timeService.getCurrentTime())
      .startOf('day')
      .toDate();

    // Filter subscriptions where the billing cycle already ends.
    return this.subscriptionsRepository.find({
      where: {
        billing_cycle_end_date: LessThan(startOfToday),
      },
      relations: ['plan'],
    });
  }

  // For cluster another solution needed
  private processBillingCycle: boolean;

  // Run the check every 1 second (For quick tests. For production need to change, for example to 3 times per day)
  @Cron(CronExpression.EVERY_SECOND)
  async handleBillingCycle() {
    if (this.processBillingCycle) {
      return;
    }
    this.processBillingCycle = true;
    try {
      const subscriptions = await this.findDueSubscriptions();
      console.log(
        `Billing: found ${subscriptions.length} due subscriptions...`,
      );

      for (const subscription of subscriptions) {
        if (!subscription.plan) {
          console.error(
            `Plan not found for subscription ${subscription.id}. Skipping billing.`,
          );
          continue;
        }
        console.log(`Billing: process subscription ${subscription.id}`);
        await this.updateToNextBillingCycle(
          subscription.id,
          subscription.billing_cycle_start_date,
        );

        await this.billingService.charge(subscription);
      }
    } finally {
      this.processBillingCycle = false;
    }
  }
}
