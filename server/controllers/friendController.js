const { Friend, Transaction, User, Notification } = require('../db');

// @route   GET /api/friends
// @desc    Get all friends of logged-in user with computed balances & connection details
exports.getAllFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    // Parallel fetch: fetch user's friends and transactions concurrently with lean()
    const [allFriends, transactions] = await Promise.all([
      Friend.find({ userId })
        .populate('connectedUserId', 'id name username email')
        .sort({ name: 1 })
        .lean(),
      Transaction.find({ userId, approvalStatus: { $ne: 'REJECTED' } })
        .select('friendId type amount impactOnUser date')
        .lean()
    ]);

    // Map transactions by friendId and collect friends with tx history
    const txByFriend = {};
    const txFriendIdSet = new Set();
    for (const t of transactions) {
      if (!t.friendId) continue;
      const fId = t.friendId._id ? t.friendId._id.toString() : t.friendId.toString();
      txFriendIdSet.add(fId);
      if (!txByFriend[fId]) txByFriend[fId] = [];
      txByFriend[fId].push(t);
    }

    // Filter active friends: OFFLINE, CONNECTED, REQUEST_SENT, PENDING_MATCH, or any with transaction history
    const friends = allFriends.filter(f => {
      const fIdStr = f._id ? f._id.toString() : (f.id || '');
      return (
        !f.connectionStatus ||
        ['OFFLINE', 'CONNECTED', 'REQUEST_SENT', 'PENDING_MATCH'].includes(f.connectionStatus) ||
        txFriendIdSet.has(fIdStr)
      );
    });

    // Batch fetch reciprocal friend records to determine friendPermission
    const connectedUserIds = friends
      .filter(f => f.connectedUserId)
      .map(f => (f.connectedUserId._id ? f.connectedUserId._id.toString() : f.connectedUserId.toString()));

    let reciprocalMap = {};
    if (connectedUserIds.length > 0) {
      const reciprocals = await Friend.find({
        userId: { $in: connectedUserIds },
        connectedUserId: userId
      }).select('userId permission').lean();
      for (const r of reciprocals) {
        reciprocalMap[r.userId.toString()] = r;
      }
    }

    const enriched = friends.map(f => {
      const fIdStr = f._id ? f._id.toString() : (f.id || '');
      const fTxs = txByFriend[fIdStr] || [];
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

      const connUserIdStr = f.connectedUserId 
        ? (f.connectedUserId._id ? f.connectedUserId._id.toString() : f.connectedUserId.toString()) 
        : null;
      const reciprocalFriend = connUserIdStr ? reciprocalMap[connUserIdStr] : null;
      const friendPermission = reciprocalFriend 
        ? (reciprocalFriend.permission || 'NORMAL') 
        : (f.connectionStatus === 'CONNECTED' ? 'NORMAL' : null);

      return {
        id: fIdStr,
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
        friendPermission,
        linkedAt: f.linkedAt,
        connectedUser: f.connectedUserId ? {
          id: f.connectedUserId.id || (f.connectedUserId._id ? f.connectedUserId._id.toString() : f.connectedUserId.toString()),
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

    // In-memory derivation of pending connection requests (zero extra DB round trips)
    const enrichedPending = allFriends
      .filter(f => ['REQUEST_SENT', 'REQUEST_RECEIVED', 'PENDING_MATCH'].includes(f.connectionStatus))
      .map(f => ({
        id: f._id ? f._id.toString() : (f.id || ''),
        name: f.name,
        phone: f.phone,
        email: f.email,
        avatarColor: f.avatarColor,
        avatarEmoji: f.avatarEmoji,
        relationshipTag: f.relationshipTag,
        pendingUsername: f.pendingUsername,
        connectionStatus: f.connectionStatus,
        createdAt: f.createdAt,
        connectedUser: f.connectedUserId ? {
          id: f.connectedUserId.id || (f.connectedUserId._id ? f.connectedUserId._id.toString() : f.connectedUserId.toString()),
          name: f.connectedUserId.name,
          username: f.connectedUserId.username,
          email: f.connectedUserId.email
        } : null
      }));

    res.json({
      success: true,
      data: enriched,
      pendingRequests: enrichedPending
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

    // Parallel fetch: retrieve friend details and all ledger transactions concurrently
    const [friend, transactions] = await Promise.all([
      Friend.findOne({ _id: friendId, userId })
        .populate('connectedUserId', 'id name username email')
        .lean(),
      Transaction.find({ 
        friendId, 
        userId, 
        approvalStatus: { $ne: 'REJECTED' } 
      }).sort({ date: 1, createdAt: 1 }).populate('linkedTransactionId', 'approvalStatus').lean()
    ]);

    if (!friend) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    // Compute running balance at each point in time
    let runningBalance = 0;
    let totalGiven = 0;
    let totalReceived = 0;

    const ledger = transactions.map(t => {
      runningBalance += t.impactOnUser;
      if (t.impactOnUser > 0 && t.type !== 'SETTLED') totalGiven += t.amount;
      if (t.impactOnUser < 0 && t.type !== 'SETTLED') totalReceived += t.amount;

      let effectiveApprovalStatus = t.approvalStatus;
      if (t.linkedTransactionId && typeof t.linkedTransactionId === 'object' && t.linkedTransactionId.approvalStatus) {
        if (t.linkedTransactionId.approvalStatus === 'PENDING_APPROVAL' || t.approvalStatus === 'PENDING_APPROVAL') {
          effectiveApprovalStatus = 'PENDING_APPROVAL';
        } else if (t.linkedTransactionId.approvalStatus === 'REJECTED' || t.approvalStatus === 'REJECTED') {
          effectiveApprovalStatus = 'REJECTED';
        }
      }

      return {
        id: t._id ? t._id.toString() : t.id,
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
        isSettled: Boolean(t.isSettled) || t.type === 'SETTLED',
        approvalStatus: effectiveApprovalStatus,
        createdAt: t.createdAt,
        runningBalance: Number(runningBalance.toFixed(2))
      };
    });

    const reversedTimeline = [...ledger].reverse();
    const finalBalance = Number(runningBalance.toFixed(2));

    let friendPermission = null;
    if (friend.connectedUserId) {
      const connId = friend.connectedUserId._id || friend.connectedUserId;
      const reciprocal = await Friend.findOne({ userId: connId, connectedUserId: userId }).select('permission').lean();
      friendPermission = reciprocal?.permission || 'NORMAL';
    }

    const friendIdStr = friend._id ? friend._id.toString() : (friend.id || friendId);

    res.json({
      success: true,
      data: {
        friend: {
          id: friendIdStr,
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
          friendPermission: friendPermission || (friend.connectionStatus === 'CONNECTED' ? 'NORMAL' : null),
          linkedAt: friend.linkedAt,
          connectedUser: friend.connectedUserId ? {
            id: friend.connectedUserId.id || (friend.connectedUserId._id ? friend.connectedUserId._id.toString() : friend.connectedUserId.toString()),
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
        initialStatus = 'REQUEST_SENT';
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
          connectionStatus: 'REQUEST_RECEIVED',
          permission: 'NORMAL',
          avatarColor: '#10b981',
          avatarEmoji: '🤝',
          relationshipTag: 'Friend'
        });
      } else {
        reciprocalFriend.connectedUserId = userId;
        reciprocalFriend.connectionStatus = 'REQUEST_RECEIVED';
        await reciprocalFriend.save();
      }

      // Send friend request notification to foundUser
      await Notification.create({
        userId: foundUser._id,
        type: 'FRIEND_REQUEST',
        title: '👋 Friend Connection Request',
        message: `${req.user.name} (@${req.user.username || 'user'}) sent you a friend connection request. Accept to see each other in your friend lists.`,
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
      const oldConnectedId = friend.connectedUserId;
      if (oldConnectedId) {
        const reciprocal = await Friend.findOne({ userId: oldConnectedId, connectedUserId: userId });
        if (reciprocal) {
          const otherTx = await Transaction.countDocuments({ userId: oldConnectedId, friendId: reciprocal._id });
          if (otherTx === 0 && (reciprocal.connectionStatus === 'REQUEST_RECEIVED' || reciprocal.connectionStatus === 'PENDING_MATCH')) {
            await Friend.deleteOne({ _id: reciprocal._id });
          } else {
            reciprocal.connectionStatus = 'OFFLINE';
            reciprocal.connectedUserId = null;
            await reciprocal.save();
          }
        }
        await Notification.deleteMany({
          userId: oldConnectedId,
          type: 'FRIEND_REQUEST',
          $or: [
            { 'data.connectedUserId': userId },
            { 'data.friendId': reciprocal?._id }
          ]
        });
      }

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
      friend.connectionStatus = 'REQUEST_SENT';
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
          connectionStatus: 'REQUEST_RECEIVED',
          permission: 'NORMAL',
          avatarColor: '#10b981',
          avatarEmoji: '🤝',
          relationshipTag: 'Friend'
        });
      } else {
        reciprocalFriend.connectedUserId = userId;
        reciprocalFriend.connectionStatus = 'REQUEST_RECEIVED';
        await reciprocalFriend.save();
      }

      // Send friend request notification to foundUser
      await Notification.create({
        userId: foundUser._id,
        type: 'FRIEND_REQUEST',
        title: '👋 Friend Connection Request',
        message: `${req.user.name} (@${req.user.username || 'user'}) sent you a friend connection request. Accept to see each other in your friend lists.`,
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
        message: `Connection request sent to @${foundUser.username}! Once accepted, you will see each other in your friend lists.`,
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
      title: '🤝 Connection Request Accepted!',
      message: `${req.user.name} (@${req.user.username || 'user'}) accepted your connection request! You are now connected friends.`,
      data: {
        friendId: reciprocalFriend._id,
        connectedUserId: userId,
        username: req.user.username,
        friendName: req.user.name
      }
    });

    // 5. Activate any pending approval transactions between both friends
    await Transaction.updateMany(
      { userId, friendId: friend._id, approvalStatus: 'PENDING_APPROVAL' },
      { approvalStatus: 'ACTIVE' }
    );
    await Transaction.updateMany(
      { userId: otherUser._id, friendId: reciprocalFriend._id, approvalStatus: 'PENDING_APPROVAL' },
      { approvalStatus: 'ACTIVE' }
    );

    // 6. Auto-sync ALL existing transactions in both directions automatically (full ledger share)
    const mirrorUnsharedTransactions = async (fromUserId, fromFriendId, toUserId, toFriendId, fromUserName) => {
      const txs = await Transaction.find({
        userId: fromUserId,
        friendId: fromFriendId,
        isShared: { $ne: true }
      });

      for (const tx of txs) {
        if (tx.linkedTransactionId) {
          const exists = await Transaction.findById(tx.linkedTransactionId);
          if (exists) continue;
        }

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
          userId: toUserId,
          friendId: toFriendId,
          type: reciprocalType,
          amount: tx.amount,
          impactOnUser: reciprocalImpact,
          category: tx.category,
          note: tx.note,
          date: tx.date,
          time: tx.time,
          paymentMethod: tx.paymentMethod,
          receiptNote: tx.receiptNote ? `From ${fromUserName}: ${tx.receiptNote}` : `Synced from ${fromUserName}`,
          isShared: true,
          sharedWithUserId: fromUserId,
          approvalStatus: 'ACTIVE',
          linkedTransactionId: tx._id
        });

        tx.isShared = true;
        tx.sharedWithUserId = toUserId;
        tx.linkedTransactionId = mirroredTx._id;
        await tx.save();
      }
    };

    // Automatically sync full ledger from accepting user to requester
    await mirrorUnsharedTransactions(userId, friend._id, otherUser._id, reciprocalFriend._id, req.user.name);
    // Automatically sync full ledger from requester to accepting user
    await mirrorUnsharedTransactions(otherUser._id, reciprocalFriend._id, userId, friend._id, otherUser.name);

    res.json({
      success: true,
      message: `Successfully connected with ${otherUser.name} (@${otherUser.username})! All ledger transactions synchronized automatically.`,
      data: {
        friend,
        reciprocalFriend
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/friends/:id/ignore-connect
// @desc    Ignore a suggested username match (reverts friend to offline or removes reciprocal entry)
exports.ignoreConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;

    const friend = await Friend.findOne({ _id: friendId, userId });
    if (!friend) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    const otherUserId = friend.connectedUserId;

    // Check if recipient has transactions with this friend
    const myTxCount = await Transaction.countDocuments({ userId, friendId: friend._id });
    if (myTxCount === 0 && (friend.connectionStatus === 'REQUEST_RECEIVED' || friend.connectionStatus === 'PENDING_MATCH')) {
      await Friend.deleteOne({ _id: friend._id });
    } else {
      friend.connectionStatus = 'OFFLINE';
      friend.connectedUserId = null;
      await friend.save();
    }

    // Also update sender's reciprocal friend entry if exists
    if (otherUserId) {
      const reciprocalFriend = await Friend.findOne({ userId: otherUserId, connectedUserId: userId });
      if (reciprocalFriend) {
        const senderTxCount = await Transaction.countDocuments({ userId: otherUserId, friendId: reciprocalFriend._id });
        if (senderTxCount === 0 && (reciprocalFriend.connectionStatus === 'REQUEST_SENT' || reciprocalFriend.connectionStatus === 'PENDING_MATCH')) {
          await Friend.deleteOne({ _id: reciprocalFriend._id });
        } else {
          reciprocalFriend.connectionStatus = 'OFFLINE';
          reciprocalFriend.connectedUserId = null;
          await reciprocalFriend.save();
        }
      }
      // Send notification to sender
      await Notification.create({
        userId: otherUserId,
        type: 'FRIEND_REQUEST_DECLINED',
        title: 'Connection Request Declined',
        message: `${req.user.name} (@${req.user.username || 'user'}) declined your connection request.`,
        data: {
          declinedBy: userId,
          declinedByName: req.user.name
        }
      });
    }

    await Notification.updateMany(
      { userId, 'data.friendId': friendId },
      { isActioned: true, actionTaken: 'IGNORED', isRead: true }
    );

    res.json({
      success: true,
      message: `Connection request declined.`,
      data: friend
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/friends/:id/cancel-connect
// @desc    Cancel an outgoing friend connection request sent to another user
exports.cancelConnectionRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;

    const friend = await Friend.findOne({ _id: friendId, userId });
    if (!friend) {
      return res.status(404).json({ success: false, error: 'Friend request not found.' });
    }

    const otherUserId = friend.connectedUserId;

    // Delete recipient's reciprocal friend entry if no transactions
    if (otherUserId) {
      const reciprocal = await Friend.findOne({ userId: otherUserId, connectedUserId: userId });
      if (reciprocal) {
        const otherTx = await Transaction.countDocuments({ userId: otherUserId, friendId: reciprocal._id });
        if (otherTx === 0) {
          await Friend.deleteOne({ _id: reciprocal._id });
        } else {
          reciprocal.connectionStatus = 'OFFLINE';
          reciprocal.connectedUserId = null;
          await reciprocal.save();
        }
      }
      // Remove notification sent to other user
      await Notification.deleteMany({
        userId: otherUserId,
        type: 'FRIEND_REQUEST',
        $or: [
          { 'data.connectedUserId': userId },
          { 'data.friendId': reciprocal?._id }
        ]
      });
    }

    // Revert friend back to standard offline mode in sender's circle
    friend.connectionStatus = 'OFFLINE';
    friend.connectedUserId = null;
    await friend.save();

    res.json({
      success: true,
      message: 'Connection request cancelled successfully.'
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

// @route   PUT /api/friends/:id/permission (and PATCH)
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

    let friendPermission = null;
    // If friend is connected to another MoneyTracker user, send alert notification without overriding reciprocal permission
    if (friend.connectedUserId) {
      let reciprocalFriend = await Friend.findOne({ userId: friend.connectedUserId, connectedUserId: userId });
      if (!reciprocalFriend && req.user.username) {
        reciprocalFriend = await Friend.findOne({ userId: friend.connectedUserId, pendingUsername: req.user.username.toLowerCase() });
      }

      friendPermission = reciprocalFriend?.permission || 'NORMAL';

      await Notification.create({
        userId: friend.connectedUserId,
        type: 'SYSTEM_ALERT',
        title: permission === 'AUTHORIZED' ? '⚡ Instant Sync Enabled' : '⏳ Normal Approval Mode Set',
        message: `${req.user.name} set sync mode with you to ${permission === 'AUTHORIZED' ? 'Authorized (Instant Sync)' : 'Normal (Requires Approval)'}.`,
        data: {
          friendId: reciprocalFriend ? reciprocalFriend._id : null,
          connectedUserId: userId,
          friendName: req.user.name,
          permission
        }
      });
    }

    res.json({
      success: true,
      message: `Permission for ${friend.name} set to ${permission === 'AUTHORIZED' ? 'Authorized (Instant Sync)' : 'Normal (Requires Approval)'}.`,
      data: {
        ...friend.toObject(),
        id: friend._id.toString(),
        friendPermission: friendPermission || (friend.connectionStatus === 'CONNECTED' ? 'NORMAL' : null)
      }
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
