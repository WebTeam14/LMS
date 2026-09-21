import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import validate from '../src/common/middleware/validate.js';
import errorHandler from '../src/common/middleware/errorHandler.js';
import { successResponse } from '../src/common/utils/response.js';

describe('Validation Middleware & Error Handler', () => {
  const testApp = express();
  testApp.use(express.json());

  const testSchema = {
    body: z.object({
      email: z.string().email('Invalid email address'),
      role: z.enum(['admin', 'faculty', 'student']),
    }),
  };

  testApp.post('/test-validate', validate(testSchema), (req, res) => {
    successResponse(res, { user: req.body });
  });

  testApp.use(errorHandler);

  it('passes valid payloads through validate middleware', async () => {
    const res = await request(testApp)
      .post('/test-validate')
      .send({ email: 'student@university.edu', role: 'student' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('student@university.edu');
  });

  it('catches invalid payloads and returns structured 400 VALIDATION_ERROR envelope', async () => {
    const res = await request(testApp)
      .post('/test-validate')
      .send({ email: 'not-an-email', role: 'invalid_role' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
  });
});
