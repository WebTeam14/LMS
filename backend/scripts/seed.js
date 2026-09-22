import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../src/config/index.js';
import { seedSystemRoles } from '../src/modules/rbac/services/role.service.js';
import Role from '../src/modules/auth/models/Role.js';
import User from '../src/modules/auth/models/User.js';
import UserRole from '../src/modules/auth/models/UserRole.js';

const seedDatabase = async () => {
  try {
    console.log(`[Seed] Connecting to MongoDB at ${config.mongodbUri}...`);
    await mongoose.connect(config.mongodbUri);
    console.log('[Seed] MongoDB connected.');

    // 1. Seed System Baseline Roles
    console.log('[Seed] Verifying system baseline roles...');
    const seededRoles = await seedSystemRoles();
    console.log(`[Seed] System roles verified. Newly created: ${seededRoles.length > 0 ? seededRoles.join(', ') : 'None (already up-to-date)'}`);

    // 2. Seed Default Platform Super Admin (if not present)
    const platformTenantId = new mongoose.Types.ObjectId('650000000000000000000001');
    const superAdminEmail = 'superadmin@unisphere.edu';

    let superAdmin = await User.findOne({ email: superAdminEmail });
    if (!superAdmin) {
      console.log(`[Seed] Creating default Platform Super Administrator: ${superAdminEmail}...`);
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
      console.log('[Seed] Super Administrator created successfully (Password: SuperAdmin2026!)');
    } else {
      console.log(`[Seed] Super Administrator ${superAdminEmail} already exists.`);
    }

    await mongoose.connection.close();
    console.log('[Seed] Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedDatabase();
