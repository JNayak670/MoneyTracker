const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/moneytracker';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`=======================================================`);
    console.log(` 🍃 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    console.log(`=======================================================`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

const User = require('./models/User');
const Friend = require('./models/Friend');
const Transaction = require('./models/Transaction');
const ShareCode = require('./models/ShareCode');

module.exports = {
  connectDB,
  User,
  Friend,
  Transaction,
  ShareCode
};
