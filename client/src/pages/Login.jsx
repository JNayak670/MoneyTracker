import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  Sparkles, 
  ArrowRight, 
  Share2, 
  Zap, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Coins, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Shield,
  HeartHandshake
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, pin);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your email and PIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@moneytracker.com');
    setPin('1234');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative overflow-hidden bg-grid-pattern selection:bg-indigo-600 selection:text-white">

      {/* ------------------------------------------------------------- */}
      {/* VIBRANT AMBIENT AURORA MESH GLOWS */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500/25 via-purple-500/20 to-pink-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 -right-24 w-[450px] h-[450px] bg-gradient-to-bl from-cyan-400/20 via-emerald-400/20 to-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-[550px] h-[550px] bg-gradient-to-tr from-rose-500/20 via-fuchsia-500/20 to-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 right-1/3 w-[350px] h-[350px] bg-gradient-to-r from-amber-400/15 to-orange-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* TOP BRAND HEADER */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              💸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 bg-clip-text text-transparent">
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

            <button
              onClick={handleDemoLogin}
              disabled={demoLoading || loading}
              className="hidden sm:flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 px-3.5 py-2.5 rounded-xl transition-all shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
              <span>{demoLoading ? 'Launching...' : '1-Click Demo'}</span>
            </button>

            <Link
              to="/register"
              className="flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-lg hover:-translate-y-0.5 transition-all flex-shrink-0"
            >
              <span>Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT HERO / LOGIN SPLIT */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* ----------------------------------------------------------- */}
          {/* LEFT COLUMN: VIBRANT PRODUCT SHOWCASE (VISIBLE ON LG+) */}
          {/* ----------------------------------------------------------- */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-6 pr-4">

            {/* Glowing Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-purple-200/80 shadow-md shadow-purple-500/10 text-xs font-black w-fit">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                ✨ India's Favorite Friend Expense Ledger
              </span>
            </div>

            {/* Showcase Headline */}
            <div className="space-y-3">
              <h1 className="font-display text-4xl xl:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                Track Friend Debts, <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                  Settle Seamlessly
                </span>
              </h1>
              <p className="text-slate-600 font-medium text-base xl:text-lg leading-relaxed max-w-lg">
                No awkward reminders or lost calculations. Keep crystal-clear records of who paid what for dinners, trips, and shared rent.
              </p>
            </div>

            {/* Interactive Live Mini-Preview Card */}
            <div className="relative p-5 rounded-3xl bg-white/90 backdrop-blur-md border border-indigo-100 shadow-xl shadow-indigo-500/10 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/15 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
                    ₹
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900">Live Circle Settlement</h2>
                    <p className="text-[10px] text-slate-500 font-semibold">Updated 2m ago</p>
                  </div>
                </div>
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  All Balanced
                </span>
              </div>

              {/* Settlement Rows */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                      RS
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Rahul Sharma</p>
                      <p className="text-[10px] text-slate-500 font-medium">Goa Beach Resort Villa</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-white px-2.5 py-1 rounded-xl shadow-xs border border-emerald-100 flex items-center gap-1">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                    + ₹2,400
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-rose-50/80 to-pink-50/80 border border-rose-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                      PK
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Priya Kapoor</p>
                      <p className="text-[10px] text-slate-500 font-medium">Cafe Dinner Split</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-rose-700 bg-white px-2.5 py-1 rounded-xl shadow-xs border border-rose-100 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    - ₹750
                  </span>
                </div>
              </div>

              {/* Mini Feature Chips */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>PIN Secured</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Instant Split</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <Coins className="w-3.5 h-3.5 text-purple-600" />
                  <span>₹0 Fees Forever</span>
                </div>
              </div>
            </div>

            {/* Social Proof Bar */}
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 border-2 border-white text-[10px] text-white flex items-center justify-center">A</div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 border-2 border-white text-[10px] text-white flex items-center justify-center">B</div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 border-2 border-white text-[10px] text-white flex items-center justify-center">C</div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 border-2 border-white text-[10px] text-white flex items-center justify-center">D</div>
              </div>
              <span>Trusted by 10,000+ friends & flatmates</span>
            </div>

          </div>

          {/* ----------------------------------------------------------- */}
          {/* RIGHT COLUMN: VIBRANT AUTH CARD */}
          {/* ----------------------------------------------------------- */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="glass-card-rainbow p-6 sm:p-8 shadow-2xl relative">

              {/* Dynamic Auth Mode Switcher Tabs */}
              <div className="flex p-1 mb-6 bg-slate-100/90 rounded-2xl border border-slate-200/80">
                <div className="flex-1 py-2 rounded-xl text-center text-xs font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md shadow-indigo-500/20">
                  Sign In
                </div>
                <Link
                  to="/register"
                  className="flex-1 py-2 rounded-xl text-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Create Account
                </Link>
              </div>

              {/* Header Title */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white text-2xl shadow-lg shadow-purple-500/30 mb-3 animate-bounce">
                  ✨
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Welcome Back
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                  Enter your credentials to access your circle ledger
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

              {/* 1-Click Instant Demo Button */}
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={demoLoading || loading}
                className="w-full mb-5 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
                <span>{demoLoading ? 'Signing in demo account...' : '⚡ 1-Click Instant Demo (PIN: 1234)'}</span>
              </button>

              {/* Quick Fill Pill */}
              <div className="flex justify-center mb-5">
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-3 py-1 rounded-full transition-all flex items-center gap-1 shadow-2xs"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>Auto-fill Demo credentials</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-wider">
                  <span className="bg-white px-3 text-slate-400">Or with email & PIN</span>
                </div>
              </div>

              {/* Sign In Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Email Address</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl pl-13 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all shadow-inner"
                      required
                    />
                  </div>
                </div>

                {/* PIN Field */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Security PIN</span>
                    <span className="text-[10px] text-indigo-600 font-bold lowercase">4-digit code</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter 4-digit PIN"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl pl-13 pr-12 py-3 text-sm text-slate-900 placeholder-slate-400 font-bold tracking-widest focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 transition-all shadow-inner"
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
                            ? 'bg-gradient-to-r from-indigo-600 to-pink-500 scale-110 shadow-xs'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-slate-400 font-bold ml-1">
                      {pin.length}/4 digits
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    Protected
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || demoLoading}
                  className="w-full mt-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-sm shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switcher */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-black text-transparent bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text hover:underline"
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
