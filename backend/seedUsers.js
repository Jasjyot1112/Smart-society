const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Society = require('./models/Society');

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    // Make sure a society exists
    let society = await Society.findOne();
    if (!society) {
      society = await Society.create({
        name: 'Genesis Society',
        address: '123 Smart St, Tech City',
        registrationNumber: 'REG12345',
        totalFlats: 100,
      });
      console.log('Created default society');
    }

    const demoUsers = [
      {
        name: 'Admin User',
        email: 'admin@smartsociety.com',
        password: 'Admin@123',
        role: 'admin',
        phone: '9999999999',
        society: society._id,
        isActive: true
      },
      {
        name: 'Raj Kumar',
        email: 'raj@example.com',
        password: 'Test@123',
        role: 'resident',
        phone: '8888888888',
        wing: 'A',
        flatNumber: '101',
        society: society._id,
        isActive: true
      },
      {
        name: 'Security Guard',
        email: 'guard@smartsociety.com',
        password: 'Guard@123',
        role: 'security',
        phone: '7777777777',
        society: society._id,
        isActive: true
      }
    ];

    for (const u of demoUsers) {
      const existingUser = await User.findOne({ email: u.email });
      if (!existingUser) {
        await User.create(u);
        console.log(`Created user: ${u.email}`);
      } else {
        // Force update password and activate
        existingUser.password = u.password;
        existingUser.isActive = true;
        await existingUser.save();
        console.log(`Updated user: ${u.email}`);
      }
    }

    console.log('Database Seeding Completed!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedUsers();
