import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bell, 
  Megaphone, 
  Receipt, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Link2, 
  ArrowRight, 
  X, 
  Sparkles,
  Volume2
} from 'lucide-react';
import api from '../services/api';
import { playNotificationSound } from '../services/soundService';

// Helper to get configuration by notification type
const getToastConfig = (type) => {
  switch (type) {
    case 'ADMIN_MESSAGE':
      return {
        badge: 'Admin Notice',
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        iconBg: 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white',
        borderClass: 'border-purple-500/40 hover:border-purple-500/60',
        glowColor: 'rgba(168, 85, 247, 0.15)',
        progressBar: 'from-purple-500 to-indigo-500',
        icon: Megaphone
      };
    case 'TRANSACTION_REQUEST':
      return {
        badge: 'Payment Request',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white',
        borderClass: 'border-amber-500/40 hover:border-amber-500/60',
        glowColor: 'rgba(245, 158, 11, 0.15)',
        progressBar: 'from-amber-500 to-orange-500',
        icon: Receipt
      };
    case 'SETTLEMENT_REQUEST':
      return {
        badge: 'Settlement Request',
        badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
        iconBg: 'bg-gradient-to-tr from-teal-500 to-emerald-600 text-white',
        borderClass: 'border-teal-500/40 hover:border-teal-500/60',
        glowColor: 'rgba(20, 184, 166, 0.15)',
        progressBar: 'from-teal-500 to-emerald-500',
        icon: Receipt
      };
    case 'SETTLEMENT_APPROVED':
      return {
        badge: 'Settlement Approved',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        iconBg: 'bg-gradient-to-tr from-emerald-600 to-green-600 text-white',
        borderClass: 'border-emerald-500/40 hover:border-emerald-500/60',
        glowColor: 'rgba(16, 185, 129, 0.15)',
        progressBar: 'from-emerald-500 to-green-500',
        icon: CheckCircle2
      };
    case 'SETTLEMENT_REJECTED':
      return {
        badge: 'Settlement Declined',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        iconBg: 'bg-gradient-to-tr from-rose-600 to-pink-600 text-white',
        borderClass: 'border-rose-500/40 hover:border-rose-500/60',
        glowColor: 'rgba(244, 63, 94, 0.15)',
        progressBar: 'from-rose-500 to-pink-500',
        icon: XCircle
      };
    case 'TRANSACTION_LOGGED':
      return {
        badge: 'Instant Synced',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white',
        borderClass: 'border-emerald-500/40 hover:border-emerald-500/60',
        glowColor: 'rgba(16, 185, 129, 0.15)',
        progressBar: 'from-emerald-500 to-teal-500',
        icon: Zap
      };
    case 'TRANSACTION_APPROVED':
      return {
        badge: 'Approved',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        iconBg: 'bg-gradient-to-tr from-emerald-600 to-green-600 text-white',
        borderClass: 'border-emerald-500/40 hover:border-emerald-500/60',
        glowColor: 'rgba(16, 185, 129, 0.15)',
        progressBar: 'from-emerald-500 to-green-500',
        icon: CheckCircle2
      };
    case 'TRANSACTION_REJECTED':
      return {
        badge: 'Declined',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        iconBg: 'bg-gradient-to-tr from-rose-600 to-pink-600 text-white',
        borderClass: 'border-rose-500/40 hover:border-rose-500/60',
        glowColor: 'rgba(244, 63, 94, 0.15)',
        progressBar: 'from-rose-500 to-pink-500',
        icon: XCircle
      };
    case 'FRIEND_REQUEST':
    case 'USERNAME_MATCH':
      return {
        badge: 'Friend Request',
        badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        iconBg: 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white',
        borderClass: 'border-indigo-500/40 hover:border-indigo-500/60',
        glowColor: 'rgba(99, 102, 241, 0.15)',
        progressBar: 'from-indigo-500 to-blue-500',
        icon: Users
      };
    case 'FRIEND_CONNECTED':
      return {
        badge: 'Connected',
        badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        iconBg: 'bg-gradient-to-tr from-cyan-600 to-teal-600 text-white',
        borderClass: 'border-cyan-500/40 hover:border-cyan-500/60',
        glowColor: 'rgba(6, 182, 212, 0.15)',
        progressBar: 'from-cyan-500 to-teal-500',
        icon: Link2
      };
    default:
      return {
        badge: 'Notification',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        iconBg: 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white',
        borderClass: 'border-blue-500/40 hover:border-blue-500/60',
        glowColor: 'rgba(59, 130, 246, 0.15)',
        progressBar: 'from-blue-500 to-indigo-500',
        icon: Bell
      };
  }
};

