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

    // 5b. PUT /api/friends/:id (Update Friend Details without duplicate)
    console.log('Test 5b: PUT /api/friends/:id (Update Vikram Details)');
    const updateFriendRes = await fetch(`${BASE}/friends/${newFriendId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Vikram Mehta (Senior)',
        relationshipTag: 'Trip Buddy',
        notes: 'Updated notes from test'
      })
    }).then(r => r.json());
    if (!updateFriendRes.success || updateFriendRes.data.name !== 'Vikram Mehta (Senior)') {
      throw new Error('Update friend failed: ' + JSON.stringify(updateFriendRes));
    }
    console.log(`Updated Friend Name: ${updateFriendRes.data.name}, Tag: ${updateFriendRes.data.relationshipTag}`);
    console.log('✅ Test 5b Passed\n');

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

    // 12. PUT /api/auth/change-pin (Change PIN from 1234 to 5678 and back)
    console.log('Test 12: PUT /api/auth/change-pin (Security PIN update)');
    const pinChangeRes = await fetch(`${BASE}/auth/change-pin`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        currentPin: '1234',
        newPin: '5678'
      })
    }).then(r => r.json());
    console.log('PIN Change Response:', pinChangeRes);
    if (!pinChangeRes.success) throw new Error('PIN change failed: ' + pinChangeRes.error);

    // Verify login with new PIN 5678
    const loginWithNewPin = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@moneytracker.com', pin: '5678' })
    }).then(r => r.json());
    if (!loginWithNewPin.success) throw new Error('Login with new PIN 5678 failed');

    // Revert PIN back to demo 1234
    await fetch(`${BASE}/auth/change-pin`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${loginWithNewPin.data.token}` },
      body: JSON.stringify({ currentPin: '5678', newPin: '1234' })
    });
    console.log('✅ Test 12 Passed (PIN Changed, Verified, Reverted to 1234)\n');

    // 13. POST /api/admin/login (Admin Gateway Authentication)
    console.log('Test 13: POST /api/admin/login (Admin Gmail & Passkey)');
    const adminLoginRes = await fetch(`${BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        passkey: 'admin1234'
      })
    }).then(r => r.json());
    console.log('Admin Login Response:', adminLoginRes);
    if (!adminLoginRes.success || !adminLoginRes.data.token) throw new Error('Admin login failed: ' + adminLoginRes.error);
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    };
    console.log('✅ Test 13 Passed\n');

    // 14. GET /api/admin/stats (Protected Admin Endpoint)
    console.log('Test 14: GET /api/admin/stats (Protected)');
    const adminStatsRes = await fetch(`${BASE}/admin/stats`, { headers: adminHeaders }).then(r => r.json());
    console.log('Admin Stats:', adminStatsRes.data);
    if (!adminStatsRes.success || adminStatsRes.data.totalUsers < 1) throw new Error('Admin stats failed');
    console.log('✅ Test 14 Passed\n');

    // 15. GET /api/admin/users
    console.log('Test 15: GET /api/admin/users');
    const adminUsersRes = await fetch(`${BASE}/admin/users`, { headers: adminHeaders }).then(r => r.json());
    console.log(`Admin Users Count: ${adminUsersRes.data?.length}`);
    if (!adminUsersRes.success || adminUsersRes.data?.length < 1) throw new Error('Admin users fetch failed');
    console.log('✅ Test 15 Passed\n');

    // 16. GET /api/admin/transactions
    console.log('Test 16: GET /api/admin/transactions');
    const adminTxRes = await fetch(`${BASE}/admin/transactions`, { headers: adminHeaders }).then(r => r.json());
    console.log(`Admin Transactions Count: ${adminTxRes.data?.length}`);
    if (!adminTxRes.success || adminTxRes.data?.length < 1) throw new Error('Admin transactions fetch failed');
    console.log('✅ Test 16 Passed\n');

    // 17. GET /api/admin/shares
    console.log('Test 17: GET /api/admin/shares');
    const adminSharesRes = await fetch(`${BASE}/admin/shares`, { headers: adminHeaders }).then(r => r.json());
    console.log(`Admin Shares Count: ${adminSharesRes.data?.length}`);
    if (!adminSharesRes.success || adminSharesRes.data?.length < 1) throw new Error('Admin shares fetch failed');
    console.log('✅ Test 17 Passed\n');

    // 18. Test 5-Attempt Account Lockout
    console.log('Test 18: Account Lockout after 5 Failed Attempts');
    // Register a temporary test user
    const lockUserEmail = `locktest_${Date.now()}@moneytracker.com`;
    const regLockUser = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Lock Test User', email: lockUserEmail, pin: '9999' })
    }).then(r => r.json());
    const lockUserId = regLockUser.data.user.id;

    // Fail 5 times intentionally with wrong PIN '0000'
    for (let i = 1; i <= 5; i++) {
      const failRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lockUserEmail, pin: '0000' })
      }).then(r => r.json());
      console.log(`Failed Attempt ${i}:`, failRes.error);
      if (i === 5 && !failRes.isLocked) throw new Error('Expected account to be locked on 5th attempt');
    }

    // Try correct PIN '9999' while locked -> should still be rejected
    const blockedRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lockUserEmail, pin: '9999' })
    }).then(r => r.json());
    console.log('Blocked Login attempt with correct PIN:', blockedRes);
    if (!blockedRes.isLocked) throw new Error('Locked account should reject login even with correct PIN');
    console.log('✅ Test 18 Passed (5-Attempt Lockout Verified)\n');

    // 19. Admin Unlock User (PUT /api/admin/users/:id/unlock)
    console.log('Test 19: PUT /api/admin/users/:id/unlock (Admin Unlocks User)');
    const unlockRes = await fetch(`${BASE}/admin/users/${lockUserId}/unlock`, {
      method: 'PUT',
      headers: adminHeaders
    }).then(r => r.json());
    console.log('Unlock Response:', unlockRes);
    if (!unlockRes.success) throw new Error('Admin unlock failed: ' + unlockRes.error);

    // Verify user can now log in with PIN '9999'
    const loginAfterUnlock = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lockUserEmail, pin: '9999' })
    }).then(r => r.json());
    if (!loginAfterUnlock.success) throw new Error('Login failed after admin unlock');
    console.log('✅ Test 19 Passed (Admin Unlock Verified)\n');

    // 20. Admin Reset User PIN (PUT /api/admin/users/:id/reset-pin)
    console.log('Test 20: PUT /api/admin/users/:id/reset-pin (Admin Resets User PIN to 4321)');
    const resetPinRes = await fetch(`${BASE}/admin/users/${lockUserId}/reset-pin`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ newPin: '4321' })
    }).then(r => r.json());
    console.log('Reset PIN Response:', resetPinRes);
    if (!resetPinRes.success) throw new Error('Admin reset PIN failed');

    // Verify login with new reset PIN '4321'
    const loginWithResetPin = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lockUserEmail, pin: '4321' })
    }).then(r => r.json());
    if (!loginWithResetPin.success) throw new Error('Login with admin-reset PIN failed');
    console.log('✅ Test 20 Passed (Admin Reset PIN Verified)\n');

    // Cleanup test user
    await fetch(`${BASE}/admin/users/${lockUserId}`, { method: 'DELETE', headers: adminHeaders });

    console.log('🎉 ALL 20 FULL-STACK, 5-ATTEMPT LOCKOUT & ADMIN SUITES PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    serverProcess.kill();
    process.exit(0);
  }
}

runTests();
