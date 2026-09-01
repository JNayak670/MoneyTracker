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
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Wallet,
  Coins,
  ShieldCheck,
  Scale,
  Zap
} from 'lucide-react';

const CATEGORY_STYLES = {
  'Food & Dining': 'bg-amber-100 text-amber-900 border-amber-300',
  'Rent & Bills': 'bg-blue-100 text-blue-900 border-blue-300',
  'Travel & Trips': 'bg-purple-100 text-purple-900 border-purple-300',
  'Entertainment': 'bg-pink-100 text-pink-900 border-pink-300',
  'Loans & Cash': 'bg-emerald-100 text-emerald-900 border-emerald-300',
  'Settlement': 'bg-cyan-100 text-cyan-900 border-cyan-300',
  'Shopping': 'bg-indigo-100 text-indigo-900 border-indigo-300',
};

const CATEGORY_EMOJIS = {
  'Food & Dining': '🍕',
  'Rent & Bills': '⚡',
  'Travel & Trips': '✈️',
  'Entertainment': '🎬',
  'Loans & Cash': '💰',
  'Settlement': '🤝',
  'Shopping': '🛍️'
};

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
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500">Loading colorful money tracker...</p>
        </div>
      </div>
    );
  }

  const currency = summary?.currency || '₹';
  const activeFriends = friends.filter(f => f.currentBalance !== 0).slice(0, 6);
  const netBalance = summary?.netBalance || 0;
  const isNetPositive = netBalance >= 0;
  const totalVolume = (summary?.totalGiven || 0) + (summary?.totalReceived || 0);

  const givenRatio = totalVolume > 0 ? Math.round(((summary?.totalGiven || 0) / totalVolume) * 100) : 50;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* ------------------------------------------------------------- */}
      {/* HERO VIBRANT FINANCIAL HEALTH COMMAND CENTER */}
      {/* ------------------------------------------------------------- */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-950 text-white shadow-2xl border border-indigo-500/30">
        
        {/* Ambient Glowing Orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Balance & Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black text-emerald-300 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Peer Ledger Active</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-purple-500/30 text-purple-200 text-xs font-mono font-bold border border-purple-400/30">
                🇮🇳 INR {currency}
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                Overall Circle Net Position
              </p>
              <div className="text-3xl sm:text-5xl font-black tracking-tight mt-1 flex items-baseline gap-2">
                <span className={isNetPositive ? 'text-emerald-400' : 'text-rose-400'}>
                  {isNetPositive ? '+' : '-'}{currency}{Math.abs(netBalance).toLocaleString()}
                </span>
                <span className="text-sm font-bold text-indigo-200">
                  {isNetPositive ? '🟢 (In Surplus)' : '🔴 (Net Payable)'}
                </span>
              </div>
            </div>

            {/* Ratio Progress Bar */}
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
                <span className="text-emerald-300">↗️ Lent: {currency}{(summary?.totalGiven || 0).toLocaleString()} ({givenRatio}%)</span>
                <span className="text-rose-300">↙️ Borrowed: {currency}{(summary?.totalReceived || 0).toLocaleString()} ({100 - givenRatio}%)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex border border-white/10 p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500 shadow-sm"
                  style={{ width: `${givenRatio}%` }}
                />
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all duration-500 shadow-sm"
                  style={{ width: `${100 - givenRatio}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 self-start lg:self-auto">
            <button
              onClick={onOpenAddTx}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-950 font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Record New Entry</span>
            </button>

            <button
              onClick={onOpenAddFriend}
              className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs px-4 py-2.5 rounded-2xl backdrop-blur-md transition-all"
            >
              <span>👤+</span>
              <span>Add New Friend</span>
            </button>

            <button
              onClick={() => exportToCSV(summary?.recentTransactions || [], 'moneytracker_statement.csv')}
              className="flex items-center justify-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 font-bold text-xs px-4 py-2.5 rounded-2xl transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Statement</span>
            </button>
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4 VIBRANT SUMMARY METRIC CARDS */}
      {/* ------------------------------------------------------------- */}
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
          subtext={summary?.netBalance >= 0 ? '🟢 In Surplus Profit' : '🔴 In Net Payable'}
        />
        <SummaryCard
          title="Pending Dues"
          amount={summary?.totalReceivable || 0}
          type="pending"
          currency={currency}
          subtext={`${summary?.activeDuesCount || 0} active balances`}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ACTIVE FRIENDS WITH RUNNING DEBT BALANCES */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Active Debtors & Circles</h2>
              <p className="text-xs text-slate-500 font-semibold">Friends with pending balances</p>
            </div>
          </div>

          <Link
            to="/friends"
            className="flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-xl transition-all"
          >
            <span>View All Circles ({friends.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeFriends.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30">
            <span className="text-4xl mb-2 block animate-bounce">🎉</span>
            <h3 className="font-black text-lg text-slate-900">All Friend Dues Are 100% Settled!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
              Zero debts pending across your circle. Record a new bill split or expense below to start tracking.
            </p>
            <button
              onClick={onOpenAddTx}
              className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 hover:scale-105 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Expense Entry</span>
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

      {/* ------------------------------------------------------------- */}
      {/* RECENT ACTIVITY & GLOBAL AUDIT FEED */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-500 font-semibold">Latest shared splits and settlement records</p>
            </div>
          </div>

          <Link
            to="/transactions"
            className="flex items-center gap-1.5 text-xs font-black text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-xl transition-all"
          >
            <span>Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden shadow-xl border border-slate-200">
          {(!summary?.recentTransactions || summary.recentTransactions.length === 0) ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No transactions recorded yet. Click <strong>Record Entry</strong> to begin!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gradient-to-r from-slate-100 via-indigo-50/50 to-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-extrabold">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Friend Contact</th>
                    <th className="px-5 py-4">Type / Direction</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {summary.recentTransactions.map(t => {
                    const isGiven = t.type === 'GIVEN' || t.impactOnUser > 0;
                    const isSettled = t.type === 'SETTLED';
                    const categoryColors = CATEGORY_STYLES[t.category] || 'bg-slate-100 text-slate-700 border-slate-200';
                    const categoryEmoji = CATEGORY_EMOJIS[t.category] || '🏷️';

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 text-slate-500 font-mono font-medium">
                          {t.date}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <span 
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm border border-black/5"
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
                              ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                              : isGiven
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {isSettled ? '🤝 Settled' : isGiven ? '↗️ Lent (You Paid)' : '↙️ Borrowed (They Paid)'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700 font-medium max-w-xs truncate">
                          {t.note || '-'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${categoryColors}`}>
                            {categoryEmoji} {t.category}
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
