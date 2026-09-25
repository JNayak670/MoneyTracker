import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Users, 
  Trash2, 
  Share2, 
  Copy, 
  Check, 
  Calendar, 
  CreditCard, 
  Tag, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Lock
} from 'lucide-react';
import api from '../services/api';
import useModalBackHandler from '../hooks/useModalBackHandler';

export default function SplitGroupModal({ isOpen, onClose, splitGroupId, onSplitDeleted }) {
  useModalBackHandler(isOpen, onClose);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen && splitGroupId) {
      loadGroupDetails();
      setConfirmDelete(false);
      setCopied(false);
    }
  }, [isOpen, splitGroupId]);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/transactions/group/${splitGroupId}`);
      setGroupData(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load group split details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBreakdown = () => {
    if (!groupData) return;
    const { title, totalBillAmount, payerName, date, participants } = groupData;
    let text = `🧾 *MoneyTracker Split Bill Summary*\n`;
    text += `📌 *Bill:* ${title}\n`;
    text += `💰 *Total Amount:* ₹${Number(totalBillAmount).toLocaleString()}\n`;
    text += `👤 *Paid by:* ${payerName}\n`;
    text += `📅 *Date:* ${date}\n\n`;
    text += `👥 *Individual Shares:*\n`;
    participants.forEach(p => {
      text += `• ${p.name}: ₹${Number(p.amount).toLocaleString()}${p.isPayer ? ' (Payer)' : ''}\n`;
    });
    text += `\nTracked via MoneyTracker ⚡`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!groupData) return;
    const { title, totalBillAmount, payerName, date, participants } = groupData;
    let text = `🧾 *MoneyTracker Split Bill Summary*\n`;
    text += `📌 *Bill:* ${title}\n`;
    text += `💰 *Total Amount:* ₹${Number(totalBillAmount).toLocaleString()}\n`;
    text += `👤 *Paid by:* ${payerName}\n`;
    text += `📅 *Date:* ${date}\n\n`;
    text += `👥 *Individual Shares:*\n`;
    participants.forEach(p => {
      text += `• ${p.name}: ₹${Number(p.amount).toLocaleString()}${p.isPayer ? ' (Payer)' : ''}\n`;
    });
    text += `\nTracked via MoneyTracker ⚡`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDeleteSplitGroup = async () => {
    try {
      setDeleting(true);
      await api.delete(`/transactions/group/${splitGroupId}`);
      if (onSplitDeleted) onSplitDeleted(splitGroupId);
      window.dispatchEvent(new Event('transaction-updated'));
      onClose();
    } catch (err) {
      alert(`Error deleting group split: ${err.response?.data?.error || err.message}`);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/90 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                Group Split Breakdown
              </h2>
              <p className="text-[11px] text-slate-500 font-mono font-medium">
                ID: {splitGroupId}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 active:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-700">Loading split bill details...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-2">
              <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
              <p className="text-sm font-bold">{error}</p>
              <button
                onClick={loadGroupDetails}
                className="text-xs font-black underline hover:text-rose-900"
              >
                Try Again
              </button>
            </div>
          ) : groupData ? (
            <>
              {/* Main Total Banner */}
              <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-lg shadow-indigo-900/10">
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200 bg-white/10 px-2 py-0.5 rounded-md">
                      {groupData.category || 'General'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                      {groupData.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200 pt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {groupData.date} {groupData.time ? `• ${groupData.time}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        {groupData.paymentMethod || 'UPI'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">
                      Total Bill
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                      ₹{Number(groupData.totalBillAmount).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Sub-status bar */}
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                  <div className="flex items-center gap-1.5 text-indigo-100">
                    <span>👑 Paid by:</span>
                    <strong className="text-white bg-white/20 px-2 py-0.5 rounded-lg">
                      {groupData.payerIsUser ? 'You (Logged in User)' : groupData.payerName}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-300 font-mono text-[11px]">
                    <span className="capitalize">{groupData.splitMode?.toLowerCase() || 'equal'} Split</span>
                    <span>• {groupData.participants.length} Participants</span>
                  </div>
                </div>
              </div>

              {/* Participants Breakdown Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Participant Shares & Debts</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {groupData.participants.length} people
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {groupData.participants.map((p, idx) => {
                    const isPayer = p.isPayer || (groupData.payerIsUser && p.isSelf) || (!groupData.payerIsUser && p.name === groupData.payerName);
                    const pct = groupData.totalBillAmount > 0 
                      ? Math.round((Number(p.amount) / Number(groupData.totalBillAmount)) * 100) 
                      : 0;

                    return (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          p.isSelf 
                            ? 'bg-indigo-50/50 border-indigo-200' 
                            : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shadow-2xs flex-shrink-0"
                            style={{ backgroundColor: p.avatarColor || '#6366f1' }}
                          >
                            {p.avatarEmoji || '👤'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                                {p.name}
                              </span>
                              {p.isSelf && (
                                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-md">
                                  You
                                </span>
                              )}
                              {isPayer && (
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                                  Payer
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                              <span>{p.relationshipTag || 'Friend'}</span>
                              <span>•</span>
                              <span>{pct}% share</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-black text-slate-900 font-mono">
                            ₹{Number(p.amount).toLocaleString()}
                          </div>
                          <div className="text-[10px] font-bold mt-0.5">
                            {isPayer ? (
                              <span className="text-emerald-700">Paid full bill</span>
                            ) : groupData.payerIsUser ? (
                              <span className="text-indigo-600">Owes you ₹{Number(p.amount).toLocaleString()}</span>
                            ) : p.isSelf ? (
                              <span className="text-rose-600">You owe {groupData.payerName}</span>
                            ) : (
                              <span className="text-slate-500">Share: ₹{Number(p.amount).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Receipt Note if present */}
              {groupData.receiptNote && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
                  <span className="text-sm">🧾</span>
                  <div className="flex-1">
                    <span className="font-bold">Receipt / Note: </span>
                    <span>{groupData.receiptNote}</span>
                  </div>
                </div>
              )}

              {/* Confirm Delete Section */}
              {confirmDelete && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <div>
                      <p className="font-black text-xs">Delete entire group split?</p>
                      <p className="text-[11px] text-rose-700">
                        This will remove all {groupData.participants.length} transactions across your friends' ledgers and adjust balances accordingly.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSplitGroup}
                      disabled={deleting}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
                    >
                      {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>Yes, Delete All</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        {groupData && !loading && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyBreakdown}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all shadow-2xs"
                title="Copy breakdown text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 active:scale-95 transition-all shadow-2xs"
                title="Share to WhatsApp group"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {!confirmDelete && (
                groupData.canDelete !== false ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                    title="Delete Entire Group Split"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete Bill</span>
                  </button>
                ) : (
                  <span 
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                    title={`Entered by ${groupData.payerName || 'friend'}. Shared splits can only be deleted by the person who entered them.`}
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Shared Split</span>
                  </span>
                )
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
