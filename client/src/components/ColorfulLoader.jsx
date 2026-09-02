import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, ShieldCheck, CreditCard, Lock, ArrowUpRight, TrendingUp } from 'lucide-react';

const SMART_INSIGHTS = [
  {
    tag: 'SPLIT ENGINE',
    icon: '🍕',
    title: 'Balancing Group Dues',
    desc: 'Calculating splits, restaurant tabs & shared trip expenses...',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-200/80',
    dotColor: 'bg-amber-500'
  },
  {
    tag: 'PEER MATRIX',
    icon: '💸',
    title: 'Syncing Running Ledgers',
    desc: 'Aligning debts, repayments & running balances in real-time...',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/80',
    dotColor: 'bg-emerald-500'
  },
  {
    tag: 'QUANTUM SETTLE',
    icon: '⚡',
    title: 'Optimizing Cash Flows',
    desc: 'Minimizing cross-payments for instant 1-click settlements...',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-200/80',
    dotColor: 'bg-indigo-500'
  },
  {
    tag: 'SECURE VAULT',
    icon: '🔐',
    title: 'Verifying Security & Proof',
    desc: 'Securing private statements with encrypted 6-digit access codes...',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-200/80',
    dotColor: 'bg-purple-500'
  }
];

export default function ColorfulLoader({
  message,
  submessage,
  fullScreen = true,
  minHeight = 'min-h-[360px]'
}) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [progress, setProgress] = useState(28);

  // Cycling insights
  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % SMART_INSIGHTS.length);
        setFade(true);
      }, 200);
    }, 1800);

    return () => clearInterval(timer);
  }, []);

  // Smooth live progress percentage climb
  useEffect(() => {
    const pTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return prev;
        const jump = Math.floor(Math.random() * 14) + 6;
        return Math.min(prev + jump, 96);
      });
    }, 240);

    return () => clearInterval(pTimer);
  }, []);

  const current = SMART_INSIGHTS[index];

  const content = (
    <div className="relative flex flex-col items-center justify-center p-6 sm:p-10 max-w-md w-full text-center select-none animate-fadeIn">
      
      {/* 1. Holographic Ambient Background Mesh */}
      <div className="absolute -top-16 -left-16 w-56 h-56 bg-gradient-to-tr from-cyan-500/30 via-indigo-600/35 to-purple-600/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-gradient-to-bl from-pink-500/35 via-rose-500/30 to-amber-400/25 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '0.8s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '0.4s' }} />

      {/* 2. Main Hologram Glass Card Container */}
      <div className="relative z-10 w-full glass-card-rainbow p-8 sm:p-9 rounded-3xl border border-white/90 shadow-2xl backdrop-blur-2xl flex flex-col items-center">
        
        {/* 3. Hero Visual: Holographic Vault Prism + Concentric Radar Waves */}
        <div className="relative mb-6 flex items-center justify-center w-28 h-28">
          
          {/* Expanding Radar Ripples */}
          <div className="absolute inset-0 rounded-full border-2 border-indigo-400/50 animate-radarWave" />
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/40 animate-radarWave" style={{ animationDelay: '0.8s' }} />
          <div className="absolute inset-0 rounded-full border-2 border-pink-400/35 animate-radarWave" style={{ animationDelay: '1.6s' }} />

          {/* Rotating Holographic Diamond Prism Outer Glow */}
          <div className="absolute inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 via-pink-500 via-amber-400 to-cyan-400 animate-spin shadow-xl shadow-indigo-500/30 p-[3px]">
            <div className="w-full h-full bg-white rounded-3xl p-1">
              <div className="w-full h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl flex items-center justify-center shadow-inner">
                {/* Metallic Glowing Center Token */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 transform hover:rotate-12 transition-transform duration-300">
                  <span className="text-2xl font-black font-mono filter drop-shadow">₹</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Orbiting Mini Badges */}
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/40 animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>

          <div className="absolute -bottom-2 -left-2 w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/40 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>

          {/* Upward Floating Particle Stream */}
          <span className="absolute -top-5 left-1 text-sm animate-floatParticle select-none">
            {current.icon}
          </span>
          <span className="absolute -bottom-5 right-2 text-xs animate-floatParticle select-none" style={{ animationDelay: '1s' }}>
            💎
          </span>

        </div>

        {/* 4. Live Metric Chips Bar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Peer Sync</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[10px] font-bold">
            <ShieldCheck className="w-3 h-3 text-indigo-500" />
            <span>Encrypted Vault</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200/80 text-purple-700 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-purple-500" />
            <span>Live Dues</span>
          </div>
        </div>

        {/* 5. Dynamic Category Tag Pill */}
        <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-[10px] font-black tracking-wider uppercase shadow-2xs mb-2 transition-all duration-300 ${current.badgeColor}`}>
          <span className={`w-2 h-2 rounded-full ${current.dotColor} animate-ping`} />
          <span>{current.tag}</span>
        </div>

        {/* 6. Dynamic Rotating Status Headline & Subtext */}
        <div className={`transition-all duration-300 min-h-[58px] flex flex-col justify-center ${fade ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-1'}`}>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {message || current.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xs mx-auto leading-relaxed">
            {submessage || current.desc}
          </p>
        </div>

        {/* 7. Segmented Neon Progress Track + Live Percentage */}
        <div className="w-full mt-6 space-y-2">
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden relative p-0.5 border border-slate-200/90 shadow-inner">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 via-purple-500 via-pink-500 to-amber-400 transition-all duration-300 animate-shimmer"
              style={{
                width: `${progress}%`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.8s linear infinite'
              }}
            />
          </div>
          
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
            <span className="flex items-center gap-1.5 text-indigo-600">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              <span>MoneyTracker Syncing</span>
            </span>
            <span className="text-purple-700 font-mono font-black">{progress}%</span>
          </div>
        </div>

      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 bg-grid-pattern relative overflow-hidden">
        {content}
      </div>
    );
  }

  return (
    <div className={`w-full ${minHeight} flex items-center justify-center p-4 relative`}>
      {content}
    </div>
  );
}
