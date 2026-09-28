const jwt = require('jsonwebtoken');
const { User } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_circle_money_tracker_2026';

// In-memory cache tracking the last time a user's activity was persisted to MongoDB
const activeUsersCache = new Map();

// In-memory cache for authenticated user profiles (TTL: 60s) to eliminate redundant User.findById queries
const userAuthCache = new Map();
const USER_CACHE_TTL = 60 * 1000;

function clearUserAuthCache(userId) {
  if (userId) {
    userAuthCache.delete(userId.toString());
  }
}

async function protect(req, res, next) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    // Support EventSource query param authentication: ?token=...
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userIdStr = decoded.id;
    const nowTime = Date.now();

    let user = null;
    const cachedEntry = userAuthCache.get(userIdStr);

    if (cachedEntry && (nowTime - cachedEntry.cachedAt < USER_CACHE_TTL)) {
      user = cachedEntry.user;
    } else {
      user = await User.findById(userIdStr).select('-password').lean();
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User account no longer exists.'
        });
      }
      user.id = user._id.toString();
      userAuthCache.set(userIdStr, { user, cachedAt: nowTime });
    }

    req.user = user;

    // Asynchronously update lastActiveAt (throttled to at most once per 20 seconds per user)
    const lastSavedTime = activeUsersCache.get(userIdStr) || 0;

    if (nowTime - lastSavedTime > 20000) {
      activeUsersCache.set(userIdStr, nowTime);
      User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date(nowTime) } })
        .exec()
        .catch(err => console.error('Error updating lastActiveAt in DB:', err.message));
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.'
    });
  }
}

module.exports = { protect, JWT_SECRET, activeUsersCache, userAuthCache, clearUserAuthCache };
