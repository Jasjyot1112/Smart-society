const mongoose = require('mongoose');
require('dotenv').config();

const Society = require('./models/Society');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Facility = require('./models/Facility');
const Visitor = require('./models/Visitor');
const Expense = require('./models/Expense');
const Payment = require('./models/Payment');
const Complaint = require('./models/Complaint');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  let genesis = await Society.findOne({ name: 'Genesis Society' });
  if (!genesis) {
    genesis = await Society.create({
      name: 'Genesis Society',
      address: '123 Smart Way, Metro City',
      adminEmail: 'admin@smartsociety.com'
    });
    console.log('Created Genesis Society:', genesis._id);
  } else {
    console.log('Genesis Society found:', genesis._id);
  }

  const sid = genesis._id;

  const models = [User, Booking, Facility, Visitor, Expense, Payment, Complaint, Notification, AuditLog];
  
  for (const Model of models) {
    const res = await Model.updateMany(
      { society: { $exists: false } },
      { $set: { society: sid } }
    );
    console.log(`Migrated ${Model.modelName}: ${res.modifiedCount} updated`);
  }

  console.log('Data migration complete.');
  process.exit(0);
}
migrate();
