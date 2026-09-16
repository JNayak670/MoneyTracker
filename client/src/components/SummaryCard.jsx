import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Scale, TrendingUp, Sparkles } from 'lucide-react';

export default function SummaryCard({ title, amount, subtext, type = 'given', currency = '₹' }) {
  const isGiven = type === 'given';
  const isReceived = type === 'received';
  const isPending = type === 'pending';
  const isNet = type === 'net';

  const config = {
    given: {
      cardBg: 'bg-[#eefbf5]',
      borderColor: 'border-[#bbf0d8]',
      badgeBg: 'bg-[#0f766e] text-white',
      amountColor: 'text-emerald-950',
      titleColor: 'text-emerald-900',
      icon: ArrowUpRight,
      label: '↗ YOU WILL GET ...',
    },
    received: {
      cardBg: 'bg-[#fff1f2]',
      borderColor: 'border-[#fecdd3]',
      badgeBg: 'bg-rose-600 text-white',
      amountColor: 'text-rose-950',
      titleColor: 'text-rose-900',
      icon: ArrowDownLeft,
      label: '↙ YOU NEED TO PAY',
    },
    pending: {
      cardBg: 'bg-[#fef7ee]',
      borderColor: 'border-[#fde4bd]',
      badgeBg: 'bg-amber-500 text-white',
      amountColor: 'text-amber-950',
      titleColor: 'text-amber-900',
      icon: TrendingUp,
      label: '⏳ ACTIVE DUES',
    },
    net: {
      cardBg: amount >= 0 ? 'bg-[#e6f9f8]' : 'bg-[#fff1f2]',
      borderColor: amount >= 0 ? 'border-[#b2ebe9]' : 'border-[#fecdd3]',
      badgeBg: amount >= 0 ? 'bg-teal-600 text-white' : 'bg-rose-600 text-white',
      amountColor: amount >= 0 ? 'text-teal-950' : 'text-rose-950',
      titleColor: amount >= 0 ? 'text-teal-900' : 'text-rose-900',
      icon: Scale,
      label: amount >= 0 ? '↓ IN PROFIT' : '↑ IN DEFICIT',
    }
  }[type] || config.given;

  const Icon = config.icon;

  return (
    <div className={`rounded-3xl p-4 sm:p-5 border min-w-[170px] sm:min-w-0 flex-1 flex flex-col justify-between transition-all duration-300 hover:shadow-md ${config.cardBg} ${config.borderColor}`}>
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider truncate ${config.titleColor}`}>
          {config.label || title}
        </span>
        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs ${config.badgeBg}`}>
          <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </div>

      <div className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight mb-1 ${config.amountColor}`}>
        {isNet && amount > 0 && '+'}
        {currency}{Math.abs(amount || 0).toLocaleString()}
      </div>

      {subtext && (
        <div className="text-[10px] sm:text-xs text-slate-600 font-semibold truncate flex items-center gap-1">
          {isNet && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>}
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
}

