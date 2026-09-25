const mongoose = require('mongoose');
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
      .populate('friendId', 'id name avatarColor avatarEmoji relationshipTag phone connectionStatus permission')
      .lean();

    const formatted = transactions.map(t => ({
      id: t._id ? t._id.toString() : t.id,
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
      splitDetails: t.splitDetails,
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
      const currentTime = time || new Date().toTimeString().slice(0, 5);
      const currentDate = date || new Date().toISOString().slice(0, 10);
      const totalAmount = Math.abs(Number(amount)) || 0;
      const splitMode = req.body.splitMode || 'EQUAL';
      const userShareNum = Math.abs(Number(req.body.userShare)) || 0;
      const payerId = req.body.payer; // 'USER' | 'ME' | friendId
      const isUserPayer = !payerId || payerId === 'USER' || payerId === 'ME' || payerId === userId;

      const createdList = [];

      if (isUserPayer) {
        // User paid the whole bill -> selected friends owe the user their respective shares
        for (const s of splits) {
          const numShare = Math.abs(Number(s.shareAmount));
          if (isNaN(numShare) || numShare <= 0) continue;

          let targetFriend = null;
          if (mongoose.Types.ObjectId.isValid(s.friendId)) {
            targetFriend = await Friend.findOne({ _id: s.friendId, userId });
          }
          if (!targetFriend) {
            targetFriend = await Friend.findOne({ userId, $or: [{ id: s.friendId }, { name: s.friendId }] });
          }
          if (!targetFriend) continue;

          const tx = await Transaction.create({
            userId,
            friendId: targetFriend._id,
            type: 'SPLIT',
            amount: numShare,
            impactOnUser: numShare, // Friend owes user
            category,
            note: note.trim(),
            date: currentDate,
            time: currentTime,
            paymentMethod,
            receiptNote: receiptNote || `Group split: ${note.trim()} (Total ₹${totalAmount.toLocaleString()})`,
            splitGroupId,
            splitDetails: {
              totalBillAmount: totalAmount,
              payerName: req.user.name,
              payerFriendId: null,
              payerIsUser: true,
              splitMode,
              userShare: userShareNum,
              participantCount: splits.length + (userShareNum > 0 ? 1 : 0)
            },
            approvalStatus: 'ACTIVE'
          });
          createdList.push(tx);

          // 2-way sync if friend has connected account
          if (targetFriend.connectedUserId) {
            const otherUserId = targetFriend.connectedUserId;
            let reciprocalFriend = await Friend.findOne({ userId: otherUserId, connectedUserId: userId });
            if (!reciprocalFriend && req.user.username) {
              reciprocalFriend = await Friend.findOne({ userId: otherUserId, pendingUsername: req.user.username.toLowerCase() });
            }

            if (reciprocalFriend) {
              const mirroredTx = await Transaction.create({
                userId: otherUserId,
                friendId: reciprocalFriend._id,
                type: 'RECEIVED',
                amount: numShare,
                impactOnUser: -numShare, // Friend owes money to user
                category,
                note: `Split: ${note.trim()}`,
                date: currentDate,
                time: currentTime,
                paymentMethod,
                receiptNote: `Split from ${req.user.name}: ${note.trim()}`,
                isShared: true,
                sharedWithUserId: userId,
                approvalStatus: 'ACTIVE',
                linkedTransactionId: tx._id,
                splitGroupId,
                splitDetails: {
                  totalBillAmount: totalAmount,
                  payerName: req.user.name,
                  payerFriendId: null,
                  payerIsUser: false,
                  splitMode,
                  userShare: numShare,
                  participantCount: splits.length + (userShareNum > 0 ? 1 : 0)
                }
              });

              tx.isShared = true;
              tx.sharedWithUserId = otherUserId;
              tx.linkedTransactionId = mirroredTx._id;
              await tx.save();

              await Notification.create({
                userId: otherUserId,
                type: 'TRANSACTION_LOGGED',
                title: '👥 Group Split Recorded',
                message: `${req.user.name} recorded a split share of ₹${numShare} for "${note.trim()}".`,
                data: {
                  friendId: reciprocalFriend._id,
                  connectedUserId: userId,
                  transactionId: mirroredTx._id,
                  friendName: req.user.name,
                  amount: numShare
                }
              });
            }
          }
        }
      } else {
        // A Friend paid the total bill!
        let payerFriend = null;
        if (mongoose.Types.ObjectId.isValid(payerId)) {
          payerFriend = await Friend.findOne({ _id: payerId, userId });
        }
        if (!payerFriend) {
          payerFriend = await Friend.findOne({ userId, $or: [{ id: payerId }, { name: payerId }] });
        }

        if (!payerFriend) {
          return res.status(400).json({ success: false, error: 'Paying friend could not be found.' });
        }

        // The user owes their own share to payerFriend
        if (userShareNum > 0) {
          const tx = await Transaction.create({
            userId,
            friendId: payerFriend._id,
            type: 'RECEIVED',
            amount: userShareNum,
            impactOnUser: -userShareNum, // User owes payerFriend
            category,
            note: `${note.trim()} (Paid by ${payerFriend.name})`,
            date: currentDate,
            time: currentTime,
            paymentMethod,
            receiptNote: receiptNote || `Group split paid by ${payerFriend.name}: ${note.trim()}`,
            splitGroupId,
            splitDetails: {
              totalBillAmount: totalAmount,
              payerName: payerFriend.name,
              payerFriendId: payerFriend._id,
              payerIsUser: false,
              splitMode,
              userShare: userShareNum,
              participantCount: splits.length + 1
            },
            approvalStatus: 'ACTIVE'
          });
          createdList.push(tx);

          // 2-way sync to payer friend if connected
          if (payerFriend.connectedUserId) {
            const otherUserId = payerFriend.connectedUserId;
            let reciprocalFriend = await Friend.findOne({ userId: otherUserId, connectedUserId: userId });
            if (!reciprocalFriend && req.user.username) {
              reciprocalFriend = await Friend.findOne({ userId: otherUserId, pendingUsername: req.user.username.toLowerCase() });
            }

            if (reciprocalFriend) {
              const mirroredTx = await Transaction.create({
                userId: otherUserId,
                friendId: reciprocalFriend._id,
                type: 'SPLIT',
                amount: userShareNum,
                impactOnUser: userShareNum, // Payer is owed money by user
                category,
                note: `Split share from ${req.user.name}: ${note.trim()}`,
                date: currentDate,
                time: currentTime,
                paymentMethod,
                receiptNote: `Split share from ${req.user.name} for ${note.trim()}`,
                isShared: true,
                sharedWithUserId: userId,
                approvalStatus: 'ACTIVE',
                linkedTransactionId: tx._id,
                splitGroupId,
                splitDetails: {
                  totalBillAmount: totalAmount,
                  payerName: payerFriend.name,
                  payerFriendId: null,
                  payerIsUser: true,
                  splitMode,
                  userShare: userShareNum,
                  participantCount: splits.length + 1
                }
              });

              tx.isShared = true;
              tx.sharedWithUserId = otherUserId;
              tx.linkedTransactionId = mirroredTx._id;
              await tx.save();

              await Notification.create({
                userId: otherUserId,
                type: 'TRANSACTION_LOGGED',
                title: '👥 Group Split Share Added',
                message: `${req.user.name} recorded ₹${userShareNum} owed to you for "${note.trim()}".`,
                data: {
                  friendId: reciprocalFriend._id,
                  connectedUserId: userId,
                  transactionId: mirroredTx._id,
                  friendName: req.user.name,
                  amount: userShareNum
                }
              });
            }
          }
        }
      }

      return res.status(201).json({
        success: true,
        message: `Group split bill recorded (${createdList.length} transaction${createdList.length === 1 ? '' : 's'})`,
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

    let friend = null;
    if (mongoose.Types.ObjectId.isValid(friendId)) {
      friend = await Friend.findOne({ _id: friendId, userId });
    }
    if (!friend) {
      friend = await Friend.findOne({ userId, $or: [{ id: friendId }, { name: friendId }] });
    }
    if (!friend) {
      return res.status(404).json({ success: false, error: 'Selected friend was not found.' });
    }

    let impact = 0;
    if (type === 'GIVEN' || type === 'SPLIT') {
      impact = numAmount; // You gave money -> Friend owes you (+)
    } else if (type === 'RECEIVED') {
      impact = -numAmount; // Friend gave you money -> You owe friend (-)
    } else if (type === 'SETTLED') {
      const direction = req.body.settleDirection || 'RECEIVED_FROM_FRIEND';
      impact = direction === 'RECEIVED_FROM_FRIEND' ? -numAmount : numAmount;
    } else {
      impact = numAmount;
    }

    const hasLinkedAccount = Boolean(friend.connectedUserId);
    const isConnected = friend.connectionStatus === 'CONNECTED' && hasLinkedAccount;
    const isAuthorized = friend.permission === 'AUTHORIZED';
    const currentTime = time || new Date().toTimeString().slice(0, 5);
    const currentDate = date || new Date().toISOString().slice(0, 10);

    // 1. Transaction is ALWAYS created and ACTIVE on creator's ledger!
    const tx = await Transaction.create({
      userId,
      friendId: friend._id,
      type: type || 'GIVEN',
      amount: numAmount,
      impactOnUser: impact,
      category: category || 'Food & Dining',
      note: note.trim(),
      date: currentDate,
      time: currentTime,
      paymentMethod: paymentMethod || 'UPI',
      receiptNote: receiptNote || null,
      isShared: Boolean(hasLinkedAccount),
      sharedWithUserId: hasLinkedAccount ? friend.connectedUserId : null,
      approvalStatus: 'ACTIVE'
    });

    // 2. Handle linked MoneyTracker Friend Two-Way Sync
    if (hasLinkedAccount) {
      const otherUserId = friend.connectedUserId;
      let reciprocalFriend = await Friend.findOne({ userId: otherUserId, connectedUserId: userId });
      if (!reciprocalFriend && req.user.username) {
        reciprocalFriend = await Friend.findOne({ userId: otherUserId, pendingUsername: req.user.username.toLowerCase() });
      }

      if (!reciprocalFriend) {
        reciprocalFriend = await Friend.create({
          userId: otherUserId,
          name: req.user.name,
          connectedUserId: userId,
          pendingUsername: req.user.username || null,
          connectionStatus: friend.connectionStatus || 'PENDING_MATCH',
          permission: 'NORMAL',
          avatarColor: '#10b981',
          avatarEmoji: '🤝',
          relationshipTag: 'Friend'
        });
      }

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

        const isAuthorizedSync = (reciprocalFriend?.permission || friend.permission) === 'AUTHORIZED';
        const mirroredStatus = (isConnected && isAuthorizedSync) ? 'ACTIVE' : 'PENDING_APPROVAL';

        const mirroredTx = await Transaction.create({
          userId: otherUserId,
          friendId: reciprocalFriend._id,
          type: reciprocalType,
          amount: numAmount,
          impactOnUser: reciprocalImpact,
          category,
          note: note.trim(),
          date: currentDate,
          time: currentTime,
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
        if (isConnected && isAuthorizedSync) {
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
      message: 'Transaction recorded successfully',
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

    const hasLinkedAccount = Boolean(friend.connectedUserId);
    const isConnected = friend.connectionStatus === 'CONNECTED' && hasLinkedAccount;
    const isAuthorized = friend.permission === 'AUTHORIZED';

    const tx = await Transaction.create({
      userId,
      friendId: friend._id,
      type: 'SETTLED',
      amount: settleAmount,
      impactOnUser: impact,
      category: 'Settlement',
      note: note.trim(),
      date,
      time: new Date().toTimeString().slice(0, 5),
      paymentMethod,
      receiptNote: `Settled via ${paymentMethod}`,
      isShared: Boolean(hasLinkedAccount),
      sharedWithUserId: hasLinkedAccount ? friend.connectedUserId : null,
      approvalStatus: 'ACTIVE'
    });

    if (hasLinkedAccount) {
      const otherUserId = friend.connectedUserId;
      let reciprocalFriend = await Friend.findOne({ userId: otherUserId, connectedUserId: userId });
      if (!reciprocalFriend && req.user.username) {
        reciprocalFriend = await Friend.findOne({ userId: otherUserId, pendingUsername: req.user.username.toLowerCase() });
      }

      if (reciprocalFriend) {
        const isAuthorizedSync = (reciprocalFriend?.permission || friend.permission) === 'AUTHORIZED';
        const mirroredStatus = (isConnected && isAuthorizedSync) ? 'ACTIVE' : 'PENDING_APPROVAL';

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
          approvalStatus: mirroredStatus,
          linkedTransactionId: tx._id
        });

        tx.linkedTransactionId = mirroredTx._id;
        await tx.save();

        if (isConnected && isAuthorizedSync) {
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
        } else {
          await Notification.create({
            userId: otherUserId,
            type: 'SETTLEMENT_REQUEST',
            title: '🤝 Settlement Recorded',
            message: `${req.user.name} recorded a settlement of ₹${settleAmount}. Accept ✅ or Decline ❌?`,
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

// @route   GET /api/transactions/group/:splitGroupId
// @desc    Get full group split details including all participants
exports.getGroupSplitDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { splitGroupId } = req.params;

    const groupTransactions = await Transaction.find({ userId, splitGroupId })
      .populate('friendId', 'id name avatarColor avatarEmoji relationshipTag phone connectionStatus permission currentBalance')
      .lean();

    if (!groupTransactions || groupTransactions.length === 0) {
      return res.status(404).json({ success: false, error: 'Group split bill not found.' });
    }

    const primary = groupTransactions[0];
    const totalBillAmount = primary.splitDetails?.totalBillAmount || 
      (groupTransactions.reduce((acc, t) => acc + t.amount, 0) + (primary.splitDetails?.userShare || 0));
    const payerName = primary.splitDetails?.payerName || (primary.splitDetails?.payerIsUser ? req.user.name : 'Unknown');
    const payerIsUser = primary.splitDetails?.payerIsUser !== false;
    const splitMode = primary.splitDetails?.splitMode || 'EQUAL';
    const userShare = primary.splitDetails?.userShare || 0;

    const participants = groupTransactions.map(t => ({
      transactionId: t._id ? t._id.toString() : t.id,
      friendId: t.friendId ? (t.friendId.id || t.friendId._id.toString()) : null,
      name: t.friendId ? t.friendId.name : 'Friend',
      avatarColor: t.friendId?.avatarColor || '#6366f1',
      avatarEmoji: t.friendId?.avatarEmoji || '👤',
      relationshipTag: t.friendId?.relationshipTag || 'Friend',
      phone: t.friendId?.phone,
      amount: t.amount,
      type: t.type,
      impactOnUser: t.impactOnUser,
      approvalStatus: t.approvalStatus,
      isShared: t.isShared,
      isPayer: false,
      isSelf: false
    }));

    // Add logged-in user to participants list if they had a share or were the payer
    if (userShare > 0 || payerIsUser) {
      participants.unshift({
        transactionId: 'USER_SELF',
        friendId: 'USER_SELF',
        name: `${req.user.name} (You)`,
        avatarColor: '#4f46e5',
        avatarEmoji: '🌟',
        relationshipTag: 'Self',
        amount: userShare,
        type: payerIsUser ? 'PAID' : 'OWING',
        impactOnUser: 0,
        isPayer: payerIsUser,
        isSelf: true
      });
    }

    res.json({
      success: true,
      data: {
        splitGroupId,
        title: primary.note,
        category: primary.category,
        date: primary.date,
        time: primary.time,
        paymentMethod: primary.paymentMethod,
        receiptNote: primary.receiptNote,
        totalBillAmount,
        payerName,
        payerIsUser,
        splitMode,
        userShare,
        participants,
        transactionCount: groupTransactions.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   DELETE /api/transactions/group/:splitGroupId
// @desc    Delete all transactions belonging to a group split
exports.deleteGroupSplit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { splitGroupId } = req.params;

    const transactions = await Transaction.find({ userId, splitGroupId });
    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ success: false, error: 'Group split bill not found or already deleted.' });
    }

    // Delete mirrored linked transactions
    const linkedIds = transactions.map(t => t.linkedTransactionId).filter(Boolean);
    if (linkedIds.length > 0) {
      await Transaction.deleteMany({ _id: { $in: linkedIds } });
    }

    // Delete notifications associated with these transactions
    const txIds = transactions.map(t => t._id);
    await Notification.deleteMany({ 'data.transactionId': { $in: txIds } });

    // Delete the transactions themselves
    const result = await Transaction.deleteMany({ userId, splitGroupId });

    res.json({
      success: true,
      message: `Deleted entire group split (${result.deletedCount} transaction${result.deletedCount === 1 ? '' : 's'}).`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

