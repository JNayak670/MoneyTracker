import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Copy, Check, MessageSquare, ShieldCheck, Share2, Sparkles, ArrowRight } from 'lucide-react';
import api from '../services/api';

const DURATIONS = [
  { label: '15 Mins', minutes: 15 },
  { label: '1 Hour', minutes: 60, default: true },
  { label: '24 Hours', minutes: 1440 },
  { label: '7 Days', minutes: 10080 },
];

export default function ShareCodeModal({ isOpen, onClose, friendId, friendName, currency = '₹' }) {
  const [duration, setDuration] = useState(60);
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await api.post('/share/generate', {
        friendId,
        durationMinutes: duration
      });
      setShareData(res.data);
    } catch (err) {
      alert(`Failed to generate share code: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getShareUrl = () => {
    if (!shareData) return '';
    const base = window.location.origin;
    return `${base}/share/${shareData.code}`;
  };

  const handleCopyCode = () => {
    if (!shareData) return;
    navigator.clipboard.writeText(shareData.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const url = getShareUrl();
    const durationText = DURATIONS.find(d => d.minutes === duration)?.label || `${duration} minutes`;
    const message = `👋 Hey ${friendName}!\nHere is our shared transaction ledger statement on MoneyTracker:\n🔗 ${url}\n🔑 Access Code: *${shareData.code}*\n⏳ Note: This link is valid for *${durationText}*.\n\nCheck all our mutual splits & settlements!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] m-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">Share Statement with {friendName}</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold">Generate a secure, time-limited access code</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setShareData(null);
              onClose();
            }} 
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {!shareData ? (
            <div className="space-y-4">
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Time-Limited Public Access</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Your friend will be able to view only their mutual transactions with you without needing an account. The link automatically expires when time runs out.
                </p>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Select Link Expiration Duration
                </label>
                <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d.minutes}
                      type="button"
                      onClick={() => setDuration(d.minutes)}
                      className={`flex flex-col xs:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                        duration === d.minutes
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white text-xs sm:text-sm font-black py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl shadow-md shadow-brand-500/25 hover:shadow-lg active:scale-[0.98] transition-all"
              >
                {loading ? (
                  <span>Generating Code...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Share Code</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Giant Code Display */}
              <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white text-center shadow-lg relative overflow-hidden">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-indigo-100 mb-1">
                  6-Digit Access Code
                </div>
                <div className="text-3xl sm:text-5xl font-black tracking-widest font-mono drop-shadow-sm my-2">
                  {shareData.code}
                </div>
                <div className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold bg-black/20 backdrop-blur-xs px-3 py-1 rounded-full text-indigo-100">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Expires at {new Date(shareData.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black py-2.5 sm:py-3 px-2 rounded-xl border border-slate-200 transition-all shadow-xs"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-black py-2.5 sm:py-3 px-2 rounded-xl border border-indigo-200 transition-all shadow-xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
              </div>

              {/* 1-Click WhatsApp Share */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-black py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl shadow-md shadow-[#25D366]/25 hover:shadow-lg active:scale-[0.98] transition-all"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Send Code & Link via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setShareData(null)}
                className="w-full text-center text-[11px] sm:text-xs text-slate-500 hover:text-slate-800 font-bold underline pt-1"
              >
                Change Expiration Duration
              </button>

            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
