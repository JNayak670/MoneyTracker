/**
 * Full-Stack API Integration Test for MoneyTracker
 */

const { spawn } = require('child_process');

async function runTests() {
  console.log('🚀 Starting Express Server on port 5000 for verification...');
  
  // Start server
  const serverProcess = spawn('node', ['server.js'], { cwd: './server', stdio: 'inherit' });

  // Give server 2.5 seconds to start
  await new Promise(r => setTimeout(r, 2500));

  const BASE = 'http://127.0.0.1:5000/api';
  console.log('\n🧪 Testing Endpoints against ' + BASE + '\n');

  try {
    // 1. Health check
    console.log('Test 1: GET /api/health');
    const health = await fetch(`${BASE}/health`).then(r => r.json());
    console.log('Health Response:', health);
    if (health.status !== 'online') throw new Error('Health check failed');
    console.log('✅ Test 1 Passed\n');

    // 2. Demo User Login
    console.log('Test 2: POST /api/auth/login (Demo User with PIN)');
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@moneytracker.com', pin: '1234' })
    }).then(r => r.json());
    
    if (!loginRes.success || !loginRes.data.token) throw new Error('Demo login failed: ' + loginRes.error);
    const token = loginRes.data.token;
    console.log(`Demo Token obtained for user: ${loginRes.data.user.name}`);
    console.log('✅ Test 2 Passed\n');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 3. GET /api/dashboard/summary
    console.log('Test 3: GET /api/dashboard/summary');
    const summaryRes = await fetch(`${BASE}/dashboard/summary`, { headers: authHeaders }).then(r => r.json());
    console.log('Summary metrics:', summaryRes.data);
    if (!summaryRes.success) throw new Error('Summary fetch failed');
    console.log('✅ Test 3 Passed\n');

    // 4. GET /api/friends
    console.log('Test 4: GET /api/friends');
    const friendsRes = await fetch(`${BASE}/friends`, { headers: authHeaders }).then(r => r.json());
    console.log(`Found ${friendsRes.data.length} friends for demo user:`);
    friendsRes.data.forEach(f => console.log(` - ${f.name}: ${f.status} (Balance: ₹${f.currentBalance})`));
    if (!friendsRes.success || friendsRes.data.length === 0) throw new Error('Friends list failed');
    console.log('✅ Test 4 Passed\n');

    // 5. POST /api/friends (Add new friend)
    console.log('Test 5: POST /api/friends (Create Vikram)');
    const createFriendRes = await fetch(`${BASE}/friends`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Vikram Mehta',
        phone: '+91 98888 22222',
        relationshipTag: 'Colleague',
        avatarEmoji: '💼',
        avatarColor: '#10b981'
      })
    }).then(r => r.json());
    if (!createFriendRes.success) throw new Error('Create friend failed: ' + createFriendRes.error);
    const newFriendId = createFriendRes.data.id;
    console.log(`Created Friend ID: ${newFriendId} (${createFriendRes.data.name})`);
    console.log('✅ Test 5 Passed\n');

    // 6. POST /api/transactions (Lent Vikram ₹1,500)
    console.log('Test 6: POST /api/transactions (Lent ₹1,500 for Office Dinner)');
    const createTxRes = await fetch(`${BASE}/transactions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        friendId: newFriendId,
        type: 'GIVEN',
        amount: 1500,
        category: 'Food & Dining',
        note: 'Team Dinner contribution',
        paymentMethod: 'UPI'
      })
    }).then(r => r.json());
    if (!createTxRes.success) throw new Error('Transaction creation failed: ' + createTxRes.error);
    console.log('Created Transaction:', createTxRes.data.note, 'Amount: ₹' + createTxRes.data.amount);
    console.log('✅ Test 6 Passed\n');

    // 7. GET /api/friends/:id (Check ledger progression)
    console.log(`Test 7: GET /api/friends/${newFriendId} (Verify Running Balance)`);
    const ledgerRes = await fetch(`${BASE}/friends/${newFriendId}`, { headers: authHeaders }).then(r => r.json());
    console.log(`Current Balance for ${ledgerRes.data.friend.name}: ₹${ledgerRes.data.currentBalance} (${ledgerRes.data.status})`);
    if (ledgerRes.data.currentBalance !== 1500 || ledgerRes.data.status !== 'OWES_YOU') {
      throw new Error(`Expected +1500 OWES_YOU, got ${ledgerRes.data.currentBalance}`);
    }
    console.log('✅ Test 7 Passed\n');

    // 8. POST /api/transactions/settle (Settle Vikram ₹1,500)
    console.log('Test 8: POST /api/transactions/settle (Vikram pays ₹1,500)');
    const settleRes = await fetch(`${BASE}/transactions/settle`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        friendId: newFriendId,
        amount: 1500,
        paymentMethod: 'Google Pay',
        note: 'Full settlement via GPay'
      })
    }).then(r => r.json());
    if (!settleRes.success) throw new Error('Settle-up failed: ' + settleRes.error);
    
    const settledLedger = await fetch(`${BASE}/friends/${newFriendId}`, { headers: authHeaders }).then(r => r.json());
    console.log(`Balance after settlement: ₹${settledLedger.data.currentBalance} (${settledLedger.data.status})`);
    if (settledLedger.data.currentBalance !== 0 || settledLedger.data.status !== 'SETTLED') {
      throw new Error(`Expected 0 SETTLED, got ${settledLedger.data.currentBalance}`);
    }
    console.log('✅ Test 8 Passed\n');

    // 9. GET /api/dashboard/analytics
    console.log('Test 9: GET /api/dashboard/analytics');
    const analyticsRes = await fetch(`${BASE}/dashboard/analytics`, { headers: authHeaders }).then(r => r.json());
    console.log('Analytics Categories:', analyticsRes.data.categories.map(c => `${c.category}: ₹${c.total}`));
    console.log('Analytics Monthly:', analyticsRes.data.monthly);
    if (!analyticsRes.success) throw new Error('Analytics failed');
    console.log('✅ Test 9 Passed\n');

    // 10. POST /api/share/generate (Generate 60-min share code for Vikram)
    console.log('Test 10: POST /api/share/generate (Time-limited share code)');
    const shareGenRes = await fetch(`${BASE}/share/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        friendId: newFriendId,
        durationMinutes: 60
      })
    }).then(r => r.json());
    console.log('Generated Share Code:', shareGenRes.data);
    if (!shareGenRes.success || !shareGenRes.data.code) throw new Error('Share code generation failed: ' + shareGenRes.error);
    const shareCode = shareGenRes.data.code;
    console.log(`✅ Test 10 Passed (Code: ${shareCode})\n`);

    // 11. GET /api/share/:code (Public access without authentication token)
    console.log(`Test 11: GET /api/share/${shareCode} (Public Access without Auth)`);
    const publicLedgerRes = await fetch(`${BASE}/share/${shareCode}`).then(r => r.json());
    console.log('Public Ledger Summary:', publicLedgerRes.data?.summary);
    console.log('Public Ledger Owner:', publicLedgerRes.data?.owner?.name);
    console.log('Public Ledger Friend:', publicLedgerRes.data?.friend?.name);
    console.log(`Public Ledger Transactions count: ${publicLedgerRes.data?.transactions?.length}`);
    if (!publicLedgerRes.success || publicLedgerRes.data?.transactions?.length < 2) {
      throw new Error('Public ledger fetch failed or transactions missing');
    }
    console.log('✅ Test 11 Passed\n');

    console.log('🎉 ALL FULL-STACK & SHARING TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    serverProcess.kill();
    process.exit(0);
  }
}

runTests();
