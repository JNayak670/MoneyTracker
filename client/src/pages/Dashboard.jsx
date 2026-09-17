import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import SummaryCard from '../components/SummaryCard';
import FriendCard from '../components/FriendCard';
import SettleModal from '../components/SettleModal';
import WhatsAppModal from '../components/WhatsAppModal';
import ShareCodeModal from '../components/ShareCodeModal';
import LinkAccountModal from '../components/LinkAccountModal';
import ShareHistoryModal from '../components/ShareHistoryModal';
import ColorfulLoader from '../components/ColorfulLoader';
import { exportToCSV } from '../services/exportService';
import { 
  Users, 
  UserPlus,
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
  const [linkModal, setLinkModal] = useState({ open: false, friend: null });
  const [shareHistoryModal, setShareHistoryModal] = useState({ open: false, friend: null, transactions: [] });

  const fetchData = async (showLoading = true) => {
    try {
      const isFirstLogin = sessionStorage.getItem('first_load_after_login') === 'true';
      if (showLoading) setLoading(true);
      
      const delay = isFirstLogin ? 1500 : 0;
      const [sumRes, friendsRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/friends'),
        delay > 0 ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve()
      ]);
      setSummary(sumRes.data);
      setFriends(friendsRes.data);
      if (isFirstLogin) {
        sessionStorage.removeItem('first_load_after_login');
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);

    const handleUpdate = () => {
      fetchData(false);
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

  const handleTogglePermission = async (friendId, newPermission) => {
    try {
      await api.patch(`/friends/${friendId}/permission`, { permission: newPermission });
      await fetchData();
      window.dispatchEvent(new Event('transaction-updated'));
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleLinkSave = async (friendId, data) => {
    try {
      const res = await api.post(`/friends/${friendId}/link-username`, data);
      setLinkModal({ open: false, friend: null });
      await fetchData();
      window.dispatchEvent(new Event('transaction-updated'));
      if (res.data.connected) {
        // Fetch transactions for this friend to offer sharing history
        try {
          const ledgerRes = await api.get(`/friends/${friendId}/ledger`);
          const txs = ledgerRes.data?.transactions || [];
          if (txs.length > 0) {
            setShareHistoryModal({
              open: true,
              friend: res.data.friend,
              transactions: txs
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleShareHistorySubmit = async (friendId, transactionIds) => {
    try {
      await api.post(`/friends/${friendId}/share-history`, { transactionIds });
      setShareHistoryModal({ open: false, friend: null, transactions: [] });
      await fetchData();
      window.dispatchEvent(new Event('transaction-updated'));
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (loading) {
    return <ColorfulLoader fullScreen={false} minHeight="min-h-[260px] sm:min-h-[400px]" message="Loading Financial Dashboard..." submessage="Fetching real-time debt balances, circle stats & activity..." />;
  }

  const currency = summary?.currency || '₹';
  const activeFriends = friends.filter(f => f.currentBalance !== 0).slice(0, 6);
  const netBalance = summary?.netBalance || 0;
  const isNetPositive = netBalance >= 0;
  const totalVolume = (summary?.totalGiven || 0) + (summary?.totalReceived || 0);
  const hasNoTransactions = !summary?.recentTransactions || summary.recentTransactions.length === 0;

  const givenRatio = totalVolume > 0 ? Math.round(((summary?.totalGiven || 0) / totalVolume) * 100) : 50;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* ------------------------------------------------------------- */}
      {/* HERO FINANCIAL HEALTH CARD (MATCHING PHONE MOCKUP) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative rounded-3xl overflow-hidden p-5 sm:p-7 bg-[#1c1d42] text-white shadow-xl border border-indigo-500/20">
        
        {/* Subtle Ambient Glowing Orbs */}
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          {/* Balance & Status */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[11px] font-bold text-emerald-300">
                <span className="text-xs">🔗</span>
                <span>Peer Ledger Active</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[11px] font-bold border border-purple-400/30">
                In INR {currency}
              </span>
            </div>

            <div>
              <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">
                OVERALL CIRCLE NET POSITION
              </p>
              <div className="text-3xl sm:text-5xl font-black tracking-tight mt-1 flex items-baseline gap-2">
                <span className={isNetPositive ? 'text-[#34d399]' : 'text-rose-400'}>
                  {isNetPositive ? '+' : '-'}{currency}{Math.abs(netBalance).toLocaleString()}
                </span>
                <span className="text-xs sm:text-sm font-bold text-emerald-300/90">
                  {isNetPositive ? '🟢 (In Surplus)' : '🔴 (Net Payable)'}
                </span>
              </div>
            </div>

            {/* Lent / Borrowed Stats Row */}
            <div className="flex items-center gap-4 text-xs font-bold pt-0.5">
              <span className="text-cyan-200">
                Lent: <span className="text-white font-black">{currency}{(summary?.totalGiven || 0).toLocaleString()}</span>
              </span>
              <span className="text-rose-300">
                Borrowed: <span className="text-white font-black">{currency}{(summary?.totalReceived || 0).toLocaleString()}</span>
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
            <button
              onClick={() => onOpenAddTx('')}
              className="flex items-center justify-center gap-1.5 bg-[#0f766e] hover:bg-[#0d6d66] text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Record Entry</span>
            </button>

            <button
              onClick={onOpenAddFriend}
              className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all"
            >
              <span>👤+ Add Friend</span>
            </button>
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ONBOARDING STEP 1: SUGGESTION BANNER (WHEN USER HAS NO FRIENDS) */}
      {/* ------------------------------------------------------------- */}
      {friends.length === 0 && (
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border-2 border-indigo-400/40 shadow-xl backdrop-blur-md animate-fadeIn">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-gradient-to-br from-indigo-500/20 to-pink-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Step 1 of 2 • Add Your First Friend</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                👋 Add your first friend to get started!
              </h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                You don't have any friends in your circle yet. MoneyTracker helps you split bills, track who owes you money, and manage shared expenses seamlessly. Add your first friend to begin recording transactions!
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 pt-1">
                <span className="flex items-center gap-1.5">🍕 Split bills & dinners</span>
                <span className="flex items-center gap-1.5">💰 Track who owes what</span>
                <span className="flex items-center gap-1.5">💬 WhatsApp reminders</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto flex-shrink-0">
              <button
                onClick={onOpenAddFriend}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-500/30 hover:scale-105 hover:shadow-indigo-500/50 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Your First Friend</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ONBOARDING STEP 2: SUGGESTION BANNER (FRIENDS EXIST, NO RECORDS YET) */}
      {/* ------------------------------------------------------------- */}
      {friends.length > 0 && hasNoTransactions && (
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-2 border-emerald-400/40 shadow-xl backdrop-blur-md animate-fadeIn">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Step 2 of 2 • Record First Entry</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                🎉 Friends added! Now record your first transaction
              </h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Great job adding {friends.length} friend{friends.length > 1 ? 's' : ''} to your circle! You haven't recorded any entries yet. Record a shared bill, lunch split, or loan to start tracking balances and settlements.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 pt-1">
                <span className="flex items-center gap-1.5">⚡ Live debt & credit balance</span>
                <span className="flex items-center gap-1.5">👥 Split evenly across group</span>
                <span className="flex items-center gap-1.5">🧾 Generate shareable passcodes</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto flex-shrink-0">
              <button
                onClick={() => onOpenAddTx('')}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/30 hover:scale-105 hover:shadow-emerald-500/50 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Record First Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUMMARY METRIC CARDS (SWIPEABLE ON PHONE, GRID ON PC) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <SummaryCard
          title="Total Given (Lent)"
          amount={summary?.totalGiven || 0}
          type="given"
          currency={currency}
          subtext={`${friends.filter(f => f.currentBalance > 0).length} friends owe you`}
        />
        <SummaryCard
          title="Net Circle Position"
          amount={summary?.netBalance || 0}
          type="net"
          currency={currency}
          subtext={summary?.netBalance >= 0 ? 'In Surplus Profit' : 'In Net Payable'}
        />
        <SummaryCard
          title="Pending Dues"
          amount={summary?.totalReceivable || 0}
          type="pending"
          currency={currency}
          subtext={`${summary?.activeDuesCount || 0} active balances`}
        />
        <SummaryCard
          title="Total Received"
          amount={summary?.totalReceived || 0}
          type="received"
          currency={currency}
          subtext={`You owe ${friends.filter(f => f.currentBalance < 0).length} friends`}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ACTIVE FRIENDS WITH RUNNING DEBT BALANCES */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0f766e] text-white flex items-center justify-center shadow-sm">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Active Debtors & Circles
              </h2>
              <p className="text-[11px] text-slate-500 font-semibold">
                Friends with pending balances
              </p>
            </div>
          </div>

          <Link
            to="/friends"
            className="flex items-center gap-1 text-xs font-black text-indigo-700 hover:text-indigo-800 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {friends.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-indigo-500/25">
              👥
            </div>
            <h3 className="font-black text-xl text-slate-900">Your Friends Circle is Empty</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto font-medium">
              You haven't added any friends yet. Add your friends, flatmates, or travel buddies to start tracking shared expenses and balances.
            </p>
            <button
              onClick={onOpenAddFriend}
              className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white text-xs font-black px-6 py-3 rounded-xl shadow-md shadow-indigo-500/20 hover:scale-105 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Your First Friend</span>
            </button>
          </div>
        ) : activeFriends.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30">
            <span className="text-4xl mb-2 block animate-bounce">🎉</span>
            <h3 className="font-black text-lg text-slate-900">
              {hasNoTransactions ? 'Friends Ready • No Transactions Yet' : 'All Friend Dues Are 100% Settled!'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
              {hasNoTransactions 
                ? `You have ${friends.length} friend${friends.length > 1 ? 's' : ''} ready. Record an expense or bill split to activate live balance tracking.`
                : 'Zero debts pending across your circle. Record a new bill split or expense below to start tracking.'}
            </p>
            <button
              onClick={() => onOpenAddTx('')}
              className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 hover:scale-105 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{hasNoTransactions ? 'Record First Entry' : 'Record Expense Entry'}</span>
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
                onLinkAccount={(f) => setLinkModal({ open: true, friend: f })}
                onTogglePermission={handleTogglePermission}
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
          {friends.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs px-4">
              <p className="font-semibold mb-2">No transactions recorded yet.</p>
              <button
                onClick={onOpenAddFriend}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
              >
                Add a friend first to record your first expense or loan &rarr;
              </button>
            </div>
          ) : hasNoTransactions ? (
            <div className="py-16 text-center text-slate-500 text-xs px-4 space-y-2">
              <p className="font-bold text-slate-800 text-sm">Your friends circle is ready!</p>
              <p className="text-slate-500 max-w-sm mx-auto">
                No entries recorded yet. Record your first bill split, loan, or expense to start tracking dues.
              </p>
              <button
                onClick={() => onOpenAddTx('')}
                className="mt-3 inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 hover:scale-105 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Record First Entry</span>
              </button>
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

      {/* Link MoneyTracker Account Modal */}
      <LinkAccountModal
        isOpen={linkModal.open}
        onClose={() => setLinkModal({ open: false, friend: null })}
        friend={linkModal.friend}
        onSave={handleLinkSave}
      />

      {/* Selective History Sharing Modal */}
      <ShareHistoryModal
        isOpen={shareHistoryModal.open}
        onClose={() => setShareHistoryModal({ open: false, friend: null, transactions: [] })}
        friend={shareHistoryModal.friend}
        transactions={shareHistoryModal.transactions}
        onConfirm={handleShareHistorySubmit}
      />

    </div>
  );
}
