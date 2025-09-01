import { UsersService } from './../users/users.service';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Subscription } from './entities/subscription.entity';
import { Between, QueryFailedError, Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { plainToClass } from 'class-transformer';
import moment from 'moment';
import { TimeService } from 'src/time/time.service';

interface PostgresError extends Error {
  code: string;
  detail?: string;
}

function isPostgresError(error: any): error is PostgresError {
  return error && typeof error.code === 'string';
}

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
  ) {}

  entityToDto(subscription: Subscription): UpdateSubscriptionDto {
    const subscriptionDto = plainToClass(UpdateSubscriptionDto, subscription);

    if (subscription.user) {
      subscriptionDto.user_id = subscription.user.id;
    }
    if (subscription.plan) {
      subscriptionDto.plan_id = subscription.plan.id;
    }
    return subscriptionDto;
  }

  async dtoToEntity(
    subscriptionDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const { plan_id, user_id } = subscriptionDto;

    const userDto = await this.usersService.findOne(user_id!);
    if (!userDto) {
      throw new NotFoundException(`User ID ${user_id} not found.`);
    }
    const user = await this.usersService.dtoToEntity(userDto);

    const plan = await this.plansRepository.findOne({
      where: { id: plan_id },
    });
    if (!plan) {
      throw new NotFoundException(`Plan ID ${plan_id} not found.`);
    }
    let subscription: Subscription | undefined;
    if (!subscriptionDto.id) {
      subscription = this.subscriptionsRepository.create(subscriptionDto);
    } else {
      subscription =
        await this.subscriptionsRepository.preload(subscriptionDto);
      if (!subscription) {
        throw new NotFoundException(
          `Subscription with ID "${subscriptionDto.id}" not found`,
        );
      }
    }

    subscription.user = user;
    subscription.plan = plan;

    return subscription;
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
      return this.entityToDto(savedSubscription);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        if (
          isPostgresError(error.driverError) &&
          error.driverError.code === '23505'
        ) {
          throw new ConflictException(
            'User already has an active subscription.',
          );
        }
      }
      throw error;
    }
  }

  async findAll() {
    const subscriptions = await this.subscriptionsRepository.find();
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
      subscription.outstanding_credit = CreditDue;
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
    const endOfToday = moment(this.timeService.getCurrentTime())
      .endOf('day')
      .toDate();

    // Filter subscriptions where the billing cycle starts today, ignoring time.
    return this.subscriptionsRepository.find({
      where: {
        billing_cycle_start_date: Between(startOfToday, endOfToday),
      },
      relations: ['plan'],
    });
  }
}
