const crypto = require('crypto');
const { ShareCode, Friend, User, Transaction } = require('../db');

function generateRandomCode() {
  // Generate 6-digit numeric or alphanumeric code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// @route   POST /api/share/generate
// @desc    Generate a time-limited share code for a friend's ledger
// @access  Private
exports.generateShareCode = async (req, res) => {
  try {
    const { friendId, durationMinutes = 60 } = req.body;

    if (!friendId) {
      return res.status(400).json({ success: false, error: 'Please provide a friend ID.' });
    }

    const friend = await Friend.findOne({ _id: friendId, userId: req.user.id });
    if (!friend) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    const validDuration = Math.max(5, Math.min(parseInt(durationMinutes, 10) || 60, 10080)); // 5 mins to 7 days
    const expiresAt = new Date(Date.now() + validDuration * 60 * 1000);

    // Delete any previous active share codes for this friend & user
    await ShareCode.deleteMany({ friendId: friend._id, userId: req.user.id });

    // Generate unique 6-digit code
    let code = generateRandomCode();
    let existing = await ShareCode.findOne({ code });
    while (existing) {
      code = generateRandomCode();
      existing = await ShareCode.findOne({ code });
    }

    const shareRecord = await ShareCode.create({
      code,
      userId: req.user.id,
      friendId: friend._id,
      durationMinutes: validDuration,
      expiresAt
    });

    res.status(201).json({
      success: true,
      message: 'Share code generated successfully',
      data: {
        code: shareRecord.code,
        expiresAt: shareRecord.expiresAt,
        durationMinutes: validDuration,
        friendName: friend.name,
        currency: req.user.currency || '₹'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   GET /api/share/:code
// @desc    Public access to view shared friend transactions ledger
// @access  Public (No login required)
exports.getSharedLedger = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ success: false, error: 'Share code is required.' });
    }

    const cleanCode = code.toString().trim().toUpperCase();
    const share = await ShareCode.findOne({ code: cleanCode });

    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Invalid share code. Please verify the code with your friend.'
      });
    }

    const now = new Date();
    if (now > share.expiresAt) {
      return res.status(410).json({
        success: false,
        expired: true,
        error: 'This share link has expired. Please ask your friend to generate a new share code.'
      });
    }

    // Fetch friend, user, and mutual transactions
    const [friend, user, transactions] = await Promise.all([
      Friend.findById(share.friendId),
      User.findById(share.userId, 'name currency'),
      Transaction.find({ friendId: share.friendId, userId: share.userId })
        .sort({ date: 1, createdAt: 1 })
        .lean()
    ]);

    if (!friend || !user) {
      return res.status(404).json({ success: false, error: 'Ledger data is no longer available.' });
    }

    // Calculate running balance
    let runningBalance = 0;
    let totalGiven = 0;
    let totalReceived = 0;
    let totalSettled = 0;

    const ledger = transactions.map(t => {
      const impact = t.impactOnUser;
      runningBalance += impact;

      if (t.type === 'GIVEN') totalGiven += t.amount;
      else if (t.type === 'RECEIVED') totalReceived += t.amount;
      else if (t.type === 'SETTLED') totalSettled += t.amount;

      return {
        id: t._id.toString(),
        type: t.type,
        amount: t.amount,
        impactOnUser: impact,
        category: t.category,
        note: t.note,
        date: t.date,
        time: t.time,
        paymentMethod: t.paymentMethod,
        receiptNote: t.receiptNote,
        status: t.status,
        runningBalanceAfter: runningBalance,
        splitGroupId: t.splitGroupId || null,
        splitDetails: t.splitDetails || null
      };
    });

    const currentBalance = runningBalance;
    const currency = user.currency || '₹';

    res.json({
      success: true,
      data: {
        code: share.code,
        expiresAt: share.expiresAt,
        serverTime: now,
        owner: {
          name: user.name,
          currency
        },
        friend: {
          name: friend.name,
          relationshipTag: friend.relationshipTag,
          avatarEmoji: friend.avatarEmoji,
          avatarColor: friend.avatarColor
        },
        summary: {
          currentBalance,
          status: currentBalance > 0 ? 'FRIEND_OWES_USER' : currentBalance < 0 ? 'USER_OWES_FRIEND' : 'SETTLED',
          totalGiven,
          totalReceived,
          totalSettled,
          transactionCount: transactions.length
        },
        transactions: ledger.reverse() // Return newest first for display
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
