import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLogo from '../components/AppLogo';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Share2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  Receipt, 
  Shield
} from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (pin.length < 4) {
      setError('Please choose a PIN with at least 4 numeric digits.');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, pin, '₹');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen flex flex-col justify-between bg-slate-50 font-sans relative bg-grid-pattern selection:bg-emerald-600 selection:text-white overflow-y-auto lg:overflow-hidden">

      {/* ------------------------------------------------------------- */}
      {/* VIBRANT AMBIENT AURORA MESH GLOWS */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute -top-24 -right-24 w-[420px] h-[420px] bg-gradient-to-bl from-emerald-400/20 via-teal-400/15 to-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 -left-24 w-[380px] h-[380px] bg-gradient-to-tr from-purple-500/15 via-indigo-500/15 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-[450px] h-[450px] bg-gradient-to-tl from-cyan-500/15 via-emerald-500/15 to-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* TOP NAVIGATION BAR (SAME AS LANDING) */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Logo Branding */}
          <AppLogo to="/" />

          {/* Nav Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Link
              to="/share"
              className="flex items-center gap-1.5 text-xs font-black text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 sm:px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Statement Code</span>
              <span className="sm:hidden">Statement</span>
            </Link>

            <Link
              to="/login"
              className="flex items-center gap-1.5 text-xs font-black text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 sm:px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </Link>

           
          </div>

        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT HERO / REGISTER */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-5 relative z-10">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">

          {/* ----------------------------------------------------------- */}
          {/* LEFT COLUMN: VIBRANT SHOWCASE (VISIBLE ON LG+) */}
          {/* ----------------------------------------------------------- */}
          <div className="hidden lg:flex lg:col-span-6 flex-col space-y-3.5 pr-2">

            {/* Glowing Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-emerald-200/80 shadow-xs text-[11px] font-black w-fit">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                🚀 100% Free · Join Over 50,000 Friends
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-1.5">
              <h1 className="font-display text-3xl lg:text-4xl xl:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                Never Ask <br />
                <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
                  "Who Owes What?"
                </span> Again.
              </h1>
              <p className="text-slate-600 font-medium text-sm xl:text-base leading-relaxed max-w-md">
                Create your peer ledger in seconds. Track trips, roommate splits, loan settlements, and share instant statements.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-emerald-100/80 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-2 shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Circle Ledgers</h2>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-snug">
                  Track 1-on-1 balances and group bills in one tap.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-teal-100/80 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-600 text-white flex items-center justify-center mb-2 shadow-xs">
                  <Share2 className="w-4 h-4" />
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Shareable Codes</h2>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-snug">
                  Friends view live balances without signing up.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-cyan-100/80 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center mb-2 shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Quick PIN Access</h2>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-snug">
                  Fast 4-digit PIN for instant entry.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-purple-100/80 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-600 text-white flex items-center justify-center mb-2 shadow-xs">
                  <Receipt className="w-4 h-4" />
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">PDF & WhatsApp</h2>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-snug">
                  Export clean summaries in one click.
                </p>
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center text-sm font-black shadow-xs flex-shrink-0">
                ⭐
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-800 italic leading-snug">
                  "Saved our flat from so many roommate arguments. Simple, clean, and fast."
                </p>
                <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                  Aryan V. · Flatmates Group
                </p>
              </div>
            </div>

          </div>

          {/* ----------------------------------------------------------- */}
          {/* RIGHT COLUMN: REFINED REGISTER CARD */}
          {/* ----------------------------------------------------------- */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="glass-card-rainbow p-5 sm:p-7 shadow-xl relative">

              {/* Dynamic Auth Mode Switcher Tabs */}
              <div className="flex p-1 mb-3.5 bg-slate-100/90 rounded-xl border border-slate-200/80">
                <Link
                  to="/login"
                  className="flex-1 py-2 rounded-lg text-center text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <div className="flex-1 py-2 rounded-lg text-center text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-xs">
                  Create Account
                </div>
              </div>

              {/* Header Title */}
              <div className="text-center mb-3">
                <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                  Create Free Account 🎉
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Start tracking peer debts in under 10 seconds
                </p>
              </div>

              {/* Error Notification Alert */}
              {error && (
                <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/80 text-rose-700 text-xs sm:text-sm font-semibold flex items-start gap-2.5 shadow-xs animate-fadeIn">
                  <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                    !
                  </div>
                  <span>{error}</span>
                </div>
              )}

              {/* Register Form */}
              <form className="space-y-2.5 sm:space-y-3" onSubmit={handleSubmit}>

                {/* Full Name Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      autoFocus
                      autoComplete="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 sm:py-3 text-sm text-slate-900 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-2xs"
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="e.g. rahul@example.com"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 sm:py-3 text-sm text-slate-900 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 transition-all shadow-2xs"
                      required
                    />
                  </div>
                </div>

                {/* PIN Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Create 4-Digit PIN</span>
                    <span className="text-[11px] text-teal-600 font-semibold lowercase">Quick passkey</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="new-password"
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Choose 4-digit PIN (e.g. 1234)"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-12 pr-11 py-2.5 sm:py-3 text-sm text-slate-900 placeholder-slate-400 font-bold tracking-widest focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 transition-all shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 rounded-md transition-colors"
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
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 scale-110 shadow-xs'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-slate-400 font-medium ml-1">
                      {pin.length >= 4 ? '✓ PIN ready' : `${pin.length}/4 digits`}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    Encrypted
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 sm:py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
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
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-center text-xs font-semibold text-slate-500">
                <span className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Free Forever
                </span>
                <span className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  No Cards
                </span>
                <span className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Instant Share
                </span>
              </div>

              {/* Bottom Switcher */}
              <div className="mt-3 pt-3 border-t border-slate-100 text-center">
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
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
