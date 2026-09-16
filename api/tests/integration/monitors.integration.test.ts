import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

// request.agent() persists cookies across requests on the same agent instance,
// exactly like a real browser session - this is what lets us "log in once,
// stay logged in" across multiple calls, matching how the cookie-based auth
// actually works end to end.
async function registeredAgent(email: string) {
  const agent = request.agent(app);
  await agent.post('/auth/register').send({ email, password: 'correcthorsebattery' });
  return agent;
}

describe('Monitor ownership isolation', () => {
  it('user B cannot GET a monitor owned by user A (404, not 403 or 200)', async () => {
    const userA = await registeredAgent('userA-get@test.com');
    const userB = await registeredAgent('userB-get@test.com');

    const createRes = await userA
      .post('/monitors')
      .send({ name: 'A monitor', url: 'https://example.com' });

    const res = await userB.get(`/monitors/${createRes.body.id}`);
    expect(res.status).toBe(404);
  });

  it('user B cannot PATCH a monitor owned by user A', async () => {
    const userA = await registeredAgent('userA-patch@test.com');
    const userB = await registeredAgent('userB-patch@test.com');

    const createRes = await userA
      .post('/monitors')
      .send({ name: 'A monitor', url: 'https://example.com' });

    const res = await userB.patch(`/monitors/${createRes.body.id}`).send({ name: 'hijacked' });
    expect(res.status).toBe(404);

    const check = await userA.get(`/monitors/${createRes.body.id}`);
    expect(check.body.name).toBe('A monitor');
  });

  it('user B cannot DELETE a monitor owned by user A', async () => {
    const userA = await registeredAgent('userA-delete@test.com');
    const userB = await registeredAgent('userB-delete@test.com');

    const createRes = await userA
      .post('/monitors')
      .send({ name: 'A monitor', url: 'https://example.com' });

    const deleteRes = await userB.delete(`/monitors/${createRes.body.id}`);
    expect(deleteRes.status).toBe(404);

    const stillThere = await userA.get(`/monitors/${createRes.body.id}`);
    expect(stillThere.status).toBe(200);
  });

  it('requests with no session are rejected with 401', async () => {
    const res = await request(app).get('/monitors');
    expect(res.status).toBe(401);
  });
});
