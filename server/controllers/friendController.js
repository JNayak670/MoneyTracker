const { Friend, Transaction } = require('../db');

// @route   GET /api/friends
// @desc    Get all friends of logged-in user with computed balances
exports.getAllFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const friends = await Friend.find({ userId }).sort({ name: 1 });
    const transactions = await Transaction.find({ userId });

    // Map transactions by friendId
    const txByFriend = {};
    for (const t of transactions) {
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
// @desc    Get single friend details with complete chronological ledger history & running balance
exports.getFriendLedger = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;

    const friend = await Friend.findOne({ _id: friendId, userId });
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
// @desc    Create a new friend
exports.createFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, email, avatarColor, avatarEmoji, relationshipTag, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Friend name is required.' });
    }

    const friend = await Friend.create({
      userId,
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      email: email ? email.trim() : null,
      avatarColor: avatarColor || '#6366f1',
      avatarEmoji: avatarEmoji || '👤',
      relationshipTag: relationshipTag || 'Friend',
      notes: notes ? notes.trim() : null
    });

    res.status(201).json({
      success: true,
      message: 'Friend added to circle',
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
    const { name, phone, email, avatarColor, avatarEmoji, relationshipTag, notes } = req.body;

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
