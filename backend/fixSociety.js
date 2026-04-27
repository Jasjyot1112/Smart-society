require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const User = require('./models/User');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  const payments = await Payment.find({ society: { $exists: false } });
  console.log('Payments missing society:', payments.length);

  for (const p of payments) {
    const user = await User.findById(p.user).select('society');
    if (user && user.society) {
      await Payment.updateOne({ _id: p._id }, { $set: { society: user.society } });
      console.log('Fixed payment', p._id.toString(), '-> society', user.society.toString());
    }
  }

  // Also fix any other collections with missing society
  const models = [
    { model: require('./models/Booking'), name: 'Booking' },
    { model: require('./models/Visitor'), name: 'Visitor' },
    { model: require('./models/Expense'), name: 'Expense' },
    { model: require('./models/Complaint'), name: 'Complaint' },
    { model: require('./models/Notification'), name: 'Notification' },
  ];

  for (const { model, name } of models) {
    // Find docs missing society but having a user field
    const docs = await model.find({ society: { $exists: false }, user: { $exists: true } });
    for (const doc of docs) {
      const user = await User.findById(doc.user).select('society');
      if (user && user.society) {
        await model.updateOne({ _id: doc._id }, { $set: { society: user.society } });
      }
    }
    if (docs.length > 0) console.log(`Fixed ${docs.length} ${name} records`);
  }

  console.log('All done!');
  process.exit(0);
}

fix().catch(e => { console.error(e); process.exit(1); });
