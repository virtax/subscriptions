import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBillingRecordDto } from './dto/create-billing-record.dto';
import { UpdateBillingRecordDto } from './dto/update-billing-record.dto';
import { BillingRecord } from './entities/billing-record.entity';
import { Repository } from 'typeorm';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import moment from 'moment';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { plainToClass } from 'class-transformer';

@Injectable()
export class BillingService {
  constructor(
    @Inject('BILLING_REPOSITORY')
    private readonly billingRepository: Repository<BillingRecord>,
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

  async findAll() {
    const billingRecords = await this.billingRepository.find();
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

  // Run the check every 1 second (for quick tests)
  @Cron(CronExpression.EVERY_SECOND)
  async handleBillingCycle() {
    const subscriptions =
      await this.subscriptionsService.findDueSubscriptions();
    console.log(`Billing: found ${subscriptions.length} due subscriptions...`);

    for (const subscription of subscriptions) {
      if (!subscription.plan) {
        console.error(
          `Plan not found for subscription ${subscription.id}. Skipping billing.`,
        );
        continue;
      }

      const billingRecordDto: CreateBillingRecordDto = {
        subscription_id: subscription.id,
        createdAt: new Date(),
        amount: subscription.plan.price_per_month,
        description: `Monthly charge for subscription ID ${subscription.id}`,
      };

      await this.create(billingRecordDto);

      const nextCycleStartDate = moment(subscription.billing_cycle_start_date)
        .add(1, 'months')
        .toDate();

      const updateDto: Partial<Subscription> = {
        billing_cycle_start_date: nextCycleStartDate,
      };

      await this.subscriptionsService.update(subscription.id, updateDto);
    }
  }
}
