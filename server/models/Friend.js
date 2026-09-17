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

module.exports = mongoose.model('Friend', friendSchema);
