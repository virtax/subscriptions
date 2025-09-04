import { forwardRef, Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { DatabaseModule } from '../database/database.module';
import { DataSource } from 'typeorm';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { BillingRecord } from './entities/billing-record.entity';

@Module({
  imports: [DatabaseModule, forwardRef(() => SubscriptionsModule)],
  exports: [BillingService],

  controllers: [BillingController],
  providers: [
    BillingService,
    {
      provide: 'BILLING_REPOSITORY',
      useFactory: (dataSource: DataSource) =>
        dataSource.getRepository(BillingRecord),
      inject: ['DATA_SOURCE'],
    },
  ],
})
export class BillingModule {}
