import React, { useState, useEffect } from 'react';
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

export default function TransactionForm({ isOpen, onClose, onSave, friends = [], preselectedFriendId = '' }) {
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
    if (preselectedFriendId) {
      setFriendId(preselectedFriendId);
    }
  }, [preselectedFriendId]);

  useEffect(() => {
    // Initialize split friend map
    const initial = {};
    friends.forEach(f => {
      initial[f.id] = { selected: true, share: 0 };
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">💸</span>
            <h2 className="text-lg font-bold text-white">Record Transaction</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-3 bg-slate-950/60 border-b border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => setTab('single')}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'single' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Single Entry</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('split')}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'split' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Split Group Bill</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {tab === 'single' ? (
            <>
              {/* Friend Select */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Friend *
                </label>
                <select
                  value={friendId}
                  onChange={(e) => setFriendId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  required
                >
                  <option value="">-- Choose a friend --</option>
                  {friends.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.relationshipTag || 'Friend'}) {f.currentBalance > 0 ? `[Owes ${f.currentBalance}]` : f.currentBalance < 0 ? `[You owe ${Math.abs(f.currentBalance)}]` : '[Settled]'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Switcher (Given vs Received) */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Direction *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('GIVEN')}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-xs font-bold transition-all ${
                      type === 'GIVEN'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>I Gave (They Owe Me)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('RECEIVED')}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-xs font-bold transition-all ${
                      type === 'RECEIVED'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-400 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>I Received (I Owe Them)</span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-lg font-extrabold text-slate-100 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              {/* Note / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description / Reason *
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Lunch at Swiggy, Uber to airport, WiFi bill"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
            </>
          ) : (
            <>
              {/* Group Split Bill Form */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Total Bill Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={splitTotal}
                    onChange={(e) => setSplitTotal(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-lg font-extrabold text-slate-100 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Bill Description *
                </label>
                <input
                  type="text"
                  value={splitNote}
                  onChange={(e) => setSplitNote(e.target.value)}
                  placeholder="e.g. Goa Trip Hotel, Team Dinner, Groceries"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Split Among Friends:</span>
                <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSelf}
                    onChange={(e) => setIncludeSelf(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-brand-600 focus:ring-0"
                  />
                  <span>Include myself in split</span>
                </label>
              </div>

              {/* Friends checklist */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 max-h-44 overflow-y-auto space-y-2">
                {friends.map(f => (
                  <div key={f.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-900 last:border-0">
                    <label className="flex items-center gap-2.5 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={selectedSplitFriends[f.id]?.selected || false}
                        onChange={(e) => {
                          const updated = { ...selectedSplitFriends };
                          if (updated[f.id]) {
                            updated[f.id].selected = e.target.checked;
                          }
                          setSelectedSplitFriends(updated);
                        }}
                        className="rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-0"
                      />
                      <span>{f.avatarEmoji || '👤'} <strong>{f.name}</strong></span>
                    </label>
                    <div className="font-mono text-emerald-400 font-bold">
                      ₹{selectedSplitFriends[f.id]?.share || 0}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                    category === cat.name
                      ? 'bg-brand-600/20 border-brand-500 text-brand-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="truncate w-full text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Payment Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Payment Mode
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
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
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Receipt / Ref ID (Optional)
            </label>
            <input
              type="text"
              value={receiptNote}
              onChange={(e) => setReceiptNote(e.target.value)}
              placeholder="e.g. Order #1234, UPI ref"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-brand-500/25 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Save Record</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
