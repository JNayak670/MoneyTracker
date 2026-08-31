import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import SummaryCard from '../components/SummaryCard';
import FriendCard from '../components/FriendCard';
import SettleModal from '../components/SettleModal';
import WhatsAppModal from '../components/WhatsAppModal';
import ShareCodeModal from '../components/ShareCodeModal';
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
  const [shareModal, setShareModal] = useState({ open: false, friendId: '', friendName: '' });

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

    const handleUpdate = () => {
      fetchData();
    };

    window.addEventListener('transaction-updated', handleUpdate);
    return () => {
      window.removeEventListener('transaction-updated', handleUpdate);
    };
  }, []);

  const handleSettleSubmit = async (payload) => {
    try {
      await api.post('/transactions/settle', payload);
      setSettleModal({ open: false, friendId: '', friendName: '', amount: 0 });
      await fetchData();
      window.dispatchEvent(new Event('transaction-updated'));
    } catch (err) {
      alert(`Settlement failed: ${err.message}`);
    }
  };

  const handleDeleteFriend = async (id) => {
    if (!confirm('Are you sure you want to delete this friend? All their transactions will be deleted.')) return;
    try {
      await api.delete(`/friends/${id}`);
      await fetchData();
      window.dispatchEvent(new Event('transaction-updated'));
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Financial Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time balance sheet for your friend circle & shared expenses
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddFriend}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            <span>👤+</span> <span>New Friend</span>
          </button>
          <button
            onClick={onOpenAddTx}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
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
            <Users className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">Active Friends</h2>
          </div>
          <Link
            to="/friends"
            className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
          >
            <span>View All ({friends.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeFriends.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center border-dashed">
            <span className="text-3xl mb-2 block">🤝</span>
            <h3 className="font-bold text-base text-slate-900">All Dues Are Settled!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No outstanding balances with any friend. Click below to add a new transaction.
            </p>
            <button
              onClick={onOpenAddTx}
              className="mt-4 inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all"
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
                onShareCode={(id, name) => setShareModal({ open: true, friendId: id, friendName: name })}
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
            <Receipt className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
          </div>
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
          >
            <span>Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
          {summary?.recentTransactions?.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-extrabold">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Friend</th>
                    <th className="px-5 py-4">Flow / Type</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {summary.recentTransactions.map(t => {
                    const isGiven = t.type === 'GIVEN' || t.impactOnUser > 0;
                    const isSettled = t.type === 'SETTLED';

                    const categoryColors = {
                      'Food & Dining': 'bg-amber-50 text-amber-800 border-amber-200',
                      'Rent & Bills': 'bg-blue-50 text-blue-800 border-blue-200',
                      'Travel & Trips': 'bg-purple-50 text-purple-800 border-purple-200',
                      'Entertainment': 'bg-pink-50 text-pink-800 border-pink-200',
                      'Loans & Cash': 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      'Settlement': 'bg-cyan-50 text-cyan-800 border-cyan-200',
                      'Shopping': 'bg-indigo-50 text-indigo-800 border-indigo-200',
                    }[t.category] || 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 text-slate-500 font-mono font-medium">
                          {t.date}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <span 
                              className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shadow-xs border border-black/5"
                              style={{ backgroundColor: t.friend?.avatarColor || '#6366f1' }}
                            >
                              {t.friend?.avatarEmoji || '👤'}
                            </span>
                            <span>{t.friend?.name || 'Friend'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-[11px] border ${
                            isSettled
                              ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                              : isGiven
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isSettled ? '🤝 Settled' : isGiven ? '↗️ Lent (You Paid)' : '↙️ Borrowed (They Paid)'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700 font-medium max-w-xs truncate">
                          {t.note || '-'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${categoryColors}`}>
                            {t.category}
                          </span>
                        </td>
                        <td className={`px-5 py-4 text-right font-black text-sm ${
                          isSettled ? 'text-cyan-700' : isGiven ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {isSettled ? '' : isGiven ? '+' : '-'}{currency}{t.amount.toLocaleString()}
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

      {/* Share Code Modal */}
      <ShareCodeModal
        isOpen={shareModal.open}
        onClose={() => setShareModal({ open: false, friendId: '', friendName: '' })}
        friendId={shareModal.friendId}
        friendName={shareModal.friendName}
        currency={currency}
      />

    </div>
  );
}
