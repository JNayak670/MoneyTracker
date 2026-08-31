import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Scale, TrendingUp } from 'lucide-react';

export default function SummaryCard({ title, amount, subtext, type = 'given', currency = '₹' }) {
  const isGiven = type === 'given';
  const isReceived = type === 'received';
  const isPending = type === 'pending';
  const isNet = type === 'net';

  const config = {
    given: {
      accentBorder: 'before:bg-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      amountColor: 'text-emerald-700',
      icon: ArrowUpRight,
    },
    received: {
      accentBorder: 'before:bg-rose-500',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      amountColor: 'text-rose-700',
      icon: ArrowDownLeft,
    },
    pending: {
      accentBorder: 'before:bg-amber-500',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      amountColor: 'text-amber-700',
      icon: TrendingUp,
    },
    net: {
      accentBorder: 'before:bg-indigo-500',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      amountColor: amount >= 0 ? 'text-emerald-700' : 'text-rose-700',
      icon: Scale,
    }
  }[type] || config.given;

  const Icon = config.icon;

  return (
    <div className={`glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md before:absolute before:top-0 before:left-0 before:right-0 before:h-[4px] ${config.accentBorder}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${config.badgeBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className={`text-2xl sm:text-3xl font-black tracking-tight mb-1 ${config.amountColor}`}>
        {isNet && amount > 0 && '+'}
        {currency}{Math.abs(amount || 0).toLocaleString()}
      </div>

      {subtext && (
        <div className="text-xs text-slate-500 font-medium">
          {subtext}
        </div>
      )}
    </div>
  );
}
