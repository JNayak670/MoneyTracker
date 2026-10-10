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
  Wallet,
  ArrowLeft,
  Home,
  Users
} from 'lucide-react';
import { exportToCSV } from '../services/exportService';
import ColorfulLoader from '../components/ColorfulLoader';
import AppLogo from '../components/AppLogo';
import SplitGroupModal from '../components/SplitGroupModal';
import { executeWithServerWakeup, pingServer } from '../services/serverWakeupService';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
  const [wakeUpMessage, setWakeUpMessage] = useState('');
  const [selectedSplitGroupId, setSelectedSplitGroupId] = useState(null);

  // Proactive ping on page visit
  useEffect(() => {
    pingServer();
  }, []);

  const fetchLedger = async (codeToFetch) => {
    const cleanCode = (codeToFetch || '').trim().toUpperCase();
    if (!cleanCode) return;
    try {
      setLoading(true);
      setError('');
      setIsExpired(false);
      setWakeUpMessage('');
      const res = await executeWithServerWakeup(
        () => axios.get(`${API_BASE}/share/${cleanCode}`),
        {
          onWakeupProgress: ({ elapsedSec }) => {
            setWakeUpMessage(`Cloud backend is waking up (${elapsedSec}s elapsed)...`);
          }
        }
      );
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
      setWakeUpMessage('');
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Header Navigation Bar with Unified App Logo and Back to Home Button */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs flex-shrink-0">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Unified Application Logo */}
          <AppLogo 
            to="/" 
            badgeText="Shared Statement" 
            badgeVariant="indigo" 
            subtitleText="Verified Friend Transaction Ledger" 
            className="scale-90 xs:scale-95 sm:scale-100 origin-left"
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Go Back Home Button */}
            <Link
              to="/"
              id="back-home-button"
              className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-black text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-2xs hover:shadow-xs transition-all group active:scale-95"
              title="Go Back to Home Page"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-0.5 transition-transform" />
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-indigo-600" />
              <span className="hidden xs:inline">Back to Home</span>
              <span className="xs:hidden">Home</span>
            </Link>

            {/* Non-logged in visitors can sign in */}
            {!user && (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl shadow-xs hover:shadow-md transition-all flex-shrink-0"
              >
                <Wallet className="w-3.5 h-3.5 hidden xs:inline" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 animate-fadeIn">
        
        {/* Page Title Banner */}
        <div className="pb-3 border-b border-slate-200 flex flex-col xs:flex-row xs:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Shared Ledger Statement</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Inspect time-limited friend statements & verify mutual cross-settlements
            </p>
          </div>

          {ledgerData && (
            <button
              onClick={() => {
                setLedgerData(null);
                navigate('/share');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-colors self-start xs:self-auto"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lookup Another Code</span>
            </button>
          )}
        </div>

        {/* Code Search bar if not loaded or switching code */}
        {(!currentCode || error) && (
          <div className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center space-y-3 sm:space-y-4 border border-slate-200 shadow-lg">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto text-lg sm:text-xl">
              🔑
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">Enter 6-Digit Share Code</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Got a temporary statement code from a friend? Enter it below to view all mutual splits, loans & settlements.
              </p>
            </div>

            <form onSubmit={handleSearchCode} className="max-w-md mx-auto flex flex-col xs:flex-row gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. 849201"
                maxLength={8}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-center text-base sm:text-lg font-mono font-black text-slate-900 tracking-widest placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs shadow-md active:scale-[0.98] transition-all"
              >
                View Ledger
              </button>
            </form>

            {error && (
              <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl text-xs font-semibold max-w-md mx-auto flex items-start gap-2 text-left ${
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
          <ColorfulLoader 
            fullScreen={false} 
            minHeight="min-h-[300px]" 
            message={wakeUpMessage || "Decrypting Shared Ledger..."} 
            submessage={wakeUpMessage ? "Render free tier instance spins down when idle. Waiting for cloud server to boot..." : "Validating 6-digit access code and fetching verified peer records..."} 
            tag={wakeUpMessage ? "CLOUD BACKEND WAKE UP" : "DATABASE SYNC"}
            statusText={wakeUpMessage ? "Connecting to Cloud API" : "Verifying Statement Code"}
          />
        )}

        {/* Loaded Ledger Content */}
        {!loading && ledgerData && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Live Expiration Countdown Banner */}
            <div className={`rounded-2xl p-3.5 sm:p-4 border flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5 sm:gap-3 shadow-xs ${
              isExpired 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200 text-indigo-950'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isExpired ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
                    {isExpired ? 'Statement Expired' : 'Time-Limited Secure Statement'}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-600 font-semibold">
                    Code: <span className="font-mono font-bold text-slate-900">{ledgerData.code}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full xs:w-auto justify-between xs:justify-end">
                {!isExpired && (
                  <div className="bg-white/80 backdrop-blur-xs border border-indigo-200 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-mono text-[11px] sm:text-xs font-black text-indigo-700 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{timeLeft}</span>
                  </div>
                )}
                <button
                  onClick={() => exportToCSV(ledgerData.transactions)}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Friend & User Profiles + Net Balance Banner */}
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6 border border-slate-200 shadow-md">
              
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-slate-100">
                
                {/* User / Friend Avatars */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex -space-x-2.5 items-center">
                    <div 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-md border-2 border-white"
                      style={{ backgroundColor: ledgerData.friend.avatarColor || '#6366f1' }}
                    >
                      {ledgerData.friend.avatarEmoji || '👤'}
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center text-xl sm:text-2xl shadow-md border-2 border-white font-bold">
                      💼
                    </div>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      {ledgerData.friend.name} & {ledgerData.owner.name}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-semibold">
                      Mutual expense statement & ledger history
                    </p>
                  </div>
                </div>

                <div className="text-left xs:text-right self-start xs:self-auto bg-slate-50 xs:bg-transparent px-2.5 py-1 xs:p-0 rounded-lg">
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold">Total Entries: </span>
                  <span className="text-xs sm:text-base font-black text-slate-800">
                    {ledgerData.summary.transactionCount} txns
                  </span>
                </div>
              </div>

              {/* Main Balance Display */}
              <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 border text-center transition-all ${
                isFriendOwing
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : isUserOwing
                  ? 'bg-gradient-to-br from-rose-500 to-orange-600 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-600/30 ring-2 ring-emerald-300'
              }`}>
                <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest text-white/90 mb-1 flex items-center justify-center gap-1.5">
                  {isFriendOwing 
                    ? `🟢 ${ledgerData.friend.name} Needs to Pay ${ledgerData.owner.name}`
                    : isUserOwing
                    ? `🔴 ${ledgerData.owner.name} Needs to Pay ${ledgerData.friend.name}`
                    : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>🤝 All Dues Are Settled (Zero Balance)</span>
                      </>
                    )}
                </div>

                <div className="text-3xl xs:text-4xl sm:text-5xl font-black tracking-tight my-1.5 sm:my-2 drop-shadow-sm font-mono">
                  {currency}{Math.abs(balance).toLocaleString()}
                </div>

                <p className="text-[11px] sm:text-xs text-white/90 font-medium">
                  {isSettled
                    ? 'There are zero pending dues between both parties.'
                    : `Current outstanding balance calculated across all ${ledgerData.summary.transactionCount} transactions.`}
                </p>
              </div>

              {/* 3 Metric Pills */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-700 truncate">Total Lent</div>
                  <div className="text-xs xs:text-sm sm:text-base font-black text-emerald-800 mt-0.5 truncate">
                    {currency}{ledgerData.summary.totalGiven.toLocaleString()}
                  </div>
                </div>

                <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-200 text-center">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-rose-700 truncate">Borrowed</div>
                  <div className="text-xs xs:text-sm sm:text-base font-black text-rose-800 mt-0.5 truncate">
                    {currency}{ledgerData.summary.totalReceived.toLocaleString()}
                  </div>
                </div>

                <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-cyan-50 border border-cyan-200 text-center">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-cyan-700 truncate">Settled</div>
                  <div className="text-xs xs:text-sm sm:text-base font-black text-cyan-800 mt-0.5 truncate">
                    {currency}{ledgerData.summary.totalSettled.toLocaleString()}
                  </div>
                </div>
              </div>

            </div>

            {/* Transactions History Table & Mobile Cards */}
            <div className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-md">
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">Chronological Transactions Ledger</h3>
                </div>
                <span className="text-[11px] sm:text-xs text-slate-500 font-bold font-mono">
                  {ledgerData.transactions.length} Records
                </span>
              </div>

              {/* Mobile View: High-density interactive cards (hidden on sm+) */}
              <div className="block sm:hidden divide-y divide-slate-100 bg-white">
                {ledgerData.transactions.map((t) => {
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
                    <div 
                      key={t.id} 
                      className={`p-3.5 sm:p-4 space-y-2.5 rounded-2xl transition-all border ${
                        isSettledTx
                          ? 'border-2 border-emerald-400 border-l-[8px] border-l-emerald-600 bg-gradient-to-br from-emerald-100/95 via-teal-50/90 to-white shadow-lg ring-2 ring-emerald-500/25 overflow-hidden'
                          : t.splitGroupId
                          ? 'border-2 border-indigo-300 border-l-[8px] border-l-indigo-600 bg-gradient-to-br from-indigo-50/95 via-purple-50/40 to-white shadow-md ring-2 ring-indigo-400/20 hover:border-indigo-400'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      {/* Top banner strip for settlement */}
                      {isSettledTx && (
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

                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-black ${isSettledTx ? 'text-emerald-950 text-sm' : t.splitGroupId ? 'text-indigo-950 font-black' : 'text-slate-900'}`}>{t.note}</span>
                            {t.splitGroupId && (
                              <button
                                type="button"
                                onClick={() => setSelectedSplitGroupId(t.splitGroupId)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-black bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-300 active:scale-95 cursor-pointer flex-shrink-0"
                                title="Click to view Group Split summary modal"
                              >
                                <Users className="w-3.5 h-3.5 text-white" />
                                <span>👥 SPLIT BILL</span>
                                <span className="bg-white/20 text-white px-1.5 py-0.2 rounded font-extrabold text-[8.5px] sm:text-[9px]">Summary ↗</span>
                              </button>
                            )}
                          </div>
                          {t.receiptNote && (
                            <div className="text-[10px] text-slate-500 font-mono">Ref: {t.receiptNote}</div>
                          )}
                          <div className={`text-[10px] font-mono ${isSettledTx ? 'text-emerald-800 font-semibold' : 'text-slate-400'}`}>
                            📅 {t.date} {t.time ? `• ${t.time}` : ''}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 space-y-1">
                          {isSettledTx ? (
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs sm:text-sm shadow-xs">
                              <span>🤝 {currency}{t.amount.toLocaleString()}</span>
                            </div>
                          ) : (
                            <div className={`text-sm font-black ${
                              isGiven ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {isGiven ? '+' : '-'}{currency}{t.amount.toLocaleString()}
                            </div>
                          )}
                          <div className={`text-[10px] font-mono ${
                            isSettledTx && Math.abs(t.runningBalanceAfter || 0) < 0.01
                              ? 'text-emerald-800 font-black flex items-center justify-end gap-1'
                              : 'text-slate-500 font-semibold'
                          }`}>
                            {isSettledTx && Math.abs(t.runningBalanceAfter || 0) < 0.01 ? (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                                <span>Bal: {currency}0 (Zero Dues Cleared)</span>
                              </>
                            ) : (
                              <span>Bal: {currency}{t.runningBalanceAfter?.toLocaleString() || 0}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-black text-[10px] border ${
                          isSettledTx
                            ? 'bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-900 border-teal-300 ring-1 ring-teal-400/30 shadow-2xs'
                            : isGiven
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isSettledTx ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-teal-700" />
                              <span>🤝 Settled Up</span>
                            </>
                          ) : isGiven ? '↗️ Lent' : '↙️ Borrowed'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${categoryColors}`}>
                          {t.category}
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200">
                          {t.paymentMethod || 'UPI'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Full detailed table (hidden on mobile) */}
              <div className="hidden sm:block overflow-x-auto">
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
                        <tr 
                          key={t.id} 
                          className={`transition-all ${
                            isSettledTx
                              ? 'bg-gradient-to-r from-emerald-100/95 via-teal-50/90 to-emerald-50/70 hover:from-emerald-200/80 hover:to-teal-100/90 border-l-[6px] border-l-emerald-600 border-y-2 border-y-emerald-300 shadow-xs'
                              : t.splitGroupId
                              ? 'bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-white hover:bg-indigo-50/95 border-l-[6px] border-l-indigo-600 border-y border-y-indigo-200/70 shadow-2xs'
                              : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                          }`}
                        >
                          <td className={`px-5 py-4 text-slate-500 font-mono font-medium ${isSettledTx ? 'border-l-[6px] border-l-emerald-600' : ''}`}>
                            <div className={isSettledTx ? 'font-bold text-emerald-950' : ''}>{t.date}</div>
                            {t.time && <div className={`text-[10px] font-bold ${isSettledTx ? 'text-emerald-700' : 'text-slate-400'}`}>{t.time}</div>}
                          </td>

                          <td className="px-5 py-4">
                            {isSettledTx ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[11px] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5] flex-shrink-0" />
                                <span>🤝 FULLY SETTLED</span>
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-black text-[11px] border shadow-2xs ${
                                isGiven
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {isGiven ? (
                                  <>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>↗️ Lent</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600" />
                                    <span>↙️ Borrowed</span>
                                  </>
                                )}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 max-w-xs">
                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                {isSettledTx && (
                                  <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs flex-shrink-0">
                                    <span>🤝</span>
                                    <span>Settlement</span>
                                  </span>
                                )}
                                <span className={`truncate ${isSettledTx ? 'font-black text-emerald-950' : t.splitGroupId ? 'text-indigo-950 font-black' : ''}`}>{t.note}</span>
                              </div>
                              {t.splitGroupId && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSplitGroupId(t.splitGroupId)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-300 transition-all active:scale-95 cursor-pointer flex-shrink-0"
                                  title="Click to view Group Split summary modal"
                                >
                                  <Users className="w-3 h-3 text-white flex-shrink-0" />
                                  <span>👥 Split Bill</span>
                                  <span className="bg-white/20 text-white px-1.5 py-0.2 rounded font-extrabold text-[8.5px] sm:text-[9px]">Summary ↗</span>
                                </button>
                              )}
                            </div>
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

                          <td className="px-5 py-4 text-right font-black whitespace-nowrap">
                            {isSettledTx ? (
                              <div className="inline-flex flex-col items-end">
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs sm:text-sm shadow-md ring-2 ring-emerald-300">
                                  <span>🤝 {currency}{t.amount.toLocaleString()}</span>
                                </span>
                                <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-950 bg-emerald-200/90 px-2 py-0.5 rounded-md mt-1 border border-emerald-300">
                                  ✓ Cleared Full Dues
                                </span>
                              </div>
                            ) : (
                              <div className={`text-sm ${
                                isGiven ? 'text-emerald-700' : 'text-rose-700'
                              }`}>
                                {isGiven ? '+' : '-'}{currency}{t.amount.toLocaleString()}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right font-mono font-bold text-xs whitespace-nowrap">
                            {isSettledTx && Math.abs(t.runningBalanceAfter || 0) < 0.01 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-950 bg-emerald-200/90 px-2 py-0.5 rounded-md border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>{currency}0 (Cleared)</span>
                              </span>
                            ) : (
                              <span className="text-slate-800">
                                {currency}{t.runningBalanceAfter?.toLocaleString() || 0}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Public footer disclaimer */}
            <div className="text-center text-[11px] sm:text-xs text-slate-400 py-3 sm:py-4 font-medium">
              🔒 Powered by MoneyTracker • Time-Limited Public Statement • Access expires automatically.
            </div>

          </div>
        )}

      </main>

      {/* Group Split Bill Breakdown Modal */}
      <SplitGroupModal
        isOpen={Boolean(selectedSplitGroupId)}
        onClose={() => setSelectedSplitGroupId(null)}
        splitGroupId={selectedSplitGroupId}
      />
    </div>
  );
}
