import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { DatabaseModule } from '../database/database.module';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { DataSource } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { UsersModule } from 'src/users/users.module';
import { TimeModule } from 'src/time/time.module';

@Module({
  imports: [DatabaseModule, UsersModule, TimeModule],

  controllers: [SubscriptionsController, PlansController],
  providers: [
    SubscriptionsService,
    PlansService,
    {
      provide: 'SUBSCRIPTIONS_REPOSITORY',
      useFactory: (dataSource: DataSource) =>
        dataSource.getRepository(Subscription),
      inject: ['DATA_SOURCE'],
    },
    {
      provide: 'PLANS_REPOSITORY',
      useFactory: (dataSource: DataSource) => dataSource.getRepository(Plan),
      inject: ['DATA_SOURCE'],
    },
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
