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
  minHeight = 'min-h-[220px]'
}) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [progress, setProgress] = useState(30);

  // Cycling insights
  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % SMART_INSIGHTS.length);
        setFade(true);
      }, 200);
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  // Smooth live progress percentage climb
  useEffect(() => {
    const pTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return prev;
        const jump = Math.floor(Math.random() * 12) + 5;
        return Math.min(prev + jump, 98);
      });
    }, 220);

    return () => clearInterval(pTimer);
  }, []);

  const current = SMART_INSIGHTS[index];

  const content = (
    <div className="relative flex flex-col items-center justify-center p-3 max-w-[300px] xs:max-w-[340px] sm:max-w-md w-full text-center select-none animate-fadeIn mx-auto">
      
      {/* Ambient background glows (strictly bounded) */}
      <div className="absolute -top-6 -left-6 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative z-10 w-full bg-white/95 border border-slate-200/90 shadow-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-xl flex flex-col items-center overflow-hidden">
        
        {/* Animated Central Brand Token */}
        <div className="relative mb-3 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16">
          
          {/* Rotating gradient ring */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 via-pink-500 to-emerald-500 animate-spin p-[2px] shadow-md shadow-indigo-500/20">
            <div className="w-full h-full bg-white rounded-2xl p-0.5">
              <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent font-mono">
                  ₹
                </span>
              </div>
            </div>
          </div>

          {/* Mini floating emoji icon */}
          <span className="absolute -top-1.5 -right-1.5 text-xs bg-white rounded-full shadow-xs px-1 border border-slate-100 animate-bounce">
            {current.icon}
          </span>
        </div>

        {/* Dynamic Category Pill */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider mb-2 transition-all duration-300 ${current.badgeColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor} animate-ping`} />
          <span>{current.tag}</span>
        </div>

        {/* Dynamic Headline & Subtext */}
        <div className={`transition-all duration-300 min-h-[38px] flex flex-col justify-center px-2 ${fade ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-1'}`}>
          <h3 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight leading-tight">
            {message || current.title}
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5 line-clamp-1 max-w-[260px] mx-auto">
            {submessage || current.desc}
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="w-full mt-3 space-y-1">
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200/80">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-slate-400 px-0.5">
            <span className="flex items-center gap-1 text-indigo-600">
              <span className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
              <span>Syncing Ledger</span>
            </span>
            <span className="text-purple-700 font-mono font-black">{progress}%</span>
          </div>
        </div>

      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-3 bg-grid-pattern relative overflow-hidden">
        {content}
      </div>
    );
  }

  return (
    <div className={`w-full ${minHeight} flex items-center justify-center p-2 relative`}>
      {content}
    </div>
  );
}

