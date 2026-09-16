import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('POST /auth/register', () => {
  it('registers a new user and sets an auth cookie', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'integration@test.com', password: 'correcthorsebattery' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('integration@test.com');
    // Token is no longer in the body - it's set as an httpOnly cookie instead.
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('token=');
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'dup@test.com', password: 'correcthorsebattery' });

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'dup@test.com', password: 'differentpassword123' });

    expect(res.status).toBe(409);
  });

  it('rejects a short password with 400 before ever touching the database', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'short@test.com', password: 'short' });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  it('logs in with correct credentials and sets an auth cookie', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'login@test.com', password: 'correcthorsebattery' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'login@test.com', password: 'correcthorsebattery' });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects wrong password with 401', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'wrongpw@test.com', password: 'correcthorsebattery' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'wrongpw@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });
});
