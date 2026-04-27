const mongoose = require('mongoose');
require('dotenv').config();
const Facility = require('./models/Facility');

const allSlots = [
  { startTime: '06:00', endTime: '07:00', label: '6 AM - 7 AM' },
  { startTime: '07:00', endTime: '08:00', label: '7 AM - 8 AM' },
  { startTime: '08:00', endTime: '09:00', label: '8 AM - 9 AM' },
  { startTime: '09:00', endTime: '10:00', label: '9 AM - 10 AM' },
  { startTime: '10:00', endTime: '11:00', label: '10 AM - 11 AM' },
  { startTime: '11:00', endTime: '12:00', label: '11 AM - 12 PM' },
  { startTime: '12:00', endTime: '13:00', label: '12 PM - 1 PM' },
  { startTime: '13:00', endTime: '14:00', label: '1 PM - 2 PM' },
  { startTime: '14:00', endTime: '15:00', label: '2 PM - 3 PM' },
  { startTime: '15:00', endTime: '16:00', label: '3 PM - 4 PM' },
  { startTime: '16:00', endTime: '17:00', label: '4 PM - 5 PM' },
  { startTime: '17:00', endTime: '18:00', label: '5 PM - 6 PM' },
  { startTime: '18:00', endTime: '19:00', label: '6 PM - 7 PM' },
  { startTime: '19:00', endTime: '20:00', label: '7 PM - 8 PM' },
  { startTime: '20:00', endTime: '21:00', label: '8 PM - 9 PM' },
  { startTime: '21:00', endTime: '22:00', label: '9 PM - 10 PM' }
];

async function update() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const result = await Facility.updateMany({}, { $set: { slots: allSlots } });
    console.log('Updated facilities:', result.modifiedCount);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

update();
