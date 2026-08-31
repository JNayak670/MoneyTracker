const prisma = require('../db');

// @route   GET /api/friends
// @desc    Get all friends of logged-in user with computed balances
exports.getAllFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const friends = await prisma.friend.findMany({
      where: { userId },
      include: {
        transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            impactOnUser: true,
            date: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const enriched = friends.map(f => {
      let totalGiven = 0;
      let totalReceived = 0;
      let balance = 0;
      let lastDate = null;

      for (const t of f.transactions) {
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
        transactionCount: f.transactions.length,
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

    const friend = await prisma.friend.findFirst({
      where: { id: friendId, userId },
      include: {
        transactions: {
          orderBy: [
            { date: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (!friend) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    // Compute running balance at each point in time
    let runningBalance = 0;
    let totalGiven = 0;
    let totalReceived = 0;

    const ledger = friend.transactions.map(t => {
      runningBalance += t.impactOnUser;
      if (t.impactOnUser > 0 && t.type !== 'SETTLED') totalGiven += t.amount;
      if (t.impactOnUser < 0 && t.type !== 'SETTLED') totalReceived += t.amount;

      return {
        ...t,
        runningBalance: Number(runningBalance.toFixed(2))
      };
    });

    // Reverse for descending display in UI, while maintaining chronologically correct running balance
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

    const friend = await prisma.friend.create({
      data: {
        userId,
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        avatarColor: avatarColor || '#6366f1',
        avatarEmoji: avatarEmoji || '👤',
        relationshipTag: relationshipTag || 'Friend',
        notes: notes ? notes.trim() : null
      }
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

    const existing = await prisma.friend.findFirst({
      where: { id: friendId, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    const updated = await prisma.friend.update({
      where: { id: friendId },
      data: {
        name: name ? name.trim() : existing.name,
        phone: phone !== undefined ? phone : existing.phone,
        email: email !== undefined ? email : existing.email,
        avatarColor: avatarColor || existing.avatarColor,
        avatarEmoji: avatarEmoji || existing.avatarEmoji,
        relationshipTag: relationshipTag || existing.relationshipTag,
        notes: notes !== undefined ? notes : existing.notes
      }
    });

    res.json({
      success: true,
      message: 'Friend updated',
      data: updated
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

    const existing = await prisma.friend.findFirst({
      where: { id: friendId, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    await prisma.friend.delete({
      where: { id: friendId }
    });

    res.json({
      success: true,
      message: 'Friend and associated transactions deleted.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
