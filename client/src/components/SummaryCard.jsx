import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Scale, TrendingUp } from 'lucide-react';

export default function SummaryCard({ title, amount, subtext, type = 'given', currency = '₹' }) {
  const isGiven = type === 'given';
  const isReceived = type === 'received';
  const isPending = type === 'pending';
  const isNet = type === 'net';

  const config = {
    given: {
      cardBg: 'bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white',
      borderColor: 'border-emerald-200/90',
      accentBar: 'bg-emerald-500',
      badgeBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20',
      amountColor: 'text-emerald-700',
      titleColor: 'text-emerald-800',
      icon: ArrowUpRight,
      label: '↗️ YOU WILL GET',
    },
    received: {
      cardBg: 'bg-gradient-to-br from-rose-50/90 via-rose-50/40 to-white',
      borderColor: 'border-rose-200/90',
      accentBar: 'bg-rose-500',
      badgeBg: 'bg-rose-600 text-white shadow-md shadow-rose-500/20',
      amountColor: 'text-rose-700',
      titleColor: 'text-rose-800',
      icon: ArrowDownLeft,
      label: '↙️ YOU NEED TO PAY',
    },
    pending: {
      cardBg: 'bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white',
      borderColor: 'border-amber-200/90',
      accentBar: 'bg-amber-500',
      badgeBg: 'bg-amber-500 text-white shadow-md shadow-amber-500/20',
      amountColor: 'text-amber-800',
      titleColor: 'text-amber-800',
      icon: TrendingUp,
      label: '⏳ ACTIVE DUES',
    },
    net: {
      cardBg: amount >= 0 
        ? 'bg-gradient-to-br from-teal-50/90 via-emerald-50/30 to-white'
        : 'bg-gradient-to-br from-orange-50/90 via-rose-50/30 to-white',
      borderColor: amount >= 0 ? 'border-teal-200/90' : 'border-rose-200/90',
      accentBar: amount >= 0 ? 'bg-teal-500' : 'bg-rose-500',
      badgeBg: amount >= 0 ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20' : 'bg-rose-600 text-white shadow-md shadow-rose-500/20',
      amountColor: amount >= 0 ? 'text-teal-700' : 'text-rose-700',
      titleColor: amount >= 0 ? 'text-teal-900' : 'text-rose-900',
      icon: Scale,
      label: amount >= 0 ? '⚖️ IN PROFIT (+)' : '⚖️ IN DEBT (-)',
    }
  }[type] || config.given;

  const Icon = config.icon;

  return (
    <div className={`rounded-3xl p-5 border relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${config.cardBg} ${config.borderColor}`}>
      {/* Top colorful accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${config.accentBar}`} />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-black uppercase tracking-wider ${config.titleColor}`}>
            {config.label || title}
          </span>
        </div>
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${config.badgeBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className={`text-2xl sm:text-3xl font-black tracking-tight mb-1.5 ${config.amountColor}`}>
        {isNet && amount > 0 && '+'}
        {currency}{Math.abs(amount || 0).toLocaleString()}
      </div>

      {subtext && (
        <div className="text-xs text-slate-600 font-semibold flex items-center gap-1">
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
}
