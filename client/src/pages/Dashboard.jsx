import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import SummaryCard from '../components/SummaryCard';
import FriendCard from '../components/FriendCard';
import SettleModal from '../components/SettleModal';
import WhatsAppModal from '../components/WhatsAppModal';
import { exportToCSV } from '../services/exportService';
import { 
  Users, 
  Receipt, 
  ArrowRight, 
  Sparkles, 
  PlusCircle, 
  Download,
  AlertCircle 
} from 'lucide-react';

export default function Dashboard({ onOpenAddTx, onOpenAddFriend, onViewFriendHistory }) {
  const [summary, setSummary] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [settleModal, setSettleModal] = useState({ open: false, friendId: '', friendName: '', amount: 0 });
  const [whatsappModal, setWhatsappModal] = useState({ open: false, friendName: '', amount: 0, phone: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, friendsRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/friends')
      ]);
      setSummary(sumRes.data);
      setFriends(friendsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSettleSubmit = async (payload) => {
    try {
      await api.post('/transactions/settle', payload);
      setSettleModal({ open: false, friendId: '', friendName: '', amount: 0 });
      await fetchData();
    } catch (err) {
      alert(`Settlement failed: ${err.message}`);
    }
  };

  const handleDeleteFriend = async (id) => {
    if (!confirm('Are you sure you want to delete this friend? All their transactions will be deleted.')) return;
    try {
      await api.delete(`/friends/${id}`);
      await fetchData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const currency = summary?.currency || '₹';
  const activeFriends = friends.filter(f => f.currentBalance !== 0).slice(0, 6);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Financial Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time balance sheet for your friend circle & shared expenses
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddFriend}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-800 transition-colors"
          >
            <span>👤+</span> <span>New Friend</span>
          </button>
          <button
            onClick={onOpenAddTx}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-500/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Given (Lent)"
          amount={summary?.totalGiven || 0}
          type="given"
          currency={currency}
          subtext={`${friends.filter(f => f.currentBalance > 0).length} friends owe you`}
        />
        <SummaryCard
          title="Total Received"
          amount={summary?.totalReceived || 0}
          type="received"
          currency={currency}
          subtext={`You owe ${friends.filter(f => f.currentBalance < 0).length} friends`}
        />
        <SummaryCard
          title="Net Circle Position"
          amount={summary?.netBalance || 0}
          type="net"
          currency={currency}
          subtext={summary?.netBalance >= 0 ? '🟢 Surplus balance' : '🔴 Deficit balance'}
        />
        <SummaryCard
          title="Pending Dues"
          amount={summary?.totalReceivable || 0}
          type="pending"
          currency={currency}
          subtext={`${summary?.activeDuesCount || 0} active balances`}
        />
      </div>

      {/* Friends with Outstanding Dues */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-bold text-white">Active Friends</h2>
          </div>
          <Link
            to="/friends"
            className="flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors"
          >
            <span>View All ({friends.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeFriends.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center border-dashed">
            <span className="text-3xl mb-2 block">🤝</span>
            <h3 className="font-bold text-base text-white">All Dues Are Settled!</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No outstanding balances with any friend. Click below to add a new transaction.
            </p>
            <button
              onClick={onOpenAddTx}
              className="mt-4 inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record New Expense</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeFriends.map(friend => (
              <FriendCard
                key={friend.id}
                friend={friend}
                currency={currency}
                onAddTx={(id) => onOpenAddTx(id)}
                onViewHistory={(id) => onViewFriendHistory(id)}
                onSettle={(id, amt, name) => setSettleModal({ open: true, friendId: id, friendName: name, amount: amt })}
                onRemind={(id, amt, name, phone) => setWhatsappModal({ open: true, friendName: name, amount: amt, phone })}
                onEdit={(f) => onOpenAddFriend(f)}
                onDelete={handleDeleteFriend}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Table */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
          </div>
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors"
          >
            <span>Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden shadow-xl">
          {summary?.recentTransactions?.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Friend</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Note</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {summary.recentTransactions.map(t => {
                    const isGiven = t.type === 'GIVEN' || t.impactOnUser > 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5 text-slate-400 font-mono">
                          {t.date}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-200">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                              style={{ backgroundColor: t.friend?.avatarColor || '#6366f1' }}
                            >
                              {t.friend?.avatarEmoji || '👤'}
                            </span>
                            <span>{t.friend?.name || 'Friend'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            t.type === 'SETTLED'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : isGiven
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300 font-medium max-w-xs truncate">
                          {t.note}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400">
                          {t.category}
                        </td>
                        <td className={`px-5 py-3.5 text-right font-extrabold text-sm ${
                          isGiven ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isGiven ? '+' : '-'}{currency}{t.amount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Settle Modal */}
      <SettleModal
        isOpen={settleModal.open}
        onClose={() => setSettleModal({ open: false, friendId: '', friendName: '', amount: 0 })}
        onSettle={handleSettleSubmit}
        friendId={settleModal.friendId}
        friendName={settleModal.friendName}
        initialAmount={settleModal.amount}
        currency={currency}
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={whatsappModal.open}
        onClose={() => setWhatsappModal({ open: false, friendName: '', amount: 0, phone: '' })}
        friendName={whatsappModal.friendName}
        amount={whatsappModal.amount}
        phone={whatsappModal.phone}
        currency={currency}
      />

    </div>
  );
}
