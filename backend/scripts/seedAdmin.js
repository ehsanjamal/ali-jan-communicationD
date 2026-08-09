// Run once to create the shop owner's admin account:
//   npm run seed:admin
// Reads SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME from .env

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const run = async () => {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || 'Admin';

  if (!email || !password) {
    console.error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    console.log(`Admin already exists for ${email}. Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await Admin.create({
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'owner',
  });

  console.log(`Admin account created for ${email}. You can now log in from the admin panel.`);
  console.log('For security, remove SEED_ADMIN_PASSWORD from your .env file now.');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
