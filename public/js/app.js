/**
 * CircleLedger - Main Application Controller
 * Handles application state, reactive UI updates, modal dialogs, and event flows.
 */

const AppState = {
  summary: null,
  friends: [],
  transactions: [],
  analytics: null,
  settings: { currency: '₹', user_name: 'My Wallet' },
  activeTab: 'friends', // 'friends' | 'ledger' | 'analytics' | 'settings'
  friendFilter: 'ALL',   // 'ALL' | 'OWES_YOU' | 'YOU_OWE' | 'SETTLED'
  searchQuery: '',
  selectedFriendLedger: null,
  activeEditingTxId: null,
  activeEditingFriendId: null
};

// Toast notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// -------------------------------------------------------------
// Core UI Render Functions
// -------------------------------------------------------------

async function loadAllData() {
  try {
    const [summaryRes, friendsRes, settingsRes] = await Promise.all([
      API.getSummary(),
      API.getFriends(),
      API.getSettings()
    ]);

    AppState.summary = summaryRes.data;
    AppState.friends = friendsRes.data;
    AppState.settings = settingsRes.data;

    renderSummaryCards();
    renderFriendsGrid();
    populateFriendDropdowns();

    if (AppState.activeTab === 'ledger') {
      await loadTransactions();
    } else if (AppState.activeTab === 'analytics') {
      await loadAnalytics();
    }
  } catch (err) {
    showToast(`Failed to load data: ${err.message}`, 'error');
  }
}

function renderSummaryCards() {
  const { total_receivable, total_payable, net_balance, friends_count, active_dues_count, settled_count, currency } = AppState.summary || {
    total_receivable: 0, total_payable: 0, net_balance: 0, friends_count: 0, active_dues_count: 0, settled_count: 0, currency: '₹'
  };

  const curr = currency || '₹';

  // Total Receivable (You will get)
  const recEl = document.getElementById('heroReceivable');
  if (recEl) {
    recEl.innerHTML = `${curr}${Number(total_receivable).toLocaleString()}`;
    document.getElementById('subReceivable').innerText = `${AppState.friends.filter(f => f.current_balance > 0).length} friends owe you`;
  }

  // Total Payable (You owe)
  const payEl = document.getElementById('heroPayable');
  if (payEl) {
    payEl.innerHTML = `${curr}${Number(total_payable).toLocaleString()}`;
    document.getElementById('subPayable').innerText = `You owe ${AppState.friends.filter(f => f.current_balance < 0).length} friends`;
  }

  // Net Balance
  const netEl = document.getElementById('heroNet');
  const netBadge = document.getElementById('heroNetBadge');
  if (netEl) {
    const isPositive = net_balance >= 0;
    netEl.innerHTML = `${isPositive ? '+' : '-'}${curr}${Math.abs(net_balance).toLocaleString()}`;
    netEl.className = `card-amount ${isPositive ? 'amount-green' : 'amount-red'}`;
    if (netBadge) {
      netBadge.innerText = net_balance > 0 ? '🟢 In Surplus' : net_balance < 0 ? '🔴 In Deficit' : '⚪ Balanced';
    }
    document.getElementById('subNet').innerText = `${active_dues_count} active dues • ${settled_count} settled`;
  }
}

