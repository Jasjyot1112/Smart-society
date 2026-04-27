const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Facility = require('../models/Facility');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected for seeding...');
};

const facilities = [
  {
    name: 'Football Turf',
    type: 'turf',
    description: 'Full-size artificial turf football ground, well maintained with floodlights.',
    slots: [
      { startTime: '06:00', endTime: '07:00', label: '6 AM - 7 AM' },
      { startTime: '07:00', endTime: '08:00', label: '7 AM - 8 AM' },
      { startTime: '08:00', endTime: '09:00', label: '8 AM - 9 AM' },
      { startTime: '17:00', endTime: '18:00', label: '5 PM - 6 PM' },
      { startTime: '18:00', endTime: '19:00', label: '6 PM - 7 PM' },
      { startTime: '19:00', endTime: '20:00', label: '7 PM - 8 PM' },
      { startTime: '20:00', endTime: '21:00', label: '8 PM - 9 PM' },
    ],
    maxBookingsPerWeek: 3,
    capacity: 22,
    pricePerSlot: 200,
    location: 'Block A - Ground Floor',
    rules: ['No shoes on turf', 'Maximum 22 players', 'Book 24 hrs in advance'],
    isAvailable: true,
  },
  {
    name: 'Table Tennis Room',
    type: 'table_tennis',
    description: 'Professional table tennis setup with 2 tables.',
    slots: [
      { startTime: '08:00', endTime: '09:00', label: '8 AM - 9 AM' },
      { startTime: '09:00', endTime: '10:00', label: '9 AM - 10 AM' },
      { startTime: '10:00', endTime: '11:00', label: '10 AM - 11 AM' },
      { startTime: '16:00', endTime: '17:00', label: '4 PM - 5 PM' },
      { startTime: '17:00', endTime: '18:00', label: '5 PM - 6 PM' },
      { startTime: '18:00', endTime: '19:00', label: '6 PM - 7 PM' },
      { startTime: '19:00', endTime: '20:00', label: '7 PM - 8 PM' },
    ],
    maxBookingsPerWeek: 5,
    capacity: 4,
    pricePerSlot: 50,
    location: 'Club House - 1st Floor',
    rules: ['No food inside', 'Handle equipment with care'],
    isAvailable: true,
  },
  {
    name: 'Lawn / Event Hall',
    type: 'lawn',
    description: 'Beautiful lawned area perfect for small gatherings and events. Capacity: 100 guests.',
    slots: [
      { startTime: '08:00', endTime: '12:00', label: '8 AM - 12 PM (Morning)' },
      { startTime: '13:00', endTime: '17:00', label: '1 PM - 5 PM (Afternoon)' },
      { startTime: '18:00', endTime: '22:00', label: '6 PM - 10 PM (Evening)' },
    ],
    maxBookingsPerWeek: 1,
    capacity: 100,
    pricePerSlot: 1000,
    location: 'Society Garden Area',
    rules: ['Music must stop by 10 PM', 'Clean up after use', 'No non-veg cooking', 'Advance deposit required'],
    isAvailable: true,
  },
];

const seedDB = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Facility.deleteMany({});
    console.log('Cleared existing data...');

    // Create Admin
    const admin = await User.create({
      name: 'Admin Kumar',
      email: process.env.ADMIN_EMAIL || 'admin@smartsociety.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
      phone: '9876543210',
      flatNumber: 'A001',
      wing: 'A',
    });
    console.log(`✅ Admin created: ${admin.email}`);

    // Create Residents
    const residents = await User.create([
      { name: 'Raj Sharma', email: 'raj@example.com', password: 'Test@123', role: 'resident', phone: '9111111111', flatNumber: 'B101', wing: 'B' },
      { name: 'Priya Patel', email: 'priya@example.com', password: 'Test@123', role: 'resident', phone: '9222222222', flatNumber: 'B102', wing: 'B' },
      { name: 'Arjun Mehta', email: 'arjun@example.com', password: 'Test@123', role: 'resident', phone: '9333333333', flatNumber: 'C201', wing: 'C' },
      { name: 'Sunita Verma', email: 'sunita@example.com', password: 'Test@123', role: 'resident', phone: '9444444444', flatNumber: 'C202', wing: 'C' },
    ]);
    console.log(`✅ ${residents.length} Residents created`);

    // Create Security Guard
    const security = await User.create({
      name: 'Ramesh Guard',
      email: 'guard@smartsociety.com',
      password: 'Guard@123',
      role: 'security',
      phone: '9555555555',
    });
    console.log(`✅ Security Guard created: ${security.email}`);

    // Create Facilities
    const createdFacilities = await Facility.create(
      facilities.map((f) => ({ ...f, addedBy: admin._id }))
    );
    console.log(`✅ ${createdFacilities.length} Facilities created`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('=== LOGIN CREDENTIALS ===');
    console.log(`Admin:    ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    console.log('Resident: raj@example.com / Test@123');
    console.log('Security: guard@smartsociety.com / Guard@123');
    console.log('=========================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDB();
