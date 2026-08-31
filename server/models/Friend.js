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
