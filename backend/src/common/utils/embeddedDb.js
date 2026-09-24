import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import logger from './logger.js';
import Tenant from '../../modules/university/models/Tenant.js';
import Role from '../../modules/auth/models/Role.js';
import User from '../../modules/auth/models/User.js';
import UserRole from '../../modules/auth/models/UserRole.js';
import { seedSystemRoles } from '../../modules/rbac/services/role.service.js';

let memoryServer = null;

export const seedInitialData = async () => {
  try {
    const platformTenantId = new mongoose.Types.ObjectId('650000000000000000000001');
    let defaultTenant = await Tenant.findById(platformTenantId);
    if (!defaultTenant) {
      defaultTenant = await Tenant.create({
        _id: platformTenantId,
        name: 'UniSphere Central University',
        code: 'UNISPHERE_MAIN',
        slug: 'unisphere-main',
        domain: 'unisphere.edu',
        status: 'active',
        settings: {
          allowSelfRegistration: true,
          mfaRequired: false,
          timezone: 'UTC',
        },
      });
      logger.info(`[DB Init] Created default Platform Tenant: ${defaultTenant.name}`);
    }

    await seedSystemRoles();

    const superAdminEmail = 'superadmin@unisphere.edu';
    let superAdmin = await User.findOne({ email: superAdminEmail, tenantId: platformTenantId });
    if (!superAdmin) {
      const passwordHash = await bcrypt.hash('SuperAdmin2026!', 12);
      superAdmin = await User.create({
        tenantId: platformTenantId,
        firstName: 'System',
        lastName: 'SuperAdmin',
        email: superAdminEmail,
        passwordHash,
        status: 'active',
        emailVerified: true,
      });

      const superAdminRole = await Role.findOne({ code: 'SUPER_ADMIN', tenantId: null });
      if (superAdminRole) {
        await UserRole.create({
          userId: superAdmin._id,
          roleId: superAdminRole._id,
          tenantId: platformTenantId,
          assignedBy: superAdmin._id,
        });
      }
      logger.info(`[DB Init] Created default Super Administrator: ${superAdminEmail}`);
    }
  } catch (err) {
    logger.warn(`[DB Init Warning] Error checking initial data: ${err.message}`);
  }
};

export const startEmbeddedMongo = async () => {
  if (memoryServer) return memoryServer;

  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'unisphere',
      },
    });

    const uri = memoryServer.getUri();
    await mongoose.connect(uri);
    logger.info(`[DB] Embedded MongoDB running on port 27017 (${uri})`);

    await seedInitialData();

    return memoryServer;
  } catch (err) {
    // If port 27017 is taken, try dynamic port
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create({
        instance: { dbName: 'unisphere' },
      });
      const uri = memoryServer.getUri();
      await mongoose.connect(uri);
      logger.info(`[DB] Embedded MongoDB running on dynamic port (${uri})`);
      await seedInitialData();
      return memoryServer;
    } catch (innerErr) {
      logger.error(`[DB] Failed to launch embedded MongoDB: ${innerErr.message}`);
      throw innerErr;
    }
  }
};

export const stopEmbeddedMongo = async () => {
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

export default {
  startEmbeddedMongo,
  stopEmbeddedMongo,
  seedInitialData,
};
