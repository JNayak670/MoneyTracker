import React from 'react';
import { 
  PlusCircle, 
  History, 
  CheckCircle2, 
  MessageSquare, 
  Edit3, 
  Trash2 
} from 'lucide-react';

export default function FriendCard({ 
  friend, 
  currency = '₹', 
  onAddTx, 
  onViewHistory, 
  onSettle, 
  onRemind, 
  onEdit, 
  onDelete 
}) {
  const bal = friend.currentBalance || 0;
  const isOwed = bal > 0;
  const isOwing = bal < 0;
  const isSettled = bal === 0;

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:border-slate-300 group">
      
      {/* Top Details */}
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-200 flex-shrink-0"
              style={{ backgroundColor: friend.avatarColor || '#6366f1' }}
            >
              {friend.avatarEmoji || '👤'}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-brand-600 transition-colors">
                {friend.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
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

        {/* Balance Status Box (Bright & High Contrast) */}
        <div className={`rounded-xl p-3.5 mb-3.5 border transition-colors ${
          isOwed
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : isOwing
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500 mb-0.5">
            {isOwed ? '🟢 Friend Needs to Pay You' : isOwing ? '🔴 You Need to Pay Friend' : '⚪ Balance Status'}
          </div>
          <div className="text-xl font-black flex items-baseline gap-1">
            {isSettled ? (
              <span className="flex items-center gap-1.5 text-sm text-slate-600 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> All Settled (₹0 Dues)
              </span>
            ) : (
              <span>{currency}{Math.abs(bal).toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Lifetime Given / Received Stats */}
        <div className="flex items-center justify-between text-xs text-slate-500 pb-2 mb-3 border-b border-slate-100 font-semibold">
          <span>Given: <strong className="text-slate-800">{currency}{friend.totalGiven?.toLocaleString() || 0}</strong></span>
          <span>Received: <strong className="text-slate-800">{currency}{friend.totalReceived?.toLocaleString() || 0}</strong></span>
          <span>{friend.transactionCount || 0} txns</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAddTx(friend.id)}
            className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-brand-600" />
            <span>+ Add Entry</span>
          </button>
          
          <button
            onClick={() => onViewHistory(friend.id)}
            className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>History</span>
          </button>
        </div>

        <div className="flex gap-2">
          {!isSettled && (
            <button
              onClick={() => onSettle(friend.id, Math.abs(bal), friend.name)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold py-2 px-3 rounded-xl shadow-sm transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Settle Up</span>
            </button>
          )}

          {isOwed && (
            <button
              onClick={() => onRemind(friend.id, Math.abs(bal), friend.name, friend.phone)}
              className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold py-2 px-3 rounded-xl border border-emerald-300 transition-all"
              title="Send WhatsApp Payment Reminder"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Remind</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
