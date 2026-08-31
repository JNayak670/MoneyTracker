import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Copy, ExternalLink, Check } from 'lucide-react';

export default function WhatsAppModal({ isOpen, onClose, friendName, amount, phone = '', currency = '₹', userName = 'Me' }) {
  const [tone, setTone] = useState('polite');
  const [phoneNumber, setPhoneNumber] = useState(phone || '');
  const [reason, setReason] = useState('');
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setPhoneNumber(phone || '');
  }, [phone]);

  const generateText = (t, r) => {
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
  }, [tone, reason, friendName, amount, currency]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">WhatsApp Reminder</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Friend's Phone / WhatsApp Number
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Message Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="polite">Polite & Friendly 😊</option>
                <option value="casual">Casual / Bro 👋</option>
                <option value="funny">Humorous / Meme 🍕😂</option>
                <option value="formal">Formal Statement 📋</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reason / Tag
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Pizza Party"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Live Message Preview
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-sans focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
