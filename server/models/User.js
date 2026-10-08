const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  pin: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    default: '₹'
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: {
    type: Date,
    default: null
  },
  lastActiveAt: {
    type: Date,
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

const sseService = require('../services/sseService');

// Notify admin console on user mutations (create, update, lock, pin, delete)
userSchema.post('save', () => sseService.notifyAdmin('USER_SAVED'));
userSchema.post('findOneAndUpdate', () => sseService.notifyAdmin('USER_UPDATED'));
userSchema.post('updateOne', () => sseService.notifyAdmin('USER_UPDATED'));
userSchema.post('updateMany', () => sseService.notifyAdmin('USER_UPDATED'));
userSchema.post('findOneAndDelete', () => sseService.notifyAdmin('USER_DELETED'));
userSchema.post('deleteOne', () => sseService.notifyAdmin('USER_DELETED'));
userSchema.post('deleteMany', () => sseService.notifyAdmin('USER_DELETED'));

module.exports = mongoose.model('User', userSchema);
