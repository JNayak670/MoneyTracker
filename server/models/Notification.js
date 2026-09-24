const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'USERNAME_MATCH',        // Offline friend registered with saved @username
      'FRIEND_REQUEST',        // Direct request from registered user
      'FRIEND_CONNECTED',      // Accounts successfully connected
      'TRANSACTION_REQUEST',   // Transaction requires approval (NORMAL permission)
      'TRANSACTION_LOGGED',    // Transaction auto-synced (AUTHORIZED permission)
      'TRANSACTION_APPROVED',  // Transaction was approved
      'TRANSACTION_REJECTED',  // Transaction was rejected
      'SYSTEM_ALERT',
      'ADMIN_MESSAGE'          // Direct message or broadcast sent from Admin Panel
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'Friend' },
    connectedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    username: String,
    friendName: String,
    amount: Number
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isActioned: {
    type: Boolean,
    default: false
  },
  actionTaken: {
    type: String, // 'CONNECTED', 'IGNORED', 'ACCEPTED', 'DECLINED', 'APPROVED', 'REJECTED'
    default: null
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

// Compound indexes for fast unread count and chronologically sorted notification feed
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
