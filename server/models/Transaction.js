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
  sharedWithUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvalStatus: {
    type: String,
    enum: ['ACTIVE', 'PENDING_APPROVAL', 'REJECTED'],
    default: 'ACTIVE'
  },
  linkedTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  isShared: {
    type: Boolean,
    default: false
  },
  isSettled: {
    type: Boolean,
    default: false
  },
  settledAt: {
    type: Date,
    default: null
  },
  createdByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  receiptNote: String,
  splitGroupId: String,
  splitDetails: {
    totalBillAmount: Number,
    payerName: String,
    payerFriendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Friend',
      default: null
    },
    payerIsUser: {
      type: Boolean,
      default: true
    },
    splitMode: {
      type: String,
      enum: ['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES'],
      default: 'EQUAL'
    },
    userShare: Number,
    participantCount: Number,
    participantsSummary: [{
      name: String,
      amount: Number,
      isPayer: Boolean,
      isSelf: Boolean
    }]
  }
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

// Create indexes for fast sorting by date & createdAt and fast friend ledger / balance queries
transactionSchema.index({ userId: 1, date: -1, createdAt: -1 });
transactionSchema.index({ userId: 1, approvalStatus: 1 });
transactionSchema.index({ userId: 1, friendId: 1, approvalStatus: 1 });
transactionSchema.index({ friendId: 1, userId: 1, date: 1 });
transactionSchema.index({ splitGroupId: 1 });
transactionSchema.index({ userId: 1, splitGroupId: 1 });

const sseService = require('../services/sseService');

// Notify admin console on any transaction mutation (create, edit, delete, settle, approve, reject)
transactionSchema.post('save', () => sseService.notifyAdmin('TRANSACTION_SAVED'));
transactionSchema.post('insertMany', () => sseService.notifyAdmin('TRANSACTION_SAVED'));
transactionSchema.post('findOneAndUpdate', () => sseService.notifyAdmin('TRANSACTION_UPDATED'));
transactionSchema.post('updateOne', () => sseService.notifyAdmin('TRANSACTION_UPDATED'));
transactionSchema.post('updateMany', () => sseService.notifyAdmin('TRANSACTION_UPDATED'));
transactionSchema.post('findOneAndDelete', () => sseService.notifyAdmin('TRANSACTION_DELETED'));
transactionSchema.post('deleteOne', () => sseService.notifyAdmin('TRANSACTION_DELETED'));
transactionSchema.post('deleteMany', () => sseService.notifyAdmin('TRANSACTION_DELETED'));

module.exports = mongoose.model('Transaction', transactionSchema);
