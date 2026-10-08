const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: String,
  email: String,
  avatarColor: {
    type: String,
    default: '#6366f1'
  },
  avatarEmoji: {
    type: String,
    default: '👤'
  },
  relationshipTag: {
    type: String,
    default: 'Friend'
  },
  pendingUsername: {
    type: String,
    lowercase: true,
    trim: true,
    default: null
  },
  connectedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  connectionStatus: {
    type: String,
    enum: ['OFFLINE', 'PENDING_MATCH', 'REQUEST_SENT', 'REQUEST_RECEIVED', 'CONNECTED'],
    default: 'OFFLINE'
  },
  permission: {
    type: String,
    enum: ['NORMAL', 'AUTHORIZED'],
    default: 'NORMAL'
  },
  linkedAt: {
    type: Date,
    default: null
  },
  notes: String
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

// Compound and single-field indexes for instant lookups and fast sorting
friendSchema.index({ userId: 1, name: 1 });
friendSchema.index({ userId: 1, connectionStatus: 1 });
friendSchema.index({ userId: 1, connectedUserId: 1 });
friendSchema.index({ connectedUserId: 1, userId: 1 });

const sseService = require('../services/sseService');

// Notify admin console on any friend/connection mutation (add, edit, link, permission, delete)
friendSchema.post('save', () => sseService.notifyAdmin('FRIEND_SAVED'));
friendSchema.post('insertMany', () => sseService.notifyAdmin('FRIEND_SAVED'));
friendSchema.post('findOneAndUpdate', () => sseService.notifyAdmin('FRIEND_UPDATED'));
friendSchema.post('updateOne', () => sseService.notifyAdmin('FRIEND_UPDATED'));
friendSchema.post('updateMany', () => sseService.notifyAdmin('FRIEND_UPDATED'));
friendSchema.post('findOneAndDelete', () => sseService.notifyAdmin('FRIEND_DELETED'));
friendSchema.post('deleteOne', () => sseService.notifyAdmin('FRIEND_DELETED'));
friendSchema.post('deleteMany', () => sseService.notifyAdmin('FRIEND_DELETED'));

module.exports = mongoose.model('Friend', friendSchema);
