const { Transaction, Friend, User, Notification } = require('../db');

// @route   GET /api/transactions
// @desc    Get transactions with search and filters for logged in user
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId, type, category, search, startDate, endDate, limit = 100 } = req.query;

    const query = { userId };

    if (friendId) query.friendId = friendId;
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { note: regex },
        { receiptNote: regex }
      ];
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(Number(limit))
      .populate('friendId', 'id name avatarColor avatarEmoji relationshipTag phone connectionStatus permission');

    const formatted = transactions.map(t => ({
      id: t.id,
      userId: t.userId.toString(),
      friendId: t.friendId ? (t.friendId.id || t.friendId._id.toString()) : null,
      type: t.type,
      amount: t.amount,
      impactOnUser: t.impactOnUser,
      category: t.category,
      note: t.note,
      date: t.date,
      time: t.time,
      paymentMethod: t.paymentMethod,
      status: t.status,
      receiptNote: t.receiptNote,
      splitGroupId: t.splitGroupId,
      isShared: t.isShared,
      approvalStatus: t.approvalStatus,
      createdAt: t.createdAt,
      friend: t.friendId ? {
        id: t.friendId.id || t.friendId._id.toString(),
        name: t.friendId.name,
        avatarColor: t.friendId.avatarColor,
        avatarEmoji: t.friendId.avatarEmoji,
        relationshipTag: t.friendId.relationshipTag,
        phone: t.friendId.phone,
        connectionStatus: t.friendId.connectionStatus,
        permission: t.friendId.permission
      } : null
    }));

    res.json({
      success: true,
      data: formatted
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

      const createdList = [];
      for (const s of splits) {
        const numShare = Math.abs(Number(s.shareAmount));
        const isPayer = s.paidByUser !== false;
        const impact = isPayer ? numShare : -numShare;
        const txType = isPayer ? 'SPLIT' : 'RECEIVED';

        const tx = await Transaction.create({
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
        });
        createdList.push(tx);
      }

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

    const friend = await Friend.findOne({ _id: friendId, userId });
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

    const isConnected = friend.connectionStatus === 'CONNECTED' && friend.connectedUserId;
    const isAuthorized = friend.permission === 'AUTHORIZED';

    const tx = await Transaction.create({
      userId,
      friendId,
      type,
      amount: numAmount,
      impactOnUser: impact,
      category,
      note: note.trim(),
      date,
      time,
      paymentMethod,
      receiptNote,
      isShared: Boolean(isConnected),
      sharedWithUserId: isConnected ? friend.connectedUserId : null,
      approvalStatus: 'ACTIVE'
    });

    // Handle connected MoneyTracker Friend Two-Way Sync
    if (isConnected) {
      const otherUserId = friend.connectedUserId;
      const reciprocalFriend = await Friend.findOne({ userId: otherUserId, connectedUserId: userId });

      if (reciprocalFriend) {
        let reciprocalType = 'RECEIVED';
        let reciprocalImpact = -numAmount;
        if (type === 'RECEIVED') {
          reciprocalType = 'GIVEN';
          reciprocalImpact = numAmount;
        } else if (type === 'SETTLED') {
          reciprocalType = 'SETTLED';
          reciprocalImpact = -impact;
        }

        const mirroredStatus = isAuthorized ? 'ACTIVE' : 'PENDING_APPROVAL';

        const mirroredTx = await Transaction.create({
          userId: otherUserId,
          friendId: reciprocalFriend._id,
          type: reciprocalType,
          amount: numAmount,
          impactOnUser: reciprocalImpact,
          category,
          note: note.trim(),
          date,
          time,
          paymentMethod,
          receiptNote: `From ${req.user.name}: ${receiptNote || note}`,
          isShared: true,
          sharedWithUserId: userId,
          approvalStatus: mirroredStatus,
          linkedTransactionId: tx._id
        });

        tx.linkedTransactionId = mirroredTx._id;
        await tx.save();

        // Send appropriate Notification
        if (isAuthorized) {
          await Notification.create({
            userId: otherUserId,
            type: 'TRANSACTION_LOGGED',
            title: '💸 Transaction Logged',
            message: `${req.user.name} recorded ₹${numAmount} for "${note.trim()}".`,
            data: {
              friendId: reciprocalFriend._id,
              connectedUserId: userId,
              transactionId: mirroredTx._id,
              friendName: req.user.name,
              amount: numAmount
            }
          });
        } else {
          await Notification.create({
            userId: otherUserId,
            type: 'TRANSACTION_REQUEST',
            title: '⏳ Approval Request',
            message: `${req.user.name} logged ₹${numAmount} for "${note.trim()}". Accept or Decline?`,
            data: {
              friendId: reciprocalFriend._id,
              connectedUserId: userId,
              transactionId: mirroredTx._id,
              friendName: req.user.name,
              amount: numAmount
            }
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: isConnected 
        ? (isAuthorized ? 'Transaction recorded and synced with friend.' : 'Transaction recorded. Approval request sent to friend.')
        : 'Transaction recorded successfully',
      data: tx
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/transactions/settle
// @desc    Settle up balance with a friend
exports.settleUp = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId, amount, paymentMethod = 'UPI', note = 'Settlement', date = new Date().toISOString().slice(0, 10) } = req.body;

    if (!friendId) {
      return res.status(400).json({ success: false, error: 'Friend ID is required for settlement.' });
    }

    const friend = await Friend.findOne({ _id: friendId, userId });
    if (!friend) {
      return res.status(404).json({ success: false, error: 'Friend not found.' });
    }

    // Calculate current net balance
    const friendTxs = await Transaction.find({ friendId, userId, approvalStatus: { $ne: 'REJECTED' } });
    let currentBalance = 0;
    for (const t of friendTxs) {
      currentBalance += t.impactOnUser;
    }

    currentBalance = Number(currentBalance.toFixed(2));
    if (currentBalance === 0) {
      return res.status(400).json({ success: false, error: `${friend.name} is already completely settled up!` });
    }

    const settleAmount = amount ? Math.abs(Number(amount)) : Math.abs(currentBalance);
    const impact = currentBalance > 0 ? -settleAmount : settleAmount;

    const isConnected = friend.connectionStatus === 'CONNECTED' && friend.connectedUserId;

    const tx = await Transaction.create({
      userId,
      friendId,
      type: 'SETTLED',
      amount: settleAmount,
      impactOnUser: impact,
      category: 'Settlement',
      note: note.trim(),
      date,
      time: new Date().toTimeString().slice(0, 5),
      paymentMethod,
      receiptNote: `Settled via ${paymentMethod}`,
      isShared: Boolean(isConnected),
      sharedWithUserId: isConnected ? friend.connectedUserId : null,
      approvalStatus: 'ACTIVE'
    });

    if (isConnected) {
      const otherUserId = friend.connectedUserId;
      const reciprocalFriend = await Friend.findOne({ userId: otherUserId, connectedUserId: userId });

      if (reciprocalFriend) {
        const mirroredTx = await Transaction.create({
          userId: otherUserId,
          friendId: reciprocalFriend._id,
          type: 'SETTLED',
          amount: settleAmount,
          impactOnUser: -impact,
          category: 'Settlement',
          note: note.trim(),
          date,
          time: new Date().toTimeString().slice(0, 5),
          paymentMethod,
          receiptNote: `Settlement from ${req.user.name}`,
          isShared: true,
          sharedWithUserId: userId,
          approvalStatus: 'ACTIVE',
          linkedTransactionId: tx._id
        });

        tx.linkedTransactionId = mirroredTx._id;
        await tx.save();

        await Notification.create({
          userId: otherUserId,
          type: 'TRANSACTION_LOGGED',
          title: '✅ Settlement Recorded',
          message: `${req.user.name} recorded a settlement of ₹${settleAmount}.`,
          data: {
            friendId: reciprocalFriend._id,
            connectedUserId: userId,
            transactionId: mirroredTx._id,
            friendName: req.user.name,
            amount: settleAmount
          }
        });
      }
    }

    const newBalance = Number((currentBalance + impact).toFixed(2));

    res.json({
      success: true,
      message: `Settlement of ₹${settleAmount} recorded for ${friend.name}`,
      data: {
        transaction: tx,
        previousBalance: currentBalance,
        newBalance
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/transactions/:id/approve
// @desc    Approve a pending transaction request
exports.approveTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const txId = req.params.id;

    const tx = await Transaction.findOne({ _id: txId, userId });
    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }

    tx.approvalStatus = 'ACTIVE';
    await tx.save();

    // Mark notification as actioned
    await Notification.updateMany(
      { userId, 'data.transactionId': tx._id },
      { isActioned: true, actionTaken: 'APPROVED', isRead: true }
    );

    // Notify creator
    if (tx.sharedWithUserId) {
      await Notification.create({
        userId: tx.sharedWithUserId,
        type: 'TRANSACTION_APPROVED',
        title: '✅ Transaction Approved',
        message: `${req.user.name} approved the transaction: "${tx.note}" (₹${tx.amount}).`,
        data: {
          transactionId: tx.linkedTransactionId || tx._id,
          friendName: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Transaction approved and activated.',
      data: tx
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/transactions/:id/reject
// @desc    Reject a pending transaction request
exports.rejectTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const txId = req.params.id;

    const tx = await Transaction.findOne({ _id: txId, userId });
    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }

    tx.approvalStatus = 'REJECTED';
    await tx.save();

    // Also update parent transaction if linked
    if (tx.linkedTransactionId) {
      await Transaction.updateOne(
        { _id: tx.linkedTransactionId },
        { approvalStatus: 'REJECTED' }
      );
    }

    // Mark notification as actioned
    await Notification.updateMany(
      { userId, 'data.transactionId': tx._id },
      { isActioned: true, actionTaken: 'REJECTED', isRead: true }
    );

    // Notify creator
    if (tx.sharedWithUserId) {
      await Notification.create({
        userId: tx.sharedWithUserId,
        type: 'TRANSACTION_REJECTED',
        title: '❌ Transaction Declined',
        message: `${req.user.name} declined the transaction request: "${tx.note}" (₹${tx.amount}).`,
        data: {
          transactionId: tx.linkedTransactionId || tx._id,
          friendName: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Transaction declined.',
      data: tx
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   PUT /api/transactions/:id
// @desc    Update existing transaction
exports.updateTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const { amount, category, note, date, paymentMethod, receiptNote } = req.body;

    const existing = await Transaction.findOne({ _id: id, userId });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }

    if (amount !== undefined) {
      const numAmount = Math.abs(Number(amount));
      existing.amount = numAmount;
      if (existing.type === 'GIVEN' || existing.type === 'SPLIT') {
        existing.impactOnUser = numAmount;
      } else if (existing.type === 'RECEIVED') {
        existing.impactOnUser = -numAmount;
      }
    }
    if (category) existing.category = category;
    if (note) existing.note = note.trim();
    if (date) existing.date = date;
    if (paymentMethod) existing.paymentMethod = paymentMethod;
    if (receiptNote !== undefined) existing.receiptNote = receiptNote;

    await existing.save();

    // If linked, update mirrored transaction
    if (existing.linkedTransactionId) {
      const mirrored = await Transaction.findById(existing.linkedTransactionId);
      if (mirrored) {
        if (amount !== undefined) {
          const numAmount = Math.abs(Number(amount));
          mirrored.amount = numAmount;
          mirrored.impactOnUser = -existing.impactOnUser;
        }
        if (category) mirrored.category = category;
        if (note) mirrored.note = note.trim();
        if (date) mirrored.date = date;
        if (paymentMethod) mirrored.paymentMethod = paymentMethod;
        await mirrored.save();
      }
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: existing
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   DELETE /api/transactions/:id
// @desc    Delete single transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const existing = await Transaction.findOne({ _id: id, userId });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }

    if (existing.linkedTransactionId) {
      await Transaction.deleteOne({ _id: existing.linkedTransactionId });
    }

    await Transaction.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Transaction deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
