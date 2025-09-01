import request from 'supertest';

import { baseUrl } from './common/test.constants';

describe('AppController (e2e)', () => {
  it('GET /', async () => {
    const res = await request(baseUrl).get('/').expect(200);
    expect(res.text).toMatch(/^Hello! The current mocked time is /);
    return res;
  });
});
