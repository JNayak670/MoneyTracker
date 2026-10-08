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
      'FRIEND_REQUEST_DECLINED', // Request was declined
      'FRIEND_CONNECTED',      // Accounts successfully connected
      'TRANSACTION_REQUEST',   // Transaction requires approval (NORMAL permission)
      'TRANSACTION_LOGGED',    // Transaction auto-synced (AUTHORIZED permission)
      'TRANSACTION_APPROVED',  // Transaction was approved
      'TRANSACTION_REJECTED',  // Transaction was rejected
      'SETTLEMENT_REQUEST',    // Settlement requires friend approval (NORMAL mode)
      'SETTLEMENT_APPROVED',   // Settlement request was accepted
      'SETTLEMENT_REJECTED',   // Settlement request was declined
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

const sseService = require('../services/sseService');

function formatNotification(doc) {
  if (!doc) return null;
  const json = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
  return {
    ...json,
    id: json.id || (doc._id ? doc._id.toString() : '')
  };
}

// Automatically push newly created notification via SSE to recipient
notificationSchema.post('save', function (doc) {
  try {
    if (doc && doc.userId) {
      const formatted = formatNotification(doc);
      sseService.sendToUser(doc.userId.toString(), 'NEW_NOTIFICATION', formatted);
      sseService.notifyAdmin('NOTIFICATION_SAVED');
    }
  } catch (err) {
    console.error('Error dispatching SSE for notification:', err.message);
  }
});

// Automatically push bulk notifications (e.g. admin broadcast) via SSE
notificationSchema.post('insertMany', function (docs) {
  try {
    if (Array.isArray(docs)) {
      docs.forEach(doc => {
        if (doc && doc.userId) {
          const formatted = formatNotification(doc);
          sseService.sendToUser(doc.userId.toString(), 'NEW_NOTIFICATION', formatted);
        }
      });
      sseService.notifyAdmin('NOTIFICATION_SAVED');
    }
  } catch (err) {
    console.error('Error dispatching SSE for insertMany notifications:', err.message);
  }
});

notificationSchema.post('deleteMany', () => sseService.notifyAdmin('NOTIFICATION_DELETED'));

module.exports = mongoose.model('Notification', notificationSchema);
