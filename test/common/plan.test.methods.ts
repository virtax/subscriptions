import { UpdatePlanDto } from './../../src/subscriptions/dto/update-plan.dto';
import { apiUrl } from './test.constants';
import { CreatePlanDto } from '../../src/subscriptions/dto/create-plan.dto';
import request from 'supertest';

export async function createPlan(plan: CreatePlanDto): Promise<CreatePlanDto> {
  const res = await request(`${apiUrl}/plans`).post('/').send(plan).expect(201);
  return res.body as CreatePlanDto;
}

export async function deletePlan(plan: UpdatePlanDto) {
  await request(`${apiUrl}/plans`).delete(`/${plan.id}`).expect(200);
}

export async function deletePlans(plans: UpdatePlanDto[]) {
  return await Promise.all(plans.map((plan) => deletePlan(plan)));
}

let basicPlan: CreatePlanDto, proPlan: CreatePlanDto;

export async function createStandartPlans() {
  basicPlan = await createPlan({
    name: 'Basic',
    price_per_month: 10,
    qr_code_limit: 5,
  });

  proPlan = await createPlan({
    name: 'Pro',
    price_per_month: 25,
    qr_code_limit: 20,
  });
}

export async function deleteStandartsPlans() {
  await deletePlans([basicPlan, proPlan]);
}
