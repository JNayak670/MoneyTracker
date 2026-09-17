import React from 'react';
import { 
  PlusCircle, 
  History, 
  CheckCircle2, 
  MessageSquare, 
  Edit3, 
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
  Sparkles,
  Link2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Zap,
  AtSign
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
  onDelete,
  onLinkAccount,
  onTogglePermission
}) {
  const bal = friend.currentBalance || 0;
  const isOwed = bal > 0;
  const isOwing = bal < 0;
  const isSettled = bal === 0;

  const isConnected = friend.connectionStatus === 'CONNECTED';
  const isPendingMatch = friend.connectionStatus === 'PENDING_MATCH';
  const isAuthorized = friend.permission === 'AUTHORIZED';

  return (
    <div className={`rounded-3xl p-4 sm:p-5 flex flex-col justify-between border transition-all duration-300 hover:shadow-xl bg-white relative overflow-hidden ${
      isOwed 
        ? 'border-emerald-300/80 shadow-emerald-500/5' 
        : isOwing 
        ? 'border-rose-300/80 shadow-rose-500/5' 
        : 'border-slate-200 shadow-slate-500/5'
    }`}>
      {/* Subtle top indicator line */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
        isOwed ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500' : isOwing ? 'bg-gradient-to-r from-rose-400 via-pink-500 to-rose-600' : 'bg-gradient-to-r from-slate-300 via-indigo-300 to-slate-300'
      }`} />
      
      {/* Top Details */}
      <div>
        <div className="flex items-start justify-between mb-2.5 pt-1">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-black/5 flex-shrink-0"
              style={{ backgroundColor: friend.avatarColor || '#3b82f6' }}
            >
              {friend.avatarEmoji || '👤'}
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 leading-snug">
                {friend.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                  {friend.relationshipTag || 'Friend'}
                </span>
                {friend.phone && (
                  <span className="text-[11px] text-slate-500 font-mono font-medium">
                    {friend.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <button
              onClick={() => onShareCode(friend.id, friend.name)}
              className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
              title="Share Ledger Code"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEdit(friend)}
              className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
              title="Edit Friend"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(friend.id)}
              className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Delete Friend"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ACCOUNT LINKING & CONNECTION BADGE BANNER */}
        {/* ------------------------------------------------------------- */}
        <div className="mb-3">
          {isConnected ? (
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  ✓
                </div>
                <div>
                  <p className="text-[11px] font-black text-emerald-950 flex items-center gap-1">
                    <span>Connected</span>
                    <span className="text-emerald-700 font-bold">@{friend.connectedUser?.username || friend.pendingUsername}</span>
                  </p>
                </div>
              </div>

              {/* Permission Badge / Toggle */}
              {onTogglePermission && (
                <button
                  onClick={() => onTogglePermission(friend)}
                  title="Click to toggle sync permission"
                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 border transition-all ${
                    isAuthorized
                      ? 'bg-amber-100/80 text-amber-900 border-amber-300 hover:bg-amber-200'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  {isAuthorized ? <Zap className="w-3 h-3 text-amber-600" /> : <Clock className="w-3 h-3 text-indigo-600" />}
                  <span>{isAuthorized ? 'Authorized (Instant)' : 'Normal (Approval)'}</span>
                </button>
              )}
            </div>
          ) : isPendingMatch ? (
            <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-[11px] font-bold text-purple-900">
                  Match Found: <strong className="text-purple-700">@{friend.pendingUsername}</strong>
                </span>
              </div>
              <button
                onClick={() => onLinkAccount(friend)}
                className="text-[11px] font-black text-purple-700 bg-white hover:bg-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-200 transition-colors shadow-2xs"
              >
                Connect
              </button>
            </div>
          ) : friend.pendingUsername ? (
            <div className="p-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <AtSign className="w-3 h-3 text-slate-400" />
                <span>Pending: <strong className="font-mono text-slate-800">@{friend.pendingUsername}</strong></span>
              </div>
              <button
                onClick={() => onLinkAccount(friend)}
                className="text-[10px] font-bold text-indigo-600 hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Offline Friend
              </span>
              <button
                onClick={() => onLinkAccount(friend)}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 px-2.5 py-0.5 rounded-lg transition-colors border border-indigo-100"
              >
                <Link2 className="w-3 h-3" />
                <span>Link Account</span>
              </button>
            </div>
          )}
        </div>

        {/* Balance Status Box */}
        <div className={`rounded-2xl p-3.5 sm:p-4 mb-3 border transition-all ${
          isOwed
            ? 'bg-[#eefbf5] border-[#d1f2e1] text-emerald-950'
            : isOwing
            ? 'bg-[#fff1f2] border-[#fecdd3] text-rose-950'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase tracking-wider font-extrabold flex items-center gap-1">
              {isOwed ? (
                <span className="text-emerald-900 flex items-center gap-1 font-black">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
                  {friend.name.toUpperCase()} OWES YOU
                </span>
              ) : isOwing ? (
                <span className="text-rose-900 flex items-center gap-1 font-black">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-rose-700" />
                  YOU OWE {friend.name.toUpperCase()}
                </span>
              ) : (
                <span className="text-slate-700 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ALL SETTLED UP
                </span>
              )}
            </span>

            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1 ${
              isOwed 
                ? 'bg-[#0f766e] text-white shadow-xs' 
                : isOwing 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'bg-slate-200 text-slate-700'
            }`}>
              {isOwed && <Sparkles className="w-2.5 h-2.5" />}
              <span>{isOwed ? 'COLLECT' : isOwing ? 'PAY DUE' : 'ZERO DUE'}</span>
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black tracking-tight flex items-baseline gap-1 mt-0.5">
            {isSettled ? (
              <span className="text-xs text-slate-500 font-bold">
                ₹0 (No balance pending)
              </span>
            ) : (
              <span className={`font-black ${isOwed ? 'text-emerald-950' : 'text-rose-950'}`}>
                {currency}{Math.abs(bal).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Lifetime Given / Received Stats */}
        <div className="flex items-center justify-between text-xs text-slate-600 pb-3 mb-3 border-b border-slate-100 font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Given: <strong className="text-slate-900 font-bold">{currency}{friend.totalGiven?.toLocaleString() || 0}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Received: <strong className="text-slate-900 font-bold">{currency}{friend.totalReceived?.toLocaleString() || 0}</strong>
          </span>
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border border-slate-200/80">
            {friend.transactionCount || 0} txns
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAddTx(friend.id)}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-black py-2.5 px-3 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Add Entry</span>
          </button>
          
          <button
            onClick={() => onViewHistory(friend.id)}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Statement</span>
          </button>
        </div>

        {/* Primary Full-Width Settle Button */}
        <div className="flex gap-2">
          <button
            onClick={() => onSettle(friend.id, Math.abs(bal), friend.name)}
            className={`flex-1 flex items-center justify-center gap-2 text-white text-xs sm:text-sm font-black py-2.5 px-4 rounded-2xl shadow-xs transition-all ${
              isSettled
                ? 'bg-slate-400 hover:bg-slate-500 cursor-default'
                : 'bg-[#0f766e] hover:bg-[#0d6d66] active:scale-[0.98]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Settle {bal !== 0 ? `${currency}${Math.abs(bal).toLocaleString()}` : ''}</span>
          </button>

          {isOwed && (
            <button
              onClick={() => onRemind(friend.id, Math.abs(bal), friend.name, friend.phone)}
              className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black py-2.5 px-3 rounded-2xl shadow-xs transition-all"
              title="Send WhatsApp Payment Reminder"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
