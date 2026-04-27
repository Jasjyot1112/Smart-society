const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/smart-society').then(async () => {
  try {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({ role: 'admin' }).limit(1).toArray();
    if (users.length) {
      await db.collection('facilities').updateMany({}, { $set: { society: users[0].society } });
      console.log('Fixed society refs');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
});
