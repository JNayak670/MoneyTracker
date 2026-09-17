import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, User, ArrowUpRight, ArrowDownLeft, Calendar, Tag, CreditCard, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { name: 'Food & Dining', icon: '🍕' },
  { name: 'Rent & Bills', icon: '🏠' },
  { name: 'Travel & Trips', icon: '✈️' },
  { name: 'Entertainment', icon: '🍿' },
  { name: 'Loans & Cash', icon: '💰' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'General', icon: '🏷️' }
];

export default function TransactionForm({ isOpen, onClose, onSave, friends = [], preselectedFriendId = '', onOpenAddFriend }) {
  const [tab, setTab] = useState('single'); // 'single' | 'split'
  const [friendId, setFriendId] = useState(preselectedFriendId || '');
  const [type, setType] = useState('GIVEN'); // 'GIVEN' (You gave / paid) | 'RECEIVED' (Friend gave / paid)
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [receiptNote, setReceiptNote] = useState('');

  // Group Split State
  const [splitTotal, setSplitTotal] = useState('');
  const [splitNote, setSplitNote] = useState('');
  const [includeSelf, setIncludeSelf] = useState(true);
  const [selectedSplitFriends, setSelectedSplitFriends] = useState({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFriendId(preselectedFriendId || '');
      setAmount('');
      setNote('');
      setSplitTotal('');
      setSplitNote('');
      setReceiptNote('');
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen, preselectedFriendId]);

  useEffect(() => {
    // Initialize split friend map
    const initial = {};
    (Array.isArray(friends) ? friends : []).forEach(f => {
      const fid = f?.id || f?._id;
      if (fid) {
        initial[fid] = { selected: true, share: 0 };
      }
    });
    setSelectedSplitFriends(initial);
  }, [friends]);

  // Recalculate shares when splitTotal or selected friends changes
  useEffect(() => {
    const total = parseFloat(splitTotal) || 0;
    const selectedIds = Object.keys(selectedSplitFriends).filter(id => selectedSplitFriends[id].selected);
    const count = selectedIds.length + (includeSelf ? 1 : 0);

    if (count > 0 && total > 0) {
      const sharePerPerson = Number((total / count).toFixed(2));
      const updated = { ...selectedSplitFriends };
      Object.keys(updated).forEach(id => {
        if (updated[id].selected) {
          updated[id].share = sharePerPerson;
        } else {
          updated[id].share = 0;
        }
      });
      setSelectedSplitFriends(updated);
    }
  }, [splitTotal, includeSelf]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (tab === 'split') {
      const total = parseFloat(splitTotal);
      if (!splitNote.trim() || isNaN(total) || total <= 0) {
        alert('Please enter a valid total amount and description for the split.');
        return;
      }

      const splits = Object.keys(selectedSplitFriends)
        .filter(id => selectedSplitFriends[id].selected && selectedSplitFriends[id].share > 0)
        .map(id => ({
          friendId: id,
          shareAmount: selectedSplitFriends[id].share,
          paidByUser: true
        }));

      if (splits.length === 0) {
        alert('Please select at least one friend for the split.');
        return;
      }

      onSave({
        isGroupSplit: true,
        amount: total,
        category,
        note: splitNote.trim(),
        date,
        paymentMethod,
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
        paymentMethod,
        receiptNote
      });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-4 pt-3 sm:pt-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto sm:my-0">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="text-xl">💸</span>
            <h2 className="text-lg font-bold text-slate-900">Record Transaction</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-2.5 bg-slate-100/70 border-b border-slate-200/80 gap-2">
          <button
            type="button"
            onClick={() => setTab('single')}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'single' ? 'bg-white text-brand-700 shadow-sm border border-slate-200/80' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Single Entry</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('split')}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'split' ? 'bg-white text-brand-700 shadow-sm border border-slate-200/80' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Split Group Bill</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {friends.length === 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-bold text-xs">No friends found</p>
                  <p className="text-[11px] text-amber-700">Add a friend to your circle before recording transactions.</p>
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
                      {f.name} {f.connectionStatus === 'CONNECTED' ? `(@${f.connectedUserId?.username || f.pendingUsername || 'connected'})` : ''} ({f.relationshipTag || 'Friend'}) {f.currentBalance > 0 ? `[Owes ₹${f.currentBalance}]` : f.currentBalance < 0 ? `[You owe ₹${Math.abs(f.currentBalance)}]` : '[Settled]'}
                    </option>
                  ))}
                </select>

                {(() => {
                  const selFriend = friends.find(f => (f.id || f._id) === friendId);
                  if (!selFriend) return null;

                  if (selFriend.connectionStatus === 'CONNECTED') {
                    const isAuth = selFriend.permission === 'AUTHORIZED';
                    return (
                      <div className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                        isAuth 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        <span className="text-base">{isAuth ? '⚡' : '⏳'}</span>
                        <div className="flex-1">
                          <p className="font-bold">
                            {isAuth ? 'Instant 2-Way Sync Active' : 'Friend Approval Required (Normal Mode)'}
                          </p>
                          <p className="text-[11px] opacity-90">
                            {isAuth 
                              ? `Will automatically reflect on @${selFriend.connectedUser?.username || selFriend.connectedUserId?.username || selFriend.pendingUsername || selFriend.name}'s MoneyTracker balance.`
                              : `A request will be sent to @${selFriend.connectedUser?.username || selFriend.connectedUserId?.username || selFriend.pendingUsername || selFriend.name} to approve before it affects their ledger.`}
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
              {/* Group Split Bill Form */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Total Bill Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={splitTotal}
                    onChange={(e) => setSplitTotal(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-lg font-extrabold text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bill Description *
                </label>
                <input
                  type="text"
                  value={splitNote}
                  onChange={(e) => setSplitNote(e.target.value)}
                  placeholder="e.g. Goa Trip Hotel, Team Dinner, Groceries"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-bold text-slate-700 uppercase">Split Among Friends:</span>
                <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSelf}
                    onChange={(e) => setIncludeSelf(e.target.checked)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>Include myself in split</span>
                </label>
              </div>

              {/* Friends checklist */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-44 overflow-y-auto space-y-2">
                {friends.map(f => {
                  const fid = f.id || f._id;
                  return (
                    <div key={fid} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/80 last:border-0">
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-800">
                        <input
                          type="checkbox"
                          checked={selectedSplitFriends[fid]?.selected || false}
                          onChange={(e) => {
                            const updated = { ...selectedSplitFriends };
                            if (updated[fid]) {
                              updated[fid].selected = e.target.checked;
                            } else {
                              updated[fid] = { selected: e.target.checked, share: 0 };
                            }
                            setSelectedSplitFriends(updated);
                          }}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span>{f.avatarEmoji || '👤'} <strong>{f.name}</strong></span>
                      </label>
                      <div className="font-mono text-emerald-700 font-bold">
                        ₹{selectedSplitFriends[fid]?.share || 0}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
              placeholder="e.g. Order #1234, UPI ref"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Save Record</span>
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
}
