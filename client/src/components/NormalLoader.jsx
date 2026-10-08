import React from 'react';
import { Database, CloudLightning, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function NormalLoader({
  message = 'Updating Database Records...',
  submessage = 'Writing changes to database and recalculating balances...',
  tag = 'DATABASE SYNC',
  statusText = 'Updating Records'
}) {
  const isWakeUp = (tag && tag.includes('WAKE UP')) || (message && message.toLowerCase().includes('waking up'));

  return (
    <div 
      id="normal-operation-loader"
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fadeIn select-none"
    >
      {/* Floating Modern Modal Card */}
      <div className="relative bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.22),0_8px_20px_-8px_rgba(0,0,0,0.08)] max-w-[340px] w-full mx-auto p-6 sm:p-7 flex flex-col items-center text-center overflow-hidden transform scale-100 transition-all">
        
        {/* Top Radiant Accent Ribbon */}
        <div 
          className={`absolute top-0 inset-x-0 h-1 ${
            isWakeUp
              ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
          }`} 
        />

        {/* Ambient Corner Aura */}
        <div 
          className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none ${
            isWakeUp ? 'bg-amber-500/10' : 'bg-indigo-500/10'
          }`} 
        />

        {/* Modern Conic Dual-Ring Spinner Unit */}
        <div className="relative w-14 h-14 mb-3.5 flex items-center justify-center">
          {/* Subtle Outer Track */}
          <div className="w-14 h-14 rounded-full border-[3px] border-slate-100" />
          
          {/* Gradient Active Arc Spinner */}
          <div 
            className={`absolute inset-0 w-14 h-14 rounded-full border-[3px] border-transparent ${
              isWakeUp
                ? 'border-t-amber-500 border-r-orange-500'
                : 'border-t-indigo-600 border-r-purple-600'
            } animate-spin`} 
          />
          
          {/* Central Pulsing Icon Pod */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs border ${
              isWakeUp
                ? 'bg-amber-50 border-amber-200/80 text-amber-600'
                : 'bg-indigo-50 border-indigo-100 text-indigo-600'
            }`}>
              {isWakeUp ? (
                <CloudLightning className="w-4 h-4 animate-pulse" />
              ) : (
                <Database className="w-4 h-4 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Monospace Operation Tag Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/90 text-[10px] font-mono font-bold tracking-wider text-slate-700 uppercase mb-2 shadow-2xs">
          <span className={`w-1.5 h-1.5 rounded-full ${
            isWakeUp ? 'bg-amber-500' : 'bg-emerald-500'
          } animate-ping`} />
          <span>{tag || 'DATABASE SYNC'}</span>
        </div>

        {/* Main Headline */}
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
          {message}
        </h3>

        {/* Submessage Description */}
        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed max-w-[270px]">
          {submessage}
        </p>

        {/* Stripe / Linear Style Indeterminate Sliding Light-Beam */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden relative border border-slate-200/60 shadow-inner">
          <div 
            className={`h-full w-2/5 rounded-full animate-indeterminate-beam shadow-xs ${
              isWakeUp
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500'
            }`} 
          />
        </div>

        {/* Bottom Metadata Status Row */}
        <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-400 mt-2.5 px-0.5">
          <div className="flex items-center gap-1 text-emerald-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Sync</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 font-mono">
            <span className="w-1 h-1 rounded-full bg-slate-400" />
            <span>{statusText || 'Syncing'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
