import { UpdateSubscriptionDto } from './../../src/subscriptions/dto/update-subscription.dto';
import request from 'supertest';
import { apiUrl } from './test.constants';
import { CreateSubscriptionDto } from '../../src/subscriptions/dto/create-subscription.dto';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { CreatePlanDto } from '../../src/subscriptions/dto/create-plan.dto';

export async function findSubscription(
  id: number,
  expectedHTTPCode: number = 200,
): Promise<UpdateSubscriptionDto> {
  const res = await request(`${apiUrl}/subscriptions`)
    .get(`/${id}`)
    .expect(expectedHTTPCode);
  return res.body as UpdateSubscriptionDto;
}

export async function subscribe(
  user: CreateUserDto,
  plan: CreatePlanDto,
  current_qrcode_usage: number = 0,
  outstanding_credit: number = 0,
): Promise<CreateSubscriptionDto> {
  const res = await request(`${apiUrl}/subscriptions`)
    .post('/')
    .send({
      user_id: user.id,
      plan_id: plan.id,
      current_qrcode_usage,
      outstanding_credit,
    })
    .expect(201);
  return res.body as CreateSubscriptionDto;
}

export async function updateSubscription(
  subscription: UpdateSubscriptionDto,
  expectedHTTPCode: number = 200,
): Promise<UpdateSubscriptionDto> {
  const res = await request(`${apiUrl}/subscriptions`)
    .patch(`/${subscription.id}`)
    .send(subscription)
    .expect(expectedHTTPCode);
  return res.body as UpdateSubscriptionDto;
}

export async function unSubscribe(subscription: CreateSubscriptionDto) {
  await request(`${apiUrl}/subscriptions`)
    .delete(`/${subscription.id}`)
    .expect(200);
}
