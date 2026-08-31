import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

export default function SettleModal({ isOpen, onClose, onSettle, friendId, friendName, initialAmount = 0, currency = '₹' }) {
  const [amount, setAmount] = useState(initialAmount || '');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setAmount(initialAmount || '');
  }, [initialAmount]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid settlement amount.');
      return;
    }

    onSettle({
      friendId,
      amount: numAmount,
      paymentMethod,
      note: note.trim() || `Settlement paid/received for ${friendName}`,
      date
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Settle Up Balance</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center pb-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <div className="text-base font-extrabold text-slate-900">{friendName}</div>
            <div className="text-xs text-brand-700 font-bold mt-0.5">
              Outstanding Dues: {currency}{Number(initialAmount).toLocaleString()}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Settlement Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">{currency}</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xl font-extrabold text-emerald-700 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Mode
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Cash Handoff</option>
                <option value="Card">Card</option>
                <option value="NetBanking">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Settlement Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Paid via UPI, Cash handed over"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              Confirm Settlement
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
