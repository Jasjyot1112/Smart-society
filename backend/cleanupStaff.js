/**
 * Run this ONCE to clean up:
 * 1. Remove resident-specific maids (like LEELA) from Staff collection
 * 2. Deactivate any staff with old roles like 'maid', 'cook', 'driver'
 * 
 * Run: node backend/cleanupStaff.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const OLD_ROLES = ['maid', 'cook', 'driver'];

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Remove staff with old resident-specific roles
  const result = await mongoose.connection.db.collection('staff').deleteMany({
    role: { $in: OLD_ROLES }
  });

  console.log(`🗑️  Removed ${result.deletedCount} resident-specific staff members (maids/cooks/drivers)`);
  
  await mongoose.disconnect();
  console.log('✅ Done. Staff collection is now society-staff only.');
}

cleanup().catch(console.error);
