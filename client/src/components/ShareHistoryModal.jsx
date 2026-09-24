import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Share2, 
  CheckSquare, 
  Square, 
  ArrowRight, 
  Calendar, 
  Tag, 
  Loader2, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import useModalBackHandler from '../hooks/useModalBackHandler';

export default function ShareHistoryModal({ isOpen, onClose, friend, transactions = [], onComplete }) {
  useModalBackHandler(isOpen && Boolean(friend), onClose);

  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      // By default select all
      setSelectedIds(transactions.map(t => t.id || t._id));
      setError('');
      setSuccess('');
    }
  }, [transactions, isOpen]);

  if (!isOpen || !friend) return null;

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(transactions.map(t => t.id || t._id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handleShare = async (shareAll = false) => {
    setSaving(true);
    setError('');
    try {
      const payload = shareAll ? { shareAll: true } : { transactionIds: selectedIds };
      const res = await api.post(`/friends/${friend.id}/share-history`, payload);
      setSuccess(res.data.message || 'Transactions shared successfully!');
      if (onComplete) onComplete();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message || 'Failed to share transactions');
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 px-4 sm:px-6 py-4 sm:py-5 text-white flex items-center justify-between gap-3 relative flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl border border-white/20 flex-shrink-0">
              <Share2 className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-black text-sm sm:text-lg leading-tight truncate">
                Share Previous Transactions?
              </h3>
              <p className="text-emerald-100 text-xs font-medium truncate" title={`Friend: ${friend.name}`}>
                Friend: <span className="font-bold text-white">{friend.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors flex-shrink-0 ml-auto"
            aria-label="Close modal"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-950">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-black">You are now connected with {friend.name}!</p>
              <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                You have <span className="font-bold">{transactions.length}</span> existing offline transaction{transactions.length === 1 ? '' : 's'}. Choose which ones you would like to sync with their account ledger, or skip to keep past history private.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          {/* Quick Select Controls */}
          <div className="flex items-center justify-between text-xs pt-1 border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-600">
              Selected: <span className="text-emerald-700 font-black">{selectedIds.length}</span> / {transactions.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
              >
                Select All
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={deselectAll}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 underline"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Transaction Checklist */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {transactions.map((tx) => {
              const id = tx.id || tx._id;
              const isSelected = selectedIds.includes(id);
              const isGiven = tx.type === 'GIVEN' || tx.type === 'SPLIT';

              return (
                <div
                  key={id}
                  onClick={() => toggleSelect(id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected 
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-xs' 
                      : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-emerald-600">
                      {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                        {tx.note}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {tx.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tx.category || tx.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`font-black text-xs sm:text-sm ${isGiven ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isGiven ? '+' : '-'}₹{tx.amount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200/60 text-xs font-bold transition-colors"
          >
            Skip / Keep Private
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleShare(false)}
              disabled={saving || selectedIds.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>Share Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
