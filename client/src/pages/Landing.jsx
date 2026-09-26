import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLogo from '../components/AppLogo';
import { 
  ArrowRight, 
  Users, 
  Zap, 
  ExternalLink,
  Search,
  KeyRound,
  Menu,
  X,
  Monitor,
  Share2,
  User
} from 'lucide-react';

// Authentic WhatsApp icon matching the mockup
function WhatsAppIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

// 4-tile grid icon matching the statement card
function StatementTileIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2.5" />
      <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2.5" />
      <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2.5" />
      <path d="M14 14L21 21M21 14L14 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Landing() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [shareCode, setShareCode] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-[#F8FAFD] text-slate-900 flex flex-col selection:bg-purple-600 selection:text-white relative">
      
      {/* ------------------------------------------------------------- */}
      {/* TOP NAVIGATION BAR (Auto-adapts: Full actions on Laptop, Hamburger on Phone) */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/90 shadow-sm shadow-slate-900/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-3">
          
          {/* Logo Branding */}
          <AppLogo to="/" size="md" />

          {/* Desktop Right Nav Buttons (hidden on phone, visible on laptop/desktop) */}
          <div className="hidden md:flex items-center gap-2.5">
            
            {/* <> Code Button */}
            <Link
              to="/share"
              className="flex items-center gap-1.5 text-xs font-black text-purple-700 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200/80 hover:border-purple-300 px-3.5 py-2 rounded-xl transition-all shadow-xs hover:shadow-sm"
            >
              <span className="font-mono text-xs font-black">&lt;&gt;</span>
              <span>Code</span>
            </Link>

            {/* ⚡ 1-Click Demo Button */}
            <button
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="flex items-center gap-1.5 text-xs font-black text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border-2 border-[#BFDBFE]/90 hover:border-blue-300 px-4 py-2 rounded-xl transition-all shadow-xs hover:shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-[#2563EB]" />
              <span>{demoLoading ? 'Starting Tour...' : '1-Click Demo'}</span>
            </button>

            {/* Sign In Button */}
            <Link
              to="/login"
              className="text-xs font-black text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border-2 border-slate-200/90 hover:border-slate-300 px-4 py-2 rounded-xl transition-all shadow-xs hover:shadow-sm"
            >
              Sign In
            </Link>

            {/* Register -> Button */}
            <Link
              to="/register"
              className="flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#EC4899] hover:from-[#4338CA] hover:to-[#DB2777] border border-white/30 px-4 py-2 rounded-xl shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <span>Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

          </div>

          {/* Mobile Hamburger Button (visible on phone, hidden on laptop/desktop) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-2.5 shadow-xl animate-fadeIn">
            <Link
              to="/share"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50 text-purple-700 font-black text-xs border-2 border-purple-200/90 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">&lt;&gt;</span>
                <span>Enter Statement Code</span>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400" />
            </Link>

            <button
              onClick={() => { setMobileMenuOpen(false); handleDemoLogin(); }}
              disabled={demoLoading}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-blue-50 text-blue-700 font-black text-xs border-2 border-blue-200/90 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 fill-current text-blue-600" />
                <span>{demoLoading ? 'Starting Tour...' : 'Launch 1-Click Demo'}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-400" />
            </button>

            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 text-white font-black text-xs border border-slate-700 shadow-md"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-300" />
                <span>Sign In with PIN</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#EC4899] text-white font-black text-xs border border-white/20 shadow-lg shadow-purple-500/30"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTAINER (Auto responsive based on screen/device width) */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 lg:pt-7 pb-10 sm:pb-14 lg:pb-16 space-y-10 sm:space-y-14">
        
        {/* ------------------------------------------------------------- */}
        {/* HERO SECTION */}
        {/* Phone: Single column with centered illustration below text */}
        {/* Laptop: 2-column side-by-side with illustration on right */}
        {/* ------------------------------------------------------------- */}
        <section className="lg:grid lg:grid-cols-12 lg:gap-10 lg:items-center space-y-6 lg:space-y-0">
          
          {/* Left Column (Desktop) / Top Section (Mobile) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-left">
            
            {/* Main Headline */}
            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-[54px] font-black text-slate-900 tracking-tight leading-[1.15]">
              Never lose track of <br />
              <span className="bg-gradient-to-r from-[#2563EB] via-[#9333EA] to-[#EC4899] bg-clip-text text-transparent">
                who owes whom money
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
              Split expenses, settle debts and stay connected with your friends and roommates.
            </p>

            {/* Phone-Only Hero Illustration: Centered and compact so entire hero fits on phone screens */}
            <div className="lg:hidden my-2 xs:my-3 sm:my-4">
              <div className="relative max-w-[260px] xs:max-w-[280px] sm:max-w-[340px] mx-auto flex items-center justify-center">
                <picture>
                  <source srcSet="/hero-friends-transparent.png" type="image/png" />
                  <img 
                    src="/hero-friends.png" 
                    alt="MoneyTracker Friends and Mobile App"
                    className="w-full h-auto object-contain drop-shadow-[0_15px_25px_rgba(99,102,241,0.2)] select-none pointer-events-none"
                    loading="eager"
                  />
                </picture>
              </div>
            </div>

            {/* 3 Circular Feature Badges in ONE Row (strictly non-wrapping across all mobile widths) */}
            <div className="grid grid-cols-3 gap-1 xs:gap-2 sm:gap-6 pt-1 pb-1">
              
              {/* Feature 1: Track Expenses */}
              <div className="flex items-center gap-1.5 xs:gap-2">
                <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 rounded-full bg-[#EDE9FE] border border-purple-200/90 text-[#7C3AED] flex items-center justify-center shadow-xs flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-[10px] xs:text-[11px] sm:text-xs font-black text-slate-900 leading-tight whitespace-nowrap">
                  Track<br />Expenses
                </div>
              </div>

              {/* Feature 2: Settle Debts */}
              <div className="flex items-center gap-1.5 xs:gap-2">
                <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 rounded-full bg-[#DBEAFE] border border-blue-200/90 text-[#2563EB] flex items-center justify-center shadow-xs flex-shrink-0">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                </div>
                <div className="text-[10px] xs:text-[11px] sm:text-xs font-black text-slate-900 leading-tight whitespace-nowrap">
                  Settle<br />Debts
                </div>
              </div>

              {/* Feature 3: WhatsApp Reminders */}
              <div className="flex items-center gap-1.5 xs:gap-2">
                <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 rounded-full bg-[#DCFCE7] border border-emerald-200/90 text-[#16A34A] flex items-center justify-center shadow-xs flex-shrink-0">
                  <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-[10px] xs:text-[11px] sm:text-xs font-black text-slate-900 leading-tight whitespace-nowrap">
                  WhatsApp<br />Reminders
                </div>
              </div>

            </div>

            {/* 3 Action Buttons (Stacked full-width on mobile, inline row on laptop/desktop) */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
              
              {/* 1. Create Free Account */}
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#EC4899] hover:from-[#4338CA] hover:to-[#DB2777] text-white font-black text-xs xs:text-sm px-6 py-3 sm:py-3.5 rounded-2xl border-2 border-white/30 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all text-center"
              >
                <User className="w-4 h-4 fill-white/20" />
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* 2. Live Demo View */}
              <button
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border-2 border-blue-200/90 hover:border-blue-400 text-blue-600 font-black text-xs xs:text-sm px-6 py-3 sm:py-3.5 rounded-2xl shadow-xs hover:shadow-sm hover:border-blue-400 hover:-translate-y-0.5 active:translate-y-0 transition-all text-center"
              >
                <Monitor className="w-4 h-4 text-blue-600" />
                <span>{demoLoading ? 'Starting Tour...' : 'Live Demo View'}</span>
              </button>

              {/* 3. Sign In with PIN */}
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] border-2 border-slate-700/80 hover:border-slate-600 text-white font-black text-xs xs:text-sm px-6 py-3 sm:py-3.5 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all text-center"
              >
                <Search className="w-4 h-4 text-slate-300" />
                <span>Sign In with PIN</span>
              </Link>

            </div>

          </div>

          {/* Right Column (Laptop/Desktop Hero Illustration): visible on desktop, hidden on phone */}
          <div className="hidden lg:flex lg:col-span-5 items-center justify-center lg:justify-end relative">
            <div className="relative w-full max-w-[540px]">
              <picture>
                <source srcSet="/hero-friends-transparent.png" type="image/png" />
                <img 
                  src="/hero-friends.png" 
                  alt="MoneyTracker friends using smartphone expense tracker"
                  className="w-full h-auto object-contain drop-shadow-[0_25px_35px_rgba(99,102,241,0.22)] select-none pointer-events-none transform transition-transform hover:scale-[1.02] duration-300"
                  loading="eager"
                />
              </picture>
            </div>
          </div>

        </section>

        {/* ------------------------------------------------------------- */}
        {/* STATEMENT CODE INSPECTOR CARD */}
        {/* Phone: Stacked input and button */}
        {/* Laptop: Sleek horizontal row layout */}
        {/* ------------------------------------------------------------- */}
        <section className="w-full">
          <div className="bg-gradient-to-r from-white via-[#EEF2FE]/80 to-white/95 backdrop-blur-xl border-2 border-indigo-100 hover:border-indigo-200 rounded-3xl p-5 sm:p-7 transition-all shadow-xl shadow-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/15">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
              
              {/* Left Header / Icon Info */}
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-indigo-50 border-2 border-indigo-200/90 text-[#4F46E5] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <StatementTileIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    Inspect Friend Statement via Code
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Enter 6-digit code to view a friend's statement.
                  </p>
                </div>
              </div>

              {/* Right Input Form */}
              <form onSubmit={handleCodeSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-md">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code (e.g. 432492)"
                    maxLength={8}
                    className="w-full bg-white border-2 border-slate-200/90 hover:border-purple-300 focus:border-purple-500 rounded-full pl-11 pr-4 py-3.5 text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-purple-500/20 shadow-xs transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#EC4899] hover:from-[#4338CA] hover:to-[#DB2777] text-white font-black px-7 py-3.5 rounded-full text-xs sm:text-sm border border-white/30 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
                >
                  <span>Open Statement</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </form>

            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 3 INTERACTIVE FEATURE CARDS */}
        {/* ------------------------------------------------------------- */}
        <section className="space-y-6 pt-4">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-purple-600 bg-purple-50 border border-purple-200/60 px-3 py-1 rounded-full">
              Smart Financial Management
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Engineered for Peer Simplicity
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Everything you need to track shared expenses, settle balances, and maintain zero awkwardness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white/95 rounded-3xl p-6 sm:p-7 border-2 border-slate-100 hover:border-purple-200 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg border-2 border-emerald-200/80 shadow-xs">
                ₹
              </div>
              <h3 className="font-black text-lg text-slate-900">Live Running Balance</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Every expense computes a real-time running ledger showing who owes whom, with clear color-coded statuses.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/95 rounded-3xl p-6 sm:p-7 border-2 border-slate-100 hover:border-emerald-200 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#16A34A] flex items-center justify-center font-black text-lg border-2 border-emerald-200/80 shadow-xs">
                <WhatsAppIcon className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-slate-900">Direct WhatsApp Alerts</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Send polite, pre-composed reminder templates with one tap directly through WhatsApp without any awkwardness.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white/95 rounded-3xl p-6 sm:p-7 border-2 border-slate-100 hover:border-purple-200 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-lg border-2 border-purple-200/80 shadow-xs">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="font-black text-lg text-slate-900">Expiring Statement Codes</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Generate 6-digit access codes valid for 15m, 1h, or 24h to share verified statements with friends without passwords.
              </p>
            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 6 VALUE PROPOSITIONS BENTO GRID */}
        {/* ------------------------------------------------------------- */}
        <section className="space-y-6 pt-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Why Friends Prefer MoneyTracker
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold">
              Tailored specifically for roommates, group trips, and everyday peer debts
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            <div className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 rounded-3xl p-6 border-2 border-indigo-100/90 hover:border-indigo-300 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-md shadow-indigo-500/30 border border-white/20">
                🇮🇳
              </div>
              <h4 className="text-base font-black text-slate-900">Native Indian Rupee (₹)</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Streamlined specifically for Indian currency formats, UPI payment apps, and regional group expenses.
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 rounded-3xl p-6 border-2 border-emerald-100/90 hover:border-emerald-300 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-lg shadow-md shadow-emerald-500/30 border border-white/20">
                🤝
              </div>
              <h4 className="text-base font-black text-slate-900">1-Click Full Settlement</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Clear all dues with Google Pay, PhonePe, Paytm, or Cash. Instantly zeroes out balances with receipt confirmation.
              </p>
            </div>

            <div className="bg-gradient-to-br from-rose-50/70 via-white to-pink-50/50 rounded-3xl p-6 border-2 border-rose-100/90 hover:border-rose-300 shadow-sm hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300 space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-lg shadow-md shadow-rose-500/30 border border-white/20">
                🔒
              </div>
              <h4 className="text-base font-black text-slate-900">PIN Security & Auto-Lock</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Fast 4–6 digit security PIN access with automatic account lockout after 5 failed attempts and safety unlock controls.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 rounded-3xl p-6 border-2 border-amber-100/90 hover:border-amber-300 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-md shadow-amber-500/30 border border-white/20">
                📊
              </div>
              <h4 className="text-base font-black text-slate-900">Visual Category Analytics</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Interactive Donut & Bar charts breaking down your shared spending across food, travel, rent, and outings.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50/70 via-white to-blue-50/50 rounded-3xl p-6 border-2 border-cyan-100/90 hover:border-cyan-300 shadow-sm hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-600 text-white flex items-center justify-center text-lg shadow-md shadow-cyan-500/30 border border-white/20">
                📥
              </div>
              <h4 className="text-base font-black text-slate-900">CSV Spreadsheet Export</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Download clean verified transaction records as spreadsheet files anytime for trip splits or personal accounting.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50/70 via-white to-fuchsia-50/50 rounded-3xl p-6 border-2 border-purple-100/90 hover:border-purple-300 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-lg shadow-md shadow-purple-500/30 border border-white/20">
                ⚡
              </div>
              <h4 className="text-base font-black text-slate-900">Zero Signup Demo Tour</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Try all features instantly with sample roommates, trip balances, and transaction histories with 1-click.
              </p>
            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* BOTTOM CTA BANNER */}
        {/* ------------------------------------------------------------- */}
        <section className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#EC4899] border-2 border-white/30 text-white text-center space-y-6 shadow-2xl shadow-purple-600/35">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Start Tracking Peer Debts in 10 Seconds
          </h2>
          <p className="text-xs sm:text-base text-purple-100 font-medium max-w-lg mx-auto">
            Join MoneyTracker today. Free, fast, and crafted for effortless financial harmony between friends.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="bg-white hover:bg-slate-50 text-indigo-700 font-black text-xs sm:text-sm px-8 py-4 rounded-2xl border-2 border-white shadow-xl shadow-indigo-950/25 hover:shadow-2xl hover:scale-105 active:scale-100 transition-all"
            >
              Get Started Free
            </Link>
            <button
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="bg-indigo-950/40 hover:bg-indigo-950/60 border-2 border-white/40 text-white font-bold text-xs sm:text-sm px-7 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              {demoLoading ? 'Starting Tour...' : '⚡ Instant Demo'}
            </button>
          </div>
        </section>

      </main>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-md py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-semibold">
          <AppLogo to="/" size="sm" showBadge={false} subtitleText="Smart Peer Debt Management" />

          <div className="flex items-center gap-5">
            <Link to="/login" className="hover:text-purple-600 transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-purple-600 transition-colors">Register</Link>
            <Link to="/share" className="hover:text-purple-600 transition-colors">Statement Lookup</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
