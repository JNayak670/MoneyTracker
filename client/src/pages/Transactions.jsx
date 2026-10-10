import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import ColorfulLoader from '../components/ColorfulLoader';
import { useOperationLoader } from '../context/OperationLoaderContext';
import { exportToCSV } from '../services/exportService';
import { 
  Receipt, 
  Search, 
  Download, 
  Filter, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  Share2,
  Calendar,
  Sparkles,
  Loader2,
  Users,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import SplitGroupModal from '../components/SplitGroupModal';
import SettleModal from '../components/SettleModal';

export default function Transactions({ onOpenAddTx }) {
  const { executeWithLoader } = useOperationLoader();
  const [transactions, setTransactions] = useState([]);
  const [selectedSplitGroupId, setSelectedSplitGroupId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [settleModal, setSettleModal] = useState({ open: false, friendId: '', friendName: '', amount: 0, note: '', isShared: false });

  // Group split view mode: combine individual participant shares into a single unified transaction row
  const [combineGroupSplits, setCombineGroupSplits] = useState(true);
  const [expandedGroupIds, setExpandedGroupIds] = useState(new Set());

  // Filters
  const [search, setSearch] = useState('');
  const [friendId, setFriendId] = useState('');
  const [type, setType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Map of active settlement records per friend to identify settled history
  const friendSettlementMap = useMemo(() => {
    const map = {};
    for (const tx of transactions) {
      if (tx.type === 'SETTLED' && tx.approvalStatus !== 'REJECTED' && tx.friendId) {
        const fId = tx.friendId;
        if (!map[fId]) map[fId] = [];
        map[fId].push(tx);
      }
    }
    return map;
  }, [transactions]);

  // Determine if a specific transaction has an active Settle button
  const checkCanSettle = (t) => {
    if (!t || !t.friend || t.type === 'SETTLED' || t.approvalStatus === 'REJECTED' || t.approvalStatus === 'PENDING_APPROVAL') {
      return false;
    }

    const friendObj = friends.find(f => f.id === t.friendId || f._id === t.friendId || (t.friend && (f.id === t.friend.id || f._id === t.friend.id)));
    const isFriendBalanceZero = friendObj && (friendObj.currentBalance === 0 || Math.abs(friendObj.currentBalance || 0) < 0.01 || friendObj.status === 'SETTLED');
    if (isFriendBalanceZero) return false;

    if (t.isSettled) return false;

    const friendSettlements = friendSettlementMap[t.friendId] || [];
    const wasCoveredBySettlement = friendSettlements.some(s => {
      const sTime = s.createdAt ? new Date(s.createdAt).getTime() : 0;
      const tTime = t.createdAt ? new Date(t.createdAt).getTime() : 0;
      if (sTime && tTime && sTime >= tTime) return true;
      if (s.date && t.date && s.date >= t.date) return true;
      return false;
    });

    return !wasCoveredBySettlement;
  };

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (friendId) params.friendId = friendId;
      if (type) params.type = type;
      if (category) params.category = category;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [txRes, friendsRes] = await Promise.all([
        api.get('/transactions', { params }),
        api.get('/friends'),
        showLoading ? new Promise(resolve => setTimeout(resolve, 100)) : Promise.resolve()
      ]);

      const txList = Array.isArray(txRes) ? txRes : (txRes?.data || []);
      const fList = Array.isArray(friendsRes) ? friendsRes : (friendsRes?.data || []);
      setTransactions(Array.isArray(txList) ? txList : []);
      setFriends(Array.isArray(fList) ? fList : []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setTransactions([]);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleUpdate = () => {
      fetchData(false);
    };

    window.addEventListener('transaction-updated', handleUpdate);
    return () => {
      window.removeEventListener('transaction-updated', handleUpdate);
    };
  }, [friendId, type, category, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await executeWithLoader(async () => {
        await api.post(`/transactions/${id}/approve`);
        await fetchData(false);
        window.dispatchEvent(new Event('transaction-updated'));
      }, {
        message: 'Approving Transaction in Database...',
        submessage: 'Updating ledger state and recalculating net balances in database...',
        tag: 'APPROVAL SYNC',
        statusText: 'Synchronizing Approved Entry'
      });
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Are you sure you want to reject/decline this transaction?')) return;
    setActionLoading(id);
    try {
      await executeWithLoader(async () => {
        await api.post(`/transactions/${id}/reject`);
        await fetchData(false);
        window.dispatchEvent(new Event('transaction-updated'));
      }, {
        message: 'Declining Transaction in Database...',
        submessage: 'Reversing pending ledger entry & adjusting balances...',
        tag: 'DATABASE UPDATE',
        statusText: 'Reconciling Ledger Balances'
      });
    } catch (err) {
      alert(`Reject error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    const tx = transactions.find(t => t.id === id);
    if (tx && tx.canDelete === false) {
      alert('Only the person who entered this transaction can delete or change it.');
      return;
    }
    if (!confirm('Are you sure you want to delete this transaction? Balance will be adjusted.')) return;
    try {
      await executeWithLoader(async () => {
        await api.delete(`/transactions/${id}`);
        await fetchData(false);
        window.dispatchEvent(new Event('transaction-updated'));
      }, {
        message: 'Deleting Transaction from Database...',
        submessage: 'Removing ledger log and recalculating net running balances...',
        tag: 'DATABASE PURGE',
        statusText: 'Updating Ledger Records'
      });
    } catch (err) {
      alert(`Delete error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleOpenSettle = (t) => {
    const friendObj = t.friend || friends.find(f => f.id === t.friendId || f._id === t.friendId);
    const friendName = friendObj?.name || 'Friend';
    const friendId = friendObj?.id || friendObj?._id || t.friendId;
    const isShared = Boolean(t.isShared || friendObj?.connectionStatus === 'CONNECTED');

    setSettleModal({
      open: true,
      friendId,
      friendName,
      amount: t.amount,
      note: `Settlement for "${t.note}"`,
      isShared
    });
  };

  const handleSettleSubmit = async (payload) => {
    setSettleModal({ open: false, friendId: '', friendName: '', amount: 0, note: '', isShared: false });
    try {
      let resMessage = '';
      await executeWithLoader(async () => {
        const res = await api.post('/transactions/settle', payload);
        resMessage = res?.data?.message || res?.message || '';
        await fetchData(false);
        window.dispatchEvent(new Event('transaction-updated'));
      }, {
        message: 'Recording Settlement in Database...',
        submessage: 'Clearing mutual debts and recording official settlement log...',
        tag: 'SETTLE ENGINE',
        statusText: 'Finalizing Debt Settlement'
      });
      if (resMessage) {
        setTimeout(() => alert(resMessage), 200);
      }
    } catch (err) {
      alert(`Settlement failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setFriendId('');
    setType('');
    setStatusFilter('');
    setCategory('');
    setStartDate('');
    setEndDate('');
  };

  const filteredTransactions = transactions.filter(t => {
    // Filter for Not Settled (shows transactions with active Settle button)
    if (statusFilter === 'NOT_SETTLED' || type === 'NOT_SETTLED') {
      if (!checkCanSettle(t)) return false;
    }

    if (statusFilter) {
      if (statusFilter === 'NOT_SETTLED') {
        if (!checkCanSettle(t)) return false;
      } else if (statusFilter === 'SETTLED') {
        if (checkCanSettle(t)) return false;
      } else if (statusFilter === 'SPLIT') {
        if (!t.splitGroupId) return false;
      } else if (statusFilter === 'PENDING') {
        if (t.approvalStatus !== 'PENDING_APPROVAL') return false;
      } else if (statusFilter === 'REJECTED') {
        if (t.approvalStatus !== 'REJECTED') return false;
      } else if (statusFilter === 'ACTIVE') {
        if (t.approvalStatus !== 'ACTIVE' && t.approvalStatus) return false;
      } else if (statusFilter === 'SHARED') {
        if (!t.isShared) return false;
      }
    }

    if (type && type !== 'NOT_SETTLED') {
      if (t.type !== type) return false;
    }

    return true;
  });

  const toggleExpandGroup = (splitGroupId) => {
    setExpandedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(splitGroupId)) {
        next.delete(splitGroupId);
      } else {
        next.add(splitGroupId);
      }
      return next;
    });
  };

  const handleDeleteGroupSplit = async (splitGroupId) => {
    if (!confirm('Are you sure you want to delete this entire group split bill? Balances for all participants will be reverted.')) return;
    try {
      await executeWithLoader(async () => {
        await api.delete(`/transactions/group/${splitGroupId}`);
        await fetchData(false);
        window.dispatchEvent(new Event('transaction-updated'));
      }, {
        message: 'Deleting Group Split from Database...',
        submessage: 'Reverting all participants\' shares and recalculating running balances...',
        tag: 'DATABASE PURGE',
        statusText: 'Restoring Pre-Split Ledger'
      });
    } catch (err) {
      alert(`Error deleting group split: ${err.response?.data?.error || err.message}`);
    }
  };

  // Combine group split entries sharing the same splitGroupId into a single unified transaction row
  const displayTransactions = useMemo(() => {
    if (!combineGroupSplits || friendId) {
      return filteredTransactions.map(t => ({
        ...t,
        isGroupedHeader: false,
        subTransactions: []
      }));
    }

    const seenGroupIds = new Set();
    const result = [];

    for (const t of filteredTransactions) {
      if (!t.splitGroupId) {
        result.push({
          ...t,
          isGroupedHeader: false,
          subTransactions: []
        });
        continue;
      }

      if (seenGroupIds.has(t.splitGroupId)) {
        continue;
      }

      const siblings = filteredTransactions.filter(other => other.splitGroupId === t.splitGroupId);

      if (siblings.length <= 1) {
        result.push({
          ...t,
          isGroupedHeader: false,
          subTransactions: []
        });
        continue;
      }

      seenGroupIds.add(t.splitGroupId);

      const totalShareAmount = siblings.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
      const totalImpact = siblings.reduce((sum, s) => sum + (Number(s.impactOnUser) || 0), 0);
      const uniqueFriends = siblings.map(s => s.friend).filter(Boolean);
      const hasPending = siblings.some(s => s.approvalStatus === 'PENDING_APPROVAL');
      const isAllSettled = siblings.every(s => s.type === 'SETTLED' || s.isSettled);

      result.push({
        ...t,
        id: `group-${t.splitGroupId}`,
        isGroupedHeader: true,
        amount: totalShareAmount,
        impactOnUser: totalImpact,
        friends: uniqueFriends,
        friendCount: siblings.length,
        hasPending,
        isAllSettled,
        subTransactions: siblings
      });
    }

    return result;
  }, [filteredTransactions, combineGroupSplits, friendId]);

  if (loading) {
    return <ColorfulLoader fullScreen={false} minHeight="min-h-[260px] sm:min-h-[400px]" message="Loading Transaction Ledger..." submessage="Fetching shared bills, repayments, loans and categories..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Transaction Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete searchable history of all loans, shared splits, approvals & settlements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportToCSV(filteredTransactions)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => onOpenAddTx('', 'split')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            title="Split group bill across friends"
          >
            <Users className="w-4 h-4" />
            <span>Split Bill</span>
          </button>
          <button
            onClick={() => onOpenAddTx('', 'single')}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <span>+ Add Entry</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, note, or receipt..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
          <select
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Friends</option>
            {friends.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Types</option>
            <option value="NOT_SETTLED">⚡ Not Settled (Needs Settle)</option>
            <option value="GIVEN">Given / Lent ↗️</option>
            <option value="RECEIVED">Received / Borrowed ↙️</option>
            <option value="SPLIT">Split 👥</option>
            <option value="SETTLED">Settled 🤝</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="NOT_SETTLED">⚡ Not Settled (Needs Settle)</option>
            <option value="SETTLED">🤝 Settled</option>
            <option value="SPLIT">👥 Group Splits</option>
            <option value="PENDING">⏳ Pending Approval</option>
            <option value="ACTIVE">✅ Active / Accepted</option>
            <option value="REJECTED">❌ Rejected / Declined</option>
            <option value="SHARED">🔗 2-Way Synced</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Categories</option>
            <option value="Food & Dining">Food & Dining</option>
            <option value="Rent & Bills">Rent & Bills</option>
            <option value="Travel & Trips">Travel & Trips</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Loans & Cash">Loans & Cash</option>
            <option value="Shopping">Shopping</option>
            <option value="General">General</option>
          </select>

          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl py-1.5 font-semibold transition-colors col-span-2 sm:col-span-1"
          >
            Clear Filters
          </button>
        </div>

        {/* Group Split View Mode & Count Sub-bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setCombineGroupSplits(!combineGroupSplits)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[11px] transition-all cursor-pointer border ${
                combineGroupSplits
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-300 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="When enabled, group split bills are unified into a single transaction row instead of separate rows per friend"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>{combineGroupSplits ? 'Group Splits: Single Combined Transaction ✓' : 'Group Splits: Separate Per Friend'}</span>
            </button>
            <span className="text-[10px] text-slate-400 font-semibold hidden md:inline">
              (Click to toggle between 1 combined row vs separate friend entries)
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-bold self-end sm:self-auto">
            Showing <strong className="text-slate-900">{displayTransactions.length}</strong> transactions
            {combineGroupSplits && filteredTransactions.length !== displayTransactions.length && (
              <span className="text-[10px] text-indigo-600 ml-1">
                ({filteredTransactions.length} individual friend entries combined)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center space-y-2 px-4">
            <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">
              {friends.length === 0 ? 'No Transactions or Friends Yet' : 'No Transactions Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {friends.length === 0 
                ? 'Add a friend to your circle first so you can start recording shared expenses and settlements.' 
                : (statusFilter === 'NOT_SETTLED' || type === 'NOT_SETTLED')
                ? 'All friend balances and previous transactions are settled up! No unsettled transactions with a Settle button.'
                : 'Try modifying your search or filters, or record a new entry.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View (fit neatly inside card container) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs table-auto">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-extrabold text-[11px]">
                  <tr>
                    <th className="px-3.5 py-3 w-[100px] whitespace-nowrap">Date</th>
                    <th className="px-3.5 py-3 w-[150px] whitespace-nowrap">Friend</th>
                    <th className="px-3.5 py-3 w-[115px] whitespace-nowrap">Flow / Type</th>
                    <th className="px-3.5 py-3 min-w-[180px] max-w-[280px]">Description & Receipt</th>
                    <th className="px-3.5 py-3 w-[115px] whitespace-nowrap">Status</th>
                    <th className="px-3.5 py-3 w-[110px] whitespace-nowrap">Category</th>
                    <th className="px-3.5 py-3 w-[75px] whitespace-nowrap">Method</th>
                    <th className="px-3.5 py-3 w-[95px] text-right whitespace-nowrap">Amount</th>
                    <th className="px-3.5 py-3 w-[75px] text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredTransactions.map(t => {
                    const isGiven = t.type === 'GIVEN' || t.impactOnUser > 0;
                    const isSettled = t.type === 'SETTLED';
                    const isPending = t.approvalStatus === 'PENDING_APPROVAL';
                    const isRejected = t.approvalStatus === 'REJECTED';
                    const canSettle = checkCanSettle(t);

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
                      <tr 
                        key={t.id} 
                        className={`transition-all ${
                          isSettled
                            ? 'bg-gradient-to-r from-emerald-100/95 via-teal-50/90 to-emerald-50/70 hover:from-emerald-200/80 hover:to-teal-100/90 border-l-[6px] border-l-emerald-600 border-y-2 border-y-emerald-300 shadow-xs'
                            : isPending 
                            ? 'bg-amber-50/30 hover:bg-amber-50/50 border-l-4 border-l-amber-400' 
                            : isRejected 
                            ? 'bg-rose-50/30 opacity-75 border-l-4 border-l-rose-300' 
                            : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                        }`}
                      >
                        <td className={`px-3.5 py-3 text-slate-500 font-mono text-[11px] font-medium whitespace-nowrap ${isSettled ? 'border-l-[6px] border-l-emerald-600' : ''}`}>
                          <div className={isSettled ? 'font-bold text-emerald-950' : ''}>{t.date}</div>
                          {t.time && <div className={`text-[10px] font-bold ${isSettled ? 'text-emerald-700' : 'text-slate-400'}`}>{t.time}</div>}
                        </td>

                        <td className="px-3.5 py-3 font-black text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span 
                              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shadow-2xs border flex-shrink-0 ${
                                isSettled ? 'ring-2 ring-emerald-500/40 border-emerald-400' : 'border-black/5'
                              }`}
                              style={{ backgroundColor: t.friend?.avatarColor || '#6366f1' }}
                            >
                              {t.friend?.avatarEmoji || '👤'}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{t.friend?.name || 'Friend'}</div>
                              {t.friend?.relationshipTag && (
                                <span className="text-[9.5px] text-slate-400 font-semibold block truncate max-w-[120px]">{t.friend.relationshipTag}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-3.5 py-3 whitespace-nowrap">
                          {isSettled ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[11px] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5] flex-shrink-0" />
                              <span>🤝 FULLY SETTLED</span>
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-black text-[10.5px] border shadow-2xs ${
                              isGiven
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {isGiven ? (
                                <>
                                  <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                                  <span>↗️ Lent</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownLeft className="w-3 h-3 text-rose-600" />
                                  <span>↙️ Borrowed</span>
                                </>
                              )}
                            </span>
                          )}
                        </td>

                        <td className="px-3.5 py-2.5 min-w-[170px] max-w-[280px]">
                          {/* Line 1: Note title + Group Split button side-by-side */}
                          <div className="flex items-center justify-between gap-1.5 min-w-0">
                            <span className="font-bold text-slate-900 text-xs truncate flex-1 min-w-0 flex items-center gap-1.5" title={t.note}>
                              {isSettled && (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs flex-shrink-0">
                                  <span>🤝</span>
                                  <span>Settlement</span>
                                </span>
                              )}
                              <span className={`truncate ${isSettled ? 'font-black text-emerald-950' : ''}`}>{t.note}</span>
                            </span>
                            {t.splitGroupId && (
                              <button
                                type="button"
                                onClick={() => setSelectedSplitGroupId(t.splitGroupId)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-black bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border border-indigo-200 shadow-2xs transition-all active:scale-95 cursor-pointer flex-shrink-0"
                                title="Click to view Group Split short summary & participants in pop up page"
                              >
                                <Users className="w-2.5 h-2.5 text-indigo-600 flex-shrink-0" />
                                <span>Group Split ({t.groupSplitShares?.length || t.splitDetails?.participantCount || 2})</span>
                                <span className="text-[9px] text-indigo-500 font-bold">↗</span>
                              </button>
                            )}
                          </div>

                          {/* Line 2: Receipt Note */}
                          {t.receiptNote && (
                            <div className="text-[9.5px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mt-0.5 inline-flex items-center gap-1 font-mono border border-purple-200/60 max-w-full truncate" title={t.receiptNote}>
                              <span>🧾</span>
                              <span className="truncate">{t.receiptNote}</span>
                            </div>
                          )}
                        </td>

                        {/* Status & Sync Column */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5 items-start">
                            {isPending ? (
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-pulse">
                                  <Clock className="w-2.5 h-2.5 text-amber-700" />
                                  <span>Status: Pending</span>
                                </span>
                                <span className="text-[9px] text-amber-700 font-bold tracking-tight">
                                  {t.isEntryOwner
                                    ? (t.type === 'SETTLED' ? '⏳ Settlement Sent (Awaiting)' : '⏳ Awaiting Friend Approval')
                                    : (t.type === 'SETTLED' ? '👉 Settlement Approval Needed' : '👉 Approval Needed')}
                                </span>
                              </>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300 line-through">
                                <XCircle className="w-2.5 h-2.5 text-rose-600" />
                                <span>Declined</span>
                              </span>
                            ) : t.isShared ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>2-Way Synced</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                <span>📝 Local</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${categoryColors}`}>
                            {t.category}
                          </span>
                        </td>

                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-slate-200">
                            {t.paymentMethod || 'UPI'}
                          </span>
                        </td>

                        <td className="px-3.5 py-3 text-right whitespace-nowrap">
                          {isSettled ? (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs sm:text-sm shadow-md ring-2 ring-emerald-300">
                                <span>🤝 ₹{t.amount.toLocaleString()}</span>
                              </span>
                              
                            </div>
                          ) : (
                            <div className={`text-xs sm:text-sm font-black ${
                              isGiven ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {isGiven ? '+' : '-'}₹{t.amount.toLocaleString()}
                            </div>
                          )}
                        </td>

                        {/* Action buttons (Settle / Approve / Reject / Delete) */}
                        <td className="px-3.5 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Settle button for unsettled records with a friend */}
                            {canSettle && (
                              <button
                                type="button"
                                onClick={() => handleOpenSettle(t)}
                                className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                                title={t.isShared ? `Send settlement request to ${t.friend.name}` : `Settle balance with ${t.friend.name}`}
                              >
                                <CheckCircle2 className="w-3 h-3 text-white" />
                                <span>Settle</span>
                              </button>
                            )}

                            {isPending ? (
                              t.isEntryOwner ? (
                                <div className="inline-flex items-center gap-1">
                                  <span 
                                    className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[9.5px] font-bold px-2 py-0.5 rounded-md"
                                    title="Waiting for friend to accept"
                                  >
                                    <Clock className="w-2.5 h-2.5 text-amber-600" />
                                    <span>Awaiting Friend</span>
                                  </span>
                                  <button
                                    onClick={() => handleDelete(t.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Cancel Request"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleApprove(t.id)}
                                    disabled={actionLoading === t.id}
                                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2 py-1 rounded shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                                    title="Accept & Confirm this transaction"
                                  >
                                    {actionLoading === t.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                                    <span>Accept</span>
                                  </button>
                                  <button
                                    onClick={() => handleReject(t.id)}
                                    disabled={actionLoading === t.id}
                                    className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-bold px-1.5 py-1 rounded transition-all disabled:opacity-50 cursor-pointer"
                                    title="Decline this transaction"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )
                            ) : t.canDelete !== false ? (
                              <button
                                onClick={() => handleDelete(t.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span 
                                className="p-1 text-slate-300 inline-flex items-center cursor-not-allowed" 
                                title={`Entered by ${t.friend?.name || 'friend'}. Shared entries cannot be modified or deleted by the recipient.`}
                              >
                                <Lock className="w-3.5 h-3.5 text-slate-300" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (Dedicated responsive cards on mobile screens) */}
            <div className="sm:hidden divide-y divide-slate-100 bg-white">
              {filteredTransactions.map(t => {
                const isGiven = t.type === 'GIVEN' || t.impactOnUser > 0;
                const isSettled = t.type === 'SETTLED';
                const isPending = t.approvalStatus === 'PENDING_APPROVAL';
                const isRejected = t.approvalStatus === 'REJECTED';
                const canSettle = checkCanSettle(t);

                const categoryColor = {
                  'Food & Dining': 'bg-amber-50 text-amber-800 border-amber-200',
                  'Rent & Bills': 'bg-blue-50 text-blue-800 border-blue-200',
                  'Travel & Trips': 'bg-purple-50 text-purple-800 border-purple-200',
                  'Entertainment': 'bg-pink-50 text-pink-800 border-pink-200',
                  'Loans & Cash': 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  'Settlement': 'bg-cyan-50 text-cyan-800 border-cyan-200',
                  'Shopping': 'bg-indigo-50 text-indigo-800 border-indigo-200',
                }[t.category] || 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <div 
                    key={t.id} 
                    className={`p-3.5 sm:p-4 space-y-2.5 transition-all rounded-2xl border ${
                      isSettled
                        ? 'border-2 border-emerald-400 border-l-[8px] border-l-emerald-600 bg-gradient-to-br from-emerald-100/95 via-teal-50/90 to-white shadow-lg ring-2 ring-emerald-500/25 overflow-hidden'
                        : isPending 
                        ? 'bg-amber-50/40 border-slate-200' 
                        : isRejected 
                        ? 'bg-rose-50/30 opacity-75 border-slate-200' 
                        : 'bg-white hover:bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    {/* Top banner strip for settlement */}
                    {isSettled && (
                      <div className="flex items-center justify-between px-3.5 py-1.5 -mx-3.5 -mt-3.5 sm:-mx-4 sm:-mt-4 mb-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-black text-[11px] shadow-xs">
                        <span className="inline-flex items-center gap-1.5 uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>🤝 Debt Settlement Cleared</span>
                        </span>
                        <span className="text-[10px] font-extrabold bg-white/20 px-2 py-0.5 rounded-md">
                          ✓ Balanced & Verified
                        </span>
                      </div>
                    )}

                    {/* Friend + Date & Amount */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-xs border flex-shrink-0 ${
                            isSettled ? 'ring-2 ring-emerald-500/40 border-emerald-400' : 'border-black/5'
                          }`}
                          style={{ backgroundColor: t.friend?.avatarColor || '#6366f1' }}
                        >
                          {t.friend?.avatarEmoji || '👤'}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1.5">
                            <span className="truncate">{t.friend?.name || 'Friend'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <span>{t.date}</span>
                            {t.time && <span>• {t.time}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 space-y-1">
                        {isSettled ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs sm:text-sm shadow-xs">
                            <span>🤝 ₹{t.amount.toLocaleString()}</span>
                          </div>
                        ) : (
                          <div className={`font-black text-sm sm:text-base ${
                            isGiven ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {isGiven ? '+' : '-'}₹{t.amount.toLocaleString()}
                          </div>
                        )}
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-black border ${
                            isSettled
                              ? 'bg-emerald-200 text-emerald-950 border-emerald-400 shadow-2xs'
                              : isGiven
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isSettled ? (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-800" />
                                <span>🤝 Fully Settled</span>
                              </>
                            ) : isGiven ? '↗️ Lent' : '↙️ Borrowed'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Note / Description */}
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="font-extrabold text-slate-900">{t.note}</span>
                      {t.splitGroupId && (
                        <button
                          type="button"
                          onClick={() => setSelectedSplitGroupId(t.splitGroupId)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9.5px] font-black bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 shadow-2xs active:scale-95 cursor-pointer"
                          title="Click to view Group Split short summary in pop up page"
                        >
                          <Users className="w-2.5 h-2.5 text-indigo-600" />
                          <span>Group Split ({t.groupSplitShares?.length || t.splitDetails?.participantCount || 2})</span>
                          <span className="text-indigo-500 font-semibold underline text-[9px]">Summary ↗</span>
                        </button>
                      )}
                    </div>

                    {t.receiptNote && (
                      <div className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 font-mono border border-purple-200/60 max-w-full truncate">
                        <span>🧾</span>
                        <span className="truncate">{t.receiptNote}</span>
                      </div>
                    )}

                    {/* Mobile Pending Status Notice Banner */}
                    {isPending && (
                      <div className="text-[10px] font-bold text-amber-800 bg-amber-50/90 px-2.5 py-1.5 rounded-lg border border-amber-200/80 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Status: Pending</span>
                        </span>
                        <span className="text-[9.5px] font-semibold text-amber-700">
                          {t.isEntryOwner
                            ? (t.type === 'SETTLED' ? 'Settlement awaiting approval' : 'Awaiting friend approval')
                            : (t.type === 'SETTLED' ? 'Settlement needs approval' : 'Action required')}
                        </span>
                      </div>
                    )}

                    {/* Footer Badges & Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${categoryColor}`}>
                          {t.category}
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold border border-slate-200">
                          {t.paymentMethod || 'UPI'}
                        </span>
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            <Clock className="w-2.5 h-2.5 text-amber-700" />
                            <span>Status: Pending</span>
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-2.5 h-2.5 text-rose-600" />
                            <span>Declined</span>
                          </span>
                        ) : t.isShared ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>2-Way</span>
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Settle button for mobile card */}
                        {canSettle && (
                          <button
                            type="button"
                            onClick={() => handleOpenSettle(t)}
                            className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[10px] font-black px-2 py-1 rounded shadow-xs active:scale-95 cursor-pointer"
                            title={t.isShared ? `Send settlement request to ${t.friend.name}` : `Settle with ${t.friend.name}`}
                          >
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            <span>Settle</span>
                          </button>
                        )}

                        {isPending ? (
                          t.isEntryOwner ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[9.5px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Awaiting Friend
                              </span>
                              <button
                                onClick={() => handleDelete(t.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Cancel Request"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApprove(t.id)}
                                disabled={actionLoading === t.id}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2 py-1 rounded shadow-xs"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleReject(t.id)}
                                disabled={actionLoading === t.id}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-bold px-2 py-1 rounded"
                              >
                                Reject
                              </button>
                            </>
                          )
                        ) : t.canDelete !== false ? (
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span 
                            className="inline-flex items-center gap-1 text-[9.5px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 cursor-not-allowed" 
                            title={`Entered by ${t.friend?.name || 'friend'}. Shared entries cannot be modified or deleted by the recipient.`}
                          >
                            <Lock className="w-2.5 h-2.5 text-slate-400" />
                            <span>Shared</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Group Split Bill Breakdown Modal */}
      <SplitGroupModal
        isOpen={Boolean(selectedSplitGroupId)}
        onClose={() => setSelectedSplitGroupId(null)}
        splitGroupId={selectedSplitGroupId}
        onSplitDeleted={() => fetchData(false)}
      />

      {/* Settle Up Balance / Request Modal */}
      <SettleModal
        isOpen={settleModal.open}
        onClose={() => setSettleModal({ open: false, friendId: '', friendName: '', amount: 0, note: '', isShared: false })}
        onSettle={handleSettleSubmit}
        friendId={settleModal.friendId}
        friendName={settleModal.friendName}
        initialAmount={settleModal.amount}
        initialNote={settleModal.note}
        isShared={settleModal.isShared}
      />

    </div>
  );
}
