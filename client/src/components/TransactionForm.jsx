import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Users, 
  User, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Tag, 
  CreditCard, 
  Sparkles, 
  Search, 
  CheckSquare, 
  Square, 
  Percent, 
  Hash, 
  Equal, 
  PieChart, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Plus,
  Minus
} from 'lucide-react';
import useModalBackHandler from '../hooks/useModalBackHandler';

const CATEGORIES = [
  { name: 'Food & Dining', icon: '🍕' },
  { name: 'Rent & Bills', icon: '🏠' },
  { name: 'Travel & Trips', icon: '✈️' },
  { name: 'Entertainment', icon: '🍿' },
  { name: 'Loans & Cash', icon: '💰' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'General', icon: '🏷️' }
];

export default function TransactionForm({ 
  isOpen, 
  onClose, 
  onSave, 
  friends = [], 
  preselectedFriendId = '', 
  initialTab = 'single',
  onOpenAddFriend 
}) {
  useModalBackHandler(isOpen, onClose);
  const [tab, setTab] = useState(initialTab || 'single'); // 'single' | 'split'
  const [friendId, setFriendId] = useState(preselectedFriendId || '');
  const [type, setType] = useState('GIVEN'); // 'GIVEN' (You gave / paid) | 'RECEIVED' (Friend gave / paid)
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [receiptNote, setReceiptNote] = useState('');

  // -------------------------------------------------------------
  // Group Split State & Controls
  // -------------------------------------------------------------
  const [splitMode, setSplitMode] = useState('EQUAL'); // 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES'
  const [splitTotal, setSplitTotal] = useState('');
  const [splitNote, setSplitNote] = useState('');
  const [payerType, setPayerType] = useState('USER'); // 'USER' (You paid) | 'FRIEND' (Friend paid)
  const [payingFriendId, setPayingFriendId] = useState('');
  const [showFriendPaidPopup, setShowFriendPaidPopup] = useState(false);
  const [includeSelf, setIncludeSelf] = useState(true);
  const [friendsSearch, setFriendsSearch] = useState('');

  // Self share state for exact/percent/shares
  const [selfExactAmount, setSelfExactAmount] = useState('');
  const [selfPercentage, setSelfPercentage] = useState('');
  const [selfShares, setSelfShares] = useState(1);

  // Friend split map: { [friendId]: { selected: bool, exactAmount: number/str, percentage: number/str, shares: number } }
  const [splitFriends, setSplitFriends] = useState({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTab(initialTab || 'single');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab || 'single');
      setFriendId(preselectedFriendId || '');
      setAmount('');
      setNote('');
      setSplitTotal('');
      setSplitNote('');
      setReceiptNote('');
      setDate(new Date().toISOString().slice(0, 10));
      setPayerType('USER');
      setSplitMode('EQUAL');
      setFriendsSearch('');
    }
  }, [isOpen, preselectedFriendId, initialTab]);

  // Initialize friends map whenever friends list changes or modal opens
  useEffect(() => {
    if (!Array.isArray(friends)) return;
    const initial = {};
    friends.forEach(f => {
      const fid = f.id || f._id;
      if (fid) {
        initial[fid] = {
          selected: true,
          exactAmount: '',
          percentage: '',
          shares: 1
        };
      }
    });
    setSplitFriends(initial);

    if (friends.length > 0 && !payingFriendId) {
      setPayingFriendId(friends[0].id || friends[0]._id);
    }
  }, [friends, isOpen]);

  // Filtered friends list for search
  const visibleFriends = useMemo(() => {
    if (!friendsSearch.trim()) return friends;
    const q = friendsSearch.toLowerCase();
    return friends.filter(f => 
      f.name?.toLowerCase().includes(q) || 
      f.relationshipTag?.toLowerCase().includes(q) ||
      f.phone?.includes(q)
    );
  }, [friends, friendsSearch]);

  const currentPayingFriend = useMemo(() => {
    return friends.find(f => (f.id || f._id) === payingFriendId) || null;
  }, [friends, payingFriendId]);
  const currentPayingFriendName = currentPayingFriend?.name || 'Paying Friend';

  const selectedFriendIds = useMemo(() => {
    return Object.keys(splitFriends).filter(id => splitFriends[id]?.selected);
  }, [splitFriends]);

  const totalParticipantsCount = selectedFriendIds.length + (includeSelf ? 1 : 0);
  const parsedTotal = parseFloat(splitTotal) || 0;

  // -------------------------------------------------------------
  // Dynamic Calculations based on Split Mode
  // -------------------------------------------------------------
  const calculatedShares = useMemo(() => {
    const result = {
      self: 0,
      friends: {},
      totalAllocated: 0,
      isBalanced: false,
      difference: 0
    };

    if (parsedTotal <= 0 || totalParticipantsCount === 0) {
      return result;
    }

    if (splitMode === 'EQUAL') {
      // Divide parsedTotal equally with roundoff penny balance
      const baseShare = Math.floor((parsedTotal / totalParticipantsCount) * 100) / 100;
      let remainder = Math.round((parsedTotal - (baseShare * totalParticipantsCount)) * 100) / 100;

      let selfVal = 0;
      if (includeSelf) {
        let extra = 0;
        if (remainder > 0) {
          extra = 0.01;
          remainder = Math.round((remainder - 0.01) * 100) / 100;
        }
        selfVal = Number((baseShare + extra).toFixed(2));
      }
      result.self = selfVal;

      selectedFriendIds.forEach(id => {
        let extra = 0;
        if (remainder > 0) {
          extra = 0.01;
          remainder = Math.round((remainder - 0.01) * 100) / 100;
        }
        result.friends[id] = Number((baseShare + extra).toFixed(2));
      });

      result.totalAllocated = parsedTotal;
      result.isBalanced = true;
      result.difference = 0;
    } 
    else if (splitMode === 'EXACT') {
      const selfVal = includeSelf ? (parseFloat(selfExactAmount) || 0) : 0;
      result.self = selfVal;

      let sum = selfVal;
      selectedFriendIds.forEach(id => {
        const val = parseFloat(splitFriends[id]?.exactAmount) || 0;
        result.friends[id] = val;
        sum += val;
      });

      result.totalAllocated = Number(sum.toFixed(2));
      const diff = Number((parsedTotal - sum).toFixed(2));
      result.difference = diff;
      result.isBalanced = Math.abs(diff) < 0.01;
    } 
    else if (splitMode === 'PERCENTAGE') {
      const selfPct = includeSelf ? (parseFloat(selfPercentage) || 0) : 0;
      let totalPct = selfPct;

      selectedFriendIds.forEach(id => {
        const p = parseFloat(splitFriends[id]?.percentage) || 0;
        totalPct += p;
      });

      const selfVal = Number(((selfPct / 100) * parsedTotal).toFixed(2));
      result.self = selfVal;

      let sum = selfVal;
      selectedFriendIds.forEach(id => {
        const p = parseFloat(splitFriends[id]?.percentage) || 0;
        const friendVal = Number(((p / 100) * parsedTotal).toFixed(2));
        result.friends[id] = friendVal;
        sum += friendVal;
      });

      result.totalAllocated = Number(sum.toFixed(2));
      result.difference = Number((100 - totalPct).toFixed(2));
      result.isBalanced = Math.abs(100 - totalPct) < 0.01;
    } 
    else if (splitMode === 'SHARES') {
      const selfSh = includeSelf ? (Math.max(1, parseInt(selfShares, 10) || 1)) : 0;
      let sumShares = selfSh;

      selectedFriendIds.forEach(id => {
        const sh = Math.max(1, parseInt(splitFriends[id]?.shares, 10) || 1);
        sumShares += sh;
      });

      if (sumShares > 0) {
        const perShare = parsedTotal / sumShares;
        const selfVal = Number((selfSh * perShare).toFixed(2));
        result.self = selfVal;

        let allocated = selfVal;
        selectedFriendIds.forEach(id => {
          const sh = Math.max(1, parseInt(splitFriends[id]?.shares, 10) || 1);
          const friendVal = Number((sh * perShare).toFixed(2));
          result.friends[id] = friendVal;
          allocated += friendVal;
        });

        result.totalAllocated = Number(allocated.toFixed(2));
        result.difference = Number((parsedTotal - allocated).toFixed(2));
        result.isBalanced = true; // By definition ratios balance
      }
    }

    return result;
  }, [splitMode, parsedTotal, totalParticipantsCount, includeSelf, selfExactAmount, selfPercentage, selfShares, splitFriends, selectedFriendIds]);

  // Quick Action: Distribute remaining equally in EXACT mode
  const handleDistributeRemaining = () => {
    if (parsedTotal <= 0) return;
    const diff = calculatedShares.difference;
    if (diff <= 0) return;

    const count = totalParticipantsCount;
    if (count === 0) return;

    const additionPerPerson = Number((diff / count).toFixed(2));
    if (includeSelf) {
      const cur = parseFloat(selfExactAmount) || 0;
      setSelfExactAmount(Number((cur + additionPerPerson).toFixed(2)).toString());
    }

    setSplitFriends(prev => {
      const next = { ...prev };
      selectedFriendIds.forEach(id => {
        const cur = parseFloat(next[id]?.exactAmount) || 0;
        next[id] = {
          ...next[id],
          exactAmount: Number((cur + additionPerPerson).toFixed(2)).toString()
        };
      });
      return next;
    });
  };

  // Quick Action: Reset equal percentages in PERCENTAGE mode
  const handleEqualizePercentages = () => {
    const count = totalParticipantsCount;
    if (count === 0) return;

    const basePct = Number((100 / count).toFixed(2));
    if (includeSelf) {
      setSelfPercentage(basePct.toString());
    }

    setSplitFriends(prev => {
      const next = { ...prev };
      selectedFriendIds.forEach(id => {
        next[id] = {
          ...next[id],
          percentage: basePct.toString()
        };
      });
      return next;
    });
  };

  // Select all or Clear all
  const handleToggleSelectAll = (select) => {
    setSplitFriends(prev => {
      const next = { ...prev };
      friends.forEach(f => {
        const fid = f.id || f._id;
        if (next[fid]) {
          next[fid] = { ...next[fid], selected: select };
        }
      });
      return next;
    });
  };

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // Form Submission
  // -------------------------------------------------------------
  const handleSubmit = (e) => {
    e.preventDefault();

    if (tab === 'split') {
      const total = parseFloat(splitTotal);
      if (!splitNote.trim() || isNaN(total) || total <= 0) {
        alert('Please enter a valid total amount and bill description.');
        return;
      }

      if (selectedFriendIds.length === 0) {
        alert('Please select at least one friend to split with.');
        return;
      }

      if (!calculatedShares.isBalanced && (splitMode === 'EXACT' || splitMode === 'PERCENTAGE')) {
        const diff = calculatedShares.difference;
        if (splitMode === 'EXACT') {
          alert(`The shares do not add up to the total bill amount (Difference: ₹${Math.abs(diff)}). Please balance before saving.`);
        } else {
          alert(`Total percentages must add up to 100% (Current difference: ${Math.abs(diff)}%).`);
        }
        return;
      }

      const payingFriend = friends.find(f => (f.id || f._id) === payingFriendId);
      const splits = selectedFriendIds.map(id => ({
        friendId: id,
        shareAmount: calculatedShares.friends[id] || 0,
        paidByUser: payerType === 'USER'
      }));

      onSave({
        isGroupSplit: true,
        amount: total,
        category,
        note: splitNote.trim(),
        date,
        time: new Date().toTimeString().slice(0, 5),
        paymentMethod,
        receiptNote,
        payer: payerType === 'USER' ? 'USER' : payingFriendId,
        payerName: payerType === 'USER' ? 'You' : (payingFriend?.name || 'Friend'),
        splitMode,
        userShare: calculatedShares.self,
        splits
      });
    } else {
      const numAmount = parseFloat(amount);
      if (!friendId) {
        alert('Please select a friend.');
        return;
      }
      if (isNaN(numAmount) || numAmount <= 0) {
        alert('Please enter a valid positive amount.');
        return;
      }
      if (!note.trim()) {
        alert('Please enter a description/reason.');
        return;
      }

      onSave({
        friendId,
        type,
        amount: numAmount,
        category,
        note: note.trim(),
        date,
        time: new Date().toTimeString().slice(0, 5),
        paymentMethod,
        receiptNote
      });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-4 pt-3 sm:pt-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto sm:my-0">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/80 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xl flex-shrink-0">💸</span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {tab === 'split' ? 'Split Group Bill' : 'Record Transaction'}
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 active:text-slate-900 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors flex-shrink-0 ml-auto"
            aria-label="Close"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-2.5 bg-slate-100/70 border-b border-slate-200/80 gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setTab('single')}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'single' 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Single Entry</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('split')}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'split' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Split Group Bill 👥</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {friends.length === 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-bold text-xs">No friends found</p>
                  <p className="text-[11px] text-amber-700">Add friends to your circle to record transactions or split bills.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddFriend?.();
                }}
                className="text-xs font-black bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-all whitespace-nowrap self-stretch sm:self-auto text-center"
              >
                + Add Friend Now
              </button>
            </div>
          )}
          
          {tab === 'single' ? (
            <>
              {/* Friend Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Friend *
                </label>
                <select
                  value={friendId}
                  onChange={(e) => setFriendId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  required
                >
                  <option value="">-- Choose a friend --</option>
                  {friends.map(f => (
                    <option key={f.id || f._id} value={f.id || f._id}>
                      {f.name} {f.connectionStatus === 'CONNECTED' ? `(@${f.connectedUserId?.username || f.pendingUsername || 'connected'})` : f.connectionStatus === 'REQUEST_SENT' ? `(@${f.connectedUser?.username || f.pendingUsername || 'user'} - Pending Request)` : ''} ({f.relationshipTag || 'Friend'}) {f.currentBalance > 0 ? `[Owes ₹${f.currentBalance}]` : f.currentBalance < 0 ? `[You owe ₹${Math.abs(f.currentBalance)}]` : '[Settled]'}
                    </option>
                  ))}
                </select>

                {(() => {
                  const selFriend = friends.find(f => (f.id || f._id) === friendId);
                  if (!selFriend) return null;

                  if (selFriend.connectionStatus === 'CONNECTED') {
                    const isAuth = (selFriend.friendPermission || selFriend.permission) === 'AUTHORIZED';
                    const targetUsername = selFriend.connectedUser?.username || selFriend.connectedUserId?.username || selFriend.pendingUsername || selFriend.name;
                    return (
                      <div className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                        isAuth 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        <span className="text-base">{isAuth ? '⚡' : '⏳'}</span>
                        <div className="flex-1">
                          <p className="font-bold">
                            {isAuth ? 'Instant Sync Active' : 'Friend Approval Required (Normal Mode)'}
                          </p>
                          <p className="text-[11px] opacity-90">
                            {isAuth 
                              ? `Will automatically reflect on @${targetUsername}'s MoneyTracker balance.`
                              : `A request will be sent to @${targetUsername} to approve before it affects their ledger.`}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (selFriend.connectionStatus === 'REQUEST_SENT') {
                    const targetUsername = selFriend.connectedUser?.username || selFriend.pendingUsername;
                    return (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                        <span className="text-base">⏳</span>
                        <div>
                          <p className="font-bold">Connection Request Sent (@{targetUsername}) · Pending Acceptance</p>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            This transaction is recorded on your ledger immediately and will automatically sync once they accept.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (selFriend.pendingUsername) {
                    return (
                      <div className="mt-2 p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center gap-2">
                        <span>🏷️</span>
                        <span>Pending username <strong>@{selFriend.pendingUsername}</strong>. Transactions recorded locally until they register.</span>
                      </div>
                    );
                  }

                  return (
                    <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                      <span>👤</span>
                      <span>Offline Friend (tracked only on your device).</span>
                    </div>
                  );
                })()}
              </div>

              {/* Type Switcher (Given vs Received) */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Who paid the money? *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setType('GIVEN')}
                    className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                      type === 'GIVEN'
                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 text-emerald-900 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs text-emerald-700 mb-1">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      <span>I GAVE (LENT)</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Friend owes me this money
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('RECEIVED')}
                    className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                      type === 'RECEIVED'
                        ? 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-300 text-rose-900 shadow-sm ring-2 ring-rose-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs text-rose-700 mb-1">
                      <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                      <span>I RECEIVED (BORROWED)</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      I need to pay friend back
                    </span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-lg font-extrabold text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    required
                  />
                </div>
              </div>

              {/* Note / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Reason *
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Lunch at Swiggy, Uber to airport, WiFi bill"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>
            </>
          ) : (
            <>
              {/* ============================================================= */}
              {/* UPGRADED SPLIT GROUP BILL CONTROLS */}
              {/* ============================================================= */}
              
              {/* Total & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Total Bill Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-indigo-500">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={splitTotal}
                      onChange={(e) => setSplitTotal(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-indigo-50/40 border border-indigo-200 rounded-xl pl-9 pr-3.5 py-2.5 text-lg font-black text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Bill Description *
                  </label>
                  <input
                    type="text"
                    value={splitNote}
                    onChange={(e) => setSplitNote(e.target.value)}
                    placeholder="e.g. Goa Trip Villa, Dinner at BBQ, WiFi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              {/* Who Paid Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>👑 Who Paid The Bill?</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {payerType === 'USER' ? 'You paid for the group' : 'Friend paid for the group'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayerType('USER')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      payerType === 'USER'
                        ? 'bg-indigo-600 text-white shadow-xs font-black'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>👤 I Paid (You)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPayerType('FRIEND');
                      if (!payingFriendId && friends.length > 0) {
                        setPayingFriendId(friends[0].id || friends[0]._id);
                      }
                      setShowFriendPaidPopup(true);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      payerType === 'FRIEND'
                        ? 'bg-purple-600 text-white shadow-xs font-black'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>👥 A Friend Paid</span>
                  </button>
                </div>

                {payerType === 'FRIEND' && (
                  <div className="pt-1.5 space-y-2.5 animate-fadeIn">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Select Paying Friend:
                      </label>
                      <select
                        value={payingFriendId}
                        onChange={(e) => setPayingFriendId(e.target.value)}
                        className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        {friends.map(f => (
                          <option key={f.id || f._id} value={f.id || f._id}>
                            {f.name} ({f.relationshipTag || 'Friend'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Notice Card: explains only balance between you and paying friend is changed */}
                    <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 text-xs shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="text-base flex-shrink-0">💡</span>
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-purple-900 leading-tight">
                              Only updates balance between You and {currentPayingFriendName}
                            </p>
                            <p className="text-[11px] text-purple-800 leading-relaxed font-medium">
                              Records what you owe to <strong>{currentPayingFriendName}</strong>. Other friends' shares will not affect your balance with them.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowFriendPaidPopup(true)}
                          className="text-[10px] font-bold px-2 py-1 bg-purple-200/80 hover:bg-purple-300 text-purple-950 rounded-lg flex-shrink-0 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          View Info
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Split Mode Selector Tabs */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Split Mode
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                  {[
                    { id: 'EQUAL', label: 'Equally', icon: Equal },
                    { id: 'EXACT', label: 'Exact (₹)', icon: Hash },
                    { id: 'PERCENTAGE', label: 'Percent (%)', icon: Percent },
                    { id: 'SHARES', label: 'Shares', icon: PieChart }
                  ].map(m => {
                    const Icon = m.icon;
                    const isActive = splitMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSplitMode(m.id)}
                        className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                          isActive
                            ? 'bg-white text-indigo-700 shadow-xs border border-slate-200 font-black'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="truncate">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allocation Balance Status Banner */}
              {parsedTotal > 0 && (
                <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                  calculatedShares.isBalanced
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {calculatedShares.isBalanced ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {calculatedShares.isBalanced
                        ? `Perfect! All ₹${parsedTotal.toLocaleString()} allocated across ${totalParticipantsCount} people.`
                        : splitMode === 'EXACT'
                        ? calculatedShares.difference > 0
                          ? `₹${Math.abs(calculatedShares.difference)} remaining to be allocated.`
                          : `Exceeded total bill by ₹${Math.abs(calculatedShares.difference)}!`
                        : splitMode === 'PERCENTAGE'
                        ? `Remaining percentage: ${calculatedShares.difference}%`
                        : ''}
                    </span>
                  </div>

                  {!calculatedShares.isBalanced && splitMode === 'EXACT' && calculatedShares.difference > 0 && (
                    <button
                      type="button"
                      onClick={handleDistributeRemaining}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black whitespace-nowrap shadow-2xs"
                    >
                      ⚡ Split Rest
                    </button>
                  )}

                  {!calculatedShares.isBalanced && splitMode === 'PERCENTAGE' && (
                    <button
                      type="button"
                      onClick={handleEqualizePercentages}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black whitespace-nowrap shadow-2xs"
                    >
                      ⚡ Equalize %
                    </button>
                  )}
                </div>
              )}

              {/* Friends Selector Header with Search & Quick Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Select Friends ({selectedFriendIds.length} of {friends.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSelectAll(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => handleToggleSelectAll(false)}
                      className="text-[11px] font-bold text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Search Friends Toolbar */}
                {friends.length > 4 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={friendsSearch}
                      onChange={(e) => setFriendsSearch(e.target.value)}
                      placeholder="Search friends in circle..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Self inclusion row */}
                <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2.5 font-bold text-indigo-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSelf}
                      onChange={(e) => setIncludeSelf(e.target.checked)}
                      className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Include Myself in the split</span>
                  </label>

                  {includeSelf && (
                    <div className="flex items-center gap-2">
                      {splitMode === 'EXACT' && (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-500 font-bold">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0"
                            value={selfExactAmount}
                            onChange={(e) => setSelfExactAmount(e.target.value)}
                            className="w-20 bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-right"
                          />
                        </div>
                      )}
                      {splitMode === 'PERCENTAGE' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={selfPercentage}
                            onChange={(e) => setSelfPercentage(e.target.value)}
                            className="w-16 bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-right"
                          />
                          <span className="text-[11px] text-slate-500 font-bold">%</span>
                        </div>
                      )}
                      {splitMode === 'SHARES' && (
                        <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded-lg px-1.5 py-0.5">
                          <button
                            type="button"
                            onClick={() => setSelfShares(Math.max(1, selfShares - 1))}
                            className="p-0.5 text-slate-500 hover:text-slate-900"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-xs">{selfShares}x</span>
                          <button
                            type="button"
                            onClick={() => setSelfShares(selfShares + 1)}
                            className="p-0.5 text-slate-500 hover:text-slate-900"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <div className="font-mono text-xs font-black text-indigo-700 bg-white px-2 py-1 rounded-lg border border-indigo-100 shadow-2xs">
                        ₹{calculatedShares.self}
                      </div>
                    </div>
                  )}
                </div>

                {/* Friends List with interactive controls */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 max-h-52 overflow-y-auto space-y-1.5">
                  {visibleFriends.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-4">No matching friends found.</p>
                  ) : (
                    visibleFriends.map(f => {
                      const fid = f.id || f._id;
                      const isChecked = splitFriends[fid]?.selected || false;
                      const shareVal = calculatedShares.friends[fid] || 0;

                      return (
                        <div 
                          key={fid}
                          className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                            isChecked
                              ? 'bg-white border-slate-200/90 shadow-2xs'
                              : 'bg-slate-100/50 border-transparent opacity-60'
                          }`}
                        >
                          <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setSplitFriends(prev => ({
                                  ...prev,
                                  [fid]: {
                                    ...prev[fid],
                                    selected: e.target.checked
                                  }
                                }));
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span 
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shadow-2xs flex-shrink-0"
                              style={{ backgroundColor: f.avatarColor || '#6366f1' }}
                            >
                              {f.avatarEmoji || '👤'}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{f.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{f.relationshipTag || 'Friend'}</p>
                            </div>
                          </label>

                          {isChecked && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {splitMode === 'EXACT' && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0"
                                    value={splitFriends[fid]?.exactAmount || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSplitFriends(prev => ({
                                        ...prev,
                                        [fid]: { ...prev[fid], exactAmount: val }
                                      }));
                                    }}
                                    className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-right focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                              )}

                              {splitMode === 'PERCENTAGE' && (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    placeholder="0"
                                    value={splitFriends[fid]?.percentage || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSplitFriends(prev => ({
                                        ...prev,
                                        [fid]: { ...prev[fid], percentage: val }
                                      }));
                                    }}
                                    className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-right focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                  <span className="text-[11px] text-slate-400 font-bold">%</span>
                                </div>
                              )}

                              {splitMode === 'SHARES' && (
                                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cur = splitFriends[fid]?.shares || 1;
                                      setSplitFriends(prev => ({
                                        ...prev,
                                        [fid]: { ...prev[fid], shares: Math.max(1, cur - 1) }
                                      }));
                                    }}
                                    className="p-0.5 text-slate-500 hover:text-slate-900"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center font-mono font-bold text-xs">
                                    {splitFriends[fid]?.shares || 1}x
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cur = splitFriends[fid]?.shares || 1;
                                      setSplitFriends(prev => ({
                                        ...prev,
                                        [fid]: { ...prev[fid], shares: cur + 1 }
                                      }));
                                    }}
                                    className="p-0.5 text-slate-500 hover:text-slate-900"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              <div className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                                ₹{shareVal}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Live Summary Preview Card */}
              {parsedTotal > 0 && selectedFriendIds.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">
                      {payerType === 'USER' ? 'You Paid (Total):' : `${friends.find(f => (f.id || f._id) === payingFriendId)?.name || 'Friend'} Paid:`}
                    </span>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      ₹{parsedTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                    <span className="text-indigo-200">
                      {payerType === 'USER' 
                        ? `Total to collect from ${selectedFriendIds.length} friends:`
                        : `You will owe paying friend:`}
                    </span>
                    <span className="font-mono font-black text-white">
                      {payerType === 'USER' 
                        ? `+₹${(parsedTotal - calculatedShares.self).toLocaleString()}` 
                        : `-₹${calculatedShares.self.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {CATEGORIES.map(cat => {
                const isSelected = category === cat.name;
                const catColorClasses = {
                  'Food & Dining': isSelected ? 'bg-amber-100 border-amber-300 text-amber-900 ring-2 ring-amber-500/20' : '',
                  'Rent & Bills': isSelected ? 'bg-blue-100 border-blue-300 text-blue-900 ring-2 ring-blue-500/20' : '',
                  'Travel & Trips': isSelected ? 'bg-purple-100 border-purple-300 text-purple-900 ring-2 ring-purple-500/20' : '',
                  'Entertainment': isSelected ? 'bg-pink-100 border-pink-300 text-pink-900 ring-2 ring-pink-500/20' : '',
                  'Loans & Cash': isSelected ? 'bg-emerald-100 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/20' : '',
                  'Shopping': isSelected ? 'bg-indigo-100 border-indigo-300 text-indigo-900 ring-2 ring-indigo-500/20' : '',
                  'General': isSelected ? 'bg-slate-200 border-slate-400 text-slate-900 ring-2 ring-slate-500/20' : ''
                }[cat.name] || '';

                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                      isSelected
                        ? catColorClasses + ' shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="truncate w-full text-center">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Payment Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Mode
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Cash Handoff</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="NetBanking">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Receipt Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Receipt / Ref ID (Optional)
            </label>
            <input
              type="text"
              value={receiptNote}
              onChange={(e) => setReceiptNote(e.target.value)}
              placeholder="e.g. Order #1234, Swiggy bill, Hotel invoice"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{tab === 'split' ? 'Record Group Split' : 'Save Record'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Friend Paid Info Pop-up Modal */}
      {showFriendPaidPopup && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowFriendPaidPopup(false)}
        >
          <div 
            className="bg-white border border-purple-200/90 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative gradient glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-200/60 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-200/50 rounded-full blur-2xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-start justify-between relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 flex items-center justify-center text-2xl shadow-xs border border-purple-200/60">
                  👥
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    A Friend Paid The Bill
                  </h3>
                  <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md uppercase tracking-wider">
                    Balance Update Notice
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFriendPaidPopup(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Message Callout */}
            <div className="p-3.5 bg-gradient-to-br from-purple-50 via-purple-50/50 to-indigo-50/40 rounded-2xl border border-purple-200 text-xs space-y-1.5 relative">
              <p className="font-black text-purple-950 text-sm leading-snug">
                📢 Only changes balance between <span className="underline decoration-purple-400 decoration-2">YOU</span> and <span className="text-purple-700">{currentPayingFriendName}</span>!
              </p>
              <p className="text-[11.5px] text-purple-900/90 font-medium leading-relaxed">
                When a friend pays for the group, your MoneyTracker account will only record what <strong>you owe to {currentPayingFriendName}</strong>.
              </p>
            </div>

            {/* Breakdown Cards */}
            <div className="space-y-2 text-xs relative">
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5">
                <span className="text-base flex-shrink-0">✅</span>
                <div className="space-y-0.5">
                  <p className="font-extrabold text-emerald-950 text-[11.5px]">
                    You & {currentPayingFriendName}
                  </p>
                  <p className="text-[11px] text-emerald-900 font-medium leading-relaxed">
                    Your personal share {calculatedShares.self > 0 ? `(₹${calculatedShares.self})` : ''} will be recorded as money <strong>you owe to {currentPayingFriendName}</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <span className="text-base flex-shrink-0">⏸️</span>
                <div className="space-y-0.5">
                  <p className="font-extrabold text-slate-900 text-[11.5px]">
                    Other Friends in Split
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Other friends owe their shares directly to <strong>{currentPayingFriendName}</strong>. Your personal balances with them will <strong>remain unchanged</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Friend Selector inside popup */}
            {friends && friends.length > 0 && (
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Paying Friend:
                </label>
                <select
                  value={payingFriendId}
                  onChange={(e) => setPayingFriendId(e.target.value)}
                  className="w-full bg-slate-50 border border-purple-200 rounded-xl px-3 py-2 text-xs font-bold text-purple-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  {friends.map(f => (
                    <option key={f.id || f._id} value={f.id || f._id}>
                      {f.name} ({f.relationshipTag || 'Friend'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Got It Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowFriendPaidPopup(false)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Understood, Got It 👍
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
