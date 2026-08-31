import React, { useState, useEffect } from 'react';
import api from '../services/api';
import FriendCard from '../components/FriendCard';
import SettleModal from '../components/SettleModal';
import WhatsAppModal from '../components/WhatsAppModal';
import { printFriendStatement } from '../services/exportService';
import { 
  Users, 
  Search, 
  PlusCircle, 
  X, 
  Printer, 
  CheckCircle2, 
  History, 
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export default function Friends({ onOpenAddTx, editingFriend, onOpenAddFriend, onCloseFriendModal, historyFriendId, onCloseHistory }) {
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'OWES_YOU' | 'YOU_OWE' | 'SETTLED'
  const [loading, setLoading] = useState(true);

  // Friend Detail / History Drawer State
  const [activeLedger, setActiveLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Add/Edit Friend Form Modal State
  const [friendModalOpen, setFriendModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationshipTag: 'Friend',
    avatarEmoji: '👤',
    avatarColor: '#6366f1',
    notes: ''
  });

  // Action Modals
  const [settleModal, setSettleModal] = useState({ open: false, friendId: '', friendName: '', amount: 0 });
  const [whatsappModal, setWhatsappModal] = useState({ open: false, friendName: '', amount: 0, phone: '' });

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const res = await api.get('/friends');
      setFriends(res.data);
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (editingFriend) {
      setFormData({
        name: editingFriend.name || '',
        phone: editingFriend.phone || '',
        email: editingFriend.email || '',
        relationshipTag: editingFriend.relationshipTag || 'Friend',
        avatarEmoji: editingFriend.avatarEmoji || '👤',
        avatarColor: editingFriend.avatarColor || '#6366f1',
        notes: editingFriend.notes || ''
      });
      setFriendModalOpen(true);
    }
  }, [editingFriend]);

  // Load history if requested from parent
  useEffect(() => {
    if (historyFriendId) {
      loadFriendLedger(historyFriendId);
    }
  }, [historyFriendId]);

  const loadFriendLedger = async (id) => {
    try {
      setLedgerLoading(true);
      const res = await api.get(`/friends/${id}`);
      setActiveLedger(res.data);
    } catch (err) {
      alert(`Failed to load history: ${err.message}`);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleSaveFriend = async (e) => {
    e.preventDefault();
    try {
      if (editingFriend?.id) {
        await api.put(`/friends/${editingFriend.id}`, formData);
      } else {
        await api.post('/friends', formData);
      }
      setFriendModalOpen(false);
      onCloseFriendModal();
      await fetchFriends();
    } catch (err) {
      alert(`Save friend error: ${err.message}`);
    }
  };

  const handleDeleteFriend = async (id) => {
    if (!confirm('Are you sure you want to delete this friend? All transaction logs will be removed.')) return;
    try {
      await api.delete(`/friends/${id}`);
      if (activeLedger?.friend?.id === id) setActiveLedger(null);
      await fetchFriends();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleSettleSubmit = async (payload) => {
    try {
      await api.post('/transactions/settle', payload);
      setSettleModal({ open: false, friendId: '', friendName: '', amount: 0 });
      await fetchFriends();
      if (activeLedger) {
        await loadFriendLedger(payload.friendId);
      }
    } catch (err) {
      alert(`Settlement error: ${err.message}`);
    }
  };

  const filteredFriends = friends.filter(f => {
    if (filter === 'OWES_YOU' && f.currentBalance <= 0) return false;
    if (filter === 'YOU_OWE' && f.currentBalance >= 0) return false;
    if (filter === 'SETTLED' && f.currentBalance !== 0) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        (f.relationshipTag && f.relationshipTag.toLowerCase().includes(q)) ||
        (f.phone && f.phone.includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Friends Circle
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage peer debts, view individual running ledgers & send WhatsApp reminders
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: '',
              phone: '',
              email: '',
              relationshipTag: 'Friend',
              avatarEmoji: '👤',
              avatarColor: '#6366f1',
              notes: ''
            });
            setFriendModalOpen(true);
          }}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-500/25 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Friend</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friend by name, tag, phone number..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'OWES_YOU', label: 'Owes You ↗️' },
            { id: 'YOU_OWE', label: 'You Owe ↙️' },
            { id: 'SETTLED', label: 'Settled ✅' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filter === btn.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Friends Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading circle...</div>
      ) : filteredFriends.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border-dashed">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-base text-white">No Friends Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No contacts match the filter criteria. Add your first friend to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFriends.map(friend => (
            <FriendCard
              key={friend.id}
              friend={friend}
              onAddTx={(id) => onOpenAddTx(id)}
              onViewHistory={(id) => loadFriendLedger(id)}
              onSettle={(id, amt, name) => setSettleModal({ open: true, friendId: id, friendName: name, amount: amt })}
              onRemind={(id, amt, name, phone) => setWhatsappModal({ open: true, friendName: name, amount: amt, phone })}
              onEdit={(f) => {
                setFormData(f);
                setFriendModalOpen(true);
              }}
              onDelete={handleDeleteFriend}
            />
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FRIEND LEDGER HISTORY MODAL DRAWER */}
      {/* ------------------------------------------------------------- */}
      {activeLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md border border-white/10"
                  style={{ backgroundColor: activeLedger.friend.avatarColor || '#6366f1' }}
                >
                  {activeLedger.friend.avatarEmoji || '👤'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{activeLedger.friend.name}</h2>
                  <span className="text-xs font-semibold text-slate-400">{activeLedger.friend.relationshipTag || 'Friend'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => printFriendStatement(activeLedger)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                  title="Print Formal Ledger Statement"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setActiveLedger(null);
                    onCloseHistory?.();
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Balance Status Banner */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    Current Running Balance
                  </span>
                  <div className={`text-2xl font-black mt-0.5 ${
                    activeLedger.currentBalance > 0
                      ? 'text-emerald-400'
                      : activeLedger.currentBalance < 0
                      ? 'text-rose-400'
                      : 'text-cyan-400'
                  }`}>
                    {activeLedger.currentBalance > 0 && `Friend Owes You ₹${activeLedger.currentBalance.toLocaleString()}`}
                    {activeLedger.currentBalance < 0 && `You Owe Friend ₹${Math.abs(activeLedger.currentBalance).toLocaleString()}`}
                    {activeLedger.currentBalance === 0 && 'All Dues Settled (₹0)'}
                  </div>
                </div>

                <div className="flex gap-2">
                  {activeLedger.currentBalance !== 0 && (
                    <button
                      onClick={() => setSettleModal({ open: true, friendId: activeLedger.friend.id, friendName: activeLedger.friend.name, amount: Math.abs(activeLedger.currentBalance) })}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Settle Up</span>
                    </button>
                  )}
                  {activeLedger.currentBalance > 0 && (
                    <button
                      onClick={() => setWhatsappModal({ open: true, friendName: activeLedger.friend.name, amount: activeLedger.currentBalance, phone: activeLedger.friend.phone })}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>Remind</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chronological Timeline */}
              <div>
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-400" />
                  <span>Ledger Progression & History ({activeLedger.transactions.length})</span>
                </h3>

                {activeLedger.transactions.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-500 font-medium">No transactions recorded yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {activeLedger.transactions.map((t) => {
                      const isGiven = t.type === 'GIVEN' || t.impactOnUser > 0;
                      return (
                        <div key={t.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-200">{t.note}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                                {t.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              📅 {t.date} {t.time || ''} • via {t.paymentMethod || 'UPI'}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`text-sm font-extrabold ${isGiven ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isGiven ? '+' : '-'}₹{t.amount.toLocaleString()}
                            </div>
                            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                              Running: ₹{t.runningBalance.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD / EDIT FRIEND MODAL */}
      {/* ------------------------------------------------------------- */}
      {friendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                {editingFriend?.id ? 'Edit Friend Details' : 'Add Friend to Circle'}
              </h2>
              <button
                onClick={() => {
                  setFriendModalOpen(false);
                  onCloseFriendModal?.();
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFriend} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tag / Group
                  </label>
                  <select
                    value={formData.relationshipTag}
                    onChange={(e) => setFormData({ ...formData, relationshipTag: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Roommate">Roommate 🏠</option>
                    <option value="College Friend">College Friend 🎓</option>
                    <option value="Colleague">Colleague 💼</option>
                    <option value="Trip Buddy">Trip Buddy ✈️</option>
                    <option value="Family">Family 👨‍👩‍👧</option>
                    <option value="Friend">Friend 👤</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Avatar Emoji
                  </label>
                  <input
                    type="text"
                    value={formData.avatarEmoji}
                    onChange={(e) => setFormData({ ...formData, avatarEmoji: e.target.value })}
                    placeholder="🍕, 🚗, ☕, 😎"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 text-center text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Badge Color
                  </label>
                  <input
                    type="color"
                    value={formData.avatarColor}
                    onChange={(e) => setFormData({ ...formData, avatarColor: e.target.value })}
                    className="w-full h-10 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Flat 402, Goa trip group"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setFriendModalOpen(false);
                    onCloseFriendModal?.();
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-brand-500/25 transition-all"
                >
                  Save Friend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Modal */}
      <SettleModal
        isOpen={settleModal.open}
        onClose={() => setSettleModal({ open: false, friendId: '', friendName: '', amount: 0 })}
        onSettle={handleSettleSubmit}
        friendId={settleModal.friendId}
        friendName={settleModal.friendName}
        initialAmount={settleModal.amount}
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={whatsappModal.open}
        onClose={() => setWhatsappModal({ open: false, friendName: '', amount: 0, phone: '' })}
        friendName={whatsappModal.friendName}
        amount={whatsappModal.amount}
        phone={whatsappModal.phone}
      />

    </div>
  );
}
