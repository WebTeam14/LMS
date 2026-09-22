import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import User from '../../src/modules/auth/models/User.js';
import Role from '../../src/modules/auth/models/Role.js';
import UserRole from '../../src/modules/auth/models/UserRole.js';
import RefreshToken from '../../src/modules/auth/models/RefreshToken.js';
import { seedSystemRoles } from '../../src/modules/rbac/services/role.service.js';
import { closeRedis } from '../../src/config/redis.js';

describe('Auth & Security API (Integration Tests)', () => {
  const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unisphere_test';
  const testTenantId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    // Clean test database and seed core roles
    await User.deleteMany({});
    await Role.deleteMany({});
    await UserRole.deleteMany({});
    await RefreshToken.deleteMany({});
    await seedSystemRoles();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await UserRole.deleteMany({});
    await RefreshToken.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    await closeRedis();
  });

  const validUserData = {
    firstName: 'Arjun',
    lastName: 'Sharma',
    email: 'arjun.sharma@uni.edu',
    password: 'SecurePassword123!',
    tenantId: testTenantId,
    roleCode: 'STUDENT',
  };

  let registeredTokens = null;

  describe('POST /api/v1/auth/register', () => {
    it('successfully registers a new student with valid credentials and role', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(validUserData.email.toLowerCase());
      expect(res.body.data.user.roles).toContain('STUDENT');
      expect(res.body.data.user.permissions).toContain('courses:read');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');

      registeredTokens = res.body.data.tokens;
    });

    it('rejects registration with duplicate email in same tenant (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_ALREADY_EXISTS');
    });

    it('rejects registration with weak password (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validUserData,
          email: 'weakpass@uni.edu',
          password: 'weak',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('successfully logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
          tenantId: testTenantId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe(validUserData.email.toLowerCase());
    });

    it('fails login with incorrect password (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: 'WrongPassword999!',
          tenantId: testTenantId,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('temporarily locks account after 5 consecutive failed attempts (423 Locked)', async () => {
      // The previous test recorded 1 failed attempt. Perform 3 more failed attempts (total = 4):
      for (let i = 0; i < 3; i++) {
        await request(app).post('/api/v1/auth/login').send({
          email: validUserData.email,
          password: 'WrongPassword999!',
          tenantId: testTenantId,
        });
      }

      // 5th failed attempt triggers the lockout
      await request(app).post('/api/v1/auth/login').send({
        email: validUserData.email,
        password: 'WrongPassword999!',
        tenantId: testTenantId,
      });

      // 6th attempt (even with valid password) must be rejected with 423 Account Locked
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
          tenantId: testTenantId,
        });

      expect(res.status).toBe(423);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCOUNT_LOCKED');

      // Reset lock in DB for subsequent tests
      await User.updateOne(
        { email: validUserData.email.toLowerCase() },
        { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } }
      );
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns user profile and permissions with valid Bearer token', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
          tenantId: testTenantId,
        });

      const token = loginRes.body.data.tokens.accessToken;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(validUserData.email.toLowerCase());
      expect(res.body.data.roles).toContain('STUDENT');
      expect(Array.isArray(res.body.data.permissions)).toBe(true);
    });

    it('returns 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token-string');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('successfully rotates refresh token and returns new access token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: registeredTokens.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.refreshToken).not.toBe(registeredTokens.refreshToken);

      // Save new rotated token
      registeredTokens.refreshToken = res.body.data.refreshToken;
      registeredTokens.accessToken = res.body.data.accessToken;
    });

    it('detects token reuse and revokes all sessions (Security violation 401)', async () => {
      // Create user and get a refresh token
      const userRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
          tenantId: testTenantId,
        });

      const originalRefreshToken = userRes.body.data.tokens.refreshToken;

      // First rotation succeeds
      await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: originalRefreshToken });

      // Second attempt with old (revoked) token triggers reuse detection
      const reuseRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: originalRefreshToken });

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.error.code).toBe('TOKEN_REUSE_DETECTED');
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('changes password and invalidates prior sessions', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
          tenantId: testTenantId,
        });

      const { accessToken, refreshToken: oldRefreshToken } = loginRes.body.data.tokens;
      const newPassword = 'BrandNewPassword2026!';

      const changeRes = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: validUserData.password,
          newPassword,
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);

      // Previous refresh token is now revoked
      const refreshAttempt = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: oldRefreshToken });

      expect(refreshAttempt.status).toBe(401);

      // Login with old password fails
      const oldLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
          tenantId: testTenantId,
        });

      expect(oldLogin.status).toBe(401);

      // Login with new password succeeds
      const newLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: newPassword,
          tenantId: testTenantId,
        });

      expect(newLogin.status).toBe(200);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('revokes the provided refresh token on logout', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: 'BrandNewPassword2026!',
          tenantId: testTenantId,
        });

      const { accessToken, refreshToken } = loginRes.body.data.tokens;

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(logoutRes.status).toBe(200);

      // Refresh token is now invalid/revoked
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });
  });
});
