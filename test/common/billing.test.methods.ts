import { CreateBillingRecordDto } from '../../src/billing/dto/create-billing-record.dto';
import { UpdateBillingRecordDto } from './../../src/billing/dto/update-billing-record.dto';
import { apiUrl } from './test.constants';
import request from 'supertest';

export async function getBillingRecords(): Promise<CreateBillingRecordDto[]> {
  const res = await request(`${apiUrl}/billing`).get('/').expect(200);
  return res.body as CreateBillingRecordDto[];
}

export async function getBillingRecord(
  billingRecordId: number,
): Promise<CreateBillingRecordDto> {
  const res = await request(`${apiUrl}/billing/${billingRecordId}`)
    .get('/')
    .expect(200);
  return res.body as CreateBillingRecordDto;
}

export async function deleteBillingRecord(
  billingRecord: UpdateBillingRecordDto,
) {
  await request(`${apiUrl}/billing`).delete(`/${billingRecord.id}`).expect(200);
}
