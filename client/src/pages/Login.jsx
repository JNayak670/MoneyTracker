import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLogo from '../components/AppLogo';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Share2, 
  Zap, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Coins, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Shield
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, pin);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or PIN. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen flex flex-col justify-between bg-slate-50 font-sans relative bg-grid-pattern selection:bg-indigo-600 selection:text-white overflow-y-auto lg:overflow-hidden">

      {/* ------------------------------------------------------------- */}
      {/* VIBRANT AMBIENT AURORA MESH GLOWS */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-pink-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 -right-24 w-[380px] h-[380px] bg-gradient-to-bl from-cyan-400/15 via-emerald-400/15 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-rose-500/15 via-fuchsia-500/15 to-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* TOP NAVIGATION BAR (SAME AS LANDING) */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo Branding */}
          <AppLogo to="/" className="scale-90 sm:scale-100 origin-left" />

          {/* Nav Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <Link
              to="/share"
              className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-black text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all shadow-2xs"
            >
              <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600" />
              <span className="hidden xs:inline">Statement Code</span>
              <span className="xs:hidden">Code</span>
            </Link>

            <Link
              to="/register"
              className="flex items-center gap-1 text-[11px] sm:text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-lg transition-all flex-shrink-0"
            >
              <span>Register</span>
              <ArrowRight className="w-3 h-3 hidden sm:inline" />
            </Link>
          </div>

        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT HERO / LOGIN */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-5 relative z-10">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">

          {/* ----------------------------------------------------------- */}
          {/* LEFT COLUMN: VIBRANT PRODUCT SHOWCASE (VISIBLE ON LG+) */}
          {/* ----------------------------------------------------------- */}
          <div className="hidden lg:flex lg:col-span-6 flex-col space-y-4 pr-2">

            {/* Glowing Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-purple-200/80 shadow-xs text-[11px] font-black w-fit">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                ✨ India's Favorite Peer Expense Ledger
              </span>
            </div>

            {/* Showcase Headline */}
            <div className="space-y-1.5">
              <h1 className="font-display text-3xl lg:text-4xl xl:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                Track Friend Debts, <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                  Settle Seamlessly
                </span>
              </h1>
              <p className="text-slate-600 font-medium text-sm xl:text-base leading-relaxed max-w-md">
                No awkward reminders or lost calculations. Keep crystal-clear records of trips, flat rent, and shared dinners.
              </p>
            </div>

            {/* Interactive Live Mini-Preview Card */}
            <div className="relative p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-indigo-100 shadow-lg shadow-indigo-500/10 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-500/15 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
                    ₹
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Live Circle Settlement</h2>
                    <p className="text-[11px] text-slate-500 font-medium">Real-time peer sync</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  All Balanced
                </span>
              </div>

              {/* Settlement Rows */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                      RS
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">Rahul Sharma</p>
                      <p className="text-xs text-slate-500 font-medium leading-tight">Goa Beach Villa</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg shadow-xs border border-emerald-100 flex items-center gap-1">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                    + ₹2,400
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-rose-50/80 to-pink-50/80 border border-rose-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                      PK
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">Priya Kapoor</p>
                      <p className="text-xs text-slate-500 font-medium leading-tight">Cafe Dinner Split</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose-700 bg-white px-2.5 py-1 rounded-lg shadow-xs border border-rose-100 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    - ₹750
                  </span>
                </div>
              </div>

              {/* Mini Feature Chips */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>PIN Secured</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Auto-Netting</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Coins className="w-3.5 h-3.5 text-purple-600" />
                  <span>₹0 Fees</span>
                </div>
              </div>
            </div>

            {/* Social Proof Bar */}
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
              <div className="flex -space-x-1.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 border-2 border-white text-[10px] text-white flex items-center justify-center font-bold">A</div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 border-2 border-white text-[10px] text-white flex items-center justify-center font-bold">B</div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 border-2 border-white text-[10px] text-white flex items-center justify-center font-bold">C</div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 border-2 border-white text-[10px] text-white flex items-center justify-center font-bold">D</div>
              </div>
              <span>Trusted by 10,000+ friends & flatmates</span>
            </div>

          </div>

          {/* ----------------------------------------------------------- */}
          {/* RIGHT COLUMN: REFINED AUTH CARD */}
          {/* ----------------------------------------------------------- */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="glass-card-rainbow p-4 xs:p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl relative">

              {/* Dynamic Auth Mode Switcher Tabs */}
              <div className="flex p-1 mb-4 sm:mb-5 bg-slate-100/90 rounded-xl border border-slate-200/80">
                <div className="flex-1 py-1.5 sm:py-2 rounded-lg text-center text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xs">
                  Sign In
                </div>
                <Link
                  to="/register"
                  className="flex-1 py-1.5 sm:py-2 rounded-lg text-center text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Create Account
                </Link>
              </div>

              {/* Header Title */}
              <div className="text-center mb-4 sm:mb-5">
                <h2 className="font-display text-xl xs:text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                  Welcome Back 👋
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                  Sign in to manage your circle balances & debts
                </p>
              </div>

              {/* Error Notification Alert */}
              {error && (
                <div className="mb-3.5 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/80 text-rose-700 text-xs font-semibold flex items-start gap-2 shadow-xs animate-fadeIn">
                  <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                    !
                  </div>
                  <span>{error}</span>
                </div>
              )}

              {/* Sign In Form */}
              <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <input
                      type="email"
                      autoFocus
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="e.g. rahul@example.com"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all shadow-2xs"
                      required
                    />
                  </div>
                </div>

                {/* PIN Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Security PIN</span>
                    <span className="text-[10px] sm:text-[11px] text-indigo-600 font-semibold lowercase">4-digit PIN</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="current-password"
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Enter 4-digit PIN"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-11 sm:pl-12 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-bold tracking-widest focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 transition-all shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 rounded-lg transition-colors"
                      title={showPin ? "Hide PIN" : "Show PIN"}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* PIN Helper Indicator Dots */}
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          pin.length > idx
                            ? 'bg-gradient-to-r from-indigo-600 to-pink-500 scale-110 shadow-xs'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-[11px] sm:text-xs text-slate-400 font-medium ml-1">
                      {pin.length >= 4 ? '✓ PIN ready' : `${pin.length}/4 digits`}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    Encrypted
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 sm:py-3.5 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm md:text-base shadow-md shadow-indigo-500/25 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* 1-Click Demo Fill Option on Phone */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail('demo@moneytracker.com');
                    setPin('1234');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Fill Demo Account (1-Click)</span>
                </button>
              </form>

              {/* Bottom Switcher */}
              <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 text-center">
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    Create Free Account ➔
                  </Link>
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER (COMPACT STATUS BAR) */}
      {/* ------------------------------------------------------------- */}
      <footer className="py-2.5 text-center text-xs text-slate-500 flex-shrink-0 relative z-10 border-t border-slate-200/60 bg-white/70 backdrop-blur-xs">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>256-Bit Encrypted Peer-to-Peer Ledger</span>
          <span>•</span>
          <span>Fast, Lightweight & 100% Free</span>
        </p>
      </footer>

    </div>
  );
}
