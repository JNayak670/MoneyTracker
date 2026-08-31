/**
 * Comprehensive Automated Verification Suite for CircleLedger
 */

async function runTests() {
  const BASE = 'http://localhost:3000';
  console.log('🧪 Starting CircleLedger API & Database Test Suite...\n');

  try {
    // 1. Summary
    console.log('Test 1: GET /api/summary');
    const summaryRes = await fetch(`${BASE}/api/summary`).then(r => r.json());
    console.log('Summary:', summaryRes.data);
    if (!summaryRes.success || summaryRes.data.friends_count === 0) throw new Error('Summary failed');
    console.log('✅ Test 1 Passed\n');

    // 2. Friends list
    console.log('Test 2: GET /api/friends');
    const friendsRes = await fetch(`${BASE}/api/friends`).then(r => r.json());
    console.log(`Found ${friendsRes.data.length} friends.`);
    friendsRes.data.forEach(f => console.log(` - ${f.name}: ${f.status} (${f.current_balance})`));
    if (!friendsRes.success) throw new Error('Friends list failed');
    console.log('✅ Test 2 Passed\n');

    // 3. Friend Ledger & Running Balance Timeline
    console.log('Test 3: GET /api/friends/1 (Rahul Sharma)');
    const rahulRes = await fetch(`${BASE}/api/friends/1`).then(r => r.json());
    console.log(`Friend: ${rahulRes.data.friend.name}, Current Balance: ${rahulRes.data.current_balance}`);
    console.log(`Transactions (${rahulRes.data.transactions.length}):`);
    rahulRes.data.transactions.forEach(t => {
      console.log(`   [${t.date}] ${t.type} ${t.amount} -> Running Bal: ${t.running_balance} (${t.description})`);
    });
    if (!rahulRes.success) throw new Error('Friend ledger failed');
    console.log('✅ Test 3 Passed\n');

    // 4. Add a new friend
    console.log('Test 4: POST /api/friends (Add Rohan)');
    const addFriendRes = await fetch(`${BASE}/api/friends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Gupta',
        phone: '+91 99999 11111',
        email: 'rohan.g@example.com',
        avatar_color: '#f59e0b',
        avatar_emoji: '🚴',
        relationship_tag: 'Trip Buddy',
        notes: 'Manali trip partner'
      })
    }).then(r => r.json());
    console.log('Created Friend:', addFriendRes.data);
    const newFriendId = addFriendRes.data.id;
    if (!addFriendRes.success) throw new Error('Add friend failed');
    console.log('✅ Test 4 Passed\n');

    // 5. Add Transaction (Lent Rohan ₹800)
    console.log('Test 5: POST /api/transactions (Lent Rohan ₹800)');
    const addTxRes = await fetch(`${BASE}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        friend_id: newFriendId,
        type: 'LENT',
        amount: 800,
        category: 'Travel & Trips',
        description: 'Bicycle rental in Old Manali',
        date: '2026-08-30',
        payment_method: 'UPI'
      })
    }).then(r => r.json());
    console.log('Transaction Created:', addTxRes.data);
    if (!addTxRes.success) throw new Error('Add transaction failed');
    console.log('✅ Test 5 Passed\n');

    // 6. Verify Rohan owes ₹800
    console.log('Test 6: Verify Rohan balance is +800');
    const rohanLedger = await fetch(`${BASE}/api/friends/${newFriendId}`).then(r => r.json());
    console.log('Rohan Balance:', rohanLedger.data.current_balance, rohanLedger.data.status);
    if (rohanLedger.data.current_balance !== 800 || rohanLedger.data.status !== 'OWES_YOU') {
      throw new Error(`Expected +800, got ${rohanLedger.data.current_balance}`);
    }
    console.log('✅ Test 6 Passed\n');

    // 7. Settle up Rohan partially (₹500)
    console.log('Test 7: POST /api/settle (Rohan pays ₹500)');
    const settleRes = await fetch(`${BASE}/api/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        friend_id: newFriendId,
        amount: 500,
        payment_method: 'GPay',
        note: 'Partial payment received'
      })
    }).then(r => r.json());
    console.log('Settlement result balance:', settleRes.data.current_balance);
    if (settleRes.data.current_balance !== 300) {
      throw new Error(`Expected +300 after 500 settlement, got ${settleRes.data.current_balance}`);
    }
    console.log('✅ Test 7 Passed\n');

    // 8. Group split bill test (Dinner split ₹1200 between Rahul and Rohan)
    console.log('Test 8: POST /api/transactions (Group Split ₹1200)');
    const splitRes = await fetch(`${BASE}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_group_split: true,
        total_amount: 1200,
        category: 'Food & Dining',
        description: 'Barbeque Nation Group Dinner',
        date: '2026-08-31',
        payment_method: 'Card',
        splits: [
          { friend_id: 1, share_amount: 400, paid_by_user: true },
          { friend_id: newFriendId, share_amount: 400, paid_by_user: true }
        ]
      })
    }).then(r => r.json());
    console.log('Split created:', splitRes);
    if (!splitRes.success) throw new Error('Split bill failed');
    console.log('✅ Test 8 Passed\n');

    // 9. Analytics endpoint
    console.log('Test 9: GET /api/analytics');
    const analyticsRes = await fetch(`${BASE}/api/analytics`).then(r => r.json());
    console.log('Categories:', analyticsRes.data.categories);
    console.log('Monthly:', analyticsRes.data.monthly);
    if (!analyticsRes.success) throw new Error('Analytics failed');
    console.log('✅ Test 9 Passed\n');

    // 10. Backup export
    console.log('Test 10: GET /api/backup');
    const backupRes = await fetch(`${BASE}/api/backup`).then(r => r.json());
    console.log(`Backup contains ${backupRes.data.friends.length} friends and ${backupRes.data.transactions.length} transactions.`);
    if (!backupRes.success) throw new Error('Backup failed');
    console.log('✅ Test 10 Passed\n');

    console.log('🎉 ALL 10 TESTS PASSED WITH 100% SUCCESS!\n');
  } catch (err) {
    console.error('❌ Test Failed:', err);
    process.exit(1);
  }
}

runTests();
