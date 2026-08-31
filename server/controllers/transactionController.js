const prisma = require('../db');

// @route   GET /api/transactions
// @desc    Get transactions with search and filters for logged in user
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId, type, category, search, startDate, endDate, limit = 100 } = req.query;

    const where = { userId };

    if (friendId) where.friendId = friendId;
    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { note: { contains: q } },
        { receiptNote: { contains: q } },
        { friend: { name: { contains: q } } }
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            avatarColor: true,
            avatarEmoji: true,
            relationshipTag: true,
            phone: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      take: Number(limit)
    });

    res.json({
      success: true,
      data: transactions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/transactions
// @desc    Create single transaction or group split bill
exports.createTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      isGroupSplit,
      friendId,
      type, // "GIVEN", "RECEIVED", "SETTLED", "SPLIT"
      amount,
      category = 'Food & Dining',
      note,
      date = new Date().toISOString().slice(0, 10),
      time = new Date().toTimeString().slice(0, 5),
      paymentMethod = 'UPI',
      receiptNote,
      splits // array of { friendId, shareAmount, paidByUser }
    } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, error: 'Description / Note is required.' });
    }

    // Handle Group Split Bill
    if (isGroupSplit && Array.isArray(splits) && splits.length > 0) {
      const splitGroupId = 'SPLIT-' + Date.now();

      const createdList = await prisma.$transaction(
        splits.map(s => {
          const numShare = Math.abs(Number(s.shareAmount));
          const isPayer = s.paidByUser !== false;
          const impact = isPayer ? numShare : -numShare;
          const txType = isPayer ? 'SPLIT' : 'RECEIVED';

          return prisma.transaction.create({
            data: {
              userId,
              friendId: s.friendId,
              type: txType,
              amount: numShare,
              impactOnUser: impact,
              category,
              note: note.trim(),
              date,
              time,
              paymentMethod,
              receiptNote: receiptNote || `Group split bill: ${note}`,
              splitGroupId
            }
          });
        })
      );

      return res.status(201).json({
        success: true,
        message: `Split bill recorded across ${createdList.length} friends`,
        data: createdList
      });
    }

    // Single Transaction
    const numAmount = Math.abs(Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid positive amount is required.' });
    }
    if (!friendId) {
      return res.status(400).json({ success: false, error: 'Friend must be selected.' });
    }

    // Verify friend belongs to user
    const friend = await prisma.friend.findFirst({
      where: { id: friendId, userId }
    });
    if (!friend) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    let impact = 0;
    if (type === 'GIVEN' || type === 'SPLIT') {
      impact = numAmount; // You gave money -> Friend owes you (+)
    } else if (type === 'RECEIVED') {
      impact = -numAmount; // Friend gave you money -> You owe friend (-)
    } else if (type === 'SETTLED') {
      const direction = req.body.settleDirection; // "RECEIVED_FROM_FRIEND" or "PAID_TO_FRIEND"
      impact = direction === 'RECEIVED_FROM_FRIEND' ? -numAmount : numAmount;
    }

    const tx = await prisma.transaction.create({
      data: {
        userId,
        friendId,
        type: type || 'GIVEN',
        amount: numAmount,
        impactOnUser: impact,
        category,
        note: note.trim(),
        date,
        time,
        paymentMethod,
        receiptNote: receiptNote ? receiptNote.trim() : null
      },
      include: {
        friend: {
          select: { id: true, name: true, avatarColor: true, avatarEmoji: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Transaction saved',
      data: tx
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   PUT /api/transactions/:id
// @desc    Update transaction
exports.updateTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const txId = req.params.id;
    const { amount, type, category, note, date, time, paymentMethod, receiptNote, friendId } = req.body;

    const existing = await prisma.transaction.findFirst({
      where: { id: txId, userId }
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }

    const numAmount = amount !== undefined ? Math.abs(Number(amount)) : existing.amount;
    const txType = type || existing.type;
    const targetFriendId = friendId || existing.friendId;

    let impact = 0;
    if (txType === 'GIVEN' || txType === 'SPLIT') {
      impact = numAmount;
    } else if (txType === 'RECEIVED') {
      impact = -numAmount;
    } else if (txType === 'SETTLED') {
      const direction = req.body.settleDirection || (existing.impactOnUser < 0 ? 'RECEIVED_FROM_FRIEND' : 'PAID_TO_FRIEND');
      impact = direction === 'RECEIVED_FROM_FRIEND' ? -numAmount : numAmount;
    }

    const updated = await prisma.transaction.update({
      where: { id: txId },
      data: {
        friendId: targetFriendId,
        type: txType,
        amount: numAmount,
        impactOnUser: impact,
        category: category || existing.category,
        note: note !== undefined ? note.trim() : existing.note,
        date: date || existing.date,
        time: time || existing.time,
        paymentMethod: paymentMethod || existing.paymentMethod,
        receiptNote: receiptNote !== undefined ? receiptNote : existing.receiptNote
      },
      include: {
        friend: {
          select: { id: true, name: true, avatarColor: true, avatarEmoji: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Transaction updated',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const txId = req.params.id;

    const existing = await prisma.transaction.findFirst({
      where: { id: txId, userId }
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }

    await prisma.transaction.delete({
      where: { id: txId }
    });

    res.json({
      success: true,
      message: 'Transaction deleted.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/transactions/settle
// @desc    1-Click Quick Settle Up balance
exports.settleUp = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId, amount, paymentMethod = 'UPI', note, date = new Date().toISOString().slice(0, 10) } = req.body;

    const friend = await prisma.friend.findFirst({
      where: { id: friendId, userId },
      include: { transactions: true }
    });

    if (!friend) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    const currentBal = friend.transactions.reduce((acc, t) => acc + t.impactOnUser, 0);
    if (currentBal === 0) {
      return res.status(400).json({ success: false, error: 'Balance is already fully settled (₹0).' });
    }

    const settleAmount = amount ? Math.abs(Number(amount)) : Math.abs(currentBal);
    if (isNaN(settleAmount) || settleAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid settlement amount.' });
    }

    // If friend owed user (currentBal > 0): Friend pays User -> impact is -settleAmount
    // If user owed friend (currentBal < 0): User pays Friend -> impact is +settleAmount
    const impact = currentBal > 0 ? -settleAmount : settleAmount;
    const desc = note ? note.trim() : (currentBal > 0 ? `Settlement received from ${friend.name}` : `Settlement paid to ${friend.name}`);

    const settleTx = await prisma.transaction.create({
      data: {
        userId,
        friendId,
        type: 'SETTLED',
        amount: settleAmount,
        impactOnUser: impact,
        category: 'Settlement',
        note: desc,
        date,
        time: new Date().toTimeString().slice(0, 5),
        paymentMethod,
        receiptNote: `Settled via ${paymentMethod}`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Settlement recorded successfully',
      data: settleTx
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
