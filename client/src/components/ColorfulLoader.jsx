import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, ShieldCheck, Lock, Activity, ArrowRight, Shield, CheckCircle2 } from 'lucide-react';

const SMART_INSIGHTS = [
  {
    tag: 'SPLIT ENGINE',
    icon: '🍕',
    title: 'Balancing Group Dues',
    desc: 'Calculating fair shares, restaurant tabs & shared trip expenses...',
    badgeColor: 'bg-amber-500/15 text-amber-700 border-amber-300',
    dotColor: 'bg-amber-500',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    statusText: 'Reconciling Tab Shares'
  },
  {
    tag: 'PEER MATRIX',
    icon: '💸',
    title: 'Syncing Running Ledgers',
    desc: 'Aligning debts, repayments & dual-party balances in real-time...',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 border-emerald-300',
    dotColor: 'bg-emerald-500',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    statusText: 'Connecting Peer Nodes'
  },
  {
    tag: 'QUANTUM SETTLE',
    icon: '⚡',
    title: 'Optimizing Cash Flows',
    desc: 'Minimizing cross-payments for instant 1-click settlements...',
    badgeColor: 'bg-indigo-500/15 text-indigo-700 border-indigo-300',
    dotColor: 'bg-indigo-500',
    glowColor: 'rgba(99, 102, 241, 0.25)',
    statusText: 'Optimizing Settle Graph'
  },
  {
    tag: 'SECURE VAULT',
    icon: '🔐',
    title: 'Verifying Ledger Security',
    desc: 'Securing private statements with encrypted 6-digit access codes...',
    badgeColor: 'bg-purple-500/15 text-purple-700 border-purple-300',
    dotColor: 'bg-purple-500',
    glowColor: 'rgba(168, 85, 247, 0.25)',
    statusText: 'Validating Passkey Hashes'
  },
  {
    tag: 'ANALYTICS PULSE',
    icon: '📈',
    title: 'Compiling Wealth Insights',
    desc: 'Synthesizing category splits, monthly velocity & circle habits...',
    badgeColor: 'bg-cyan-500/15 text-cyan-700 border-cyan-300',
    dotColor: 'bg-cyan-500',
    glowColor: 'rgba(6, 182, 212, 0.25)',
    statusText: 'Aggregating Group Velocity'
  }
];

