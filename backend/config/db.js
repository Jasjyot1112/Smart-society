const mongoose = require('mongoose');

const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.error(`❌ MongoDB connection failed: ${err.message}`);
      retries -= 1;
      if (retries === 0) {
        console.error('All retries exhausted. Exiting...');
        process.exit(1);
      }
      console.log(`Retrying in 5 seconds... (${retries} attempts left)`);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
};

module.exports = connectDB;
