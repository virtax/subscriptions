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
import { BAD_REQUEST_ERROR, NOT_FOUND_ERROR } from './common/test.constants';

let user: CreateUserDto;
let user2: CreateUserDto;
let subscription: CreateSubscriptionDto;

let basicPlan: CreatePlanDto, proPlan: CreatePlanDto;

const basicPlanDto: CreatePlanDto = {
  name: 'Subscription test Basic plan',
  price_per_month: 10,
  qr_code_limit: 5,
};

const proPlanDto: CreatePlanDto = {
  name: 'Subscription test Pro plan',
  price_per_month: 25,
  qr_code_limit: 20,
};

describe('SubscriptionsController (e2e)', () => {
  beforeAll(async () => {
    basicPlan = await createPlan(basicPlanDto);
    proPlan = await createPlan(proPlanDto);

    user = await createUser({
      name: 'Helen Smith',
      email: 'helen.smith@mail.com',
    });
    expect(user.name).toBe('Helen Smith');
    expect(user.email).toBe('helen.smith@mail.com');

    user2 = await createUser({
      name: 'Robert Smith',
      email: 'rob.smith@mail.com',
    });
    expect(user2.name).toBe('Robert Smith');
    expect(user2.email).toBe('rob.smith@mail.com');
  });

  afterAll(async () => {
    await deleteUser(user);
    await deletePlan(basicPlan);
    await deletePlan(proPlan);
  });

  it('subscribe', async () => {
    expect(user?.id).toBeDefined();
    expect(proPlan?.id).toBeDefined();

    subscription = await subscribe(user, proPlan);
    try {
      expect(subscription.user_id).toBe(user.id);
      expect(subscription.plan_id).toBe(proPlan.id);
      expect(subscription.plan_start_date).toBeDefined();
      expect(subscription.billing_cycle_start_date).toBeDefined();
      expect(subscription.billing_cycle_end_date).toBeDefined();
      expect(subscription.outstanding_credit).toBe(0);
      expect(subscription.current_qrcode_usage).toBe(0);
    } finally {
      await unSubscribe(subscription);
    }
  });

  it('check usage limit when downgrade and returns erorr if limit exceed usage', async () => {
    expect(user?.id).toBeDefined();
    expect(proPlan?.id).toBeDefined();
    expect(basicPlan?.id).toBeDefined();
    const current_qrcode_usage = 15;

    subscription = await subscribe(user, proPlan, current_qrcode_usage);
    try {
      expect(subscription.plan_id).toBe(proPlan.id);

      const subscriptionToUpdate = {
        id: subscription.id,
        plan_id: basicPlan.id,
      };

      await updateSubscription(subscriptionToUpdate, BAD_REQUEST_ERROR);
    } finally {
      await unSubscribe(subscription);
    }
  });

  it('does not allow changing the user of a subscription', async () => {
    expect(user?.id).toBeDefined();
    expect(proPlan?.id).toBeDefined();

    subscription = await subscribe(user, proPlan);
    try {
      expect(subscription.plan_id).toBe(proPlan.id);

      const subscriptionToUpdate = {
        id: subscription.id,
        plan_id: proPlan.id,
        user_id: user2.id,
      };

      await updateSubscription(subscriptionToUpdate, BAD_REQUEST_ERROR);
    } finally {
      await unSubscribe(subscription);
    }
  });


  it('does not allow changing the plan_start_date of a subscription', async () => {
    expect(user?.id).toBeDefined();
    expect(proPlan?.id).toBeDefined();

    subscription = await subscribe(user, proPlan);
    try {
      expect(subscription.plan_id).toBe(proPlan.id);

      const subscriptionToUpdate = {
        id: subscription.id,
        plan_id: proPlan.id,
        plan_start_date: new Date(),
      };

      await updateSubscription(subscriptionToUpdate, BAD_REQUEST_ERROR);
    } finally {
      await unSubscribe(subscription);
    }
  });

  it('does not allow changing the billing_cycle_start_date of a subscription', async () => {
    expect(user?.id).toBeDefined();
    expect(proPlan?.id).toBeDefined();

    subscription = await subscribe(user, proPlan);
    try {
      expect(subscription.plan_id).toBe(proPlan.id);

      const subscriptionToUpdate = {
        id: subscription.id,
        plan_id: proPlan.id,
        billing_cycle_start_date: new Date(),
      };

      await updateSubscription(subscriptionToUpdate, BAD_REQUEST_ERROR);
    } finally {
      await unSubscribe(subscription);
    }
  });

  it('does not allow changing the billing_cycle_end_date of a subscription', async () => {
    expect(user?.id).toBeDefined();
    expect(proPlan?.id).toBeDefined();

    subscription = await subscribe(user, proPlan);
    try {
      expect(subscription.plan_id).toBe(proPlan.id);

      const subscriptionToUpdate = {
        id: subscription.id,
        plan_id: proPlan.id,
        billing_cycle_end_date: new Date(),
      };

      await updateSubscription(subscriptionToUpdate, BAD_REQUEST_ERROR);
    } finally {
      await unSubscribe(subscription);
    }
  });


  it('unSubscribe', async () => {
    expect(user?.id).toBeDefined();
    expect(proPlan?.id).toBeDefined();

    subscription = await subscribe(user, proPlan);
    await unSubscribe(subscription);
    await findSubscription(subscription.id!, NOT_FOUND_ERROR);
  });
});
