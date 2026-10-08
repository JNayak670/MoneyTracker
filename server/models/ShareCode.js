const mongoose = require('mongoose');

const shareCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  friendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Friend',
    required: true,
    index: true
  },
  durationMinutes: {
    type: Number,
    default: 60
  },
  expiresAt: {
    type: Date,
    required: true
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

// Auto delete expired share records after 1 day past expiry
shareCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

const sseService = require('../services/sseService');

// Notify admin console on share link mutation (create, delete, expire)
shareCodeSchema.post('save', () => sseService.notifyAdmin('SHARE_SAVED'));
shareCodeSchema.post('findOneAndDelete', () => sseService.notifyAdmin('SHARE_DELETED'));
shareCodeSchema.post('deleteOne', () => sseService.notifyAdmin('SHARE_DELETED'));
shareCodeSchema.post('deleteMany', () => sseService.notifyAdmin('SHARE_DELETED'));

module.exports = mongoose.model('ShareCode', shareCodeSchema);
