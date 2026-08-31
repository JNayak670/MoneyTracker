import React, { useState, useEffect } from 'react';
import api from '../services/api';
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
  Calendar
} from 'lucide-react';

export default function Transactions({ onOpenAddTx }) {
  const [transactions, setTransactions] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [friendId, setFriendId] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (friendId) params.friendId = friendId;
      if (type) params.type = type;
      if (category) params.category = category;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [txRes, friendsRes] = await Promise.all([
        api.get('/transactions', { params }),
        api.get('/friends')
      ]);

      setTransactions(txRes.data);
      setFriends(friendsRes.data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
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
  }, [friendId, type, category, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction? Balance will be adjusted.')) return;
    try {
      await api.delete(`/transactions/${id}`);
      await fetchData();
      window.dispatchEvent(new Event('transaction-updated'));
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setFriendId('');
    setType('');
    setCategory('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Transaction Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete searchable history of all loans, shared splits, and settlements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportToCSV(transactions)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAddTx}
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
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
            className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl py-1.5 font-semibold transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Transactions Found</h3>
            <p className="text-xs text-slate-500">Try modifying your filters or recording a new expense.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Friend</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Description & Note</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Payment Mode</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(t => {
                  const isGiven = t.type === 'GIVEN' || t.impactOnUser > 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 text-slate-500 font-mono">
                        <div>{t.date}</div>
                        {t.time && <div className="text-[10px] text-slate-400">{t.time}</div>}
                      </td>

                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shadow-xs"
                            style={{ backgroundColor: t.friend?.avatarColor || '#6366f1' }}
                          >
                            {t.friend?.avatarEmoji || '👤'}
                          </span>
                          <span>{t.friend?.name || 'Friend'}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          t.type === 'SETTLED'
                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            : isGiven
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isGiven ? <ArrowUpRight className="w-3 h-3 text-emerald-600" /> : <ArrowDownLeft className="w-3 h-3 text-rose-600" />}
                          <span>{t.type}</span>
                        </span>
                      </td>

                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900">{t.note}</div>
                        {t.receiptNote && (
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate font-mono">
                            Ref: {t.receiptNote}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px] border border-slate-200/60">
                          {t.category}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 font-mono">
                        {t.paymentMethod || 'UPI'}
                      </td>

                      <td className={`px-5 py-3.5 text-right font-extrabold text-sm ${
                        t.type === 'SETTLED'
                          ? 'text-cyan-700'
                          : isGiven
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}>
                        {isGiven ? '+' : '-'}₹{t.amount.toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
  );
}
