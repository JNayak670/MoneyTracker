import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  UserCheck, 
  Clock, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import api from '../services/api';

export default function NotificationDrawer({ isOpen, onClose, onOpenShareHistory, onDataChanged }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      const list = res?.notifications || res?.data?.notifications || (Array.isArray(res) ? res : []);
      setNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnectMatch = async (notif) => {
    const friendId = notif.data?.friendId;
    if (!friendId) return;

    setActionLoading(notif.id);
    try {
      const res = await api.post(`/friends/${friendId}/confirm-connect`);
      const resData = res?.data !== undefined ? res.data : res;
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isActioned: true, actionTaken: 'CONNECTED', isRead: true } : n));
      if (onDataChanged) onDataChanged();

      if (resData?.data?.eligibleTransactionsCount > 0 && onOpenShareHistory) {
        onClose();
        onOpenShareHistory({ id: friendId, name: notif.data?.friendName }, resData.data.eligibleTransactions);
      } else if (resData?.eligibleTransactionsCount > 0 && onOpenShareHistory) {
        onClose();
        onOpenShareHistory({ id: friendId, name: notif.data?.friendName }, resData.eligibleTransactions);
      }
    } catch (err) {
      alert(err.message || 'Failed to connect friend');
    } finally {
      setActionLoading(null);
    }
  };

  const handleIgnoreMatch = async (notif) => {
    const friendId = notif.data?.friendId;
    if (!friendId) return;

    setActionLoading(notif.id);
    try {
      await api.post(`/friends/${friendId}/ignore-connect`);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isActioned: true, actionTaken: 'IGNORED', isRead: true } : n));
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.message || 'Failed to ignore match');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveTransaction = async (notif) => {
    const txId = notif.data?.transactionId;
    if (!txId) return;

    setActionLoading(notif.id);
    try {
      await api.post(`/transactions/${txId}/approve`);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isActioned: true, actionTaken: 'APPROVED', isRead: true } : n));
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.message || 'Failed to approve transaction');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectTransaction = async (notif) => {
    const txId = notif.data?.transactionId;
    if (!txId) return;

    setActionLoading(notif.id);
    try {
      await api.post(`/transactions/${txId}/reject`);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isActioned: true, actionTaken: 'REJECTED', isRead: true } : n));
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.message || 'Failed to reject transaction');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slideLeft border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Notifications</h3>
              <p className="text-[11px] text-slate-400">Match alerts & friend requests</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                title="Mark all as read"
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Read All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <p className="text-xs">Loading notifications...</p>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                <Bell className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700 text-sm">No notifications</p>
              <p className="text-xs text-slate-400 max-w-xs">
                You're all caught up! New friend matches and transaction requests will appear here.
              </p>
            </div>
          )}

          {!loading && notifications.map((notif) => {
            const isMatch = notif.type === 'USERNAME_MATCH' || notif.type === 'FRIEND_REQUEST';
            const isTxReq = notif.type === 'TRANSACTION_REQUEST' || notif.type === 'SETTLEMENT_REQUEST';
            const isLoadingThis = actionLoading === notif.id;

            return (
              <div
                key={notif.id}
                className={`p-3.5 rounded-2xl border transition-all relative ${
                  !notif.isRead 
                    ? 'bg-purple-50/40 border-purple-200/80 shadow-2xs' 
                    : 'bg-slate-50/70 border-slate-200/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-xs ${
                      isMatch ? 'bg-purple-100 text-purple-700' :
                      isTxReq ? 'bg-amber-100 text-amber-700' :
                      notif.type === 'FRIEND_CONNECTED' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {isMatch ? <Sparkles className="w-3.5 h-3.5" /> :
                       isTxReq ? <Clock className="w-3.5 h-3.5" /> :
                       <ShieldCheck className="w-3.5 h-3.5" />}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-xs leading-snug">
                        {notif.title}
                      </h4>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {new Date(notif.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteNotif(notif.id)}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* USERNAME MATCH ACTIONS */}
                {isMatch && !notif.isActioned && (
                  <div className="mt-3 pt-2.5 border-t border-purple-200/60 flex items-center gap-2 justify-end">
                    <button
                      onClick={() => handleIgnoreMatch(notif)}
                      disabled={isLoadingThis}
                      className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-200/60 text-xs font-bold transition-colors"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => handleConnectMatch(notif)}
                      disabled={isLoadingThis}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      {isLoadingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                      <span>Connect</span>
                    </button>
                  </div>
                )}

                {/* TRANSACTION REQUEST APPROVAL ACTIONS */}
                {isTxReq && !notif.isActioned && (
                  <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center gap-2 justify-end">
                    <button
                      onClick={() => handleRejectTransaction(notif)}
                      disabled={isLoadingThis}
                      className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors border border-rose-200"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApproveTransaction(notif)}
                      disabled={isLoadingThis}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      {isLoadingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Approve</span>
                    </button>
                  </div>
                )}

                {/* Already Actioned Badge */}
                {notif.isActioned && (
                  <div className="mt-2 text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-slate-400" />
                    <span>Action completed ({notif.actionTaken})</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
