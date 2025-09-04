import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBillingRecordDto } from './dto/create-billing-record.dto';
import { UpdateBillingRecordDto } from './dto/update-billing-record.dto';
import { BillingRecord } from './entities/billing-record.entity';
import { Repository } from 'typeorm';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { plainToClass } from 'class-transformer';
import { FilterBillingRecordDto } from './dto/filter-billing-record.dto';
import { UpdateSubscriptionDto } from 'src/subscriptions/dto/update-subscription.dto';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class BillingService {
  constructor(
    @Inject('BILLING_REPOSITORY')
    private readonly billingRepository: Repository<BillingRecord>,

    @Inject(SubscriptionsService)
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  entityToDto(billing: BillingRecord): UpdateBillingRecordDto {
    const billingDto = plainToClass(UpdateBillingRecordDto, billing);

    if (billing.subscription) {
      billingDto.subscription_id = billing.subscription.id;
    }
    return billingDto;
  }

  async dtoToEntity(
    billingDto: UpdateBillingRecordDto,
  ): Promise<BillingRecord> {
    const { subscription_id, ...otherData } = billingDto;

    const subscriptionDto = await this.subscriptionsService.findOne(
      subscription_id!,
    );
    if (!subscriptionDto) {
      throw new NotFoundException(`User ID ${subscription_id} not found.`);
    }
    const subscription =
      await this.subscriptionsService.dtoToEntity(subscriptionDto);

    const billing: BillingRecord = this.billingRepository.create(otherData);

    billing.subscription = subscription;

    return billing;
  }

  async create(createBillingRecordDto: CreateBillingRecordDto) {
    const billingRecord: BillingRecord = await this.dtoToEntity(
      createBillingRecordDto,
    );

    return await this.billingRepository.save(billingRecord);
  }

  async findAll(filterDto: FilterBillingRecordDto) {
    const where = {};
    if (filterDto.id) {
      where['id'] = filterDto.id;
    }
    if (filterDto.subscription_id) {
      where['subscription'] = {
        id: filterDto.subscription_id,
      };
    }
    const billingRecords = await this.billingRepository.find({
      where,
    });
    return billingRecords.map((billingRecord) =>
      this.entityToDto(billingRecord),
    );
  }

  async findOne(id: number) {
    const billingRecord = await this.billingRepository.findOneBy({ id });
    if (!billingRecord) {
      throw new NotFoundException(`BillingRecord with ID "${id}" not found`);
    }
    return this.entityToDto(billingRecord);
  }

  async update(id: number, updateBillingRecordDto: UpdateBillingRecordDto) {
    const billingRecord = await this.billingRepository.preload({
      id: id,
      ...updateBillingRecordDto,
    });
    if (!billingRecord) {
      throw new NotFoundException(`BillingRecord with ID "${id}" not found`);
    }
    const savedbillingRecord = await this.billingRepository.save(billingRecord);
    return this.entityToDto(savedbillingRecord);
  }

  async remove(id: number) {
    const result = await this.billingRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`BillingRecord with ID "${id}" not found`);
    }
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
      const subscriptions =
        await this.subscriptionsService.findDueSubscriptions();
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
        await this.subscriptionsService.updateToNextBillingCycle(
          subscription.id,
          subscription.billing_cycle_start_date,
        );

        await this.charge(subscription);
      }
    } finally {
      this.processBillingCycle = false;
    }
  }

  async charge(subscription: Subscription) {
    // Todo: use transaction here
    let chargeAmount: number;
    let newCredit: number;

    if (subscription.outstanding_credit > 0) {
      if (
        subscription.outstanding_credit >= subscription.plan.price_per_month
      ) {
        newCredit =
          subscription.outstanding_credit - subscription.plan.price_per_month;
        chargeAmount = 0;
      } else {
        newCredit = 0;
        chargeAmount =
          subscription.plan.price_per_month - subscription.outstanding_credit;
      }
    } else {
      newCredit = 0;
      chargeAmount = subscription.plan.price_per_month;
    }

    const billingRecordDto: CreateBillingRecordDto = {
      subscription_id: subscription.id,
      createdAt: new Date(),
      amount: chargeAmount,
      // Todo: Move to the detail sub items/lines?
      description: `Monthly charge for subscription ID ${subscription.id}:
Description               Price
${subscription.plan.name} Subscription   $${subscription.plan.price_per_month}
Credit                    ($${subscription.outstanding_credit})
Total Amount Due          $${chargeAmount}`,
    };

    await this.create(billingRecordDto);

    const updateDto: UpdateSubscriptionDto = {
      outstanding_credit: newCredit,
    };
    await this.subscriptionsService.update(subscription.id, updateDto);
  }

  @OnEvent('subscription.created')
  async handleSubscriptionCreatedEvent(subscription: Subscription) {
    await this.charge(subscription);
  }
}