function ToastItem({ toast, onDismiss, onOpen }) {
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(toast.duration || 6000);

  const config = getToastConfig(toast.notif?.type);
  const IconComponent = config.icon;

  const triggerDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 280);
  }, [toast.id, onDismiss]);

  // Handle countdown with pause on hover
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(500, remainingTimeRef.current - elapsed);
    } else {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        triggerDismiss();
      }, remainingTimeRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPaused, triggerDismiss]);

  const handleToastClick = (e) => {
    // If close button was clicked, don't open drawer
    if (e.target.closest('button[data-close="true"]')) {
      return;
    }
    onOpen(toast.notif);
    triggerDismiss();
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={handleToastClick}
      style={{
        boxShadow: `0 15px 35px -5px ${config.glowColor}, 0 8px 12px -6px rgba(0, 0, 0, 0.5)`
      }}
      className={`relative w-full max-w-sm bg-slate-900/95 backdrop-blur-xl border ${config.borderClass} rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-98 select-none group pointer-events-auto ${
        isExiting ? 'animate-slideOutRight' : 'animate-slideInRight'
      }`}
    >
      {/* Subtle top corner ambient glow */}
      <div 
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none"
        style={{ backgroundColor: config.glowColor }}
      />

      <div className="p-3.5 sm:p-4">
        {/* Top Header Row: Icon + Badge + Time + Close Button */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0 shadow-md`}>
              <IconComponent className="w-3.5 h-3.5" />
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase border ${config.badgeClass} truncate`}>
              {config.badge}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-slate-400 font-medium font-mono">
              {new Date(toast.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              data-close="true"
              onClick={(e) => {
                e.stopPropagation();
                triggerDismiss();
              }}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Dismiss notification"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notification Title & Body */}
        <div className="pl-9 pr-1">
          <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-purple-300 transition-colors line-clamp-1">
            {toast.notif?.title || 'New Notification'}
          </h4>
          <p className="text-xs text-slate-300 font-medium mt-0.5 line-clamp-2 leading-relaxed">
            {toast.notif?.message}
          </p>

          {/* Amount badge if present */}
          {toast.notif?.data?.amount && (
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black font-mono">
              <span>Amount: ₹{Number(toast.notif.data.amount).toLocaleString()}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
              <span>Click to view details</span>
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-purple-400 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all">
              <span>Open</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

        {/* Dynamic Countdown Progress Bar (Fills 100% to 0% over toast duration) */}
      <div className="h-1 w-full bg-slate-800/80 overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${config.progressBar}`}
          style={{
            animation: `toastCountdown ${toast.duration || 6000}ms linear forwards`,
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        />
      </div>
    </div>
  );
}

export default function NotificationToastContainer() {
  const [toasts, setToasts] = useState([]);
  const knownNotificationIds = useRef(new Set());
  const hasInitialized = useRef(false);
  const lastCheckTimeRef = useRef(0);

  // Mark single notification as read & open drawer
  const handleOpenNotification = async (notif) => {
    if (!notif) return;
    const notifId = notif.id || notif._id;
    // Dismiss toast immediately from screen
    setToasts(prev => prev.filter(t => t.notif?.id !== notifId && t.notif?._id !== notifId && t.id !== notifId));
    try {
      if (!notif.isRead && notifId) {
        await api.put(`/notifications/${notifId}/read`);
        window.dispatchEvent(new Event('notifications-updated'));
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
    // Open drawer
    window.dispatchEvent(new CustomEvent('open-notification-drawer', { detail: { notif } }));
  };

  const handleDismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Poll for new notifications
  const checkForNewNotifications = useCallback(async () => {
    try {
      lastCheckTimeRef.current = Date.now();
      const res = await api.get('/notifications');
      const list = res?.notifications || res?.data?.notifications || (Array.isArray(res) ? res : []);
      if (!Array.isArray(list)) return;

      // On first run (when user logs in or loads the app):
      if (!hasInitialized.current) {
        list.forEach(n => {
          const id = n.id || n._id;
          if (id) knownNotificationIds.current.add(id);
        });
        hasInitialized.current = true;

        // Display any unread / unseen notifications that arrived while the user was offline/logged out
        const unseenNotifications = list.filter(n => !n.isRead);

        if (unseenNotifications.length > 0) {
          // Play notification sound & haptic vibration
          playNotificationSound();

          // Show up to 3 most recent unread notifications as side pop-up toasts
          const initialToasts = unseenNotifications.slice(0, 3).map((n, idx) => ({
            id: n.id || n._id || `login-unseen-${idx}-${Date.now()}`,
            notif: n,
            duration: 8000, // 8 seconds duration so user clearly sees them upon returning
            createdAt: Date.now()
          }));

          setToasts(initialToasts);
        }
        return;
      }

      // Check for incoming notifications that are new AND unread
      const incomingNew = [];
      list.forEach(n => {
        const id = n.id || n._id;
        if (id && !knownNotificationIds.current.has(id)) {
          knownNotificationIds.current.add(id);
          if (!n.isRead) {
            incomingNew.push(n);
          }
        }
      });

      if (incomingNew.length > 0) {
        // Play notification sound & haptic vibration
        playNotificationSound();

        // Add to toast stack (limit to max 3 concurrent visible toasts)
        setToasts(prev => {
          const newToasts = incomingNew.map(n => ({
            id: n.id || n._id || Math.random().toString(),
            notif: n,
            duration: 6500, // Show for 6.5 seconds
            createdAt: Date.now()
          }));
          return [...newToasts, ...prev].slice(0, 3);
        });

        // Trigger updates in Navbar and active page
        window.dispatchEvent(new Event('notifications-updated'));
        window.dispatchEvent(new Event('transaction-updated'));
      }
    } catch (err) {
      // ignore background poll error
    }
  }, []);

  useEffect(() => {
    // Initial fetch to load unseen notifications and prime known IDs
    checkForNewNotifications();

    // Establish real-time Server-Sent Events (SSE) stream
    const token = localStorage.getItem('money_tracker_token');
    let eventSource = null;

    if (token) {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const cleanBase = apiBase.replace(/\/+$/, '');
      const streamUrl = `${cleanBase}/notifications/stream?token=${encodeURIComponent(token)}`;

      try {
        eventSource = new EventSource(streamUrl);

        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);

            if (payload.type === 'NEW_NOTIFICATION' && payload.data) {
              const notif = payload.data;
              const notifId = notif.id || notif._id;

              if (notifId && !knownNotificationIds.current.has(notifId)) {
                knownNotificationIds.current.add(notifId);

                if (!notif.isRead) {
                  // Play chime sound & haptic vibration
                  playNotificationSound();

                  // Display instant floating toast
                  setToasts(prev => [
                    {
                      id: notifId,
                      notif,
                      duration: 6500,
                      createdAt: Date.now()
                    },
                    ...prev
                  ].slice(0, 3));

                  // Instantly update badge count in Navbar and refresh active transactions
                  window.dispatchEvent(new Event('notifications-updated'));
                  window.dispatchEvent(new Event('transaction-updated'));
                }
              }
            } else if (
              payload.type === 'NOTIFICATION_READ' ||
              payload.type === 'NOTIFICATIONS_ALL_READ' ||
              payload.type === 'NOTIFICATIONS_CLEARED' ||
              payload.type === 'NOTIFICATION_DELETED'
            ) {
              // Sync multi-tab state instantly
              window.dispatchEvent(new Event('notifications-updated'));
            }
          } catch (err) {
            // Heartbeat / ping or non-JSON event (e.g. comment)
          }
        };

        eventSource.onopen = () => {
          // Immediately catch up on any notifications that arrived while disconnected
          checkForNewNotifications();
        };

        eventSource.onerror = () => {
          // Fall back to REST check while native EventSource reconnects in background
          checkForNewNotifications();
        };
      } catch (err) {
        console.warn('Failed to initialize SSE stream:', err);
      }
    }

    // High-responsiveness safety poll (every 12s) as backup if SSE disconnects or sleeps
    const fallbackInterval = setInterval(() => {
      if (!document.hidden && Date.now() - lastCheckTimeRef.current > 10000) {
        checkForNewNotifications();
      }
    }, 12000);

    // Sync immediately on tab re-focus or app resume (2s debounce)
    const handleEvents = () => {
      if (!document.hidden && Date.now() - lastCheckTimeRef.current > 2000) {
        checkForNewNotifications();
      }
    };

    // Custom event to manually display a test/system toast
    const handleCustomToast = (e) => {
      const notifData = e.detail;
      if (notifData) {
        playNotificationSound();
        setToasts(prev => [
          {
            id: notifData.id || `custom-${Date.now()}`,
            notif: notifData,
            duration: 6500,
            createdAt: Date.now()
          },
          ...prev
        ].slice(0, 3));
      }
    };

    window.addEventListener('focus', handleEvents);
    document.addEventListener('visibilitychange', handleEvents);
    window.addEventListener('show-notification-toast', handleCustomToast);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(fallbackInterval);
      window.removeEventListener('focus', handleEvents);
      document.removeEventListener('visibilitychange', handleEvents);
      window.removeEventListener('show-notification-toast', handleCustomToast);
    };
  }, [checkForNewNotifications]);

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-4 sm:top-20 right-3 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label="Incoming notifications"
    >
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={handleDismissToast}
          onOpen={handleOpenNotification}
        />
      ))}
    </div>
  );
}
