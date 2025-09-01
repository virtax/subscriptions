import { CreatePlanDto } from '../src/subscriptions/dto/create-plan.dto';
import request from 'supertest';

import { createPlan, deletePlan } from './common/plan.test.methods';
import { apiUrl } from './common/test.constants';

let plan: CreatePlanDto;

const testPlanData: CreatePlanDto = {
  name: 'test plan 111',
  price_per_month: 111,
  qr_code_limit: 33,
};

describe('PlansController (e2e)', () => {
  it('create plan', async () => {
    plan = await createPlan(testPlanData);
    expect(plan.name).toBe('test plan 111');
    expect(plan.price_per_month).toBe(111);
    expect(plan.qr_code_limit).toBe(33);
  });

  it('delete plan', async () => {
    await deletePlan(plan);
    await request(`${apiUrl}/plans/${plan.id}`).get('/').expect(404); // plan not found
  });
});
