const prisma = require('../db');

// @route   GET /api/dashboard/summary
// @desc    Get dashboard metrics & summary
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const friends = await prisma.friend.findMany({
      where: { userId },
      include: {
        transactions: {
          select: {
            amount: true,
            impactOnUser: true,
            type: true
          }
        }
      }
    });

    let totalGiven = 0;      // Total amount user lent/paid
    let totalReceived = 0;   // Total amount user borrowed/received
    let totalReceivable = 0; // Total currently owed to user (Positive balances)
    let totalPayable = 0;    // Total currently owed by user (Negative balances)
    let activeDuesCount = 0;
    let settledCount = 0;

    for (const f of friends) {
      let friendBal = 0;
      for (const t of f.transactions) {
        friendBal += t.impactOnUser;
        if (t.impactOnUser > 0 && t.type !== 'SETTLED') {
          totalGiven += t.amount;
        } else if (t.impactOnUser < 0 && t.type !== 'SETTLED') {
          totalReceived += t.amount;
        }
      }

      friendBal = Number(friendBal.toFixed(2));
      if (friendBal > 0) {
        totalReceivable += friendBal;
        activeDuesCount++;
      } else if (friendBal < 0) {
        totalPayable += Math.abs(friendBal);
        activeDuesCount++;
      } else {
        settledCount++;
      }
    }

    const netBalance = totalReceivable - totalPayable;

    // Recent 5 transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        friend: {
          select: { id: true, name: true, avatarColor: true, avatarEmoji: true }
        }
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5
    });

    res.json({
      success: true,
      data: {
        totalGiven: Number(totalGiven.toFixed(2)),
        totalReceived: Number(totalReceived.toFixed(2)),
        totalReceivable: Number(totalReceivable.toFixed(2)), // Pending to get
        totalPayable: Number(totalPayable.toFixed(2)),       // Pending to pay
        netBalance: Number(netBalance.toFixed(2)),
        friendsCount: friends.length,
        activeDuesCount,
        settledCount,
        currency: req.user.currency || '₹',
        recentTransactions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   GET /api/dashboard/analytics
// @desc    Get category distribution and monthly trends
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const allTx = await prisma.transaction.findMany({
      where: { userId },
      select: {
        amount: true,
        impactOnUser: true,
        type: true,
        category: true,
        date: true
      }
    });

    // 1. Group by category (exclude pure settlement)
    const categoryMap = {};
    for (const t of allTx) {
      if (t.type === 'SETTLED') continue;
      const cat = t.category || 'Other';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, given: 0, received: 0, total: 0, count: 0 };
      }
      if (t.impactOnUser > 0) {
        categoryMap[cat].given += t.amount;
      } else {
        categoryMap[cat].received += t.amount;
      }
      categoryMap[cat].total += t.amount;
      categoryMap[cat].count++;
    }

    const categories = Object.values(categoryMap).sort((a, b) => b.total - a.total);

    // 2. Group by month (YYYY-MM)
    const monthMap = {};
    for (const t of allTx) {
      const month = t.date.slice(0, 7); // '2026-08'
      if (!monthMap[month]) {
        monthMap[month] = { month, given: 0, received: 0, settled: 0 };
      }
      if (t.type === 'SETTLED') {
        monthMap[month].settled += t.amount;
      } else if (t.impactOnUser > 0) {
        monthMap[month].given += t.amount;
      } else {
        monthMap[month].received += t.amount;
      }
    }

    const monthly = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

    res.json({
      success: true,
      data: {
        categories,
        monthly
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
