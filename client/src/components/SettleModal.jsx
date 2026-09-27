import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2 } from 'lucide-react';
import useModalBackHandler from '../hooks/useModalBackHandler';

export default function SettleModal({ 
  isOpen, 
  onClose, 
  onSettle, 
  friendId, 
  friendName, 
  initialAmount = 0, 
  initialNote = '',
  isShared = false,
  currency = '₹' 
}) {
  useModalBackHandler(isOpen, onClose);
  const [amount, setAmount] = useState(initialAmount || '');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [note, setNote] = useState(initialNote || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAmount(initialAmount || '');
  }, [initialAmount]);

  useEffect(() => {
    setNote(initialNote || '');
  }, [initialNote, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsSubmitting(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid settlement amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSettle({
        friendId,
        amount: numAmount,
        paymentMethod,
        note: note.trim() || `Settlement paid/received for ${friendName}`,
        date
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] m-auto"
      >
        
        <div className="flex items-center justify-between gap-2.5 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/90 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs sm:text-base font-bold text-slate-900 truncate leading-snug">
                {isShared ? `Request Settlement` : `Settle Up Balance`}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate" title={isShared ? `Send settlement request to ${friendName}` : `Record settlement with ${friendName}`}>
                {isShared ? `Send settlement request to ${friendName}` : `Record settlement with ${friendName}`}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 active:text-slate-900 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors flex-shrink-0 ml-auto"
            aria-label="Close modal"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto">
          {isShared && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 text-teal-950 flex items-start gap-2.5 shadow-2xs">
              <div className="w-5 h-5 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 shadow-xs">
                🤝
              </div>
              <div className="text-[11.5px] leading-relaxed">
                <strong className="font-extrabold text-teal-950 block">Connected 2-Way Sync</strong>
                A settlement request will be sent to <strong>{friendName}</strong> for mutual approval and ledger balance clearance.
              </div>
            </div>
          )}

          <div className="text-center bg-emerald-50/70 p-3 rounded-xl sm:rounded-2xl border border-emerald-200/80">
            <div className="text-xs sm:text-sm font-extrabold text-slate-900">{friendName}</div>
            <div className="text-xs text-emerald-800 font-bold mt-0.5 font-mono">
              Outstanding Dues: {currency}{Number(initialAmount).toLocaleString()}
            </div>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Settlement Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base sm:text-lg font-bold text-slate-400">{currency}</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 sm:pl-9 pr-3.5 py-2 sm:py-2.5 text-lg sm:text-xl font-extrabold text-emerald-700 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="UPI">UPI (GPay/PhonePe)</option>
                <option value="Cash">Cash Handoff</option>
                <option value="Card">Card</option>
                <option value="NetBanking">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Settlement Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Paid via UPI, Cash handed over"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2 pt-2 sm:pt-3 border-t border-slate-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 xs:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 xs:flex-initial bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-black px-5 py-2.5 sm:py-3 rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-center flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isShared ? 'Send Settlement Request 🤝' : 'Confirm Settlement'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
