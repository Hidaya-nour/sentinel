import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

async function registerAndGetToken(email: string) {
  const res = await request(app)
    .post('/auth/register')
    .send({ email, password: 'correcthorsebattery' });
  return res.body.token as string;
}

describe('Monitor ownership isolation', () => {
  let userAToken: string;
  let userBToken: string;

  beforeEach(async () => {
    userAToken = await registerAndGetToken('userA@test.com');
    userBToken = await registerAndGetToken('userB@test.com');
  });

  it('user B cannot GET a monitor owned by user A (404, not 403 or 200)', async () => {
    const createRes = await request(app)
      .post('/monitors')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'A monitor', url: 'https://example.com' });

    const monitorId = createRes.body.id;

    const res = await request(app)
      .get(`/monitors/${monitorId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
  });

  it('user B cannot PATCH a monitor owned by user A', async () => {
    const createRes = await request(app)
      .post('/monitors')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'A monitor', url: 'https://example.com' });

    const res = await request(app)
      .patch(`/monitors/${createRes.body.id}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'hijacked' });

    expect(res.status).toBe(404);

    // Confirm it genuinely wasn't changed, not just that the response was 404
    const check = await request(app)
      .get(`/monitors/${createRes.body.id}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(check.body.name).toBe('A monitor');
  });

  it('user B cannot DELETE a monitor owned by user A', async () => {
    const createRes = await request(app)
      .post('/monitors')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'A monitor', url: 'https://example.com' });

    const deleteRes = await request(app)
      .delete(`/monitors/${createRes.body.id}`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(deleteRes.status).toBe(404);

    const stillThere = await request(app)
      .get(`/monitors/${createRes.body.id}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(stillThere.status).toBe(200);
  });

  it('requests with no token are rejected with 401', async () => {
    const res = await request(app).get('/monitors');
    expect(res.status).toBe(401);
  });
});
