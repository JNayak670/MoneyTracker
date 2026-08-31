const express = require('express');
const cors = require('cors');
const path = require('path');
const {
  dbAsync,
  initDatabase,
  seedDemoData,
  getAllFriendsWithBalances,
  getFriendLedger,
  getCircleSummary,
  getAnalytics
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize DB schema & seeds
initDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Circle Summary
app.get('/api/summary', async (req, res) => {
  try {
    const summary = await getCircleSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Friends
app.get('/api/friends', async (req, res) => {
  try {
    const friends = await getAllFriendsWithBalances();
    res.json({ success: true, data: friends });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/friends/:id', async (req, res) => {
  try {
    const ledgerData = await getFriendLedger(Number(req.params.id));
    if (!ledgerData) {
      return res.status(404).json({ success: false, error: 'Friend not found' });
    }
    res.json({ success: true, data: ledgerData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/friends', async (req, res) => {
  try {
    const { name, phone, email, avatar_color, avatar_emoji, relationship_tag, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Friend name is required' });
    }

    const result = await dbAsync.run(`
      INSERT INTO friends (name, phone, email, avatar_color, avatar_emoji, relationship_tag, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      phone ? phone.trim() : '',
      email ? email.trim() : '',
      avatar_color || '#6366f1',
      avatar_emoji || '👤',
      relationship_tag || 'Friend',
      notes ? notes.trim() : ''
    ]);

    const newFriend = await dbAsync.get('SELECT * FROM friends WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, data: newFriend });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/friends/:id', async (req, res) => {
  try {
    const { name, phone, email, avatar_color, avatar_emoji, relationship_tag, notes } = req.body;
    const friendId = Number(req.params.id);

    const existing = await dbAsync.get('SELECT * FROM friends WHERE id = ?', [friendId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Friend not found' });
    }

    await dbAsync.run(`
      UPDATE friends 
      SET name = ?, phone = ?, email = ?, avatar_color = ?, avatar_emoji = ?, relationship_tag = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name ? name.trim() : existing.name,
      phone !== undefined ? phone.trim() : existing.phone,
      email !== undefined ? email.trim() : existing.email,
      avatar_color || existing.avatar_color,
      avatar_emoji || existing.avatar_emoji,
      relationship_tag || existing.relationship_tag,
      notes !== undefined ? notes.trim() : existing.notes,
      friendId
    ]);

    const updated = await dbAsync.get('SELECT * FROM friends WHERE id = ?', [friendId]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/friends/:id', async (req, res) => {
  try {
    const friendId = Number(req.params.id);
    const existing = await dbAsync.get('SELECT * FROM friends WHERE id = ?', [friendId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Friend not found' });
    }

    await dbAsync.run('DELETE FROM transactions WHERE friend_id = ?', [friendId]);
    await dbAsync.run('DELETE FROM friends WHERE id = ?', [friendId]);
    res.json({ success: true, message: 'Friend and associated records deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const { friend_id, type, category, search, start_date, end_date, limit = 100 } = req.query;

    let query = `
      SELECT t.*, f.name AS friend_name, f.avatar_color, f.avatar_emoji, f.relationship_tag
      FROM transactions t
      JOIN friends f ON t.friend_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (friend_id) {
      query += ' AND t.friend_id = ?';
      params.push(Number(friend_id));
    }
    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }
    if (category) {
      query += ' AND t.category = ?';
      params.push(category);
    }
    if (start_date) {
      query += ' AND t.date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND t.date <= ?';
      params.push(end_date);
    }
    if (search) {
      query += ' AND (t.description LIKE ? OR f.name LIKE ? OR t.receipt_note LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY t.date DESC, t.id DESC LIMIT ?';
    params.push(Number(limit));

    const transactions = await dbAsync.all(query, params);
    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const {
      is_group_split,
      friend_id,
      type, // 'LENT', 'BORROWED', 'SETTLED', 'SPLIT'
      amount,
      category = 'General',
      description,
      date,
      time = new Date().toTimeString().slice(0, 5),
      payment_method = 'UPI',
      receipt_note,
      splits // array of { friend_id, share_amount, paid_by_user }
    } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Description is required' });
    }
    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required' });
    }

    // Handle Group Split Bill
    if (is_group_split && Array.isArray(splits) && splits.length > 0) {
      const splitId = 'SPLIT-' + Date.now();
      for (const item of splits) {
        const numAmount = Math.abs(Number(item.share_amount));
        if (numAmount > 0) {
          const impact = item.paid_by_user === false ? -numAmount : numAmount;
          const txType = item.paid_by_user === false ? 'BORROWED' : 'SPLIT';
          await dbAsync.run(`
            INSERT INTO transactions (friend_id, type, amount, impact_on_user, category, description, date, time, payment_method, group_split_id, receipt_note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            Number(item.friend_id),
            txType,
            numAmount,
            impact,
            category,
            description.trim(),
            date,
            time,
            payment_method,
            splitId,
            receipt_note || `Group split: ${description}`
          ]);
        }
      }

      return res.status(201).json({ success: true, message: `Split recorded across ${splits.length} friends`, split_id: splitId });
    }

    // Handle Single Transaction
    const numAmount = Math.abs(Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid positive amount is required' });
    }
    if (!friend_id) {
      return res.status(400).json({ success: false, error: 'Friend must be selected' });
    }

    let impact = 0;
    if (type === 'LENT' || type === 'SPLIT') {
      impact = numAmount; // Friend owes user (+)
    } else if (type === 'BORROWED') {
      impact = -numAmount; // User owes friend (-)
    } else if (type === 'SETTLED') {
      const direction = req.body.settle_direction;
      if (direction === 'RECEIVED_FROM_FRIEND') {
        impact = -numAmount;
      } else {
        impact = numAmount;
      }
    }

    const result = await dbAsync.run(`
      INSERT INTO transactions (friend_id, type, amount, impact_on_user, category, description, date, time, payment_method, group_split_id, receipt_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      Number(friend_id),
      type || 'LENT',
      numAmount,
      impact,
      category,
      description.trim(),
      date,
      time,
      payment_method,
      null,
      receipt_note ? receipt_note.trim() : null
    ]);

    const newTx = await dbAsync.get('SELECT * FROM transactions WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, data: newTx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const txId = Number(req.params.id);
    const existing = await dbAsync.get('SELECT * FROM transactions WHERE id = ?', [txId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    const { amount, type, category, description, date, time, payment_method, receipt_note, friend_id } = req.body;
    const numAmount = amount !== undefined ? Math.abs(Number(amount)) : existing.amount;
    const txType = type || existing.type;
    const txFriendId = friend_id ? Number(friend_id) : existing.friend_id;

    let impact = 0;
    if (txType === 'LENT' || txType === 'SPLIT') {
      impact = numAmount;
    } else if (txType === 'BORROWED') {
      impact = -numAmount;
    } else if (txType === 'SETTLED') {
      const direction = req.body.settle_direction || (existing.impact_on_user < 0 ? 'RECEIVED_FROM_FRIEND' : 'PAID_TO_FRIEND');
      impact = direction === 'RECEIVED_FROM_FRIEND' ? -numAmount : numAmount;
    }

    await dbAsync.run(`
      UPDATE transactions 
      SET friend_id = ?, type = ?, amount = ?, impact_on_user = ?, category = ?, description = ?, date = ?, time = ?, payment_method = ?, receipt_note = ?
      WHERE id = ?
    `, [
      txFriendId,
      txType,
      numAmount,
      impact,
      category || existing.category,
      description !== undefined ? description.trim() : existing.description,
      date || existing.date,
      time || existing.time,
      payment_method || existing.payment_method,
      receipt_note !== undefined ? receipt_note : existing.receipt_note,
      txId
    ]);

    const updated = await dbAsync.get('SELECT * FROM transactions WHERE id = ?', [txId]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const txId = Number(req.params.id);
    const existing = await dbAsync.get('SELECT * FROM transactions WHERE id = ?', [txId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    await dbAsync.run('DELETE FROM transactions WHERE id = ?', [txId]);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Quick Settle Up
app.post('/api/settle', async (req, res) => {
  try {
    const { friend_id, amount, payment_method = 'UPI', note, date = new Date().toISOString().slice(0, 10) } = req.body;
    const friendId = Number(friend_id);
    const ledger = await getFriendLedger(friendId);

    if (!ledger) {
      return res.status(404).json({ success: false, error: 'Friend not found' });
    }

    const currentBal = ledger.current_balance;
    if (currentBal === 0) {
      return res.status(400).json({ success: false, error: 'Balance is already fully settled (₹0)' });
    }

    const settleAmount = amount ? Math.abs(Number(amount)) : Math.abs(currentBal);
    if (isNaN(settleAmount) || settleAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid settlement amount' });
    }

    // If friend owed user (currentBal > 0): Friend pays User -> impact is -settleAmount
    // If user owed friend (currentBal < 0): User pays Friend -> impact is +settleAmount
    const impact = currentBal > 0 ? -settleAmount : settleAmount;
    const desc = note ? note.trim() : (currentBal > 0 ? `Received payment from ${ledger.friend.name}` : `Paid dues to ${ledger.friend.name}`);

    await dbAsync.run(`
      INSERT INTO transactions (friend_id, type, amount, impact_on_user, category, description, date, time, payment_method, group_split_id, receipt_note)
      VALUES (?, 'SETTLED', ?, ?, 'Settlement', ?, ?, ?, ?, NULL, ?)
    `, [
      friendId,
      settleAmount,
      impact,
      desc,
      date,
      new Date().toTimeString().slice(0, 5),
      payment_method,
      `Settled balance via ${payment_method}`
    ]);

    const updatedLedger = await getFriendLedger(friendId);
    res.status(201).json({
      success: true,
      message: 'Settlement recorded successfully',
      data: updatedLedger
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const analytics = await getAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Settings
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await dbAsync.all('SELECT * FROM settings');
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { currency, user_name } = req.body;
    if (currency) {
      await dbAsync.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['currency', currency]);
    }
    if (user_name) {
      await dbAsync.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['user_name', user_name]);
    }

    res.json({ success: true, message: 'Settings saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Database Administration (Reset Demo / Clear / Export / Import)
app.post('/api/reset-demo', async (req, res) => {
  try {
    await dbAsync.run('DELETE FROM transactions');
    await dbAsync.run('DELETE FROM friends');
    await seedDemoData();
    res.json({ success: true, message: 'Demo data reloaded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/clear-all', async (req, res) => {
  try {
    await dbAsync.run('DELETE FROM transactions');
    await dbAsync.run('DELETE FROM friends');
    res.json({ success: true, message: 'All circle data cleared' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/backup', async (req, res) => {
  try {
    const friends = await dbAsync.all('SELECT * FROM friends');
    const transactions = await dbAsync.all('SELECT * FROM transactions');
    const settings = await dbAsync.all('SELECT * FROM settings');

    res.json({
      success: true,
      backup_date: new Date().toISOString(),
      app: 'CircleLedger',
      data: { friends, transactions, settings }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/restore', async (req, res) => {
  try {
    const { friends, transactions, settings } = req.body.data || req.body;
    if (!Array.isArray(friends) || !Array.isArray(transactions)) {
      return res.status(400).json({ success: false, error: 'Invalid backup format' });
    }

    await dbAsync.run('DELETE FROM transactions');
    await dbAsync.run('DELETE FROM friends');
    await dbAsync.run('DELETE FROM settings');

    for (const f of friends) {
      await dbAsync.run(`
        INSERT INTO friends (id, name, phone, email, avatar_color, avatar_emoji, relationship_tag, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [f.id, f.name, f.phone, f.email, f.avatar_color, f.avatar_emoji, f.relationship_tag, f.notes, f.created_at, f.updated_at]);
    }

    for (const t of transactions) {
      await dbAsync.run(`
        INSERT INTO transactions (id, friend_id, type, amount, impact_on_user, category, description, date, time, payment_method, group_split_id, receipt_note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [t.id, t.friend_id, t.type, t.amount, t.impact_on_user, t.category, t.description, t.date, t.time, t.payment_method, t.group_split_id, t.receipt_note, t.created_at]);
    }

    if (Array.isArray(settings)) {
      for (const s of settings) {
        await dbAsync.run('INSERT INTO settings (key, value) VALUES (?, ?)', [s.key, s.value]);
      }
    }

    res.json({ success: true, message: 'Database successfully restored from backup' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Express Server with auto port fallback
function startServer(portToUse) {
  const server = app.listen(portToUse, () => {
    console.log(`=======================================================`);
    console.log(` 🚀 CircleLedger Server running at http://localhost:${portToUse}`);
    console.log(` 💾 SQLite Database active at circle_ledger.db`);
    console.log(`=======================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(portToUse) + 1;
      console.log(`⚠️ Port ${portToUse} is in use. Falling back to port ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
