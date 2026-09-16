import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLogo from '../components/AppLogo';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  Receipt, 
  Share2, 
  MessageSquare, 
  KeyRound, 
  CheckCircle2, 
  Zap, 
  ExternalLink,
  Coins,
  TrendingUp,
  Lock,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Shield
} from 'lucide-react';

export default function Landing() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [shareCode, setShareCode] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    try {
      setDemoLoading(true);
      await login('demo@moneytracker.com', '1234');
      navigate('/');
    } catch (err) {
      alert(`Demo login error: ${err.message}`);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleCodeSearch = (e) => {
    e.preventDefault();
    if (!shareCode.trim()) return;
    navigate(`/share/${shareCode.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      
      {/* ------------------------------------------------------------- */}
      {/* AMBIENT AURORA BACKGROUND GLOWS */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[550px] h-[550px] bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-3/4 right-1/4 w-[400px] h-[400px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* TOP NAVIGATION BAR */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo Branding */}
          <AppLogo to="/" size="lg" />

          {/* Nav Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Link
              to="/share"
              className="flex items-center gap-1.5 text-xs font-black text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl transition-all shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Statement Code</span>
              <span className="sm:hidden">Statement</span>
            </Link>

            <button
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="hidden md:flex items-center gap-1.5 text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2.5 rounded-xl transition-all shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>{demoLoading ? 'Launching...' : '1-Click Demo'}</span>
            </button>

            <Link
              to="/login"
              className="text-xs font-black text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-xs"
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="flex items-center gap-1 text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-lg hover:-translate-y-0.5 transition-all flex-shrink-0"
            >
              <span>Register</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </Link>
          </div>

        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-16 relative z-10">
        
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-purple-200 shadow-sm animate-pulseGlow">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-black bg-gradient-to-r from-indigo-700 to-pink-600 bg-clip-text text-transparent uppercase tracking-wider">
              The Next-Gen Peer Debt & Expense Circle
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-none">
            Never lose track of <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              who owes whom money
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Record splits with friends, roommates, and colleagues. Settle debts in 1-click, send direct WhatsApp reminders, and share time-limited verified statement codes.
          </p>

          {/* 4 Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            
            {/* 1. Register / Get Started */}
            <Link
              to="/register"
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-black text-sm sm:text-base px-7 py-3.5 rounded-2xl shadow-xl shadow-indigo-500/30 hover:scale-105 transition-all"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* 2. 1-Click Demo Tour */}
            <button
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border-2 border-indigo-200 hover:border-indigo-400 text-indigo-700 font-black text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all"
            >
              <Zap className="w-4 h-4 text-indigo-600" />
              <span>{demoLoading ? 'Starting Tour...' : 'Live Demo View'}</span>
            </button>

            {/* 3. Sign In */}
            <Link
              to="/login"
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all"
            >
              <KeyRound className="w-4 h-4 text-purple-300" />
              <span>Sign In with PIN</span>
            </Link>

          </div>

          {/* Instant 6-Digit Share Code Inspector */}
          <div className="max-w-xl mx-auto pt-6">
            <div className="bg-white/95 border-2 border-purple-200/90 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-purple-600" />
                  <span>Inspect Friend Statement via Code</span>
                </span>
                <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                  No Login Needed
                </span>
              </div>

              <form onSubmit={handleCodeSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code (e.g. 432492)"
                    maxLength={8}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-mono font-black text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 tracking-wider"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black px-6 py-3 rounded-2xl text-xs shadow-md shadow-purple-500/25 transition-all flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>Open Statement</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* INTERACTIVE APP PREVIEW CARD */}
        {/* ------------------------------------------------------------- */}
        <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-950 text-white shadow-2xl border border-indigo-500/30 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/30 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Live Interactive System</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Complete Peer Expense Architecture
              </h2>
            </div>
            
            <button
              onClick={handleDemoLogin}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs px-5 py-3 rounded-xl shadow-lg hover:scale-105 transition-all self-start sm:self-auto"
            >
              <span>Explore Live Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3 Interactive Feature Modules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Module 1: Running Balance */}
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 space-y-3 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center font-black">
                ↗️
              </div>
              <h3 className="font-black text-base text-white">Chronological Running Ledger</h3>
              <p className="text-xs text-indigo-200 font-medium">
                Every rupee lent or borrowed computes continuous running balance with exact date, time, category, and payment mode.
              </p>
            </div>

            {/* Module 2: WhatsApp Reminders */}
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 space-y-3 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center font-black">
                💬
              </div>
              <h3 className="font-black text-base text-white">WhatsApp 1-Click Reminders</h3>
              <p className="text-xs text-indigo-200 font-medium">
                Send polite, pre-formatted WhatsApp reminders with exact outstanding amounts and friendly message templates.
              </p>
            </div>

            {/* Module 3: Time-Limited Share Codes */}
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 space-y-3 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center font-black">
                🔗
              </div>
              <h3 className="font-black text-base text-white">Time-Limited Share Codes</h3>
              <p className="text-xs text-indigo-200 font-medium">
                Generate 6-digit expiring access codes (15m, 1h, 24h) to share transparent statements with friends without requiring login.
              </p>
            </div>

          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* 6 COLORFUL FEATURE HIGHLIGHTS */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
              Why MoneyTracker is Different
            </h2>
            <p className="text-sm text-slate-500 font-semibold">
              Designed specifically for real-world peer debts, trips, roommates & bill sharing
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="glass-card rounded-3xl p-6 border-indigo-200/90 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-500/25">
                🇮🇳
              </div>
              <h3 className="text-lg font-black text-slate-900">Native Indian Rupee (₹)</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Streamlined specifically for Indian currency formats (₹), UPI payment modes, and regional group expenses.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card rounded-3xl p-6 border-emerald-200/90 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/25">
                🤝
              </div>
              <h3 className="text-lg font-black text-slate-900">1-Click Full Settlement</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Clear all dues with Google Pay, PhonePe, Paytm, or Cash. Instantly zeroes out balances with receipt confirmation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card rounded-3xl p-6 border-rose-200/90 bg-gradient-to-br from-rose-50/60 via-white to-pink-50/40 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-xl shadow-md shadow-rose-500/25">
                🔒
              </div>
              <h3 className="text-lg font-black text-slate-900">Security PIN & Auto-Lock</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Fast 4–6 digit security PIN access with automatic account lockout after 5 failed attempts and admin unlock supervision.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card rounded-3xl p-6 border-amber-200/90 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/25">
                📊
              </div>
              <h3 className="text-lg font-black text-slate-900">Visual Category Analytics</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Vivid interactive Donut & Bar charts breaking down your spending velocity across food, travel, rent, and shopping.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-card rounded-3xl p-6 border-cyan-200/90 bg-gradient-to-br from-cyan-50/60 via-white to-blue-50/40 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center text-xl shadow-md shadow-cyan-500/25">
                📥
              </div>
              <h3 className="text-lg font-black text-slate-900">CSV Spreadsheet Export</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Download verified transaction ledgers as clean CSV files anytime for offline records, Excel, or tax accounting.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-card rounded-3xl p-6 border-purple-200/90 bg-gradient-to-br from-purple-50/60 via-white to-fuchsia-50/40 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl shadow-md shadow-purple-500/25">
                🛡️
              </div>
              <h3 className="text-lg font-black text-slate-900">Hidden Master Administration</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Decoupled admin portal at /admin with master passkey authentication, user unlock controls, and platform metrics.
              </p>
            </div>

          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* BOTTOM CTA BANNER */}
        {/* ------------------------------------------------------------- */}
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-center space-y-6 shadow-2xl">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Start Tracking Peer Debts in 10 Seconds
          </h2>
          <p className="text-base sm:text-lg text-indigo-100 font-medium max-w-xl mx-auto">
            Join MoneyTracker today. Free, fast, and built for flawless peer financial harmony.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="bg-white hover:bg-slate-50 text-indigo-700 font-black text-sm sm:text-base px-8 py-3.5 rounded-2xl shadow-xl hover:scale-105 transition-all"
            >
              Get Started Free
            </Link>
            <button
              onClick={handleDemoLogin}
              className="bg-indigo-950/40 hover:bg-indigo-950/60 border border-white/30 text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl transition-all"
            >
              ⚡ Instant Demo
            </button>
          </div>
        </div>

      </main>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-semibold">
          <AppLogo to="/" size="sm" showBadge={false} subtitleText="Smart Peer Debt Management" />

          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-indigo-600 transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-indigo-600 transition-colors">Register</Link>
            <Link to="/share" className="hover:text-indigo-600 transition-colors">Statement Lookup</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
