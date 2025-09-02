import { CreatePlanDto } from '../src/subscriptions/dto/create-plan.dto';
import { CreateSubscriptionDto } from '../src/subscriptions/dto/create-subscription.dto';
import { CreateUserDto } from '../src/users/dto/create-user.dto';

import { createPlan, deletePlan } from './common/plan.test.methods';
import { createUser, deleteUser } from './common/user.test.methods';
import {
  findSubscription,
  subscribe,
  unSubscribe,
  updateSubscription,
} from './common/subscription.test.methods';
import { getBillingRecords } from './common/billing.test.methods';
import { sleep } from './common/test.utils';
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

  it('When Outstanding Credit=0. Create billing record with monthly charge after subscribe to Pro plan', async () => {
    expect(user?.id).toBeDefined();
    expect(proPlan?.id).toBeDefined();

    subscription = await subscribe(user, proPlan);
    try {
      await sleep(1200); // sleep 1.2 sec, wait for cron job to issue a billing record

      const subscriptionBillingRecords = await getBillingRecords(
        subscription.id,
      );
      const newBilingRecord = subscriptionBillingRecords[0];

      expect(newBilingRecord.subscription_id).toBe(subscription.id);
      expect(newBilingRecord.amount).toBe(proPlan.price_per_month);
    } finally {
      await unSubscribe(subscription);
    }
  });

  it('When Outstanding Сredit > plan charge. Create billing record with 0 charge, decrease credit by monthly charge, after subscribe to plan', async () => {
    expect(user?.id).toBeDefined();
    expect(proPlan?.id).toBeDefined();
    const outstandingСredit = 50;

    subscription = await subscribe(user, proPlan, 0, outstandingСredit);
    try {
      await sleep(1200); // sleep 1.2 sec, wait for cron job to issue a billing record

      const subscriptionBillingRecords = await getBillingRecords(
        subscription.id,
      );
      const newBilingRecord = subscriptionBillingRecords[0];

      expect(newBilingRecord.subscription_id).toBe(subscription.id);
      expect(newBilingRecord.amount).toBe(0);

      const newCredit = 25; // outstandingСredit - proPlan.price_per_month;

      const chargedSubscription = await findSubscription(subscription.id!);
      expect(chargedSubscription.outstanding_credit).toBe(newCredit);
    } finally {
      await unSubscribe(subscription);
    }
  });

  it('When 0 < Outstanding Сredit < plan charge. Create billing record with (PlanCharge-OutstandingСredit) charge, new credit = 0, after subscribe to plan', async () => {
    expect(user?.id).toBeDefined();
    expect(proPlan?.id).toBeDefined();
    const outstandingСredit = 17;

    const chargedAmount = 25 - 17;
    const newCredit = 0;

    subscription = await subscribe(user, proPlan, 0, outstandingСredit);
    try {
      await sleep(1500); // sleep 1.5 sec, wait for cron job to issue a billing record

      const subscriptionBillingRecords = await getBillingRecords(
        subscription.id,
      );
      const newBilingRecord = subscriptionBillingRecords[0];

      expect(newBilingRecord.subscription_id).toBe(subscription.id);
      expect(newBilingRecord.amount).toBe(chargedAmount);

      const chargedSubscription = await findSubscription(subscription.id!);
      expect(chargedSubscription.outstanding_credit).toBe(newCredit);
    } finally {
      await unSubscribe(subscription);
    }
  });

  it('Downgrade plan in the middle of period, check outstanding_credit', async () => {
    expect(user?.id).toBeDefined();
    expect(proPlan?.id).toBeDefined();
    expect(basicPlan?.id).toBeDefined();

    await mockTime('2025-04-01T09:00:00.000Z');
    try {
      subscription = await subscribe(user, proPlan);
      expect(subscription.plan_id).toBe(proPlan.id);

      await mockTime('2025-04-15T09:00:00.000Z');
      subscription.plan_id = basicPlan.id!;

      const updatedSubscription = await updateSubscription(subscription);
      expect(updatedSubscription.plan_id).toBe(basicPlan.id);
      expect(updatedSubscription.outstanding_credit).toBe(7.5);
    } finally {
      await removeTimeMock();
      await unSubscribe(subscription);
    }
  });
});
