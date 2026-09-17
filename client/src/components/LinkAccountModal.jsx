import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  AtSign, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Link2, 
  Unlink,
  Loader2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

export default function LinkAccountModal({ isOpen, onClose, friend, onUpdated, onOpenShareHistory }) {
  const [usernameInput, setUsernameInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (friend) {
      setUsernameInput(friend.pendingUsername || (friend.connectedUser?.username) || '');
      setSearchResult(null);
      setError('');
      setSuccessMsg('');
    }
  }, [friend, isOpen]);

  if (!isOpen || !friend) return null;

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    const clean = usernameInput.replace(/^@/, '').trim().toLowerCase();
    if (!clean) {
      setError('Please enter a username to search.');
      return;
    }

    setSearching(true);
    try {
      const res = await api.get(`/friends/search-user?username=${clean}`);
      const data = res?.exists !== undefined ? res : (res?.data || res);
      setSearchResult(data);
    } catch (err) {
      setError(err.message || 'Failed to search for user');
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSaveOrLink = async () => {
    setSaving(true);
    setError('');
    try {
      const clean = usernameInput.replace(/^@/, '').trim().toLowerCase();
      const res = await api.post(`/friends/${friend.id}/link-username`, { username: clean });
      const data = res?.status !== undefined ? res : (res?.data || res);
      
      if (data.status === 'MATCH_FOUND') {
        // User found, offer immediate connection
        const connectRes = await api.post(`/friends/${friend.id}/confirm-connect`);
        const connectData = connectRes?.data !== undefined ? connectRes.data : connectRes;
        setSuccessMsg(`Connected successfully with @${clean}!`);
        if (onUpdated) onUpdated();
        
        // If there are eligible transactions to share, offer to open share history modal
        if (connectData?.eligibleTransactionsCount > 0 && onOpenShareHistory) {
          setTimeout(() => {
            onClose();
            onOpenShareHistory(friend, connectData.eligibleTransactions);
          }, 800);
        } else {
          setTimeout(() => onClose(), 1200);
        }
      } else {
        setSuccessMsg(data.message || 'Username saved as pending.');
        if (onUpdated) onUpdated();
        setTimeout(() => onClose(), 1400);
      }
    } catch (err) {
      setError(err.message || 'Failed to link account');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm(`Unlink @${friend.pendingUsername || friend.connectedUser?.username} from ${friend.name}? This friend will return to standard offline mode.`)) {
      return;
    }
    setSaving(true);
    try {
      await api.post(`/friends/${friend.id}/link-username`, { username: '' });
      setSuccessMsg('Account unlinked successfully.');
      if (onUpdated) onUpdated();
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setError(err.message || 'Failed to unlink account');
    } finally {
      setSaving(false);
    }
  };

  const isConnected = friend.connectionStatus === 'CONNECTED';

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 px-6 py-5 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl border border-white/20">
              <Link2 className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg leading-tight">
                {isConnected ? 'Connected MoneyTracker Friend' : 'Link MoneyTracker Account'}
              </h3>
              <p className="text-purple-200 text-xs font-medium">
                Friend: <span className="font-bold text-white">{friend.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Status Banner */}
          {isConnected ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-black text-emerald-900">Connected MoneyTracker Account</p>
                <p className="text-emerald-700 mt-0.5">
                  Linked to <span className="font-bold">@{friend.connectedUser?.username || friend.pendingUsername}</span>. Shared ledger sync is active.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-100 flex items-start gap-2.5 text-xs text-purple-900">
              <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Two-Way Account Linking</p>
                <p className="text-purple-700 text-[11px] mt-0.5">
                  Enter their MoneyTracker @username. If they haven't registered yet, we'll save it as pending and notify you the moment they join!
                </p>
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Username Search Input */}
          {!isConnected && (
            <form onSubmit={handleSearch} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Friend's @Username
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => {
                        setUsernameInput(e.target.value.replace(/\s+/g, '').toLowerCase());
                        setSearchResult(null);
                        setError('');
                      }}
                      placeholder="e.g. amit456 or rahul123"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 transition-all shadow-2xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching || !usernameInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-xs flex-shrink-0"
                  >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Check</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Search Results Display */}
          {searchResult && (
            <div className="animate-fadeIn">
              {searchResult.exists ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>MoneyTracker User Found! ✓</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{searchResult.user.name}</p>
                      <p className="text-emerald-700 text-xs font-semibold">@{searchResult.user.username}</p>
                    </div>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
                      Registered
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-800 font-black text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>No account found yet for @{searchResult.username}</span>
                  </div>
                  <p className="text-amber-900/80 text-[11px] leading-relaxed">
                    This friend will continue working normally as an offline friend. If they register later using this username, you will be notified automatically to connect!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
            {isConnected || friend.pendingUsername ? (
              <button
                type="button"
                onClick={handleUnlink}
                disabled={saving}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Unlink</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Close
              </button>
              
              {!isConnected && (
                <button
                  type="button"
                  onClick={handleSaveOrLink}
                  disabled={saving || !usernameInput.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  <span>
                    {searchResult?.exists ? 'Connect & Link' : 'Save Username'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
