import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import Tenant from '../../src/modules/university/models/Tenant.js';
import User from '../../src/modules/auth/models/User.js';
import Role from '../../src/modules/auth/models/Role.js';
import UserRole from '../../src/modules/auth/models/UserRole.js';
import RefreshToken from '../../src/modules/auth/models/RefreshToken.js';
import { seedSystemRoles } from '../../src/modules/rbac/services/role.service.js';
import { closeRedis } from '../../src/config/redis.js';

describe('Auth & Security API (Integration Tests)', () => {
  const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unisphere_test';
  const testTenantId = new mongoose.Types.ObjectId().toString();
  const secondaryTenantId = new mongoose.Types.ObjectId().toString();
  const inactiveTenantId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    // Clean test database and seed core roles and tenants
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await UserRole.deleteMany({});
    await RefreshToken.deleteMany({});
    await User.syncIndexes();
    await seedSystemRoles();

    // Create active test tenants (UNI-015)
    await Tenant.create([
      {
        _id: testTenantId,
        name: 'Apex Institute of Technology',
        code: 'AIT_MAIN',
        slug: 'ait-main',
        domain: 'ait.edu',
        status: 'active',
      },
      {
        _id: secondaryTenantId,
        name: 'Beacon State University',
        code: 'BSU_MAIN',
        slug: 'bsu-main',
        domain: 'bsu.edu',
        status: 'active',
      },
      {
        _id: inactiveTenantId,
        name: 'Suspended Campus',
        code: 'SUSPENDED_MAIN',
        slug: 'suspended-main',
        domain: 'suspended.edu',
        status: 'suspended',
      },
    ]);
  });

  afterAll(async () => {
    await Tenant.deleteMany({});
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
    email: 'arjun.sharma@ait.edu',
    password: 'SecurePassword123!',
    tenantId: testTenantId,
  };

  let registeredTokens = null;
  let emailVerificationToken = null;

  describe('Health & Gateway Routes (UNI-002)', () => {
    it('returns 200 OK from /api/v1/health', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
    });

    it('returns 200 OK from /api/v1/ready', async () => {
      const res = await request(app).get('/api/v1/ready');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.database).toBe(true);
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('successfully registers a new student and generates verification token', async () => {
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
      expect(res.body.data).toHaveProperty('verificationToken');

      registeredTokens = res.body.data.tokens;
      emailVerificationToken = res.body.data.verificationToken;
    });

    it('forces STUDENT role even if client sends arbitrary roleCode (UNI-014)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Sneaky',
          lastName: 'User',
          email: 'sneaky.admin@ait.edu',
          password: 'SecurePassword123!',
          tenantId: testTenantId,
          roleCode: 'SUPER_ADMIN', // Attempted privilege escalation
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.roles).toContain('STUDENT');
      expect(res.body.data.user.roles).not.toContain('SUPER_ADMIN');
    });

    it('rejects registration when tenantId does not exist (404 TENANT_NOT_FOUND) (UNI-015)', async () => {
      const nonExistentTenantId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validUserData,
          email: 'notenant@ait.edu',
          tenantId: nonExistentTenantId,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TENANT_NOT_FOUND');
    });

    it('rejects registration when tenant is suspended (403 TENANT_INACTIVE) (UNI-015)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validUserData,
          email: 'suspended@suspended.edu',
          tenantId: inactiveTenantId,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TENANT_INACTIVE');
    });

    it('rejects registration with duplicate email in same tenant (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_ALREADY_EXISTS');
    });

    it('allows re-registering the same email if prior account was soft-deleted (UNI-018)', async () => {
      const reRegEmail = 'softdeleted@ait.edu';
      // 1. Register user
      const firstReg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validUserData,
          email: reRegEmail,
        });
      expect(firstReg.status).toBe(201);

      // 2. Soft-delete user
      await User.updateOne({ email: reRegEmail }, { $set: { isDeleted: true, deletedAt: new Date() } });

      // 3. Re-register with the same email in the same tenant
      const reReg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validUserData,
          email: reRegEmail,
        });

      expect(reReg.status).toBe(201);
      expect(reReg.body.data.user.email).toBe(reRegEmail);
    });

    it('rejects registration with weak password (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validUserData,
          email: 'weakpass@ait.edu',
          password: 'weak',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Email Verification (UNI-016)', () => {
    it('verifies email with valid verification token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: emailVerificationToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify emailVerified status via DB
      const user = await User.findOne({ email: validUserData.email.toLowerCase() });
      expect(user.emailVerified).toBe(true);
    });

    it('rejects verification with invalid token (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'invalid-nonexistent-token' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_VERIFICATION_TOKEN');
    });
  });

  describe('POST /api/v1/auth/login & Multi-Tenant Disambiguation (UNI-017)', () => {
    it('successfully logs in with correct credentials and explicit tenantId', async () => {
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

    it('successfully logs in when tenantId is omitted and user exists in exactly one tenant', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.tenantId).toBe(testTenantId);
    });

    it('requires tenantId when same email exists across multiple tenants (UNI-017)', async () => {
      const multiEmail = 'dual.student@global.edu';

      // Register same email in secondary tenant
      await request(app).post('/api/v1/auth/register').send({
        firstName: 'Dual',
        lastName: 'One',
        email: multiEmail,
        password: 'SecurePassword123!',
        tenantId: testTenantId,
      });

      await request(app).post('/api/v1/auth/register').send({
        firstName: 'Dual',
        lastName: 'Two',
        email: multiEmail,
        password: 'SecurePassword123!',
        tenantId: secondaryTenantId,
      });

      // Login without tenantId should be rejected with TENANT_REQUIRED
      const res = await request(app).post('/api/v1/auth/login').send({
        email: multiEmail,
        password: 'SecurePassword123!',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('TENANT_REQUIRED');
      expect(res.body.error.details.tenantIds).toBeDefined();
      expect(res.body.error.details.tenantIds.length).toBe(2);

      // Login WITH explicit tenantId succeeds
      const explicitRes = await request(app).post('/api/v1/auth/login').send({
        email: multiEmail,
        password: 'SecurePassword123!',
        tenantId: secondaryTenantId,
      });

      expect(explicitRes.status).toBe(200);
      expect(explicitRes.body.data.user.tenantId).toBe(secondaryTenantId);
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

  describe('Password Recovery (UNI-016)', () => {
    let resetToken = null;

    it('generates a password reset token for valid user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: validUserData.email, tenantId: testTenantId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resetToken).toBeDefined();

      resetToken = res.body.data.resetToken;
    });

    it('resets password and invalidates previous sessions', async () => {
      // First get a login session
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
          tenantId: testTenantId,
        });
      const previousRefreshToken = loginRes.body.data.tokens.refreshToken;

      // Reset password
      const newPassword = 'NewlyResetPassword2026!';
      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword,
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Old refresh token must now be revoked
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: previousRefreshToken });
      expect(refreshRes.status).toBe(401);

      // Login with new password succeeds
      const newLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: newPassword,
          tenantId: testTenantId,
        });
      expect(newLoginRes.status).toBe(200);

      // Restore password for downstream tests
      validUserData.password = newPassword;
    });

    it('rejects invalid or expired reset token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token-string',
          newPassword: 'SomePassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_RESET_TOKEN');
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
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
          tenantId: testTenantId,
        });

      const activeRefreshToken = loginRes.body.data.tokens.refreshToken;

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: activeRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.refreshToken).not.toBe(activeRefreshToken);
    });

    it('detects token reuse and revokes all sessions (Security violation 401)', async () => {
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

  describe('POST /api/v1/auth/logout (UNI-022)', () => {
    it('rejects logout when neither token nor authorization is provided (400)', async () => {
      const res = await request(app).post('/api/v1/auth/logout').send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('LOGOUT_CREDENTIAL_REQUIRED');
    });

    it('successfully logs out and revokes refresh token when credentials provided', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
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
