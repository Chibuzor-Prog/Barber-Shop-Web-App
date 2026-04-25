
// Auto-seeds the MongoDB database on server startup when collections are empty.
// Imports data from data/seed/services.mongo.js and data/seed/users.mongo.js.
// Runs automatically from server.js when DB collections are empty.

require('dotenv').config();
const { connectDB, disconnectDB } = require('./connection');
const UserCredentials = require('../models/UserCredentials');
const UserProfile     = require('../models/UserProfile');
const Service         = require('../models/Service');

// ── Import seed data files ────────────────────────────────────────────────────
const SEED_SERVICES = require('../data/seed/services.mongo');
const SEED_USERS    = require('../data/seed/users.mongo');

// ── Seed Services ─────────────────────────────────────────────────────────────
async function seedServices() {
  const count = await Service.countDocuments();
  if (count > 0) {
    console.log(`  Services: ${count} already present — skipping.`);
    return;
  }

  await Service.insertMany(SEED_SERVICES);
  console.log(`  Services: inserted ${SEED_SERVICES.length} documents.`);
}

// ── Seed Users (credentials + profiles) ──────────────────────────────────────
async function seedUsers() {
  let inserted = 0;
  let skipped  = 0;

  for (const userData of SEED_USERS) {
    const existing = await UserCredentials.findOne({ email: userData.email });

    if (existing) {
      skipped++;
      continue;
    }

    // Hash the plain-text password before storing
    const passwordHash = await UserCredentials.hashPassword(userData.password);

    const cred = await UserCredentials.create({
      email:        userData.email,
      passwordHash,
      role:         userData.role,
    });

    await UserProfile.create({
      credentialId: cred._id,
      email:        userData.email,
      fullName:     userData.fullName,
      phone:        userData.phone || '',
      preferences:  userData.preferences || {},
    });

    inserted++;
  }

  console.log(`  Users: inserted ${inserted}, skipped ${skipped} (already existed).`);
}

// ── Main seed function ────────────────────────────────────────────────────────
async function seed() {
  console.log('\nRunning database seed...');

  await seedServices();
  await seedUsers();

  console.log('Database seed complete.\n');
}

// Run directly: node db/seed.js
if (require.main === module) {
  (async () => {
    await connectDB();
    await seed();
    await disconnectDB();
    process.exit(0);
  })().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

module.exports = seed;
