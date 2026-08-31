const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  friendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Friend',
    required: true
  },
  type: {
    type: String,
    enum: ['GIVEN', 'RECEIVED', 'SETTLED', 'SPLIT'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  impactOnUser: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    default: 'Food & Dining'
  },
  note: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: String,
  paymentMethod: {
    type: String,
    default: 'UPI'
  },
  status: {
    type: String,
    default: 'COMPLETED'
  },
  receiptNote: String,
  splitGroupId: String
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Create index for fast sorting by date & createdAt
transactionSchema.index({ userId: 1, date: -1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
