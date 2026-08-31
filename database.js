const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'circle_ledger.db');
const db = new sqlite3.Database(DB_PATH);

// Promise helpers for clean async/await
const dbAsync = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  },
  exec(sql) {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
};

async function initDatabase() {
  await dbAsync.run('PRAGMA foreign_keys = ON');

  // 1. Friends table
  await dbAsync.exec(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      avatar_color TEXT DEFAULT '#6366f1',
      avatar_emoji TEXT DEFAULT '👤',
      relationship_tag TEXT DEFAULT 'Friend',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Transactions table
  // impact_on_user:
  // Positive (+) => Friend owes you more (You lent money / Paid their share)
  // Negative (-) => You owe friend more (You borrowed money / They paid your share)
  // When settling up:
  // - If friend was owing you (+500) and pays you 500 => impact is -500 (balance becomes 0)
  // - If you were owing friend (-300) and you pay them 300 => impact is +300 (balance becomes 0)
  await dbAsync.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      friend_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'LENT', 'BORROWED', 'SETTLED', 'SPLIT'
      amount REAL NOT NULL,
      impact_on_user REAL NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      payment_method TEXT DEFAULT 'UPI',
      group_split_id TEXT,
      receipt_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (friend_id) REFERENCES friends(id) ON DELETE CASCADE
    );
  `);

  // 3. Settings table
  await dbAsync.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Default settings
  const existingCurrency = await dbAsync.get('SELECT value FROM settings WHERE key = ?', ['currency']);
  if (!existingCurrency) {
    await dbAsync.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['currency', '₹']);
    await dbAsync.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['user_name', 'My Wallet']);
  }

  // Seed sample demo data if empty
  const countRow = await dbAsync.get('SELECT COUNT(*) as count FROM friends');
  if (!countRow || countRow.count === 0) {
    await seedDemoData();
  }
}

async function seedDemoData() {
  // 1. Rahul Sharma (Friend owes you ₹1,450)
  const rahulRes = await dbAsync.run(`
    INSERT INTO friends (name, phone, email, avatar_color, avatar_emoji, relationship_tag, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, ['Rahul Sharma', '+91 98765 43210', 'rahul.s@example.com', '#3b82f6', '🍕', 'Roommate', 'Flat 402 roommate']);

  const rahulId = rahulRes.lastID;

  await dbAsync.run(`
    INSERT INTO transactions (friend_id, type, amount, impact_on_user, category, description, date, time, payment_method, group_split_id, receipt_note)
    VALUES (?, 'LENT', 1200, 1200, 'Food & Dining', 'Weekend Pizza Party & Drinks (Paid via Swiggy)', '2026-08-22', '20:30', 'UPI', NULL, 'Order #SWIG-8821')
  `, [rahulId]);

  await dbAsync.run(`
    INSERT INTO transactions (friend_id, type, amount, impact_on_user, category, description, date, time, payment_method, group_split_id, receipt_note)
    VALUES (?, 'LENT', 750, 750, 'Rent & Bills', 'WiFi High-speed Fiber Bill share', '2026-08-25', '11:15', 'Google Pay', NULL, 'Airtel Broadband')
  `, [rahulId]);

  await dbAsync.run(`
    INSERT INTO transactions (friend_id, type, amount, impact_on_user, category, description, date, time, payment_method, group_split_id, receipt_note)
    VALUES (?, 'SETTLED', 500, -500, 'Settlement', 'Partial payback via UPI', '2026-08-28', '18:40', 'PhonePe', NULL, 'Trans ID: P260828001')
  `, [rahulId]);

  // 2. Priya Patel (You owe Priya ₹420)
  const priyaRes = await dbAsync.run(`
    INSERT INTO friends (name, phone, email, avatar_color, avatar_emoji, relationship_tag, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, ['Priya Patel', '+91 91234 56789', 'priya.p@example.com', '#ec4899', '☕', 'Colleague', 'Design team lead']);

  const priyaId = priyaRes.lastID;

  await dbAsync.run(`
    INSERT INTO transactions (friend_id, type, amount, impact_on_user, category, description, date, time, payment_method, group_split_id, receipt_note)
    VALUES (?, 'BORROWED', 620, -620, 'Food & Dining', 'Team Lunch at Blue Tokai Cafe (Priya paid for all)', '2026-08-24', '13:45', 'Card', NULL, 'Flat White + Bagel')
  `, [priyaId]);

  await dbAsync.run(`
    INSERT INTO transactions (friend_id, type, amount, impact_on_user, category, description, date, time, payment_method, group_split_id, receipt_note)
    VALUES (?, 'SETTLED', 200, 200, 'Settlement', 'Paid cash for morning coffee', '2026-08-27', '09:30', 'Cash', NULL, 'Cash handoff')
  `, [priyaId]);

  // 3. Amit Verma (Friend owes you ₹3,500)
  const amitRes = await dbAsync.run(`
    INSERT INTO friends (name, phone, email, avatar_color, avatar_emoji, relationship_tag, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, ['Amit Verma', '+91 99887 76655', 'amit.v@example.com', '#10b981', '🚗', 'College Friend', 'Goa road trip buddy']);

  const amitId = amitRes.lastID;

  await dbAsync.run(`
    INSERT INTO transactions (friend_id, type, amount, impact_on_user, category, description, date, time, payment_method, group_split_id, receipt_note)
    VALUES (?, 'SPLIT', 2500, 2500, 'Travel & Trips', 'Goa Resort Stay 2-Nights Booking Share', '2026-08-15', '16:00', 'Credit Card', 'TRIP-GOA-2026', 'Booking Ref #GOA-901')
  `, [amitId]);

  await dbAsync.run(`
    INSERT INTO transactions (friend_id, type, amount, impact_on_user, category, description, date, time, payment_method, group_split_id, receipt_note)
    VALUES (?, 'LENT', 1000, 1000, 'Loans & Cash', 'Emergency fuel & highway toll cash', '2026-08-17', '22:10', 'Cash', NULL, 'Highway Fastag recharge')
  `, [amitId]);

  // 4. Sneha Roy (All Settled ₹0)
  const snehaRes = await dbAsync.run(`
    INSERT INTO friends (name, phone, email, avatar_color, avatar_emoji, relationship_tag, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, ['Sneha Roy', '+91 97654 32109', 'sneha.r@example.com', '#8b5cf6', '🎬', 'Friend', 'Movie & weekend group']);

  const snehaId = snehaRes.lastID;

  await dbAsync.run(`
    INSERT INTO transactions (friend_id, type, amount, impact_on_user, category, description, date, time, payment_method, group_split_id, receipt_note)
    VALUES (?, 'LENT', 850, 850, 'Entertainment', 'IMAX Cinema Tickets (Inception 2)', '2026-08-10', '19:00', 'BookMyShow', NULL, '2 Tickets recliner')
  `, [snehaId]);

  await dbAsync.run(`
    INSERT INTO transactions (friend_id, type, amount, impact_on_user, category, description, date, time, payment_method, group_split_id, receipt_note)
    VALUES (?, 'SETTLED', 850, -850, 'Settlement', 'Full payback via GPay', '2026-08-11', '10:05', 'Google Pay', NULL, 'Ref #UPI-449102')
  `, [snehaId]);
}

// Balance and Ledger Helpers
async function getAllFriendsWithBalances() {
  const friends = await dbAsync.all(`
    SELECT 
      f.*,
      COALESCE(SUM(t.impact_on_user), 0) AS current_balance,
      COALESCE(SUM(CASE WHEN t.impact_on_user > 0 AND t.type != 'SETTLED' THEN t.amount ELSE 0 END), 0) AS total_lent,
      COALESCE(SUM(CASE WHEN t.impact_on_user < 0 AND t.type != 'SETTLED' THEN t.amount ELSE 0 END), 0) AS total_borrowed,
      COUNT(t.id) AS transaction_count,
      MAX(t.date) AS last_activity_date
    FROM friends f
    LEFT JOIN transactions t ON f.id = t.friend_id
    GROUP BY f.id
    ORDER BY 
      CASE 
        WHEN COALESCE(SUM(t.impact_on_user), 0) != 0 THEN 0 
        ELSE 1 
      END,
      ABS(COALESCE(SUM(t.impact_on_user), 0)) DESC,
      f.name ASC
  `);

  return friends.map(f => ({
    ...f,
    current_balance: Number(Number(f.current_balance || 0).toFixed(2)),
    status: f.current_balance > 0 ? 'OWES_YOU' : f.current_balance < 0 ? 'YOU_OWE' : 'SETTLED'
  }));
}

async function getFriendLedger(friendId) {
  const friend = await dbAsync.get('SELECT * FROM friends WHERE id = ?', [friendId]);
  if (!friend) return null;

  const rawTx = await dbAsync.all(`
    SELECT * FROM transactions
    WHERE friend_id = ?
    ORDER BY date ASC, id ASC
  `, [friendId]);

  let runningBalance = 0;
  const ledger = rawTx.map(tx => {
    runningBalance += Number(tx.impact_on_user || 0);
    return {
      ...tx,
      running_balance: Number(runningBalance.toFixed(2))
    };
  });

  const sortedDesc = [...ledger].reverse();

  return {
    friend,
    current_balance: Number(runningBalance.toFixed(2)),
    status: runningBalance > 0 ? 'OWES_YOU' : runningBalance < 0 ? 'YOU_OWE' : 'SETTLED',
    transactions: sortedDesc
  };
}

async function getCircleSummary() {
  const friends = await getAllFriendsWithBalances();
  let totalReceivable = 0;
  let totalPayable = 0;
  let activeDuesCount = 0;
  let settledCount = 0;

  for (const f of friends) {
    if (f.current_balance > 0) {
      totalReceivable += f.current_balance;
      activeDuesCount++;
    } else if (f.current_balance < 0) {
      totalPayable += Math.abs(f.current_balance);
      activeDuesCount++;
    } else {
      settledCount++;
    }
  }

  const netBalance = totalReceivable - totalPayable;
  const currencySetting = await dbAsync.get("SELECT value FROM settings WHERE key = 'currency'");
  const currency = currencySetting ? currencySetting.value : '₹';

  return {
    total_receivable: Number(totalReceivable.toFixed(2)),
    total_payable: Number(totalPayable.toFixed(2)),
    net_balance: Number(netBalance.toFixed(2)),
    friends_count: friends.length,
    active_dues_count: activeDuesCount,
    settled_count: settledCount,
    currency
  };
}

async function getAnalytics() {
  const categories = await dbAsync.all(`
    SELECT 
      category,
      SUM(CASE WHEN impact_on_user > 0 AND type != 'SETTLED' THEN amount ELSE 0 END) AS lent_amount,
      SUM(CASE WHEN impact_on_user < 0 AND type != 'SETTLED' THEN amount ELSE 0 END) AS borrowed_amount,
      COUNT(*) as count
    FROM transactions
    WHERE type != 'SETTLED'
    GROUP BY category
    ORDER BY (lent_amount + borrowed_amount) DESC
  `);

  const monthly = await dbAsync.all(`
    SELECT 
      substr(date, 1, 7) AS month,
      SUM(CASE WHEN impact_on_user > 0 AND type != 'SETTLED' THEN amount ELSE 0 END) AS total_lent,
      SUM(CASE WHEN impact_on_user < 0 AND type != 'SETTLED' THEN amount ELSE 0 END) AS total_borrowed,
      SUM(CASE WHEN type = 'SETTLED' THEN amount ELSE 0 END) AS total_settled
    FROM transactions
    GROUP BY substr(date, 1, 7)
    ORDER BY month DESC
    LIMIT 6
  `);

  return {
    categories,
    monthly: monthly.reverse()
  };
}

module.exports = {
  db,
  dbAsync,
  initDatabase,
  seedDemoData,
  getAllFriendsWithBalances,
  getFriendLedger,
  getCircleSummary,
  getAnalytics
};
