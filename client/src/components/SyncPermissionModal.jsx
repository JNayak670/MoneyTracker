import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Zap, Clock, ShieldCheck, CheckCircle2, X, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import useModalBackHandler from '../hooks/useModalBackHandler';

export default function SyncPermissionModal({ isOpen, onClose, friend, onConfirm }) {
  useModalBackHandler(isOpen && Boolean(friend), onClose);

  const [loading, setLoading] = useState(false);

  if (!isOpen || !friend) return null;

  const currentPerm = friend.permission || 'NORMAL';
  const targetPerm = currentPerm === 'AUTHORIZED' ? 'NORMAL' : 'AUTHORIZED';
  const isSwitchingToAuthorized = targetPerm === 'AUTHORIZED';
  const friendUsername = friend.connectedUser?.username || friend.pendingUsername || friend.name;
  const friendPerm = friend.friendPermission || 'NORMAL';
  const isFriendAuthorized = friendPerm === 'AUTHORIZED';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(friend, targetPerm);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] m-auto transform transition-all animate-scaleUp">
        
        {/* Top Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isSwitchingToAuthorized 
            ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border-amber-200/80' 
            : 'bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-indigo-500/5 border-indigo-200/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm border ${
              isSwitchingToAuthorized 
                ? 'bg-amber-100 text-amber-700 border-amber-300' 
                : 'bg-indigo-100 text-indigo-700 border-indigo-300'
            }`}>
              {isSwitchingToAuthorized ? <Zap className="w-5 h-5 text-amber-600 fill-amber-500" /> : <Clock className="w-5 h-5 text-indigo-600" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {isSwitchingToAuthorized ? 'Enable Authorized (Instant Sync)' : 'Switch to Normal (Approval Mode)'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Sync settings with <strong className="text-slate-800">{friend.name}</strong> (@{friendUsername})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">

          {/* Current vs New Mode Visual Transition */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Current</span>
              <span className={`text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 border ${
                currentPerm === 'AUTHORIZED'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-200/80 text-slate-800 border-slate-300'
              }`}>
                {currentPerm === 'AUTHORIZED' ? <Zap className="w-3.5 h-3.5 text-amber-600" /> : <Clock className="w-3.5 h-3.5 text-slate-600" />}
                <span>{currentPerm === 'AUTHORIZED' ? 'Authorized (Instant)' : 'Normal (Approval)'}</span>
              </span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your New</span>
              <span className={`text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 border shadow-2xs ${
                targetPerm === 'AUTHORIZED'
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-indigo-600 text-white border-indigo-700'
              }`}>
                {targetPerm === 'AUTHORIZED' ? <Zap className="w-3.5 h-3.5 fill-white" /> : <Clock className="w-3.5 h-3.5" />}
                <span>{targetPerm === 'AUTHORIZED' ? 'Authorized (Instant)' : 'Normal (Approval)'}</span>
              </span>
            </div>
          </div>

          {/* Friend's Current Setting Notice */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">@{friendUsername}'s Setting for You:</span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-lg flex items-center gap-1 border shadow-2xs ${
                isFriendAuthorized
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}>
                {isFriendAuthorized ? <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" /> : <Clock className="w-3.5 h-3.5 text-slate-500" />}
                <span>{isFriendAuthorized ? 'Authorized (Instant)' : 'Normal (Approval)'}</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Independent</span>
          </div>

          {/* Detailed Mode Breakdown Cards */}
          <div className="space-y-3">
            {/* Authorized Card */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isSwitchingToAuthorized 
                ? 'bg-gradient-to-br from-amber-50/90 to-orange-50/50 border-amber-300 ring-2 ring-amber-400/20 shadow-xs' 
                : 'bg-slate-50/70 border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs">
                    <Zap className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900">Authorized (Instant 2-Way Sync)</h3>
                </div>
                {isSwitchingToAuthorized && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Selected
                  </span>
                )}
              </div>

              <ul className="space-y-2 text-xs text-slate-700 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">⚡</span>
                  <div>
                    <strong className="text-slate-900">Zero-Wait Instant Updates:</strong> Transactions, group splits, and settlements you or {friend.name} record are <strong>immediately active</strong> on both accounts.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">🔔</span>
                  <div>
                    <strong className="text-slate-900">Auto-Logged Notifications:</strong> Both receive real-time notifications (`₹X recorded by Friend`), with no manual approval step needed.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">🤝</span>
                  <div>
                    <strong className="text-slate-900">Best for Trusted Friends:</strong> Perfect for roommates, frequent spenders, and partners who trust each other's bookkeeping.
                  </div>
                </li>
              </ul>
            </div>

            {/* Normal Card */}
            <div className={`p-4 rounded-2xl border transition-all ${
              !isSwitchingToAuthorized 
                ? 'bg-gradient-to-br from-indigo-50/90 to-blue-50/50 border-indigo-300 ring-2 ring-indigo-400/20 shadow-xs' 
                : 'bg-slate-50/70 border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900">Normal (Requires Approval)</h3>
                </div>
                {!isSwitchingToAuthorized && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900">
                    Selected
                  </span>
                )}
              </div>

              <ul className="space-y-2 text-xs text-slate-700 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold mt-0.5">🛡️</span>
                  <div>
                    <strong className="text-slate-900">Two-Step Verification:</strong> Shared transactions remain in <strong>Pending Approval</strong> until the recipient reviews and clicks <strong>Accept ✅</strong>.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold mt-0.5">🔒</span>
                  <div>
                    <strong className="text-slate-900">Protected Balances:</strong> Unapproved entries do not affect the recipient's net balance until approved.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold mt-0.5">🔍</span>
                  <div>
                    <strong className="text-slate-900">Best for Occasional Splits:</strong> Useful when you want to verify every single expense before it touches your books.
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>
              You can toggle this setting back at any time by clicking the sync badge on {friend.name}'s card.
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-5 py-2.5 text-xs font-black text-white rounded-xl shadow-md transition-all flex items-center gap-2 ${
              isSwitchingToAuthorized 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20 active:scale-[0.98]' 
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-600/20 active:scale-[0.98]'
            } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
              </>
            ) : isSwitchingToAuthorized ? (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>Switch to Authorized (Instant)</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                <span>Switch to Normal Mode</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
