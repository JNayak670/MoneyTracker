import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquare, Copy, ExternalLink, Check } from 'lucide-react';
import useModalBackHandler from '../hooks/useModalBackHandler';

export default function WhatsAppModal({ 
  isOpen, 
  onClose, 
  friendName, 
  amount, 
  phone = '', 
  currency = '₹', 
  userName = 'Me',
  type = 'OWED' 
}) {
  useModalBackHandler(isOpen, onClose);
  const [tone, setTone] = useState('polite');
  const [phoneNumber, setPhoneNumber] = useState(phone || '');
  const [reason, setReason] = useState('');
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  const isYouOwe = type === 'YOU_OWE';
  const isSettled = type === 'SETTLED' || Number(amount) === 0;

  useEffect(() => {
    setPhoneNumber(phone || '');
  }, [phone]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const generateText = (t, r) => {
    if (isSettled) {
      switch (t) {
        case 'casual':
          return `Hey ${friendName}! 👋 All our shared expenses and ledgers on MoneyTracker are completely settled (₹0). Catch up soon! 🍕`;
        case 'funny':
          return `Hello ${friendName}! 📢 Breaking News: Our shared balance is exactly ₹0! Neither of us owes anything. Time for another outing? 😂`;
        case 'formal':
          return `*Account Statement - Money Tracker*\n\nTo: ${friendName}\nCurrent Balance: Settled (₹0)\nDate: ${new Date().toLocaleDateString()}\n\nAll accounts between us are balanced and up to date. Thank you.`;
        case 'polite':
        default:
          return `Hey ${friendName}! 😊 Just checking in—all our shared ledgers on MoneyTracker are fully balanced and settled. Have a wonderful day! 🙌`;
      }
    }

    if (isYouOwe) {
      switch (t) {
        case 'casual':
          return `Yo ${friendName}! 👋 Ready to clear the ${currency}${amount} balance I owe you${r ? ` for ${r}` : ''}. Send over your UPI ID or QR code whenever you get a chance! 🚀`;
        case 'funny':
          return `Hello ${friendName}! 📢 Breaking News: My wallet owes you ${currency}${amount}${r ? ` (${r})` : ''}! 🍕💸 Send your UPI details so I can settle before I spend it all! 😂`;
        case 'formal':
          return `*Payment Settlement Notice - Money Tracker*\n\nTo: ${friendName}\nAmount Owed by Me: ${currency}${amount}\nReference: ${r || 'Shared Expense'}\nDate: ${new Date().toLocaleDateString()}\n\nPlease share your UPI ID / bank details so I can complete the payment. Thank you.`;
        case 'polite':
        default:
          return `Hey ${friendName}! 😊 Hope you're doing well.\n\nJust wanted to reach out regarding the ${currency}${amount} I owe you${r ? ` for "${r}"` : ''}.\nPlease send your UPI ID or payment link so I can clear it today. Thanks a lot! 🙌`;
      }
    }

    switch (t) {
      case 'casual':
        return `Yo ${friendName}! 👋 Quick heads up on the ${currency}${amount} balance${r ? ` for ${r}` : ''}. Send over UPI whenever you get a chance! 🚀`;
      case 'funny':
        return `Hello ${friendName}! 📢 Breaking News: My wallet misses ${currency}${amount} from our hangout${r ? ` (${r})` : ''}! 🍕💸 Please send UPI before inflation eats it away! 😂`;
      case 'formal':
        return `*Payment Reminder - Money Tracker*\n\nTo: ${friendName}\nOutstanding Dues: ${currency}${amount}\nReference: ${r || 'Shared Expense'}\nDate: ${new Date().toLocaleDateString()}\n\nPlease transfer to my UPI / account at your earliest convenience. Thank you.`;
      case 'polite':
      default:
        return `Hey ${friendName}! 😊 Hope you're doing well.\n\nJust a gentle reminder regarding our shared expense${r ? ` for "${r}"` : ''} of ${currency}${amount}.\nWhenever you get a chance, please settle it. Thanks a lot! 🙌`;
    }
  };

  useEffect(() => {
    setMessage(generateText(tone, reason));
  }, [tone, reason, friendName, amount, currency, isYouOwe, isSettled]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(message);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
    onClose();
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
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${
              isYouOwe 
                ? 'bg-rose-50 text-rose-600 border-rose-200' 
                : isSettled 
                ? 'bg-slate-50 text-slate-600 border-slate-200'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              <MessageSquare className="w-4 h-4 fill-current opacity-80" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs sm:text-base font-black text-slate-900 truncate leading-snug">
                {isSettled ? 'WhatsApp Message' : isYouOwe ? 'Payment Settlement Note' : 'WhatsApp Reminder'}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate" title={isSettled ? `Message ${friendName}` : isYouOwe ? `Send UPI request to ${friendName}` : `Send reminder to ${friendName}`}>
                {isSettled ? `Message ${friendName}` : isYouOwe ? `Send UPI request to ${friendName}` : `Send reminder to ${friendName}`}
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

        <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto">
          {/* Friend & Amount Summary Card */}
          <div className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border flex items-center justify-between ${
            isSettled
              ? 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200'
              : isYouOwe
              ? 'bg-gradient-to-r from-rose-50 via-pink-50 to-white border-rose-200'
              : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200'
          }`}>
            <div>
              <div className={`text-[10px] uppercase font-bold tracking-wider ${
                isSettled ? 'text-slate-600' : isYouOwe ? 'text-rose-700' : 'text-emerald-800'
              }`}>
                {isSettled ? 'Account Status' : isYouOwe ? 'You Owe' : 'Due to you'}
              </div>
              <div className={`text-base sm:text-lg font-black ${
                isSettled ? 'text-slate-800' : isYouOwe ? 'text-rose-950' : 'text-emerald-900'
              }`}>
                {isSettled ? 'All Settled (₹0)' : `${currency}${Number(amount).toLocaleString()}`}
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
              isSettled
                ? 'text-slate-700 bg-white border-slate-200'
                : isYouOwe
                ? 'text-rose-700 bg-white/90 border-rose-200'
                : 'text-emerald-700 bg-white/80 border-emerald-200/80'
            }`}>
              {friendName}
            </span>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Friend's Phone / WhatsApp Number
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Message Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="polite">Polite & Friendly 😊</option>
                <option value="casual">Casual / Bro 👋</option>
                <option value="funny">Humorous / Meme 🍕</option>
                <option value="formal">Formal Statement 📋</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason / Note (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Pizza Party"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Live Message Preview
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 text-[11px] sm:text-xs text-slate-800 font-sans focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none leading-relaxed"
            />
          </div>

          <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2 pt-2 sm:pt-3 border-t border-slate-100 flex-shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 xs:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 xs:flex-initial flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-black px-5 py-2.5 sm:py-3 rounded-xl shadow-md shadow-[#25D366]/20 active:scale-[0.98] transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
