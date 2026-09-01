const mongoose = require('mongoose');

const adminSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'admin_credentials'
  },
  email: {
    type: String,
    required: true,
    default: 'admin@gmail.com',
    lowercase: true,
    trim: true
  },
  passkeyHash: {
    type: String,
    default: null
  },
  plainPasskey: {
    type: String,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminSetting', adminSettingSchema);
