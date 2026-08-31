const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Friend, Transaction, ShareCode } = require('../db');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase().trim();
const ADMIN_PASSKEY = (process.env.ADMIN_PASSKEY || 'admin1234').trim();

// @route   POST /api/admin/login
// @desc    Authenticate admin via Gmail & Passkey
exports.adminLogin = async (req, res) => {
  try {
    const { email, passkey } = req.body;

    if (!email || !passkey) {
      return res.status(400).json({
        success: false,
        error: 'Please provide admin Gmail and Passkey.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPasskey = passkey.trim();

    if (cleanEmail !== ADMIN_EMAIL || cleanPasskey !== ADMIN_PASSKEY) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Admin Gmail or Passkey.'
      });
    }

    const token = jwt.sign(
      { role: 'admin', email: ADMIN_EMAIL },
      process.env.JWT_SECRET || 'super_secret_jwt_key_circle_money_tracker_2026',
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      message: 'Admin access granted.',
      data: {
        email: ADMIN_EMAIL,
        token
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin authentication middleware
exports.requireAdminAuth = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Admin authorization required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_circle_money_tracker_2026');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access restricted to administrator.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired admin token.' });
  }
};

// @route   GET /api/admin/stats
// @desc    Get platform-wide aggregated metrics
exports.getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const [totalUsers, totalFriends, totalTransactions, activeShares, volumeAgg] = await Promise.all([
      User.countDocuments(),
      Friend.countDocuments(),
      Transaction.countDocuments(),
      ShareCode.countDocuments({ expiresAt: { $gt: now } }),
      Transaction.aggregate([
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
      ])
    ]);

    const totalVolume = volumeAgg[0]?.totalAmount || 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalFriends,
        totalTransactions,
        totalVolume,
        activeShares,
        serverTime: now
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   GET /api/admin/users
// @desc    List all registered users with friend and transaction counts
exports.getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();

    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const [friendsCount, txCount] = await Promise.all([
          Friend.countDocuments({ userId: u._id }),
          Transaction.countDocuments({ userId: u._id })
        ]);
        return {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          currency: u.currency || '₹',
          isLocked: !!u.isLocked,
          failedLoginAttempts: u.failedLoginAttempts || 0,
          lockedAt: u.lockedAt || null,
          createdAt: u.createdAt,
          friendsCount,
          txCount
        };
      })
    );

    res.json({
      success: true,
      data: usersWithStats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   PUT /api/admin/users/:id/unlock
// @desc    Unlock a locked user account and reset failed login attempts
exports.unlockAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.isLocked = false;
    user.failedLoginAttempts = 0;
    user.lockedAt = null;
    await user.save();

    res.json({
      success: true,
      message: `Account for ${user.name} (${user.email}) has been UNLOCKED successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   PUT /api/admin/users/:id/reset-pin
// @desc    Reset a user's password / PIN
exports.resetAdminUserPin = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPin = '1234' } = req.body;

    const rawPin = newPin.toString().trim();
    if (!/^\d{4,6}$/.test(rawPin)) {
      return res.status(400).json({
        success: false,
        error: 'Reset PIN must be 4 to 6 numeric digits.'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.pin = await bcrypt.hash(rawPin, salt);
    user.isLocked = false;
    user.failedLoginAttempts = 0;
    user.lockedAt = null;
    await user.save();

    res.json({
      success: true,
      message: `Security PIN for ${user.name} has been reset to: ${rawPin}`,
      data: {
        newPin: rawPin
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   DELETE /api/admin/users/:id
// @desc    Delete user and cascade delete their friends, transactions, shares
exports.deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await Promise.all([
      Transaction.deleteMany({ userId: id }),
      Friend.deleteMany({ userId: id }),
      ShareCode.deleteMany({ userId: id }),
      User.findByIdAndDelete(id)
    ]);

    res.json({
      success: true,
      message: `User ${user.name} and all associated records deleted successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   GET /api/admin/transactions
// @desc    Global list of recent transactions across the platform
exports.getAdminTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId', 'name email')
      .populate('friendId', 'name relationshipTag avatarEmoji avatarColor')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const formatted = transactions.map(t => ({
      id: t._id.toString(),
      userName: t.userId?.name || 'Unknown',
      userEmail: t.userId?.email || '',
      friendName: t.friendId?.name || 'Friend',
      friendEmoji: t.friendId?.avatarEmoji || '👤',
      type: t.type,
      amount: t.amount,
      category: t.category,
      note: t.note,
      paymentMethod: t.paymentMethod,
      date: t.date,
      time: t.time,
      createdAt: t.createdAt
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   GET /api/admin/shares
// @desc    List all active and recent share codes
exports.getAdminShares = async (req, res) => {
  try {
    const shares = await ShareCode.find()
      .populate('userId', 'name email')
      .populate('friendId', 'name relationshipTag avatarEmoji')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const now = new Date();
    const formatted = shares.map(s => ({
      id: s._id.toString(),
      code: s.code,
      userName: s.userId?.name || 'Unknown',
      friendName: s.friendId?.name || 'Unknown',
      durationMinutes: s.durationMinutes,
      expiresAt: s.expiresAt,
      isExpired: now > s.expiresAt,
      createdAt: s.createdAt
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   DELETE /api/admin/shares/:id
// @desc    Revoke/delete an active share code
exports.deleteAdminShare = async (req, res) => {
  try {
    const { id } = req.params;
    await ShareCode.findByIdAndDelete(id);
    res.json({ success: true, message: 'Share code revoked successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