export default function ColorfulLoader({
  message,
  submessage,
  tag,
  statusText,
  fullScreen = true,
  minHeight = 'min-h-[220px]'
}) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [progress, setProgress] = useState(42);

  // Cycling smart insights
  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % SMART_INSIGHTS.length);
        setFade(true);
      }, 150);
    }, 1800);

    return () => clearInterval(timer);
  }, []);

  // Smooth live progress percentage climb
  useEffect(() => {
    const pTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return prev;
        const jump = Math.floor(Math.random() * 14) + 8;
        return Math.min(prev + jump, 98);
      });
    }, 70);

    return () => clearInterval(pTimer);
  }, []);

  const current = SMART_INSIGHTS[index];

  const cardContent = (
    <div className="relative flex flex-col items-center justify-center p-2 max-w-[340px] xs:max-w-[400px] sm:max-w-[440px] w-full text-center select-none animate-fadeIn mx-auto">
      
      {/* Dynamic Ambient Background Glow (Tracks active insight color) */}
      <div 
        className="absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 animate-pulseGlow"
        style={{ backgroundColor: current.glowColor }}
      />
      <div 
        className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 animate-pulseGlow"
        style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', animationDelay: '1.5s' }}
      />

      {/* Main Luxury Glassmorphic Chassis */}
      <div className="relative z-10 w-full p-[1.5px] rounded-3xl bg-gradient-to-tr from-indigo-500/50 via-purple-500/40 via-pink-500/45 to-emerald-400/40 shadow-[0_25px_60px_-15px_rgba(99,102,241,0.28),0_12px_30px_-10px_rgba(236,72,153,0.2)]">
        
        <div className="relative w-full bg-white/95 backdrop-blur-2xl rounded-[22px] p-6 sm:p-8 flex flex-col items-center overflow-hidden border border-white/90">
          
          {/* Top highlight shine line */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />
          
          {/* Internal corner glows */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

          {/* Central Gyroscopic Medallion Unit */}
          <div className="relative my-4 flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
            
            {/* Pulsing Central Energy Orb */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/30 via-purple-500/30 to-pink-500/30 blur-xl animate-pulseGlow" />

            {/* Outer Slow Gyro Ring with orbiting satellite particle */}
            <div className="absolute -inset-3 rounded-full p-[2.5px] bg-gradient-to-tr from-indigo-500 via-purple-500 via-pink-500 via-amber-400 to-emerald-400 animate-spin-slow opacity-90 shadow-md shadow-indigo-500/20">
              <div className="w-full h-full rounded-full bg-white/30 backdrop-blur-xs" />
              {/* Satellite planet dot on outer ring */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-indigo-600 shadow-[0_0_10px_#6366f1] ring-2 ring-white" />
            </div>

            {/* Inner Counter-Spinning Dashed Compass Orbit */}
            <div className="absolute -inset-0.5 rounded-full border-2 border-dashed border-purple-400/60 animate-spin-reverse-slow">
              {/* Satellite star dot on inner ring */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899] ring-2 ring-white" />
            </div>

            {/* Central 3D Glass Currency Medallion */}
            <div className="relative z-10 w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/95 border-2 border-white shadow-[0_12px_28px_rgba(99,102,241,0.3)] flex items-center justify-center backdrop-blur-md overflow-hidden group">
              {/* Liquid radial shimmer background */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-pink-50/80" />
              
              {/* Animated Light Sweep Shimmer */}
              <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/80 to-transparent rotate-45 animate-shimmer-sweep pointer-events-none" />

              {/* Currency Symbol ₹ with bold 3D gradient */}
              <span className="relative z-10 text-3xl sm:text-4xl font-black font-sans bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm select-none leading-none">
                ₹
              </span>
            </div>

            {/* Floating Top-Right Insight Emoji Capsule */}
            <div className="absolute -top-2.5 -right-2.5 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-purple-100 shadow-lg shadow-purple-500/25 text-base animate-bounce">
              <span>{current.icon}</span>
            </div>

            {/* Floating Bottom-Left Sparkle Badge */}
            <div className="absolute -bottom-1 -left-1 z-20 flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md border-2 border-white">
              <Sparkles className="w-3 h-3 animate-pulse" />
            </div>
          </div>

          {/* Dynamic Category Pill with Beacon & Equalizer */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider mb-2.5 transition-all duration-300 shadow-xs ${current.badgeColor}`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-beaconRing absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dotColor}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dotColor}`} />
            </span>
            <span>{tag || current.tag}</span>
            {/* 4-bar mini data equalizer */}
            <div className="flex items-center gap-0.5 ml-1 opacity-85">
              <span className="w-0.5 h-2 rounded-full bg-current animate-pulseBar" style={{ animationDelay: '0ms' }} />
              <span className="w-0.5 h-3.5 rounded-full bg-current animate-pulseBar" style={{ animationDelay: '150ms' }} />
              <span className="w-0.5 h-2.5 rounded-full bg-current animate-pulseBar" style={{ animationDelay: '300ms' }} />
              <span className="w-0.5 h-4 rounded-full bg-current animate-pulseBar" style={{ animationDelay: '450ms' }} />
            </div>
          </div>

          {/* Dynamic Headline & Subtext */}
          <div className={`transition-all duration-300 min-h-[52px] flex flex-col justify-center px-2 ${fade || message ? 'opacity-100 transform translate-y-0 scale-100' : 'opacity-0 transform translate-y-1 scale-95'}`}>
            <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-snug">
              {message || current.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 line-clamp-2 max-w-[320px] mx-auto leading-relaxed">
              {submessage || current.desc}
            </p>
          </div>

          {/* High-Precision Shimmering Liquid Progress Bar */}
          <div className="w-full mt-4 space-y-2.5">
            
            <div className="w-full h-3 rounded-full bg-slate-100 p-[2px] overflow-hidden relative border border-slate-200/90 shadow-inner">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 via-pink-500 to-emerald-400 relative transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                {/* Continuous Shimmer Light Beam */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/85 to-transparent animate-shimmer-sweep w-full" />
                {/* Hot Leading Sparkle Tip with Glow */}
                <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white shadow-[0_0_10px_#ffffff,0_0_15px_#818cf8] rounded-full" />
              </div>
            </div>

            {/* Micro Status Sub-Row */}
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-0.5">
              
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-bold text-slate-700 tracking-tight text-[11px]">
                  {statusText || current.statusText}
                </span>
              </div>

              {/* Step indicator pills */}
              <div className="flex items-center gap-1.5">
                {SMART_INSIGHTS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === index 
                        ? 'w-4.5 bg-gradient-to-r from-indigo-500 to-purple-500 shadow-xs' 
                        : 'w-1.5 bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* High-Tech Monospace Percentage Chip */}
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-purple-200/80 text-purple-700 font-mono font-black text-xs shadow-xs">
                <span>{progress}%</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-between p-4 sm:p-6 bg-grid-pattern relative overflow-hidden">
        
        {/* Soft floating ambient radial aura blobs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/12 via-purple-500/10 to-pink-500/12 rounded-full blur-3xl pointer-events-none animate-pulseGlow" />
        
        {/* Ambient Decorative Floating Floating Badges (Subtle fintech vibes) */}
        <div className="absolute top-24 left-8 sm:left-24 hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/70 border border-indigo-100/80 shadow-sm backdrop-blur-md text-xs font-bold text-indigo-700 opacity-40 pointer-events-none animate-float-drift-1">
          <span>🍕</span>
          <span>Dinner Split • ₹850</span>
        </div>

        <div className="absolute bottom-28 left-12 sm:left-28 hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/70 border border-emerald-100/80 shadow-sm backdrop-blur-md text-xs font-bold text-emerald-700 opacity-40 pointer-events-none animate-float-drift-2">
          <span>💸</span>
          <span>Settled in 1-Click</span>
        </div>

        <div className="absolute top-28 right-8 sm:right-24 hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/70 border border-purple-100/80 shadow-sm backdrop-blur-md text-xs font-bold text-purple-700 opacity-40 pointer-events-none animate-float-drift-2">
          <span>🔐</span>
          <span>Verified Access Code</span>
        </div>

        <div className="absolute bottom-32 right-12 sm:right-28 hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/70 border border-amber-100/80 shadow-sm backdrop-blur-md text-xs font-bold text-amber-700 opacity-40 pointer-events-none animate-float-drift-1">
          <span>⚡</span>
          <span>Real-time Sync Active</span>
        </div>

        {/* Top Header Branding Banner */}
        <div className="relative z-10 flex items-center gap-3 py-3 select-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Zap className="w-4.5 h-4.5 fill-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-800 tracking-tight text-base sm:text-lg">MoneyTracker</span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200/60 font-mono shadow-xs">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Smart Peer Debt & Expense Circle</p>
          </div>
        </div>

        {/* Center Card */}
        <div className="my-auto w-full flex items-center justify-center py-4">
          {cardContent}
        </div>

        {/* Footer Security Badge */}
        <div className="relative z-10 flex items-center gap-2.5 py-2.5 px-5 rounded-full bg-white/80 border border-slate-200/80 backdrop-blur-md shadow-xs text-xs font-semibold text-slate-500 select-none">
          <Shield className="w-3.5 h-3.5 text-indigo-500" />
          <span>Protected with 256-bit encrypted ledger verification • Zero-Knowledge</span>
        </div>

      </div>
    );
  }

  return (
    <div className={`w-full ${minHeight} flex items-center justify-center p-3 relative`}>
      {cardContent}
    </div>
  );
}
