const jwt = require('jsonwebtoken');
const { User } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_circle_money_tracker_2026';

async function protect(req, res, next) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account no longer exists.'
      });
    }

    req.user = user;

    // Asynchronously update lastActiveAt (throttled to at most once per 20 seconds)
    const now = new Date();
    if (!user.lastActiveAt || (now.getTime() - new Date(user.lastActiveAt).getTime() > 20000)) {
      User.updateOne({ _id: user._id }, { lastActiveAt: now }).exec().catch(() => {});
      user.lastActiveAt = now;
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.'
    });
  }
}

module.exports = { protect, JWT_SECRET };
