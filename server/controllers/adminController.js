const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Friend, Transaction, ShareCode, AdminSetting, Notification } = require('../db');

const getAdminCredentials = async () => {
  const defaultEmail = (process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase().trim();
  const defaultPasskey = (process.env.ADMIN_PASSKEY || 'admin1234').trim();

  let setting = await AdminSetting.findOne({ key: 'admin_credentials' });
  if (!setting) {
    return {
      email: defaultEmail,
      passkey: defaultPasskey,
      isHashed: false
    };
  }

  return {
    email: (setting.email || defaultEmail).toLowerCase().trim(),
    passkey: setting.plainPasskey || defaultPasskey,
    passkeyHash: setting.passkeyHash,
    isHashed: !!setting.passkeyHash
  };
};

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

    const creds = await getAdminCredentials();

    let isMatch = false;
    if (cleanEmail === creds.email) {
      if (creds.passkeyHash) {
        isMatch = await bcrypt.compare(cleanPasskey, creds.passkeyHash);
        if (!isMatch && (creds.passkey === cleanPasskey || cleanPasskey === (process.env.ADMIN_PASSKEY || 'admin1234').trim())) {
          isMatch = true;
        }
      } else {
        isMatch = (cleanPasskey === creds.passkey || cleanPasskey === (process.env.ADMIN_PASSKEY || 'admin1234').trim());
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Admin Gmail or Passkey.'
      });
    }

    const token = jwt.sign(
      { role: 'admin', email: cleanEmail },
      process.env.JWT_SECRET || 'super_secret_jwt_key_circle_money_tracker_2026',
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      message: 'Admin access granted.',
      data: {
        email: cleanEmail,
        token
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   GET /api/admin/profile
// @desc    Get admin current profile/email
exports.getAdminProfile = async (req, res) => {
  try {
    const creds = await getAdminCredentials();
    res.json({
      success: true,
      data: {
        email: creds.email
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   PUT /api/admin/change-password
// @desc    Change admin master passkey / credentials
exports.changeAdminPassword = async (req, res) => {
  try {
    const { currentPasskey, newPasskey, newEmail } = req.body;

    if (!currentPasskey || !newPasskey) {
      return res.status(400).json({
        success: false,
        error: 'Current passkey and new passkey are required.'
      });
    }

    const cleanCurrent = currentPasskey.trim();
    const cleanNew = newPasskey.trim();

    if (cleanNew.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'New passkey must be at least 4 characters long.'
      });
    }

    const creds = await getAdminCredentials();

    let isCurrentMatch = false;
    if (creds.passkeyHash) {
      isCurrentMatch = await bcrypt.compare(cleanCurrent, creds.passkeyHash);
      if (!isCurrentMatch && (creds.passkey === cleanCurrent || cleanCurrent === (process.env.ADMIN_PASSKEY || 'admin1234').trim())) {
        isCurrentMatch = true;
      }
    } else {
      isCurrentMatch = (cleanCurrent === creds.passkey || cleanCurrent === (process.env.ADMIN_PASSKEY || 'admin1234').trim());
    }

    if (!isCurrentMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect current passkey. Please check and try again.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(cleanNew, salt);

    const emailToSave = newEmail ? newEmail.toLowerCase().trim() : creds.email;

    await AdminSetting.findOneAndUpdate(
      { key: 'admin_credentials' },
      {
        key: 'admin_credentials',
        email: emailToSave,
        passkeyHash: hash,
        plainPasskey: cleanNew,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Admin Master Passkey has been changed successfully! Please remember your new passkey.',
      data: {
        email: emailToSave
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
    const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // Active within last 2 minutes
    const onlineCutoff = new Date(now.getTime() - ONLINE_THRESHOLD_MS);

    const [
      totalUsers, 
      onlineUsers,
      totalFriends, 
      connectedFriends,
      authorizedFriends,
      totalTransactions, 
      syncedTransactions,
      pendingApprovals,
      activeShares, 
      volumeAgg
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastActiveAt: { $gte: onlineCutoff } }),
      Friend.countDocuments(),
      Friend.countDocuments({ connectionStatus: 'CONNECTED' }),
      Friend.countDocuments({ permission: 'AUTHORIZED' }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ isShared: true }),
      Transaction.countDocuments({ approvalStatus: 'PENDING_APPROVAL' }),
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
        onlineUsers,
        totalFriends,
        connectedFriends,
        authorizedFriends,
        totalTransactions,
        syncedTransactions,
        pendingApprovals,
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
// @desc    List all registered users with friend, transaction counts, and live online status
exports.getAdminUsers = async (req, res) => {
  try {
    const now = new Date();
    const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // Active within last 2 minutes

    const users = await User.find().sort({ createdAt: -1 }).lean();

    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const [friendsCount, connectedCount, txCount] = await Promise.all([
          Friend.countDocuments({ userId: u._id }),
          Friend.countDocuments({ userId: u._id, connectionStatus: 'CONNECTED' }),
          Transaction.countDocuments({ userId: u._id })
        ]);

        const lastActive = u.lastActiveAt || u.updatedAt || u.createdAt;
        const isOnline = lastActive ? (now.getTime() - new Date(lastActive).getTime() <= ONLINE_THRESHOLD_MS) : false;

        return {
          id: u._id.toString(),
          name: u.name,
          username: u.username || null,
          email: u.email,
          currency: u.currency || '₹',
          isLocked: !!u.isLocked,
          failedLoginAttempts: u.failedLoginAttempts || 0,
          lockedAt: u.lockedAt || null,
          createdAt: u.createdAt,
          lastActiveAt: lastActive,
          isOnline,
          friendsCount,
          connectedCount,
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

// @route   PUT /api/admin/users/:id/username
// @desc    Admin manually sets or updates a user's @username
exports.setAdminUserUsername = async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid username.'
      });
    }

    const cleanUsername = username.replace(/^@/, '').toLowerCase().trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        error: 'Username must be 3 to 20 letters, numbers, or underscores (e.g. rahul_123).'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Check if another user already has this username
    const existing = await User.findOne({ username: cleanUsername, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Username @${cleanUsername} is already taken by ${existing.name} (${existing.email}).`
      });
    }

    const oldUsername = user.username;
    user.username = cleanUsername;
    await user.save();

    // Trigger match detection for offline friends waiting for this pendingUsername
    try {
      const matchingFriends = await Friend.find({
        pendingUsername: cleanUsername,
        connectedUserId: null
      });

      for (const f of matchingFriends) {
        if (f.userId.toString() === user.id) continue;

        f.connectionStatus = 'PENDING_MATCH';
        f.connectedUserId = user._id;
        await f.save();

        await Notification.create({
          userId: f.userId,
          type: 'USERNAME_MATCH',
          title: `🔔 ${user.name} username updated!`,
          message: `${user.name} now has @${cleanUsername}. Connect accounts to manage shared transactions?`,
          data: {
            friendId: f._id,
            connectedUserId: user._id,
            username: cleanUsername,
            friendName: f.name
          }
        });
      }
    } catch (matchErr) {
      console.warn('⚠️ Match detection warning in admin setAdminUserUsername:', matchErr.message);
    }

    res.json({
      success: true,
      message: `Username for ${user.name} updated to @${cleanUsername} successfully!`,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: cleanUsername,
        oldUsername
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
      .populate('userId', 'name email username')
      .populate('friendId', 'name relationshipTag avatarEmoji avatarColor connectionStatus permission connectedUserId pendingUsername')
      .populate('sharedWithUserId', 'name username email')
      .sort({ createdAt: -1 })
      .limit(150)
      .lean();

    const formatted = transactions.map(t => ({
      id: t._id.toString(),
      userName: t.userId?.name || 'Unknown',
      userUsername: t.userId?.username || null,
      userEmail: t.userId?.email || '',
      friendName: t.friendId?.name || 'Friend',
      friendEmoji: t.friendId?.avatarEmoji || '👤',
      friendConnectionStatus: t.friendId?.connectionStatus || 'OFFLINE',
      friendPermission: t.friendId?.permission || 'NORMAL',
      type: t.type,
      amount: t.amount,
      impactOnUser: t.impactOnUser,
      category: t.category,
      note: t.note,
      paymentMethod: t.paymentMethod,
      date: t.date,
      time: t.time,
      isShared: Boolean(t.isShared),
      approvalStatus: t.approvalStatus || 'ACTIVE',
      receiptNote: t.receiptNote || null,
      splitGroupId: t.splitGroupId || null,
      sharedWithUserName: t.sharedWithUserId?.name || null,
      sharedWithUsername: t.sharedWithUserId?.username || null,
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

// @route   PUT /api/admin/transactions/:id/approve
// @desc    Admin override to approve a pending approval transaction
exports.approveAdminTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await Transaction.findById(id);
    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }

    tx.approvalStatus = 'ACTIVE';
    await tx.save();

    if (tx.linkedTransactionId) {
      await Transaction.updateOne({ _id: tx.linkedTransactionId }, { approvalStatus: 'ACTIVE' });
    }

    res.json({
      success: true,
      message: `Transaction "${tx.note}" (₹${tx.amount}) approved by administrator.`,
      data: tx
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   PUT /api/admin/transactions/:id/reject
// @desc    Admin override to decline a transaction
exports.rejectAdminTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await Transaction.findById(id);
    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }

    tx.approvalStatus = 'REJECTED';
    await tx.save();

    if (tx.linkedTransactionId) {
      await Transaction.updateOne({ _id: tx.linkedTransactionId }, { approvalStatus: 'REJECTED' });
    }

    res.json({
      success: true,
      message: `Transaction "${tx.note}" (₹${tx.amount}) declined by administrator.`,
      data: tx
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   GET /api/admin/connections
// @desc    List all 2-way connected friends and their sync permissions
exports.getAdminConnections = async (req, res) => {
  try {
    const connectedFriends = await Friend.find({ connectionStatus: 'CONNECTED' })
      .populate('userId', 'name username email')
      .populate('connectedUserId', 'name username email')
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = connectedFriends.map(f => ({
      id: f._id.toString(),
      user: {
        id: f.userId?._id?.toString() || f.userId?.toString(),
        name: f.userId?.name || 'Unknown',
        username: f.userId?.username || 'user',
        email: f.userId?.email || ''
      },
      connectedUser: {
        id: f.connectedUserId?._id?.toString() || f.connectedUserId?.toString(),
        name: f.connectedUserId?.name || f.name,
        username: f.connectedUserId?.username || f.pendingUsername || 'user',
        email: f.connectedUserId?.email || ''
      },
      friendName: f.name,
      avatarColor: f.avatarColor,
      avatarEmoji: f.avatarEmoji,
      relationshipTag: f.relationshipTag,
      connectionStatus: f.connectionStatus,
      permission: f.permission || 'NORMAL',
      linkedAt: f.linkedAt || f.createdAt,
      createdAt: f.createdAt
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   PUT /api/admin/connections/:id/permission
// @desc    Admin toggle permission for a single connected friend connection
exports.updateAdminConnectionPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { permission, syncBoth = false } = req.body;

    if (!['NORMAL', 'AUTHORIZED'].includes(permission)) {
      return res.status(400).json({ success: false, error: 'Permission must be NORMAL or AUTHORIZED.' });
    }

    const friend = await Friend.findById(id)
      .populate('userId', 'name username')
      .populate('connectedUserId', 'name username');
    if (!friend) {
      return res.status(404).json({ success: false, error: 'Friend connection not found.' });
    }

    friend.permission = permission;
    await friend.save();

    // Only update reciprocal if explicitly requested (syncBoth === true)
    if (syncBoth && friend.connectedUserId && friend.userId) {
      const otherUserId = friend.connectedUserId._id || friend.connectedUserId;
      const thisUserId = friend.userId._id || friend.userId;
      await Friend.updateOne(
        { userId: otherUserId, connectedUserId: thisUserId },
        { permission }
      );
    }

    const accountName = friend.userId?.name || 'Account';
    const friendName = friend.connectedUserId?.name || friend.name || 'Friend';
    const modeLabel = permission === 'AUTHORIZED' ? 'Authorized (Instant Sync)' : 'Normal (Requires Approval)';

    res.json({
      success: true,
      message: `${accountName}'s permission for ${friendName} updated to ${modeLabel}.`,
      data: friend
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
      .populate('userId', 'name email username')
      .populate('friendId', 'name relationshipTag avatarEmoji')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const now = new Date();
    const formatted = shares.map(s => ({
      id: s._id.toString(),
      code: s.code,
      userName: s.userId?.name || 'Unknown',
      userUsername: s.userId?.username || null,
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

// @route   POST /api/admin/messages
// @desc    Send a direct message or broadcast notification to users
exports.sendAdminMessage = async (req, res) => {
  try {
    const { userId, title, message } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Message title is required.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();

    // 1. Broadcast to ALL users
    if (userId === 'ALL') {
      const allUsers = await User.find({}, '_id name username').lean();
      if (!allUsers || allUsers.length === 0) {
        return res.status(404).json({ success: false, error: 'No registered users found.' });
      }

      const notifDocs = allUsers.map(u => ({
        userId: u._id,
        type: 'ADMIN_MESSAGE',
        title: cleanTitle,
        message: cleanMessage,
        data: {
          isAdminBroadcast: true,
          sentBy: 'System Administrator'
        }
      }));

      await Notification.insertMany(notifDocs);

      return res.json({
        success: true,
        message: `Broadcast message sent to all ${allUsers.length} users successfully.`,
        data: {
          recipientCount: allUsers.length,
          title: cleanTitle
        }
      });
    }

    // 2. Send to a specific user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Target user not found.' });
    }

    const notif = await Notification.create({
      userId: targetUser._id,
      type: 'ADMIN_MESSAGE',
      title: cleanTitle,
      message: cleanMessage,
      data: {
        isAdminMessage: true,
        sentBy: 'System Administrator',
        recipientName: targetUser.name,
        recipientUsername: targetUser.username
      }
    });

    res.json({
      success: true,
      message: `Message sent successfully to ${targetUser.name} (@${targetUser.username || 'user'}).`,
      data: notif
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


