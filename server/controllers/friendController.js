const { Friend, Transaction, User, Notification } = require('../db');

// @route   GET /api/friends
// @desc    Get all friends of logged-in user with computed balances & connection details
exports.getAllFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const friends = await Friend.find({ userId })
      .populate('connectedUserId', 'id name username email')
      .sort({ name: 1 });
    const transactions = await Transaction.find({ userId });

    // Map transactions by friendId
    const txByFriend = {};
    for (const t of transactions) {
      if (!t.friendId) continue;
      const fId = t.friendId.toString();
      if (!txByFriend[fId]) txByFriend[fId] = [];
      txByFriend[fId].push(t);
    }

    const enriched = friends.map(f => {
      const fTxs = txByFriend[f.id] || [];
      let totalGiven = 0;
      let totalReceived = 0;
      let balance = 0;
      let lastDate = null;

      for (const t of fTxs) {
        balance += t.impactOnUser;
        if (t.impactOnUser > 0 && t.type !== 'SETTLED') {
          totalGiven += t.amount;
        } else if (t.impactOnUser < 0 && t.type !== 'SETTLED') {
          totalReceived += t.amount;
        }
        if (!lastDate || t.date > lastDate) {
          lastDate = t.date;
        }
      }

      balance = Number(balance.toFixed(2));

      return {
        id: f.id,
        name: f.name,
        phone: f.phone,
        email: f.email,
        avatarColor: f.avatarColor,
        avatarEmoji: f.avatarEmoji,
        relationshipTag: f.relationshipTag,
        notes: f.notes,
        pendingUsername: f.pendingUsername,
        connectionStatus: f.connectionStatus || 'OFFLINE',
        permission: f.permission || 'NORMAL',
        linkedAt: f.linkedAt,
        connectedUser: f.connectedUserId ? {
          id: f.connectedUserId.id || f.connectedUserId._id.toString(),
          name: f.connectedUserId.name,
          username: f.connectedUserId.username,
          email: f.connectedUserId.email
        } : null,
        totalGiven: Number(totalGiven.toFixed(2)),
        totalReceived: Number(totalReceived.toFixed(2)),
        currentBalance: balance,
        status: balance > 0 ? 'OWES_YOU' : balance < 0 ? 'YOU_OWE' : 'SETTLED',
        transactionCount: fTxs.length,
        lastActivityDate: lastDate,
        createdAt: f.createdAt
      };
    });

    // Sort: Unsettled first (largest balance), then settled
    enriched.sort((a, b) => {
      if (a.currentBalance !== 0 && b.currentBalance === 0) return -1;
      if (a.currentBalance === 0 && b.currentBalance !== 0) return 1;
      return Math.abs(b.currentBalance) - Math.abs(a.currentBalance);
    });

    res.json({
      success: true,
      data: enriched
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   GET /api/friends/:id
// @desc    Get single friend details with complete ledger history, connection status & running balance
exports.getFriendLedger = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;

    const friend = await Friend.findOne({ _id: friendId, userId })
      .populate('connectedUserId', 'id name username email');
    if (!friend) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    const transactions = await Transaction.find({ friendId, userId }).sort({ date: 1, createdAt: 1 });

    // Compute running balance at each point in time
    let runningBalance = 0;
    let totalGiven = 0;
    let totalReceived = 0;

    const ledger = transactions.map(t => {
      runningBalance += t.impactOnUser;
      if (t.impactOnUser > 0 && t.type !== 'SETTLED') totalGiven += t.amount;
      if (t.impactOnUser < 0 && t.type !== 'SETTLED') totalReceived += t.amount;

      return {
        id: t.id,
        userId: t.userId.toString(),
        friendId: t.friendId.toString(),
        type: t.type,
        amount: t.amount,
        impactOnUser: t.impactOnUser,
        category: t.category,
        note: t.note,
        date: t.date,
        time: t.time,
        paymentMethod: t.paymentMethod,
        receiptNote: t.receiptNote,
        splitGroupId: t.splitGroupId,
        isShared: t.isShared,
        approvalStatus: t.approvalStatus,
        createdAt: t.createdAt,
        runningBalance: Number(runningBalance.toFixed(2))
      };
    });

    const reversedTimeline = [...ledger].reverse();
    const finalBalance = Number(runningBalance.toFixed(2));

    res.json({
      success: true,
      data: {
        friend: {
          id: friend.id,
          name: friend.name,
          phone: friend.phone,
          email: friend.email,
          avatarColor: friend.avatarColor,
          avatarEmoji: friend.avatarEmoji,
          relationshipTag: friend.relationshipTag,
          notes: friend.notes,
          pendingUsername: friend.pendingUsername,
          connectionStatus: friend.connectionStatus || 'OFFLINE',
          permission: friend.permission || 'NORMAL',
          linkedAt: friend.linkedAt,
          connectedUser: friend.connectedUserId ? {
            id: friend.connectedUserId.id || friend.connectedUserId._id.toString(),
            name: friend.connectedUserId.name,
            username: friend.connectedUserId.username,
            email: friend.connectedUserId.email
          } : null,
          createdAt: friend.createdAt
        },
        currentBalance: finalBalance,
        totalGiven: Number(totalGiven.toFixed(2)),
        totalReceived: Number(totalReceived.toFixed(2)),
        status: finalBalance > 0 ? 'OWES_YOU' : finalBalance < 0 ? 'YOU_OWE' : 'SETTLED',
        transactions: reversedTimeline
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/friends
// @desc    Create a new friend (supports offline with optional pending username)
exports.createFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, email, avatarColor, avatarEmoji, relationshipTag, notes, username } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Friend name is required.' });
    }

    let cleanUsername = null;
    let foundUser = null;
    let initialStatus = 'OFFLINE';

    if (username && username.trim()) {
      const rawInput = username.trim();
      cleanUsername = rawInput.replace(/^@/, '').toLowerCase().trim();
      
      const orConditions = [
        { username: cleanUsername },
        { email: rawInput.toLowerCase() }
      ];
      if (rawInput.match(/^[0-9a-fA-F]{24}$/)) {
        orConditions.push({ _id: rawInput });
      }

      foundUser = await User.findOne({ $or: orConditions });
      if (foundUser) {
        if (foundUser.id === userId || foundUser._id.toString() === userId) {
          return res.status(400).json({ success: false, error: 'You cannot add yourself as a friend.' });
        }
        initialStatus = 'PENDING_MATCH';
        cleanUsername = foundUser.username;
      }
    }

    const friend = await Friend.create({
      userId,
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      email: email ? email.trim() : (foundUser ? foundUser.email : null),
      avatarColor: avatarColor || '#6366f1',
      avatarEmoji: avatarEmoji || '👤',
      relationshipTag: relationshipTag || 'Friend',
      notes: notes ? notes.trim() : null,
      pendingUsername: cleanUsername,
      connectedUserId: foundUser ? foundUser._id : null,
      connectionStatus: initialStatus,
      permission: 'NORMAL'
    });

    // If a registered MoneyTracker user was matched, send a connection request notification to them!
    if (foundUser) {
      let reciprocalFriend = await Friend.findOne({ userId: foundUser._id, connectedUserId: userId });
      if (!reciprocalFriend && req.user.username) {
        reciprocalFriend = await Friend.findOne({ userId: foundUser._id, pendingUsername: req.user.username.toLowerCase() });
      }

      if (!reciprocalFriend) {
        reciprocalFriend = await Friend.create({
          userId: foundUser._id,
          name: req.user.name,
          connectedUserId: userId,
          pendingUsername: req.user.username || null,
          connectionStatus: 'PENDING_MATCH',
          permission: 'NORMAL',
          avatarColor: '#10b981',
          avatarEmoji: '🤝',
          relationshipTag: 'Friend'
        });
      } else {
        reciprocalFriend.connectedUserId = userId;
        reciprocalFriend.connectionStatus = 'PENDING_MATCH';
        await reciprocalFriend.save();
      }

      // Send friend request notification to foundUser
      await Notification.create({
        userId: foundUser._id,
        type: 'FRIEND_REQUEST',
        title: '👋 Friend Connection Request',
        message: `${req.user.name} (@${req.user.username || 'user'}) added you as a friend on MoneyTracker. Connect accounts to enable shared 2-way tracking.`,
        data: {
          friendId: reciprocalFriend._id,
          connectedUserId: userId,
          username: req.user.username,
          friendName: req.user.name
        }
      });
    }

    res.status(201).json({
      success: true,
      message: foundUser 
        ? `Friend added! Account @${cleanUsername} found on MoneyTracker and connection request sent.` 
        : cleanUsername 
        ? `Friend added! @${cleanUsername} saved as pending username.` 
        : 'Friend added to circle',
      data: friend,
      matchedUser: foundUser ? {
        id: foundUser.id || foundUser._id.toString(),
        name: foundUser.name,
        username: foundUser.username,
        email: foundUser.email
      } : null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   GET /api/friends/search-user
// @desc    Search for a MoneyTracker user by @username, email, or user ID
exports.searchUserByUsername = async (req, res) => {
  try {
    const rawInput = (req.query.username || '').trim();
    if (!rawInput) {
      return res.status(400).json({ success: false, error: 'Username, email, or user ID is required' });
    }

    const cleanUsername = rawInput.replace(/^@/, '').toLowerCase().trim();
    const orConditions = [
      { username: cleanUsername },
      { email: rawInput.toLowerCase() }
    ];
    if (rawInput.match(/^[0-9a-fA-F]{24}$/)) {
      orConditions.push({ _id: rawInput });
    }

    const user = await User.findOne({ $or: orConditions }).select('id name username email currency');
    if (!user) {
      return res.json({
        success: true,
        exists: false,
        username: cleanUsername,
        message: `No registered MoneyTracker account found for "${rawInput}".`
      });
    }

    if (user.id === req.user.id || user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'This is your own account!'
      });
    }

    res.json({
      success: true,
      exists: true,
      user: {
        id: user.id || user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/friends/:id/link-username
// @desc    Link or save username for an offline friend
exports.linkUsernameToFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;
    const { username } = req.body;

    const friend = await Friend.findOne({ _id: friendId, userId });
    if (!friend) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    if (!username || !username.trim()) {
      // Unlink username
      friend.pendingUsername = null;
      friend.connectedUserId = null;
      friend.connectionStatus = 'OFFLINE';
      await friend.save();
      return res.json({
        success: true,
        message: 'Username unlinked. Friend returned to standard offline mode.',
        data: friend
      });
    }

    const rawInput = username.trim();
    const cleanUsername = rawInput.replace(/^@/, '').toLowerCase().trim();
    if (cleanUsername === req.user.username) {
      return res.status(400).json({ success: false, error: 'You cannot link your own username to a friend.' });
    }

    const orConditions = [
      { username: cleanUsername },
      { email: rawInput.toLowerCase() }
    ];
    if (rawInput.match(/^[0-9a-fA-F]{24}$/)) {
      orConditions.push({ _id: rawInput });
    }

    const foundUser = await User.findOne({ $or: orConditions });

    if (foundUser) {
      friend.pendingUsername = foundUser.username;
      friend.connectedUserId = foundUser._id;
      friend.connectionStatus = 'PENDING_MATCH';
      await friend.save();

      // Ensure reciprocal friend entry exists in foundUser circle & notify them
      let reciprocalFriend = await Friend.findOne({ userId: foundUser._id, connectedUserId: userId });
      if (!reciprocalFriend && req.user.username) {
        reciprocalFriend = await Friend.findOne({ userId: foundUser._id, pendingUsername: req.user.username.toLowerCase() });
      }

      if (!reciprocalFriend) {
        reciprocalFriend = await Friend.create({
          userId: foundUser._id,
          name: req.user.name,
          connectedUserId: userId,
          pendingUsername: req.user.username || null,
          connectionStatus: 'PENDING_MATCH',
          permission: 'NORMAL',
          avatarColor: '#10b981',
          avatarEmoji: '🤝',
          relationshipTag: 'Friend'
        });
      } else {
        reciprocalFriend.connectedUserId = userId;
        reciprocalFriend.connectionStatus = 'PENDING_MATCH';
        await reciprocalFriend.save();
      }

      // Send friend request notification to foundUser
      await Notification.create({
        userId: foundUser._id,
        type: 'FRIEND_REQUEST',
        title: '👋 Friend Connection Request',
        message: `${req.user.name} (@${req.user.username || 'user'}) linked your account on MoneyTracker. Connect accounts to enable shared 2-way tracking.`,
        data: {
          friendId: reciprocalFriend._id,
          connectedUserId: userId,
          username: req.user.username,
          friendName: req.user.name
        }
      });

      return res.json({
        success: true,
        status: 'MATCH_FOUND',
        message: `Registered user found for @${foundUser.username}! Connection request sent. Confirm connection to enable shared features.`,
        data: friend,
        matchedUser: {
          id: foundUser.id || foundUser._id.toString(),
          name: foundUser.name,
          username: foundUser.username,
          email: foundUser.email
        }
      });
    } else {
      friend.pendingUsername = cleanUsername;
      friend.connectedUserId = null;
      friend.connectionStatus = 'OFFLINE';
      await friend.save();

      return res.json({
        success: true,
        status: 'SAVED_PENDING',
        message: `@${cleanUsername} is not registered yet. Saved as pending username. Friend continues working as a normal offline friend.`,
        data: friend
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/friends/:id/confirm-connect
// @desc    Confirm and establish connected friendship between two users
exports.confirmConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;

    const friend = await Friend.findOne({ _id: friendId, userId });
    if (!friend) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    if (!friend.connectedUserId) {
      return res.status(400).json({ success: false, error: 'No matched user account associated with this friend.' });
    }

    const otherUser = await User.findById(friend.connectedUserId);
    if (!otherUser) {
      return res.status(404).json({ success: false, error: 'Target user account no longer exists.' });
    }

    // 1. Update friend state to CONNECTED
    friend.connectionStatus = 'CONNECTED';
    friend.linkedAt = new Date();
    await friend.save();

    // 2. Ensure reciprocal friend entry exists in other user's circle
    let reciprocalFriend = await Friend.findOne({
      userId: otherUser._id,
      connectedUserId: userId
    });

    if (!reciprocalFriend) {
      // Check if other user had an offline friend with this user's username
      if (req.user.username) {
        reciprocalFriend = await Friend.findOne({
          userId: otherUser._id,
          pendingUsername: req.user.username.toLowerCase()
        });
      }
    }

    if (!reciprocalFriend) {
      // Create reciprocal friend entry
      reciprocalFriend = await Friend.create({
        userId: otherUser._id,
        name: req.user.name,
        connectedUserId: userId,
        pendingUsername: req.user.username || null,
        connectionStatus: 'CONNECTED',
        permission: 'NORMAL',
        linkedAt: new Date(),
        avatarColor: '#10b981',
        avatarEmoji: '🤝',
        relationshipTag: 'Friend'
      });
    } else {
      reciprocalFriend.connectedUserId = userId;
      reciprocalFriend.connectionStatus = 'CONNECTED';
      reciprocalFriend.linkedAt = new Date();
      await reciprocalFriend.save();
    }

    // 3. Mark matching notification as actioned
    await Notification.updateMany(
      { userId, 'data.friendId': friend._id },
      { isActioned: true, actionTaken: 'CONNECTED', isRead: true }
    );

    // 4. Notify other user that friendship is connected
    await Notification.create({
      userId: otherUser._id,
      type: 'FRIEND_CONNECTED',
      title: '🤝 New Connected Friend!',
      message: `${req.user.name} (@${req.user.username || 'user'}) connected with you on MoneyTracker.`,
      data: {
        friendId: reciprocalFriend._id,
        connectedUserId: userId,
        username: req.user.username,
        friendName: req.user.name
      }
    });

    // 5. Check if there are existing offline transactions
    const existingTransactions = await Transaction.find({ friendId, userId });

    res.json({
      success: true,
      message: `Successfully connected with ${otherUser.name} (@${otherUser.username})!`,
      data: {
        friend,
        eligibleTransactionsCount: existingTransactions.length,
        eligibleTransactions: existingTransactions.map(t => ({
          id: t.id,
          note: t.note,
          amount: t.amount,
          type: t.type,
          date: t.date,
          category: t.category
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/friends/:id/ignore-connect
// @desc    Ignore a suggested username match (reverts friend to offline)
exports.ignoreConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;

    const friend = await Friend.findOne({ _id: friendId, userId });
    if (!friend) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    friend.connectionStatus = 'OFFLINE';
    friend.connectedUserId = null;
    await friend.save();

    await Notification.updateMany(
      { userId, 'data.friendId': friend._id },
      { isActioned: true, actionTaken: 'IGNORED', isRead: true }
    );

    res.json({
      success: true,
      message: `Connection suggestion ignored. ${friend.name} will remain an offline friend.`,
      data: friend
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/friends/:id/share-history
// @desc    Selectively share previous offline transactions with newly connected friend
exports.shareHistoricalTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;
    const { transactionIds, shareAll } = req.body;

    const friend = await Friend.findOne({ _id: friendId, userId });
    if (!friend || !friend.connectedUserId) {
      return res.status(400).json({ success: false, error: 'Friend must be a connected MoneyTracker user to share history.' });
    }

    const otherUserId = friend.connectedUserId;
    const reciprocalFriend = await Friend.findOne({ userId: otherUserId, connectedUserId: userId });

    if (!reciprocalFriend) {
      return res.status(400).json({ success: false, error: 'Reciprocal friend record not found.' });
    }

    let targetTransactions = [];
    if (shareAll) {
      targetTransactions = await Transaction.find({ friendId, userId });
    } else if (Array.isArray(transactionIds) && transactionIds.length > 0) {
      targetTransactions = await Transaction.find({ _id: { $in: transactionIds }, friendId, userId });
    }

    if (targetTransactions.length === 0) {
      return res.json({
        success: true,
        message: 'No transactions selected for sharing.',
        sharedCount: 0
      });
    }

    let sharedCount = 0;
    for (const tx of targetTransactions) {
      if (tx.isShared) continue; // Already shared

      tx.isShared = true;
      tx.sharedWithUserId = otherUserId;
      tx.approvalStatus = 'ACTIVE';

      // Determine reciprocal type and impact on the other user:
      // If Rahul gave money (GIVEN / SPLIT, impact > 0) -> Other user received money (RECEIVED, impact < 0)
      // If Rahul received money (RECEIVED, impact < 0) -> Other user gave money (GIVEN, impact > 0)
      let reciprocalType = 'RECEIVED';
      let reciprocalImpact = -tx.amount;
      if (tx.type === 'RECEIVED') {
        reciprocalType = 'GIVEN';
        reciprocalImpact = tx.amount;
      } else if (tx.type === 'SETTLED') {
        reciprocalType = 'SETTLED';
        reciprocalImpact = -tx.impactOnUser;
      }

      const mirroredTx = await Transaction.create({
        userId: otherUserId,
        friendId: reciprocalFriend._id,
        type: reciprocalType,
        amount: tx.amount,
        impactOnUser: reciprocalImpact,
        category: tx.category,
        note: tx.note,
        date: tx.date,
        time: tx.time,
        paymentMethod: tx.paymentMethod,
        receiptNote: `Shared from ${req.user.name}: ${tx.receiptNote || tx.note}`,
        isShared: true,
        sharedWithUserId: userId,
        approvalStatus: 'ACTIVE',
        linkedTransactionId: tx._id
      });

      tx.linkedTransactionId = mirroredTx._id;
      await tx.save();
      sharedCount++;
    }

    // Send notification to friend about shared history
    if (sharedCount > 0) {
      await Notification.create({
        userId: otherUserId,
        type: 'SYSTEM_ALERT',
        title: '📜 Transaction History Shared',
        message: `${req.user.name} shared ${sharedCount} past transaction${sharedCount === 1 ? '' : 's'} with you.`,
        data: {
          friendId: reciprocalFriend._id,
          connectedUserId: userId,
          friendName: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: `Successfully shared ${sharedCount} transaction${sharedCount === 1 ? '' : 's'} with ${friend.name}.`,
      sharedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   PUT /api/friends/:id/permission
// @desc    Update friend permission (NORMAL = Requires Approval, AUTHORIZED = Instant Sync)
exports.updateFriendPermission = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;
    const { permission } = req.body;

    if (!['NORMAL', 'AUTHORIZED'].includes(permission)) {
      return res.status(400).json({ success: false, error: 'Permission must be NORMAL or AUTHORIZED.' });
    }

    const friend = await Friend.findOne({ _id: friendId, userId });
    if (!friend) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    friend.permission = permission;
    await friend.save();

    res.json({
      success: true,
      message: `Permission for ${friend.name} set to ${permission === 'AUTHORIZED' ? 'Authorized (Instant Sync)' : 'Normal (Requires Approval)'}.`,
      data: friend
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   PUT /api/friends/:id
// @desc    Update friend details
exports.updateFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;
    const { name, phone, email, avatarColor, avatarEmoji, relationshipTag, notes, pendingUsername } = req.body;

    const existing = await Friend.findOne({ _id: friendId, userId });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    if (name) existing.name = name.trim();
    if (phone !== undefined) existing.phone = phone;
    if (email !== undefined) existing.email = email;
    if (avatarColor) existing.avatarColor = avatarColor;
    if (avatarEmoji) existing.avatarEmoji = avatarEmoji;
    if (relationshipTag) existing.relationshipTag = relationshipTag;
    if (notes !== undefined) existing.notes = notes;
    if (pendingUsername !== undefined) existing.pendingUsername = pendingUsername ? pendingUsername.replace(/^@/, '').toLowerCase().trim() : null;

    await existing.save();

    res.json({
      success: true,
      message: 'Friend updated',
      data: existing
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   DELETE /api/friends/:id
// @desc    Delete friend and cascade delete their transactions
exports.deleteFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;

    const existing = await Friend.findOne({ _id: friendId, userId });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    await Transaction.deleteMany({ friendId, userId });
    await Friend.deleteOne({ _id: friendId });

    res.json({
      success: true,
      message: 'Friend and associated transactions deleted.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
