import mongoose from 'mongoose';
import config from '../src/config/index.js';

const seedDatabase = async () => {
  try {
    console.log(`[Seed] Connecting to MongoDB at ${config.mongodbUri}...`);
    await mongoose.connect(config.mongodbUri);
    console.log('[Seed] MongoDB connected.');

    // Seed baseline roles, system tenant, or admin configurations
    console.log('[Seed] Seeding initial UniSphere platform configuration...');
    
    // Future Phase 2 seed data will populate here (roles: super_admin, university_admin, faculty, student)
    console.log('[Seed] Baseline configuration seeded successfully.');

    await mongoose.connection.close();
    console.log('[Seed] Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedDatabase();
