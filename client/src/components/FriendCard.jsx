import React from 'react';
import { 
  PlusCircle, 
  History, 
  CheckCircle2, 
  MessageSquare, 
  Edit3, 
  Trash2,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export default function FriendCard({ 
  friend, 
  currency = '₹', 
  onAddTx, 
  onViewHistory, 
  onSettle, 
  onRemind, 
  onShareCode,
  onEdit, 
  onDelete 
}) {
  const bal = friend.currentBalance || 0;
  const isOwed = bal > 0;
  const isOwing = bal < 0;
  const isSettled = bal === 0;

  return (
    <div className={`rounded-3xl p-5 flex flex-col justify-between border transition-all duration-200 hover:shadow-xl group bg-white ${
      isOwed 
        ? 'border-emerald-200 hover:border-emerald-300' 
        : isOwing 
        ? 'border-rose-200 hover:border-rose-300' 
        : 'border-slate-200 hover:border-slate-300'
    }`}>
      
      {/* Top Details */}
      <div>
        <div className="flex items-start justify-between mb-3.5">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-black/5 flex-shrink-0"
              style={{ backgroundColor: friend.avatarColor || '#6366f1' }}
            >
              {friend.avatarEmoji || '👤'}
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 group-hover:text-brand-600 transition-colors">
                {friend.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {friend.relationshipTag || 'Friend'}
                </span>
                {friend.phone && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    {friend.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onShareCode(friend.id, friend.name)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Generate Time-Limited Share Code"
            >
              <span className="text-xs">🔗</span>
            </button>
            <button
              onClick={() => onEdit(friend)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Edit Friend"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(friend.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Friend"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Balance Status Box (Vibrant, Crystal Clear, Easy to Understand) */}
        <div className={`rounded-2xl p-4 mb-3.5 border transition-all ${
          isOwed
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50/80 border-emerald-300 text-emerald-900 shadow-xs'
            : isOwing
            ? 'bg-gradient-to-r from-rose-50 to-orange-50/80 border-rose-300 text-rose-900 shadow-xs'
            : 'bg-gradient-to-r from-slate-50 to-cyan-50/50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase tracking-wider font-extrabold flex items-center gap-1">
              {isOwed ? (
                <span className="text-emerald-700 flex items-center gap-1 font-black">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  {friend.name} owes you
                </span>
              ) : isOwing ? (
                <span className="text-rose-700 flex items-center gap-1 font-black">
                  <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                  You owe {friend.name}
                </span>
              ) : (
                <span className="text-slate-600 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  All Settled Up
                </span>
              )}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              isOwed ? 'bg-emerald-100 text-emerald-800' : isOwing ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {isOwed ? 'Collect' : isOwing ? 'Pay Due' : 'Zero Balance'}
            </span>
          </div>

          <div className="text-2xl font-black tracking-tight flex items-baseline gap-1">
            {isSettled ? (
              <span className="text-sm text-slate-500 font-semibold mt-1">
                No money pending between both of you.
              </span>
            ) : (
              <span className={isOwed ? 'text-emerald-700' : 'text-rose-700'}>
                {currency}{Math.abs(bal).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Lifetime Given / Received Stats */}
        <div className="flex items-center justify-between text-xs text-slate-600 pb-2.5 mb-3 border-b border-slate-100 font-semibold">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Given: <strong className="text-slate-900 font-bold">{currency}{friend.totalGiven?.toLocaleString() || 0}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Received: <strong className="text-slate-900 font-bold">{currency}{friend.totalReceived?.toLocaleString() || 0}</strong>
          </span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono text-[11px]">
            {friend.transactionCount || 0} txns
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAddTx(friend.id)}
            className="flex items-center justify-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold py-2.5 px-3 rounded-xl border border-brand-200 transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-brand-600" />
            <span>+ Add Entry</span>
          </button>
          
          <button
            onClick={() => onViewHistory(friend.id)}
            className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-200 transition-colors shadow-xs"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Statement</span>
          </button>
        </div>

        <div className="flex gap-2">
          {!isSettled && (
            <button
              onClick={() => onSettle(friend.id, Math.abs(bal), friend.name)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 px-3 rounded-xl shadow-md shadow-emerald-500/20 hover:-translate-y-0.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Settle Full {currency}{Math.abs(bal).toLocaleString()}</span>
            </button>
          )}

          <button
            onClick={() => onShareCode(friend.id, friend.name)}
            className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black py-2.5 px-3 rounded-xl border border-indigo-200 transition-all"
            title="Generate Time-Limited Share Code"
          >
            <span>🔗 Share</span>
          </button>

          {isOwed && (
            <button
              onClick={() => onRemind(friend.id, Math.abs(bal), friend.name, friend.phone)}
              className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black py-2.5 px-3.5 rounded-xl shadow-md shadow-[#25D366]/20 hover:-translate-y-0.5 transition-all"
              title="Send WhatsApp Payment Reminder"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>WhatsApp</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
