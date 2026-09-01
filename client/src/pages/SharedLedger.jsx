import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Receipt, 
  Download, 
  Search, 
  Share2, 
  AlertCircle,
  ExternalLink,
  Wallet
} from 'lucide-react';
import { exportToCSV } from '../services/exportService';

const API_BASE = '/api';

export default function SharedLedger() {
  const { user } = useAuth();
  const { code: routeParamCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Robust code extraction from param or pathname (e.g., /share/398652 or /share/398652/)
  const pathParts = location.pathname.split('/').filter(Boolean);
  const pathCode = pathParts[0] === 'share' && pathParts[1] ? pathParts[1] : '';
  const currentCode = (routeParamCode || pathCode || '').trim().toUpperCase();

  const [codeInput, setCodeInput] = useState(currentCode);
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(Boolean(currentCode));
  const [error, setError] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const fetchLedger = async (codeToFetch) => {
    const cleanCode = (codeToFetch || '').trim().toUpperCase();
    if (!cleanCode) return;
    try {
      setLoading(true);
      setError('');
      setIsExpired(false);
      const res = await axios.get(`${API_BASE}/share/${cleanCode}`);
      if (res.data.success) {
        setLedgerData(res.data.data);
      }
    } catch (err) {
      if (err.response?.status === 410 || err.response?.data?.expired) {
        setIsExpired(true);
        setError(err.response?.data?.error || 'This share code has expired.');
      } else {
        setError(err.response?.data?.error || 'Failed to load shared ledger. Please check the code.');
      }
      setLedgerData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCode) {
      setCodeInput(currentCode);
      fetchLedger(currentCode);
    }
  }, [currentCode]);

  // Live Countdown Timer
  useEffect(() => {
    if (!ledgerData?.expiresAt) return;

    const updateTimer = () => {
      const difference = new Date(ledgerData.expiresAt).getTime() - new Date().getTime();
      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [ledgerData]);

  const handleSearchCode = (e) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    const clean = codeInput.trim().toUpperCase();
    navigate(`/share/${clean}`);
    fetchLedger(clean);
  };

  const currency = ledgerData?.owner?.currency || '₹';
  const balance = ledgerData?.summary?.currentBalance || 0;
  const isFriendOwing = balance > 0;
  const isUserOwing = balance < 0;
  const isSettled = balance === 0;

  return (
    <div className={`${user ? 'py-2' : 'min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8'}`}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        
        {/* Top Public Header (Shown only to non-logged in visitors) */}
        {!user && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-2xl shadow-md shadow-brand-500/25">
                💸
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900">MoneyTracker</h1>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Shared Statement
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold">Verified Friend Transaction Ledger</p>
              </div>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Open MoneyTracker App</span>
            </Link>
          </div>
        )}

        {/* In-App Title Banner when user is logged in */}
        {user && (
          <div className="pb-2 border-b border-slate-200">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Shared Ledger Portal
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Inspect time-limited friend statements & verify mutual cross-settlements
            </p>
          </div>
        )}

        {/* Code Search bar if not loaded or switching code */}
        {(!currentCode || error) && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 text-center space-y-4 border border-slate-200 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto text-xl">
              🔑
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Enter 6-Digit Share Code</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Got a temporary statement code from a friend? Enter it below to view all mutual splits, loans & settlements.
              </p>
            </div>

            <form onSubmit={handleSearchCode} className="max-w-md mx-auto flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. 849201"
                maxLength={8}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-center text-lg font-mono font-black text-slate-900 tracking-widest placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-black px-6 py-3 rounded-2xl text-xs shadow-md transition-all"
              >
                View Ledger
              </button>
            </form>

            {error && (
              <div className={`p-4 rounded-2xl text-xs font-semibold max-w-md mx-auto flex items-start gap-2 text-left ${
                isExpired ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{isExpired ? 'Link Expired' : 'Access Error'}</div>
                  <div className="mt-0.5 text-[11px]">{error}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-500">Decrypting & loading shared ledger...</p>
          </div>
        )}

        {/* Loaded Ledger Content */}
        {!loading && ledgerData && (
          <div className="space-y-6">
            
            {/* Live Expiration Countdown Banner */}
            <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs ${
              isExpired 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200 text-indigo-950'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isExpired ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">
                    {isExpired ? 'Statement Expired' : 'Time-Limited Secure Statement'}
                  </div>
                  <div className="text-[11px] text-slate-600 font-semibold">
                    Code: <span className="font-mono font-bold text-slate-900">{ledgerData.code}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isExpired && (
                  <div className="bg-white/80 backdrop-blur-xs border border-indigo-200 px-3 py-1.5 rounded-xl font-mono text-xs font-black text-indigo-700 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Valid for {timeLeft}</span>
                  </div>
                )}
                <button
                  onClick={() => exportToCSV(ledgerData.transactions)}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Friend & User Profiles + Net Balance Banner */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 shadow-md">
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
                
                {/* User / Friend Avatars */}
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3 items-center">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border-2 border-white"
                      style={{ backgroundColor: ledgerData.friend.avatarColor || '#6366f1' }}
                    >
                      {ledgerData.friend.avatarEmoji || '👤'}
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-md border-2 border-white font-bold">
                      💼
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      {ledgerData.friend.name} & {ledgerData.owner.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold">
                      Mutual expense statement & ledger history
                    </p>
                  </div>
                </div>

                <div className="text-right self-end sm:self-auto">
                  <span className="text-[11px] text-slate-500 font-semibold">Total Entries</span>
                  <div className="text-lg font-black text-slate-800">
                    {ledgerData.summary.transactionCount} transactions
                  </div>
                </div>
              </div>

              {/* Main Balance Display */}
              <div className={`rounded-3xl p-6 border text-center transition-all ${
                isFriendOwing
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : isUserOwing
                  ? 'bg-gradient-to-br from-rose-500 to-orange-600 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg'
              }`}>
                <div className="text-xs uppercase font-black tracking-widest text-white/80 mb-1">
                  {isFriendOwing 
                    ? `🟢 ${ledgerData.friend.name} Needs to Pay ${ledgerData.owner.name}`
                    : isUserOwing
                    ? `🔴 ${ledgerData.owner.name} Needs to Pay ${ledgerData.friend.name}`
                    : '🤝 All Dues Are Settled'}
                </div>

                <div className="text-4xl sm:text-5xl font-black tracking-tight my-2 drop-shadow-sm">
                  {currency}{Math.abs(balance).toLocaleString()}
                </div>

                <p className="text-xs text-white/90 font-medium">
                  {isSettled
                    ? 'There are zero pending dues between both parties.'
                    : `Current outstanding balance calculated across all ${ledgerData.summary.transactionCount} transactions.`}
                </p>
              </div>

              {/* 3 Metric Pills */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Total Lent</div>
                  <div className="text-base font-black text-emerald-800 mt-0.5">
                    {currency}{ledgerData.summary.totalGiven.toLocaleString()}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-rose-700">Total Borrowed</div>
                  <div className="text-base font-black text-rose-800 mt-0.5">
                    {currency}{ledgerData.summary.totalReceived.toLocaleString()}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-cyan-700">Total Settled</div>
                  <div className="text-base font-black text-cyan-800 mt-0.5">
                    {currency}{ledgerData.summary.totalSettled.toLocaleString()}
                  </div>
                </div>
              </div>

            </div>

            {/* Transactions History Table */}
            <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 shadow-md">
              <div className="px-6 py-4 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-brand-600" />
                  <h3 className="text-sm font-black text-slate-900">Chronological Transactions Ledger</h3>
                </div>
                <span className="text-xs text-slate-500 font-bold font-mono">
                  {ledgerData.transactions.length} Records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold">
                    <tr>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Description</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Payment</th>
                      <th className="px-5 py-3.5 text-right">Amount</th>
                      <th className="px-5 py-3.5 text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {ledgerData.transactions.map(t => {
                      const isGiven = t.type === 'GIVEN';
                      const isSettledTx = t.type === 'SETTLED';

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
                            <div>{t.date}</div>
                            {t.time && <div className="text-[10px] text-slate-400 font-bold">{t.time}</div>}
                          </td>

                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-[11px] border ${
                              isSettledTx
                                ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                : isGiven
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {isSettledTx ? '🤝 Settled' : isGiven ? '↗️ Lent' : '↙️ Borrowed'}
                            </span>
                          </td>

                          <td className="px-5 py-4 max-w-xs">
                            <div className="font-bold text-slate-900">{t.note}</div>
                            {t.receiptNote && (
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate font-mono">
                                Ref: {t.receiptNote}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${categoryColors}`}>
                              {t.category}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border border-slate-200">
                              {t.paymentMethod || 'UPI'}
                            </span>
                          </td>

                          <td className={`px-5 py-4 text-right font-black text-sm ${
                            isSettledTx ? 'text-cyan-700' : isGiven ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {isSettledTx ? '' : isGiven ? '+' : '-'}{currency}{t.amount.toLocaleString()}
                          </td>

                          <td className="px-5 py-4 text-right font-mono font-bold text-xs text-slate-800">
                            {currency}{t.runningBalanceAfter?.toLocaleString() || 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Public footer disclaimer */}
            <div className="text-center text-xs text-slate-400 py-4 font-medium">
              🔒 Powered by MoneyTracker • Time-Limited Public Statement • Access expires automatically.
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
