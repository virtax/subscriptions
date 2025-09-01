import { CreatePlanDto } from '../src/subscriptions/dto/create-plan.dto';
import { CreateSubscriptionDto } from '../src/subscriptions/dto/create-subscription.dto';
import { CreateUserDto } from '../src/users/dto/create-user.dto';

import { createPlan, deletePlan } from './common/plan.test.methods';
import { createUser, deleteUser } from './common/user.test.methods';
import {
  subscribe,
  unSubscribe,
  updateSubscription,
} from './common/subscription.test.methods';
import { getBillingRecords } from './common/billing.test.methods';
import { sleep } from './common/test.utils';
import { UpdateBillingRecordDto } from '../src/billing/dto/update-billing-record.dto';
import { mockTime, removeTimeMock } from './common/time.test.methods';

let user: CreateUserDto;
let subscription: CreateSubscriptionDto;
let basicPlan: CreatePlanDto, proPlan: CreatePlanDto;

const basicPlanDto: CreatePlanDto = {
  name: 'Billing test Basic plan',
  price_per_month: 10,
  qr_code_limit: 5,
};

const proPlanDto: CreatePlanDto = {
  name: 'Billing test Pro plan',
  price_per_month: 25,
  qr_code_limit: 20,
};

describe('BillingController (e2e)', () => {
  beforeAll(async () => {
    await removeTimeMock();
    basicPlan = await createPlan(basicPlanDto);
    proPlan = await createPlan(proPlanDto);

    user = await createUser({
      name: 'Ann Smith',
      email: 'ann.smith@mail.com',
    });

    expect(user.name).toBe('Ann Smith');
    expect(user.email).toBe('ann.smith@mail.com');
  });

  afterAll(async () => {
    // if (subscription?.id) {
    //   await unSubscribe(subscription);
    // }
    await deletePlan(basicPlan);
    await deletePlan(proPlan);
    await deleteUser(user);
    await removeTimeMock();
  });

  it('create billing record after subscribe to Pro plan', async () => {
    expect(user?.id).toBeDefined();
    expect(proPlan?.id).toBeDefined();

    const initialBillingRecords = await getBillingRecords();
    const initialBRCount = initialBillingRecords.length;

    subscription = await subscribe(user, proPlan);
    try {
      await sleep(1500); // sleep 1.5 sec, wait for scheduler

      const newBillingRecords = await getBillingRecords();
      const newBRCount = newBillingRecords.length;

      expect(newBRCount).toBe(initialBRCount + 1);

      const lastBilingRecord: UpdateBillingRecordDto =
        newBillingRecords[newBRCount - 1];

      expect(lastBilingRecord.subscription_id).toBe(subscription.id);
      expect(lastBilingRecord.amount).toBe(proPlan.price_per_month);
    } finally {
      await unSubscribe(subscription);
    }
  });

  it('downgrade plan in the middle of period', async () => {
    expect(user?.id).toBeDefined();
    expect(proPlan?.id).toBeDefined();
    expect(basicPlan?.id).toBeDefined();

    await mockTime('2025-04-01T09:00:00.000Z');
    try {
      subscription = await subscribe(user, proPlan);
      expect(subscription.plan_id).toBe(proPlan.id);

      //await sleep(1500); // sleep 1.5 sec, wait for scheduler

      await mockTime('2025-04-15T09:00:00.000Z');
      subscription.plan_id = basicPlan.id!;
      delete subscription['plan'];

      const updatedSubscription = await updateSubscription(subscription);
      expect(updatedSubscription.plan_id).toBe(basicPlan.id);
      expect(updatedSubscription.outstanding_credit).toBe(7.5);

      //await sleep(1500); // sleep 1.5 sec, wait for scheduler
    } finally {
      await removeTimeMock();
      await unSubscribe(subscription);
    }
  });
});
