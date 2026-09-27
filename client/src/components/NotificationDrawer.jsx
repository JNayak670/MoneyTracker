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
  Loader2,
  Megaphone,
  Volume2,
  VolumeX
} from 'lucide-react';
import api from '../services/api';
import useModalBackHandler from '../hooks/useModalBackHandler';
import { isSoundEnabled, toggleSound, testNotificationSound } from '../services/soundService';

export default function NotificationDrawer({ isOpen, onClose, onDataChanged }) {
  useModalBackHandler(isOpen, onClose);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [actionLoading, setActionLoading] = useState(null);
  const [markingRead, setMarkingRead] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      const list = res?.notifications || res?.data?.notifications || (Array.isArray(res) ? res : []);
      setNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
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
      setMarkingRead(true);
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('notifications-updated'));
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingRead(false);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n.id === id || n._id === id) ? { ...n, isRead: true } : n));
      window.dispatchEvent(new Event('notifications-updated'));
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      window.dispatchEvent(new Event('notifications-updated'));
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnectMatch = async (notif) => {
    const friendId = notif.data?.friendId;
    if (!friendId) return;

    setActionLoading(notif.id);
    try {
      await api.post(`/friends/${friendId}/confirm-connect`);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isActioned: true, actionTaken: 'CONNECTED', isRead: true } : n));
      window.dispatchEvent(new Event('transaction-updated'));
      if (onDataChanged) onDataChanged();
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
      window.dispatchEvent(new Event('transaction-updated'));
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
      window.dispatchEvent(new Event('transaction-updated'));
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
      window.dispatchEvent(new Event('transaction-updated'));
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
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between flex-shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
              <Bell className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm leading-tight text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white shadow-xs animate-pulse">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Match alerts & friend requests</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingRead || unreadCount === 0}
                title={unreadCount > 0 ? "Mark all notifications as read" : "All caught up"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-md ${
                  unreadCount > 0
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white shadow-purple-950/40 border border-purple-400/50 hover:scale-[1.04] active:scale-[0.96] ring-2 ring-purple-400/20 cursor-pointer'
                    : 'bg-slate-800 text-slate-400 border border-slate-700/60 opacity-60 cursor-default'
                }`}
              >
                {markingRead ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-200" />
                ) : (
                  <CheckCheck className={`w-4 h-4 ${unreadCount > 0 ? 'text-purple-200' : 'text-slate-400'}`} />
                )}
                <span>Read All</span>
                {unreadCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-black rounded-full bg-white/20 text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification Sound Alert Settings Bar */}
        <div className="bg-slate-900/90 px-5 py-2.5 border-b border-slate-800/80 flex items-center justify-between text-xs flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              const next = toggleSound();
              setSoundActive(next);
              if (next) testNotificationSound();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              soundActive 
                ? 'bg-purple-600/25 text-purple-300 border border-purple-500/40 hover:bg-purple-600/35' 
                : 'bg-slate-800 text-slate-400 border border-slate-700/60 hover:bg-slate-750'
            }`}
            title={soundActive ? "Notification sound is ON. Click to mute." : "Notification sound is MUTED. Click to turn ON."}
          >
            {soundActive ? <Volume2 className="w-3.5 h-3.5 text-purple-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span>{soundActive ? 'Sound: ON' : 'Sound: Muted'}</span>
          </button>

          <button
            type="button"
            onClick={() => testNotificationSound()}
            className="text-[11px] font-bold text-slate-300 hover:text-purple-300 flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg hover:bg-white/5 active:scale-95 cursor-pointer"
            title="Play sample notification chime"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Test Sound</span>
          </button>
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
            const isAdminMsg = notif.type === 'ADMIN_MESSAGE';
            const isLoadingThis = actionLoading === notif.id;

            return (
              <div
                key={notif.id}
                className={`p-3.5 rounded-2xl border transition-all relative ${
                  !notif.isRead 
                    ? isAdminMsg 
                      ? 'bg-gradient-to-r from-purple-50/70 to-indigo-50/50 border-purple-300 shadow-sm' 
                      : 'bg-purple-50/40 border-purple-200/80 shadow-2xs' 
                    : 'bg-slate-50/70 border-slate-200/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-xs ${
                      isAdminMsg ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xs' :
                      isMatch ? 'bg-purple-100 text-purple-700' :
                      notif.type === 'SETTLEMENT_REQUEST' ? 'bg-teal-100 text-teal-800' :
                      isTxReq ? 'bg-amber-100 text-amber-700' :
                      (notif.type === 'FRIEND_CONNECTED' || notif.type === 'SETTLEMENT_APPROVED') ? 'bg-emerald-100 text-emerald-700' :
                      notif.type === 'SETTLEMENT_REJECTED' ? 'bg-rose-100 text-rose-700' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {isAdminMsg ? <Megaphone className="w-3.5 h-3.5" /> :
                       isMatch ? <Sparkles className="w-3.5 h-3.5" /> :
                       (notif.type === 'SETTLEMENT_REQUEST' || notif.type === 'SETTLEMENT_APPROVED') ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                       notif.type === 'SETTLEMENT_REJECTED' ? <XCircle className="w-3.5 h-3.5" /> :
                       isTxReq ? <Clock className="w-3.5 h-3.5" /> :
                       <ShieldCheck className="w-3.5 h-3.5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-xs leading-snug">
                          {notif.title}
                        </h4>
                        {isAdminMsg && (
                          <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                            Admin Notice
                          </span>
                        )}
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse flex-shrink-0" title="Unread" />
                        )}
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">
                          {new Date(notif.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkSingleRead(notif.id)}
                            className="text-[10px] font-bold text-purple-600 hover:text-purple-800 underline transition-colors"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
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
