import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ColorfulLoader from '../components/ColorfulLoader';
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
  Lock
} from 'lucide-react';
import SplitGroupModal from '../components/SplitGroupModal';

export default function Transactions({ onOpenAddTx }) {
  const [transactions, setTransactions] = useState([]);
  const [selectedSplitGroupId, setSelectedSplitGroupId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [friendId, setFriendId] = useState('');
  const [type, setType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
      await api.post(`/transactions/${id}/approve`);
      await fetchData(false);
      window.dispatchEvent(new Event('transaction-updated'));
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
      await api.post(`/transactions/${id}/reject`);
      await fetchData(false);
      window.dispatchEvent(new Event('transaction-updated'));
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
      await api.delete(`/transactions/${id}`);
      await fetchData(false);
      window.dispatchEvent(new Event('transaction-updated'));
    } catch (err) {
      alert(`Delete error: ${err.response?.data?.error || err.message}`);
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
    if (!statusFilter) return true;
    if (statusFilter === 'SPLIT') return Boolean(t.splitGroupId);
    if (statusFilter === 'PENDING') return t.approvalStatus === 'PENDING_APPROVAL';
    if (statusFilter === 'REJECTED') return t.approvalStatus === 'REJECTED';
    if (statusFilter === 'ACTIVE') return t.approvalStatus === 'ACTIVE' || !t.approvalStatus;
    if (statusFilter === 'SHARED') return t.isShared;
    return true;
  });

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
                      <tr key={t.id} className={`hover:bg-slate-50/80 transition-colors ${isPending ? 'bg-amber-50/30' : isRejected ? 'bg-rose-50/30 opacity-75' : ''}`}>
                        <td className="px-3.5 py-3 text-slate-500 font-mono text-[11px] font-medium whitespace-nowrap">
                          <div>{t.date}</div>
                          {t.time && <div className="text-[10px] text-slate-400 font-bold">{t.time}</div>}
                        </td>

                        <td className="px-3.5 py-3 font-black text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-7 h-7 rounded-xl flex items-center justify-center text-xs shadow-2xs border border-black/5 flex-shrink-0"
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
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-black text-[10.5px] border ${
                            isSettled
                              ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                              : isGiven
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isSettled ? (
                              <span>🤝 Settled</span>
                            ) : isGiven ? (
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
                        </td>

                        <td className="px-3.5 py-3 min-w-[180px] max-w-[280px]">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                            <span className="truncate max-w-[170px]" title={t.note}>{t.note}</span>
                            {t.splitGroupId && (
                              <button
                                type="button"
                                onClick={() => setSelectedSplitGroupId(t.splitGroupId)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-2xs transition-all active:scale-95 cursor-pointer flex-shrink-0"
                                title="Click to view full group split breakdown & participants"
                              >
                                <Users className="w-2.5 h-2.5 text-indigo-600" />
                                <span>Group Split</span>
                              </button>
                            )}
                          </div>

                          {/* Short summary for all shared users */}
                          {t.splitGroupId && (
                            <div 
                              onClick={() => setSelectedSplitGroupId(t.splitGroupId)}
                              className="mt-1 p-1.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/80 cursor-pointer transition-all duration-150 group/split shadow-2xs"
                              title="Click to view full group split breakdown & settle up"
                            >
                              <div className="flex items-center justify-between gap-1 text-[10px] font-black text-indigo-900 leading-tight">
                                <span className="flex items-center gap-1">
                                  <Users className="w-2.5 h-2.5 text-indigo-600 flex-shrink-0" />
                                  <span>Group Split ({t.groupSplitShares?.length || t.splitDetails?.participantCount || 2}):</span>
                                </span>
                                <span className="text-[9px] text-indigo-600 font-semibold group-hover/split:underline flex-shrink-0">
                                  View →
                                </span>
                              </div>

                              {t.groupSplitShares && t.groupSplitShares.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  {t.groupSplitShares.map((s, idx) => (
                                    <span 
                                      key={idx}
                                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold leading-none ${
                                        s.isSelf 
                                          ? 'bg-indigo-600 text-white shadow-2xs' 
                                          : s.isPayer 
                                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                          : 'bg-white text-slate-700 border border-indigo-200/70'
                                      }`}
                                    >
                                      <span>{s.name}:</span>
                                      <span className="font-mono">₹{Number(s.amount || 0).toLocaleString()}</span>
                                      {s.isPayer && <span title="Payer">👑</span>}
                                    </span>
                                  ))}
                                </div>
                              ) : t.groupSplitSummary ? (
                                <div className="text-[9.5px] text-indigo-800 font-medium truncate mt-0.5">
                                  {t.groupSplitSummary}
                                </div>
                              ) : (
                                <div className="text-[9.5px] text-indigo-700 font-medium mt-0.5">
                                  Click to view shares
                                </div>
                              )}
                            </div>
                          )}

                          {t.receiptNote && (
                            <div className="text-[9.5px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mt-1 inline-flex items-center gap-1 font-mono border border-purple-200/60 max-w-full truncate" title={t.receiptNote}>
                              <span>🧾</span>
                              <span className="truncate">{t.receiptNote}</span>
                            </div>
                          )}
                        </td>

                        {/* Status & Sync Column */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5 items-start">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                <Clock className="w-2.5 h-2.5 text-amber-700" />
                                <span>Pending</span>
                              </span>
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

                        <td className={`px-3.5 py-3 text-right font-black text-xs sm:text-sm whitespace-nowrap ${
                          isSettled
                            ? 'text-cyan-700'
                            : isGiven
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}>
                          {isSettled ? '' : isGiven ? '+' : '-'}₹{t.amount.toLocaleString()}
                        </td>

                        {/* Action buttons (Approve / Reject / Delete) */}
                        <td className="px-3.5 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleApprove(t.id)}
                                  disabled={actionLoading === t.id}
                                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2 py-1 rounded shadow-2xs transition-all disabled:opacity-50"
                                  title="Accept & Confirm this transaction"
                                >
                                  {actionLoading === t.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => handleReject(t.id)}
                                  disabled={actionLoading === t.id}
                                  className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-bold px-1.5 py-1 rounded transition-all disabled:opacity-50"
                                  title="Decline this transaction"
                                >
                                  <X className="w-2.5 h-2.5" />
                                  <span>Reject</span>
                                </button>
                              </>
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
                    className={`p-3.5 space-y-2.5 transition-colors ${
                      isPending ? 'bg-amber-50/40' : isRejected ? 'bg-rose-50/30 opacity-75' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Top: Friend + Date & Amount */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-xs border border-black/5 flex-shrink-0"
                          style={{ backgroundColor: t.friend?.avatarColor || '#6366f1' }}
                        >
                          {t.friend?.avatarEmoji || '👤'}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-900 truncate">
                            {t.friend?.name || 'Friend'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <span>{t.date}</span>
                            {t.time && <span>• {t.time}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className={`font-black text-sm sm:text-base ${
                          isSettled
                            ? 'text-cyan-700'
                            : isGiven
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}>
                          {isSettled ? '' : isGiven ? '+' : '-'}₹{t.amount.toLocaleString()}
                        </div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9.5px] font-black border ${
                          isSettled
                            ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                            : isGiven
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isSettled ? '🤝 Settled' : isGiven ? '↗️ Lent' : '↙️ Borrowed'}
                        </span>
                      </div>
                    </div>

                    {/* Note / Description */}
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span>{t.note}</span>
                      {t.splitGroupId && (
                        <button
                          type="button"
                          onClick={() => setSelectedSplitGroupId(t.splitGroupId)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-2xs active:scale-95 cursor-pointer"
                        >
                          <Users className="w-2.5 h-2.5 text-indigo-600" />
                          <span>Group Split</span>
                        </button>
                      )}
                    </div>

                    {/* Short summary for all shared users on mobile */}
                    {t.splitGroupId && (
                      <div
                        onClick={() => setSelectedSplitGroupId(t.splitGroupId)}
                        className="p-2 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/80 cursor-pointer transition-all group/split shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-1 text-[10.5px] font-black text-indigo-900">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-indigo-600" />
                            <span>Group Split ({t.groupSplitShares?.length || t.splitDetails?.participantCount || 2} People):</span>
                          </span>
                          <span className="text-[10px] text-indigo-600 underline font-semibold">View Details →</span>
                        </div>

                        {t.groupSplitShares && t.groupSplitShares.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            {t.groupSplitShares.map((s, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  s.isSelf
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : s.isPayer
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-white text-slate-700 border border-indigo-200/70'
                                }`}
                              >
                                <span>{s.name}:</span>
                                <span className="font-mono">₹{Number(s.amount || 0).toLocaleString()}</span>
                                {s.isPayer && <span title="Payer">👑</span>}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-indigo-800 font-medium mt-1 truncate">
                            {t.groupSplitSummary || 'Split between participants'}
                          </div>
                        )}
                      </div>
                    )}

                    {t.receiptNote && (
                      <div className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 font-mono border border-purple-200/60 max-w-full truncate">
                        <span>🧾</span>
                        <span className="truncate">{t.receiptNote}</span>
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
                            <span>Pending</span>
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
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
                        {isPending ? (
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

    </div>
  );
}
