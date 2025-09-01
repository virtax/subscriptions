import { SetTimeDto } from '../../src/time/dto/set-time.dto';
import { apiUrl } from './test.constants';
import request from 'supertest';

export async function mockTime(time: string) {
  const setTimeDto: SetTimeDto = {
    time,
  };
  return await request(`${apiUrl}/time`).post('/').send(setTimeDto).expect(204);
}

export async function removeTimeMock() {
  return await request(`${apiUrl}/time`).post('/').send().expect(204);
}

export async function getCurrentTime(): Promise<string> {
  const res = await request(`${apiUrl}/time`).get('/').expect(200);
  return res.text;
}
