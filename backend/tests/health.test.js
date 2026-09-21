import request from 'supertest';
import app from '../src/app.js';
import { closeRedis } from '../src/config/redis.js';

describe('Health and Status API Checks', () => {
  afterAll(async () => {
    await closeRedis();
  });
  it('GET /health returns status ok with system metadata', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body.data).toHaveProperty('service', 'UniSphere');
    expect(res.body.data).toHaveProperty('components');
  });

  it('GET /ready returns readiness status', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('status');
  });

  it('GET /api/v1 returns API root gateway information', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('version', '1.0.0');
  });

  it('GET /non-existent-route returns 404 with error envelope', async () => {
    const res = await request(app).get('/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});