function renderFriendsGrid() {
  const container = document.getElementById('friendsGrid');
  if (!container) return;

  const curr = AppState.summary ? AppState.summary.currency : '₹';
  let filtered = [...AppState.friends];

  // Filter by status
  if (AppState.friendFilter === 'OWES_YOU') {
    filtered = filtered.filter(f => f.current_balance > 0);
  } else if (AppState.friendFilter === 'YOU_OWE') {
    filtered = filtered.filter(f => f.current_balance < 0);
  } else if (AppState.friendFilter === 'SETTLED') {
    filtered = filtered.filter(f => f.current_balance === 0);
  }

  // Filter by search query
  if (AppState.searchQuery.trim()) {
    const q = AppState.searchQuery.toLowerCase();
    filtered = filtered.filter(f => 
      f.name.toLowerCase().includes(q) || 
      (f.relationship_tag && f.relationship_tag.toLowerCase().includes(q)) ||
      (f.phone && f.phone.includes(q))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">👥</div>
        <h3 class="empty-title">No Friends Found</h3>
        <p class="empty-desc">No friends match your current filter criteria. Add a new friend or adjust your search.</p>
        <button class="btn btn-primary" onclick="openAddFriendModal()">+ Add New Friend</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(f => {
    const bal = f.current_balance;
    const isOwed = bal > 0;
    const isOwing = bal < 0;
    const isSettled = bal === 0;

    let balanceBoxClass = isOwed ? 'balance-box-green' : isOwing ? 'balance-box-red' : 'balance-box-settled';
    let balanceLabel = isOwed ? 'Friend Owes You (Get)' : isOwing ? 'You Owe Friend (Due)' : 'All Settled Up';
    let balanceValColor = isOwed ? 'amount-green' : isOwing ? 'amount-red' : 'amount-indigo';
    let formattedBal = isSettled ? 'Settled ✅' : `${curr}${Math.abs(bal).toLocaleString()}`;

    return `
      <div class="friend-card" id="friend-card-${f.id}">
        <div>
          <div class="friend-top">
            <div class="friend-avatar-info">
              <div class="friend-avatar" style="background: ${f.avatar_color || '#6366f1'};">
                ${f.avatar_emoji || '👤'}
              </div>
              <div class="friend-details">
                <h3>${escapeHtml(f.name)}</h3>
                <span class="friend-tag">${escapeHtml(f.relationship_tag || 'Friend')}</span>
              </div>
            </div>
            <button class="friend-more-btn" title="Edit Friend" onclick="openEditFriendModal(${f.id})">✏️</button>
          </div>

          <div class="friend-balance-box ${balanceBoxClass}">
            <div class="balance-label">${balanceLabel}</div>
            <div class="balance-value ${balanceValColor}">${formattedBal}</div>
          </div>

          <div class="friend-stats-meta">
            <span>Lent: ${curr}${f.total_lent.toLocaleString()}</span>
            <span>Borrowed: ${curr}${f.total_borrowed.toLocaleString()}</span>
            <span>${f.transaction_count} Txns</span>
          </div>
        </div>

        <div>
          <div class="friend-actions">
            <button class="btn btn-primary btn-sm" onclick="openAddTxModalForFriend(${f.id})">
              ➕ Add Entry
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openFriendHistoryModal(${f.id})">
              📜 History
            </button>
          </div>
          <div class="friend-actions-bottom">
            ${!isSettled ? `
              <button class="btn btn-success btn-sm" style="flex:1;" onclick="openSettleModal(${f.id}, ${Math.abs(bal)}, '${escapeHtml(f.name)}')">
                ⚡ Settle Up
              </button>
            ` : `
              <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="openFriendHistoryModal(${f.id})">
                ✅ View Log
              </button>
            `}
            ${isOwed ? `
              <button class="btn btn-secondary btn-sm" title="Send WhatsApp Reminder" onclick="openWhatsAppModal(${f.id}, ${Math.abs(bal)}, '${escapeHtml(f.name)}', '${escapeHtml(f.phone || '')}')">
                💬 Remind
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadTransactions() {
  const container = document.getElementById('ledgerTableBody');
  if (!container) return;

  container.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem;">Loading transactions...</td></tr>';

  try {
    const friendFilter = document.getElementById('txFilterFriend') ? document.getElementById('txFilterFriend').value : '';
    const typeFilter = document.getElementById('txFilterType') ? document.getElementById('txFilterType').value : '';
    const categoryFilter = document.getElementById('txFilterCategory') ? document.getElementById('txFilterCategory').value : '';
    const searchVal = document.getElementById('txSearchInput') ? document.getElementById('txSearchInput').value : '';

    const params = {};
    if (friendFilter) params.friend_id = friendFilter;
    if (typeFilter) params.type = typeFilter;
    if (categoryFilter) params.category = categoryFilter;
    if (searchVal) params.search = searchVal;

    const res = await API.getTransactions(params);
    AppState.transactions = res.data;

    const curr = AppState.summary ? AppState.summary.currency : '₹';

    if (AppState.transactions.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
            No transactions match the selected criteria.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = AppState.transactions.map(t => {
      let typeBadgeClass = 'type-lent';
      let typeIcon = '↗️ Lent';
      let amountSign = '+';
      let amountClass = 'amount-green';

      if (t.type === 'BORROWED') {
        typeBadgeClass = 'type-borrowed';
        typeIcon = '↙️ Borrowed';
        amountSign = '-';
        amountClass = 'amount-red';
      } else if (t.type === 'SETTLED') {
        typeBadgeClass = 'type-settled';
        typeIcon = '🤝 Settled';
        amountSign = t.impact_on_user > 0 ? '+' : '-';
        amountClass = 'amount-indigo';
      } else if (t.type === 'SPLIT') {
        typeBadgeClass = 'type-split';
        typeIcon = '👥 Split';
        amountSign = t.impact_on_user > 0 ? '+' : '-';
        amountClass = t.impact_on_user > 0 ? 'amount-green' : 'amount-red';
      }

      return `
        <tr>
          <td>
            <div style="font-weight:600;">${t.date}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${t.time || ''}</div>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:50%; background:${t.avatar_color || '#6366f1'}; font-size:0.9rem;">
                ${t.avatar_emoji || '👤'}
              </span>
              <strong>${escapeHtml(t.friend_name || 'Friend')}</strong>
            </div>
          </td>
          <td>
            <span class="badge-tag ${typeBadgeClass}">${typeIcon}</span>
          </td>
          <td>
            <div style="font-weight:600;">${escapeHtml(t.description)}</div>
            ${t.receipt_note ? `<div style="font-size:0.75rem; color:var(--text-muted);">Note: ${escapeHtml(t.receipt_note)}</div>` : ''}
          </td>
          <td>
            <span class="badge-tag" style="background:var(--bg-elevated);">${escapeHtml(t.category)}</span>
          </td>
          <td>
            <span style="font-size:0.8rem; color:var(--text-muted);">${t.payment_method || 'UPI'}</span>
          </td>
          <td style="text-align:right;">
            <div class="${amountClass}" style="font-weight:800; font-size:1rem;">
              ${amountSign}${curr}${t.amount.toLocaleString()}
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.35rem; margin-top:0.3rem;">
              <button class="btn btn-ghost btn-sm" title="Delete" style="padding:2px 6px; font-size:0.75rem;" onclick="deleteTransaction(${t.id})">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--accent-danger); padding:2rem;">Error: ${err.message}</td></tr>`;
  }
}

async function loadAnalytics() {
  try {
    const res = await API.getAnalytics();
    AppState.analytics = res.data;
    const curr = AppState.summary ? AppState.summary.currency : '₹';

    Charts.renderCategoryDonut('categoryChartContainer', AppState.analytics.categories, curr);
    Charts.renderMonthlyBars('monthlyChartContainer', AppState.analytics.monthly, curr);
  } catch (err) {
    showToast(`Failed to load analytics: ${err.message}`, 'error');
  }
}

function populateFriendDropdowns() {
  const selects = ['txFriendSelect', 'txFilterFriend', 'settleFriendSelect'];
  selects.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;

    const currentVal = sel.value;
    let defaultOpt = id === 'txFilterFriend' ? '<option value="">All Friends</option>' : '<option value="">-- Select a Friend --</option>';
    
    sel.innerHTML = defaultOpt + AppState.friends.map(f => `
      <option value="${f.id}">
        ${escapeHtml(f.name)} (${f.relationship_tag || 'Friend'}) ${f.current_balance > 0 ? `[Owes ${f.current_balance}]` : f.current_balance < 0 ? `[You owe ${Math.abs(f.current_balance)}]` : '[Settled]'}
      </option>
    `).join('');

    if (currentVal) sel.value = currentVal;
  });
}

// -------------------------------------------------------------
// Modal Dialogs & Action Handlers
// -------------------------------------------------------------

// Add/Edit Transaction Modal
function openAddTransactionModal() {
  AppState.activeEditingTxId = null;
  document.getElementById('txModalTitle').innerText = 'Add New Transaction';
  document.getElementById('txForm').reset();
  document.getElementById('txDate').value = new Date().toISOString().slice(0, 10);
  
  // Set active type button default (LENT)
  setTxType('LENT');
  selectCategory('Food & Dining');
  switchTxTab('single');
  
  document.getElementById('transactionModal').showModal();
}

function openAddTxModalForFriend(friendId) {
  openAddTransactionModal();
  const sel = document.getElementById('txFriendSelect');
  if (sel) sel.value = friendId;
}

function switchTxTab(mode) {
  const singleSection = document.getElementById('txSingleSection');
  const splitSection = document.getElementById('txSplitSection');
  const btnSingle = document.getElementById('tabSingleTx');
  const btnSplit = document.getElementById('tabSplitTx');

  if (mode === 'split') {
    singleSection.style.display = 'none';
    splitSection.style.display = 'block';
    btnSingle.classList.remove('active');
    btnSplit.classList.add('active');
    renderSplitFriendsChecklist();
  } else {
    singleSection.style.display = 'block';
    splitSection.style.display = 'none';
    btnSingle.classList.add('active');
    btnSplit.classList.remove('active');
  }
}

function renderSplitFriendsChecklist() {
  const container = document.getElementById('splitFriendsList');
  if (!container) return;

  const curr = AppState.summary ? AppState.summary.currency : '₹';
  container.innerHTML = AppState.friends.map(f => `
    <div style="display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid var(--border-color);">
      <label style="display:flex; align-items:center; gap:0.6rem; cursor:pointer;">
        <input type="checkbox" class="split-friend-check" data-friend-id="${f.id}" checked onchange="recalculateSplitShares()">
        <span>${f.avatar_emoji || '👤'} <strong>${escapeHtml(f.name)}</strong></span>
      </label>
      <div style="display:flex; align-items:center; gap:0.3rem;">
        <span>${curr}</span>
        <input type="number" class="split-share-input form-control" style="width:90px; padding:0.3rem 0.5rem; text-align:right;" data-friend-id="${f.id}" value="0">
      </div>
    </div>
  `).join('');

  recalculateSplitShares();
}

function recalculateSplitShares() {
  const totalAmount = Number(document.getElementById('txSplitTotal').value) || 0;
  const includeSelf = document.getElementById('txSplitIncludeSelf').checked;
  const checkboxes = document.querySelectorAll('.split-friend-check:checked');
  const count = checkboxes.length + (includeSelf ? 1 : 0);

  if (count > 0 && totalAmount > 0) {
    const share = Number((totalAmount / count).toFixed(2));
    document.querySelectorAll('.split-friend-check').forEach(chk => {
      const friendId = chk.dataset.friendId;
      const input = document.querySelector(`.split-share-input[data-friend-id="${friendId}"]`);
      if (input) {
        input.value = chk.checked ? share : 0;
      }
    });
  }
}

let selectedTxType = 'LENT';
function setTxType(type) {
  selectedTxType = type;
  const btnLent = document.getElementById('typeBtnLent');
  const btnBorrowed = document.getElementById('typeBtnBorrowed');

  if (type === 'LENT') {
    btnLent.className = 'type-toggle-btn active-lent';
    btnBorrowed.className = 'type-toggle-btn';
  } else {
    btnLent.className = 'type-toggle-btn';
    btnBorrowed.className = 'type-toggle-btn active-borrowed';
  }
}

let selectedCategoryValue = 'Food & Dining';
function selectCategory(cat) {
  selectedCategoryValue = cat;
  document.querySelectorAll('.cat-chip').forEach(chip => {
    if (chip.dataset.cat === cat) {
      chip.classList.add('selected');
    } else {
      chip.classList.remove('selected');
    }
  });
}

async function handleSaveTransaction(e) {
  e.preventDefault();

  const isSplitTab = document.getElementById('tabSplitTx').classList.contains('active');

  if (isSplitTab) {
    // Group split submission
    const totalAmount = Number(document.getElementById('txSplitTotal').value);
    const desc = document.getElementById('txSplitDesc').value;
    const date = document.getElementById('txDate').value;
    const payment_method = document.getElementById('txPaymentMethod').value;

    if (!desc || !desc.trim()) {
      showToast('Please enter split bill description', 'error');
      return;
    }
    if (totalAmount <= 0) {
      showToast('Please enter a valid total amount', 'error');
      return;
    }

    const splits = [];
    document.querySelectorAll('.split-friend-check:checked').forEach(chk => {
      const friendId = Number(chk.dataset.friendId);
      const input = document.querySelector(`.split-share-input[data-friend-id="${friendId}"]`);
      const shareAmount = Number(input ? input.value : 0);
      if (shareAmount > 0) {
        splits.push({ friend_id: friendId, share_amount: shareAmount, paid_by_user: true });
      }
    });

    if (splits.length === 0) {
      showToast('Select at least one friend for the split', 'error');
      return;
    }

    try {
      await API.createTransaction({
        is_group_split: true,
        total_amount: totalAmount,
        category: selectedCategoryValue,
        description: desc,
        date,
        payment_method,
        splits
      });

      showToast('Group split bill saved successfully!', 'success');
      document.getElementById('transactionModal').close();
      await loadAllData();
    } catch (err) {
      showToast(`Failed to save split: ${err.message}`, 'error');
    }
    return;
  }

  // Single transaction
  const friend_id = document.getElementById('txFriendSelect').value;
  const amount = Number(document.getElementById('txAmount').value);
  const description = document.getElementById('txDescription').value;
  const date = document.getElementById('txDate').value;
  const payment_method = document.getElementById('txPaymentMethod').value;
  const receipt_note = document.getElementById('txReceiptNote').value;

  if (!friend_id) {
    showToast('Please select a friend', 'error');
    return;
  }
  if (amount <= 0 || isNaN(amount)) {
    showToast('Please enter a valid amount', 'error');
    return;
  }
  if (!description || !description.trim()) {
    showToast('Please enter a description / reason', 'error');
    return;
  }

  try {
    const payload = {
      friend_id,
      type: selectedTxType,
      amount,
      category: selectedCategoryValue,
      description,
      date,
      payment_method,
      receipt_note
    };

    if (AppState.activeEditingTxId) {
      await API.updateTransaction(AppState.activeEditingTxId, payload);
      showToast('Transaction updated', 'success');
    } else {
      await API.createTransaction(payload);
      showToast('Transaction added to ledger', 'success');
    }

    document.getElementById('transactionModal').close();
    await loadAllData();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function deleteTransaction(txId) {
  if (!confirm('Are you sure you want to delete this transaction? Balance will be updated.')) return;

  try {
    await API.deleteTransaction(txId);
    showToast('Transaction deleted', 'success');
    await loadAllData();
    if (AppState.selectedFriendLedger) {
      openFriendHistoryModal(AppState.selectedFriendLedger.friend.id);
    }
  } catch (err) {
    showToast(`Delete failed: ${err.message}`, 'error');
  }
}

// -------------------------------------------------------------
// Friend History & Ledger Timeline Modal
// -------------------------------------------------------------
async function openFriendHistoryModal(friendId) {
  try {
    const res = await API.getFriendLedger(friendId);
    AppState.selectedFriendLedger = res.data;
    const { friend, current_balance, transactions } = res.data;
    const curr = AppState.summary ? AppState.summary.currency : '₹';

    document.getElementById('histFriendName').innerText = friend.name;
    document.getElementById('histFriendTag').innerText = friend.relationship_tag || 'Friend';
    document.getElementById('histFriendAvatar').innerText = friend.avatar_emoji || '👤';
    document.getElementById('histFriendAvatar').style.background = friend.avatar_color || '#6366f1';

    const balEl = document.getElementById('histCurrentBalance');
    const isOwed = current_balance > 0;
    const isOwing = current_balance < 0;
    const isSettled = current_balance === 0;

    balEl.className = `balance-value ${isOwed ? 'amount-green' : isOwing ? 'amount-red' : 'amount-indigo'}`;
    balEl.innerText = isSettled ? 'All Settled (₹0)' : `${isOwed ? 'Owes You ' : 'You Owe '}${curr}${Math.abs(current_balance).toLocaleString()}`;

    // Timeline entries
    const timelineContainer = document.getElementById('friendTimelineContainer');
    if (transactions.length === 0) {
      timelineContainer.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:2rem 0;">No transactions recorded with this friend yet.</p>';
    } else {
      timelineContainer.innerHTML = transactions.map(t => {
        let dotColor = t.impact_on_user > 0 ? 'dot-green' : t.impact_on_user < 0 ? 'dot-red' : 'dot-blue';
        let amountSign = t.impact_on_user > 0 ? '+' : t.impact_on_user < 0 ? '-' : '';
        let amountColor = t.impact_on_user > 0 ? 'amount-green' : t.impact_on_user < 0 ? 'amount-red' : 'amount-indigo';

        return `
          <div class="timeline-item">
            <div class="timeline-dot ${dotColor}"></div>
            <div class="timeline-header">
              <span>📅 ${t.date} ${t.time || ''}</span>
              <span class="badge-tag" style="background:var(--bg-card);">${t.category}</span>
            </div>
            <div class="timeline-body">
              <div>
                <div class="timeline-desc">${escapeHtml(t.description)}</div>
                ${t.receipt_note ? `<div style="font-size:0.78rem; color:var(--text-muted);">Note: ${escapeHtml(t.receipt_note)}</div>` : ''}
              </div>
              <div style="text-align:right;">
                <div class="timeline-amount ${amountColor}">${amountSign}${curr}${t.amount.toLocaleString()}</div>
                <div class="timeline-running">Balance: ${curr}${t.running_balance.toLocaleString()}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Configure Quick Action Buttons on History Modal
    const settleBtn = document.getElementById('histSettleBtn');
    if (settleBtn) {
      settleBtn.style.display = isSettled ? 'none' : 'inline-flex';
      settleBtn.onclick = () => {
        document.getElementById('friendHistoryModal').close();
        openSettleModal(friend.id, Math.abs(current_balance), friend.name);
      };
    }

    const printBtn = document.getElementById('histPrintBtn');
    if (printBtn) {
      printBtn.onclick = () => Exporter.printFriendStatement(res.data, curr);
    }

    document.getElementById('friendHistoryModal').showModal();
  } catch (err) {
    showToast(`Error opening history: ${err.message}`, 'error');
  }
}

// -------------------------------------------------------------
// Settle Up Modal
// -------------------------------------------------------------
function openSettleModal(friendId, outstandingAmount, friendName) {
  document.getElementById('settleFriendId').value = friendId;
  document.getElementById('settleAmount').value = outstandingAmount || '';
  document.getElementById('settleOutstandingNote').innerText = `Outstanding Dues: ${AppState.summary ? AppState.summary.currency : '₹'}${outstandingAmount.toLocaleString()}`;
  document.getElementById('settleFriendName').innerText = friendName;
  document.getElementById('settleDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('settleModal').showModal();
}

async function handleSettleSubmit(e) {
  e.preventDefault();
  const friend_id = document.getElementById('settleFriendId').value;
  const amount = Number(document.getElementById('settleAmount').value);
  const payment_method = document.getElementById('settlePaymentMethod').value;
  const note = document.getElementById('settleNote').value;
  const date = document.getElementById('settleDate').value;

  if (amount <= 0 || isNaN(amount)) {
    showToast('Please enter a valid settlement amount', 'error');
    return;
  }

  try {
    await API.settleUp({ friend_id, amount, payment_method, note, date });
    showToast('Settlement recorded successfully!', 'success');
    document.getElementById('settleModal').close();
    await loadAllData();
  } catch (err) {
    showToast(`Settlement failed: ${err.message}`, 'error');
  }
}

// -------------------------------------------------------------
// WhatsApp Reminder Modal
// -------------------------------------------------------------
let activeWhatsAppTarget = { friendId: null, amount: 0, friendName: '', phone: '' };

function openWhatsAppModal(friendId, amount, friendName, phone) {
  activeWhatsAppTarget = { friendId, amount, friendName, phone };
  document.getElementById('waFriendName').innerText = friendName;
  document.getElementById('waPhoneInput').value = phone || '';
  updateWhatsAppPreview();
  document.getElementById('whatsappModal').showModal();
}

function updateWhatsAppPreview() {
  const tone = document.getElementById('waToneSelect').value;
  const customReason = document.getElementById('waReasonInput').value;
  const curr = AppState.summary ? AppState.summary.currency : '₹';
  const userName = AppState.settings.user_name || 'Me';

  const msg = Reminder.buildMessage(
    activeWhatsAppTarget.friendName,
    activeWhatsAppTarget.amount,
    curr,
    userName,
    customReason,
    tone
  );

  document.getElementById('waMessagePreview').value = msg;
}

function sendWhatsAppReminder() {
  const phone = document.getElementById('waPhoneInput').value;
  const msg = document.getElementById('waMessagePreview').value;
  const url = Reminder.generateWhatsAppUrl(phone, msg);
  window.open(url, '_blank');
  document.getElementById('whatsappModal').close();
  showToast('WhatsApp reminder opened!', 'success');
}

function copyWhatsAppMessage() {
  const msg = document.getElementById('waMessagePreview').value;
  navigator.clipboard.writeText(msg).then(() => {
    showToast('Message copied to clipboard!', 'success');
  });
}

// -------------------------------------------------------------
// Add/Edit Friend Modal
// -------------------------------------------------------------
function openAddFriendModal() {
  AppState.activeEditingFriendId = null;
  document.getElementById('friendModalTitle').innerText = 'Add Friend to Circle';
  document.getElementById('friendForm').reset();
  document.getElementById('friendEmojiInput').value = '👤';
  document.getElementById('friendColorInput').value = '#6366f1';
  document.getElementById('friendModal').showModal();
}

function openEditFriendModal(friendId) {
  const friend = AppState.friends.find(f => f.id === friendId);
  if (!friend) return;

  AppState.activeEditingFriendId = friendId;
  document.getElementById('friendModalTitle').innerText = 'Edit Friend Details';
  document.getElementById('friendNameInput').value = friend.name;
  document.getElementById('friendPhoneInput').value = friend.phone || '';
  document.getElementById('friendEmailInput').value = friend.email || '';
  document.getElementById('friendTagInput').value = friend.relationship_tag || 'Friend';
  document.getElementById('friendEmojiInput').value = friend.avatar_emoji || '👤';
  document.getElementById('friendColorInput').value = friend.avatar_color || '#6366f1';
  document.getElementById('friendNotesInput').value = friend.notes || '';
  document.getElementById('friendModal').showModal();
}

async function handleSaveFriend(e) {
  e.preventDefault();
  const name = document.getElementById('friendNameInput').value;
  const phone = document.getElementById('friendPhoneInput').value;
  const email = document.getElementById('friendEmailInput').value;
  const relationship_tag = document.getElementById('friendTagInput').value;
  const avatar_emoji = document.getElementById('friendEmojiInput').value;
  const avatar_color = document.getElementById('friendColorInput').value;
  const notes = document.getElementById('friendNotesInput').value;

  if (!name || !name.trim()) {
    showToast('Please enter a friend name', 'error');
    return;
  }

  const payload = { name, phone, email, relationship_tag, avatar_emoji, avatar_color, notes };

  try {
    if (AppState.activeEditingFriendId) {
      await API.updateFriend(AppState.activeEditingFriendId, payload);
      showToast('Friend details updated', 'success');
    } else {
      await API.createFriend(payload);
      showToast('Friend added to your circle', 'success');
    }
    document.getElementById('friendModal').close();
    await loadAllData();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

// -------------------------------------------------------------
// Database Settings, Backup & Restore
// -------------------------------------------------------------
async function handleResetDemoData() {
  if (!confirm('This will reload sample demo circle records into the database. Continue?')) return;
  try {
    await API.resetDemo();
    showToast('Demo data reloaded into SQLite database', 'success');
    await loadAllData();
  } catch (err) {
    showToast(`Reset failed: ${err.message}`, 'error');
  }
}

async function handleClearAllData() {
  if (!confirm('CAUTION: This will delete ALL friends and transactions from the database! Are you sure?')) return;
  try {
    await API.clearAll();
    showToast('All database records cleared', 'info');
    await loadAllData();
  } catch (err) {
    showToast(`Clear failed: ${err.message}`, 'error');
  }
}

async function handleBackupDownload() {
  try {
    const res = await API.getBackup();
    Exporter.downloadJSONBackup(res);
    showToast('Backup JSON downloaded successfully', 'success');
  } catch (err) {
    showToast(`Backup error: ${err.message}`, 'error');
  }
}

async function handleRestoreFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const json = JSON.parse(event.target.result);
      await API.restoreBackup(json);
      showToast('Database successfully restored from backup file!', 'success');
      await loadAllData();
    } catch (err) {
      showToast(`Restore failed: ${err.message}`, 'error');
    }
  };
  reader.readAsText(file);
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const currency = document.getElementById('settingCurrency').value;
  const user_name = document.getElementById('settingUserName').value;

  try {
    await API.saveSettings({ currency, user_name });
    showToast('Settings saved successfully', 'success');
    await loadAllData();
  } catch (err) {
    showToast(`Settings error: ${err.message}`, 'error');
  }
}

// -------------------------------------------------------------
// Tab Switching & Navigation
// -------------------------------------------------------------
function switchMainTab(tabName) {
  AppState.activeTab = tabName;
  document.querySelectorAll('.tab-btn').forEach(b => {
    if (b.dataset.tab === tabName) b.classList.add('active');
    else b.classList.remove('active');
  });

  document.querySelectorAll('.view-section').forEach(s => {
    if (s.id === `view-${tabName}`) s.classList.add('active');
    else s.classList.remove('active');
  });

  if (tabName === 'ledger') {
    loadTransactions();
  } else if (tabName === 'analytics') {
    loadAnalytics();
  }
}

function setFriendFilter(filterType) {
  AppState.friendFilter = filterType;
  document.querySelectorAll('.pill-btn').forEach(btn => {
    if (btn.dataset.filter === filterType) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  renderFriendsGrid();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('circle_theme', next);
  document.getElementById('themeToggleBtn').innerText = next === 'dark' ? '🌙' : '☀️';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// -------------------------------------------------------------
// Keyboard Shortcuts & Initialization
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Theme init
  const savedTheme = localStorage.getItem('circle_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) themeBtn.innerText = savedTheme === 'dark' ? '🌙' : '☀️';

  // Search input handler
  const searchInput = document.getElementById('globalSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value;
      renderFriendsGrid();
    });
  }

  // Split bill input dynamic recalculation
  const splitTotalInput = document.getElementById('txSplitTotal');
  if (splitTotalInput) {
    splitTotalInput.addEventListener('input', recalculateSplitShares);
  }
  const splitSelfCheck = document.getElementById('txSplitIncludeSelf');
  if (splitSelfCheck) {
    splitSelfCheck.addEventListener('change', recalculateSplitShares);
  }

  // Modal backdrop click to close
  document.querySelectorAll('dialog').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.close();
      }
    });
  });

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+K or / to focus search
    if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT')) {
      e.preventDefault();
      document.getElementById('globalSearch')?.focus();
    }
    // N for new transaction
    if (e.key === 'n' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      openAddTransactionModal();
    }
  });

  // Initial Load
  loadAllData();
});

window.openAddTransactionModal = openAddTransactionModal;
window.openAddTxModalForFriend = openAddTxModalForFriend;
window.openAddFriendModal = openAddFriendModal;
window.openEditFriendModal = openEditFriendModal;
window.openFriendHistoryModal = openFriendHistoryModal;
window.openSettleModal = openSettleModal;
window.openWhatsAppModal = openWhatsAppModal;
window.switchMainTab = switchMainTab;
window.setFriendFilter = setFriendFilter;
window.setTxType = setTxType;
window.selectCategory = selectCategory;
window.switchTxTab = switchTxTab;
window.handleSaveTransaction = handleSaveTransaction;
window.handleSaveFriend = handleSaveFriend;
window.handleSettleSubmit = handleSettleSubmit;
window.handleSaveSettings = handleSaveSettings;
window.handleResetDemoData = handleResetDemoData;
window.handleClearAllData = handleClearAllData;
window.handleBackupDownload = handleBackupDownload;
window.handleRestoreFile = handleRestoreFile;
window.deleteTransaction = deleteTransaction;
window.sendWhatsAppReminder = sendWhatsAppReminder;
window.copyWhatsAppMessage = copyWhatsAppMessage;
window.updateWhatsAppPreview = updateWhatsAppPreview;
window.toggleTheme = toggleTheme;
window.loadTransactions = loadTransactions;
