import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Share2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Users, 
  Receipt, 
  Coins, 
  Globe2,
  Shield
} from 'lucide-react';

const CURRENCIES = [
  { symbol: '₹', code: 'INR', label: 'Rupee' },
  { symbol: '$', code: 'USD', label: 'Dollar' },
  { symbol: '€', code: 'EUR', label: 'Euro' },
  { symbol: '£', code: 'GBP', label: 'Pound' },
  { symbol: 'د.إ', code: 'AED', label: 'Dirham' },
];

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('₹');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (pin.length < 4) {
      setError('Please choose a PIN of at least 4 numeric digits.');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, pin, selectedCurrency);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative overflow-hidden bg-grid-pattern selection:bg-emerald-600 selection:text-white">

      {/* ------------------------------------------------------------- */}
      {/* VIBRANT AMBIENT AURORA MESH GLOWS */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-400/25 via-teal-400/20 to-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 -left-24 w-[450px] h-[450px] bg-gradient-to-tr from-purple-500/20 via-indigo-500/20 to-pink-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-[550px] h-[550px] bg-gradient-to-tl from-cyan-500/20 via-emerald-500/20 to-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 left-1/3 w-[350px] h-[350px] bg-gradient-to-r from-amber-400/15 to-orange-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* TOP BRAND HEADER */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              💸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-clip-text text-transparent">
                  MoneyTracker
                </span>
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xs">
                  ₹ INR
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold leading-none mt-0.5 hidden sm:block">
                Smart Peer Debt & Shared Expense Ledger
              </p>
            </div>
          </Link>

          {/* Nav Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/share"
              className="flex items-center gap-1.5 text-xs font-black text-purple-700 bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl transition-all shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Statement Code</span>
              <span className="sm:hidden">Statement</span>
            </Link>

            <Link
              to="/login"
              className="text-xs font-black text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-xs"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT HERO / REGISTER SPLIT */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* ----------------------------------------------------------- */}
          {/* LEFT COLUMN: VIBRANT SHOWCASE (VISIBLE ON LG+) */}
          {/* ----------------------------------------------------------- */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-6 pr-4">

            {/* Glowing Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-emerald-200/80 shadow-md shadow-emerald-500/10 text-xs font-black w-fit">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                🚀 100% Free · Join Over 50,000 Friends
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="font-display text-4xl xl:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                Never Ask <br />
                <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
                  "Who Owes What?"
                </span> Again.
              </h1>
              <p className="text-slate-600 font-medium text-base xl:text-lg leading-relaxed max-w-lg">
                Create your peer ledger in seconds. Track trips, roommate grocery splits, loan settlements, and share instant statements without passwords.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-emerald-100/80 shadow-md shadow-emerald-500/5 hover:-translate-y-0.5 transition-all">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-2.5 shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-xs font-black text-slate-900">Circle Ledgers</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-normal">
                  Track individual balances and shared friend groups in one tap.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-teal-100/80 shadow-md shadow-teal-500/5 hover:-translate-y-0.5 transition-all">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-600 text-white flex items-center justify-center mb-2.5 shadow-xs">
                  <Share2 className="w-5 h-5" />
                </div>
                <h2 className="text-xs font-black text-slate-900">Shareable Codes</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-normal">
                  Give friends a 6-letter statement code to view live balances without signing up.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-cyan-100/80 shadow-md shadow-cyan-500/5 hover:-translate-y-0.5 transition-all">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center mb-2.5 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="text-xs font-black text-slate-900">Quick PIN Access</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-normal">
                  No bulky passwords. Fast 4-digit numeric PIN for instant entry.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-purple-100/80 shadow-md shadow-purple-500/5 hover:-translate-y-0.5 transition-all">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-600 text-white flex items-center justify-center mb-2.5 shadow-xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <h2 className="text-xs font-black text-slate-900">PDF & WhatsApp</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-normal">
                  Generate professional PDF statements and WhatsApp summaries instantly.
                </p>
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center text-sm font-black shadow-xs flex-shrink-0">
                ⭐
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 italic">
                  "Saved our flat from so many roommate arguments. Simple, clean, and fast."
                </p>
                <p className="text-[10px] text-emerald-700 font-black mt-0.5">
                  Aryan V. · Bangalore Flatmates Group
                </p>
              </div>
            </div>

          </div>

          {/* ----------------------------------------------------------- */}
          {/* RIGHT COLUMN: VIBRANT REGISTER CARD */}
          {/* ----------------------------------------------------------- */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="glass-card-rainbow p-6 sm:p-8 shadow-2xl relative">

              {/* Dynamic Auth Mode Switcher Tabs */}
              <div className="flex p-1 mb-6 bg-slate-100/90 rounded-2xl border border-slate-200/80">
                <Link
                  to="/login"
                  className="flex-1 py-2 rounded-xl text-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <div className="flex-1 py-2 rounded-xl text-center text-xs font-black bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-md shadow-emerald-500/20">
                  Create Account
                </div>
              </div>

              {/* Header Title */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-600 text-white text-2xl shadow-lg shadow-emerald-500/30 mb-3 animate-bounce">
                  🎉
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Create Free Account
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                  Join in 10 seconds · Start tracking friend balances
                </p>
              </div>

              {/* Error Notification Alert */}
              {error && (
                <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/80 text-rose-700 text-xs font-bold flex items-start gap-2.5 shadow-xs animate-fadeIn">
                  <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                    !
                  </div>
                  <span>{error}</span>
                </div>
              )}

              {/* Register Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>

                {/* Full Name Field */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl pl-13 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all shadow-inner"
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl pl-13 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 transition-all shadow-inner"
                      required
                    />
                  </div>
                </div>

                {/* PIN Field */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Create 4-Digit Security PIN</span>
                    <span className="text-[10px] text-teal-600 font-bold lowercase">Quick passkey</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Choose 4-digit PIN (e.g. 1234)"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl pl-13 pr-12 py-3 text-sm text-slate-900 placeholder-slate-400 font-bold tracking-widest focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all shadow-inner"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
                      title={showPin ? "Hide PIN" : "Show PIN"}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* PIN Helper Indicator Dots */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          pin.length > idx
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 scale-110 shadow-xs'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-slate-400 font-bold ml-1">
                      {pin.length >= 4 ? '✓ PIN ready' : `${pin.length}/4 digits`}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    Protected
                  </span>
                </div>

                {/* Preferred Currency Picker */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Globe2 className="w-3.5 h-3.5 text-teal-600" />
                      Default Currency
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Change anytime</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {CURRENCIES.map((curr) => (
                      <button
                        key={curr.symbol}
                        type="button"
                        onClick={() => setSelectedCurrency(curr.symbol)}
                        className={`py-2 px-1 rounded-xl text-center transition-all ${
                          selectedCurrency === curr.symbol
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-md shadow-emerald-500/20 scale-102 border-transparent'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200/80'
                        }`}
                      >
                        <span className="text-xs block leading-tight">{curr.symbol}</span>
                        <span className="text-[9px] block opacity-80 leading-tight">{curr.code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-black text-sm shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Ledger Account...</span>
                    </div>
                  ) : (
                    <>
                      <span>Create Free Account</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Free Benefits Checklist */}
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-600">
                <span className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Free Forever
                </span>
                <span className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  No Cards Needed
                </span>
                <span className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Instant Sharing
                </span>
              </div>

              {/* Bottom Switcher */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-black text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text hover:underline"
                  >
                    Sign In ➔
                  </Link>
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER */}
      {/* ------------------------------------------------------------- */}
      <footer className="py-4 text-center text-xs text-slate-400 relative z-10">
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
