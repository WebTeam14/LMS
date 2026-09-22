import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import User from '../../src/modules/auth/models/User.js';
import Role from '../../src/modules/auth/models/Role.js';
import UserRole from '../../src/modules/auth/models/UserRole.js';
import { seedSystemRoles } from '../../src/modules/rbac/services/role.service.js';
import { register } from '../../src/modules/auth/services/auth.service.js';
import { closeRedis } from '../../src/config/redis.js';

describe('RBAC & Multi-Tenancy Isolation API (Integration Tests)', () => {
  const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unisphere_test';

  const tenantA = new mongoose.Types.ObjectId().toString();
  const tenantB = new mongoose.Types.ObjectId().toString();

  let adminTokenTenantA = null;
  let studentTokenTenantA = null;
  let adminTokenTenantB = null;
  let userInTenantBId = null;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    await User.deleteMany({});
    await Role.deleteMany({});
    await UserRole.deleteMany({});
    await seedSystemRoles();

    // 1. Create University Admin in Tenant A
    const adminA = await register({
      firstName: 'Admin',
      lastName: 'TenantA',
      email: 'admin@tenanta.edu',
      password: 'AdminPassword123!',
      tenantId: tenantA,
      roleCode: 'UNIVERSITY_ADMIN',
    });
    adminTokenTenantA = adminA.tokens.accessToken;

    // 2. Create Student in Tenant A
    const studentA = await register({
      firstName: 'Student',
      lastName: 'TenantA',
      email: 'student@tenanta.edu',
      password: 'StudentPassword123!',
      tenantId: tenantA,
      roleCode: 'STUDENT',
    });
    studentTokenTenantA = studentA.tokens.accessToken;

    // 3. Create University Admin in Tenant B
    const adminB = await register({
      firstName: 'Admin',
      lastName: 'TenantB',
      email: 'admin@tenantb.edu',
      password: 'AdminPassword123!',
      tenantId: tenantB,
      roleCode: 'UNIVERSITY_ADMIN',
    });
    adminTokenTenantB = adminB.tokens.accessToken;

    // 4. Create Student in Tenant B
    const studentB = await register({
      firstName: 'Student',
      lastName: 'TenantB',
      email: 'student@tenantb.edu',
      password: 'StudentPassword123!',
      tenantId: tenantB,
      roleCode: 'STUDENT',
    });
    userInTenantBId = studentB.user.id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await UserRole.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    await closeRedis();
  });

  describe('RBAC Authorization Enforcement', () => {
    it('allows University Admin with users:read to list users', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminTokenTenantA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('denies Student without users:read access to list users (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${studentTokenTenantA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('prevents modifying or deleting protected system roles (403 Forbidden)', async () => {
      const studentRole = await Role.findOne({ code: 'STUDENT', tenantId: null });

      const res = await request(app)
        .delete(`/api/v1/roles/${studentRole._id}`)
        .set('Authorization', `Bearer ${adminTokenTenantA}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('SYSTEM_ROLE_PROTECTED');
    });
  });

  describe('Multi-Tenancy Isolation Verification', () => {
    it('Tenant A user list strictly excludes Tenant B users', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminTokenTenantA}`);

      expect(res.status).toBe(200);
      const userEmails = res.body.data.map((u) => u.email);
      expect(userEmails).toContain('admin@tenanta.edu');
      expect(userEmails).toContain('student@tenanta.edu');
      // Tenant B users must NOT appear in Tenant A results
      expect(userEmails).not.toContain('admin@tenantb.edu');
      expect(userEmails).not.toContain('student@tenantb.edu');
    });

    it('Tenant A Admin cannot access a specific user belonging to Tenant B (404/Isolated)', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${userInTenantBId}`)
        .set('Authorization', `Bearer ${adminTokenTenantA}`);

      // Even with an admin token, accessing another tenant's user is prevented
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('Tenant A Admin cannot delete a user belonging to Tenant B', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${userInTenantBId}`)
        .set('Authorization', `Bearer ${adminTokenTenantA}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');

      // Verify user is still alive in Tenant B
      const checkRes = await request(app)
        .get(`/api/v1/users/${userInTenantBId}`)
        .set('Authorization', `Bearer ${adminTokenTenantB}`);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.isDeleted).toBe(false);
    });
  });
});
