import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import FriendCard from '../components/FriendCard';
import SettleModal from '../components/SettleModal';
import WhatsAppModal from '../components/WhatsAppModal';
import ShareCodeModal from '../components/ShareCodeModal';
import LinkAccountModal from '../components/LinkAccountModal';
import SyncPermissionModal from '../components/SyncPermissionModal';
import ColorfulLoader from '../components/ColorfulLoader';
import useModalBackHandler from '../hooks/useModalBackHandler';
import { printFriendStatement } from '../services/exportService';
import SplitGroupModal from '../components/SplitGroupModal';
import { 
  Users, 
  Search, 
  PlusCircle, 
  X, 
  Printer, 
  CheckCircle2, 
  History, 
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
  Link2,
  AtSign,
  ShieldCheck,
  Zap,
  Clock,
  Loader2,
  AlertCircle,
  UserCheck,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function Friends({ onOpenAddTx, editingFriend, onOpenAddFriend, onCloseFriendModal, historyFriendId, onCloseHistory }) {
  const [friends, setFriends] = useState([]);
  const [selectedSplitGroupId, setSelectedSplitGroupId] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'OWES_YOU' | 'YOU_OWE' | 'SETTLED'
  const [loading, setLoading] = useState(true);

  // Sync Permission Modal State
  const [syncModal, setSyncModal] = useState({ open: false, friend: null });

  // Friend Detail / History Drawer State
  const [activeLedger, setActiveLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Add/Edit Friend Form Modal State
  const [friendModalOpen, setFriendModalOpen] = useState(false);
  const [currentEditingFriend, setCurrentEditingFriend] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    email: '',
    relationshipTag: 'Friend',
    avatarEmoji: '👤',
    avatarColor: '#6366f1',
    notes: ''
  });

  // User search verification state for Add Friend modal
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [userCheckResult, setUserCheckResult] = useState(null);

  // Action Modals
  const [settleModal, setSettleModal] = useState({ open: false, friendId: '', friendName: '', amount: 0 });
  const [whatsappModal, setWhatsappModal] = useState({ open: false, friendName: '', amount: 0, phone: '', type: 'OWED' });
  const [shareModal, setShareModal] = useState({ open: false, friendId: '', friendName: '' });
  const [linkModal, setLinkModal] = useState({ open: false, friend: null });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingActionLoading, setPendingActionLoading] = useState(null);

  const fetchFriends = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [res] = await Promise.all([
        api.get('/friends'),
        showLoading ? new Promise(resolve => setTimeout(resolve, 200)) : Promise.resolve()
      ]);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setFriends(Array.isArray(list) ? list : []);
      setPendingRequests(Array.isArray(res?.pendingRequests) ? res.pendingRequests : []);
    } catch (err) {
      console.error('Failed to load friends:', err);
      setFriends([]);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (friendId) => {
    setPendingActionLoading(friendId);
    try {
      await api.post(`/friends/${friendId}/confirm-connect`);
      await fetchFriends(false);
      window.dispatchEvent(new Event('transaction-updated'));
    } catch (err) {
      alert(`Failed to accept connection: ${err.message}`);
    } finally {
      setPendingActionLoading(null);
    }
  };

  const handleIgnoreRequest = async (friendId) => {
    setPendingActionLoading(friendId);
    try {
      await api.post(`/friends/${friendId}/ignore-connect`);
      await fetchFriends(false);
      window.dispatchEvent(new Event('transaction-updated'));
    } catch (err) {
      alert(`Failed to decline request: ${err.message}`);
    } finally {
      setPendingActionLoading(null);
    }
  };

  const handleCancelRequest = async (friendId) => {
    setPendingActionLoading(friendId);
    try {
      await api.post(`/friends/${friendId}/cancel-connect`);
      await fetchFriends(false);
      window.dispatchEvent(new Event('transaction-updated'));
    } catch (err) {
      alert(`Failed to cancel request: ${err.message}`);
    } finally {
      setPendingActionLoading(null);
    }
  };

  useEffect(() => {
    fetchFriends();

    const handleUpdate = () => {
      fetchFriends(false);
      if (activeLedger?.friend?.id) {
        loadFriendLedger(activeLedger.friend.id, false);
      }
    };

    window.addEventListener('transaction-updated', handleUpdate);
    return () => {
      window.removeEventListener('transaction-updated', handleUpdate);
    };
  }, [activeLedger?.friend?.id]);

  useEffect(() => {
    if (editingFriend) {
      if (editingFriend.isNew || !editingFriend.name) {
        handleOpenCreateModal();
      } else {
        handleOpenEditModal(editingFriend);
      }
    }
  }, [editingFriend]);

  // Load history if requested from parent
  useEffect(() => {
    if (historyFriendId) {
      loadFriendLedger(historyFriendId);
    }
  }, [historyFriendId]);

  const loadFriendLedger = async (id, showLoading = true) => {
    try {
      if (showLoading) setLedgerLoading(true);
      const res = await api.get(`/friends/${id}`);
      const data = res?.friend !== undefined || res?.transactions !== undefined ? res : (res?.data || res);
      setActiveLedger(data);
    } catch (err) {
      alert(`Failed to load history: ${err.message}`);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleCheckMoneyTrackerUser = async (rawVal) => {
    const input = (rawVal !== undefined ? rawVal : formData.username || '').trim();
    if (!input) {
      setUserCheckResult({ isEmpty: true });
      return;
    }
    setUsernameChecking(true);
    try {
      const res = await api.get(`/friends/search-user?username=${encodeURIComponent(input)}`);
      const data = res?.exists !== undefined ? res : (res?.data || res);
      setUserCheckResult(data);
      if (data?.exists && data?.user?.name) {
        // Automatically populate Full Name field with user's original name!
        setFormData(prev => ({ 
          ...prev, 
          name: data.user.name,
          username: data.user.username || input.replace(/^@/, '')
        }));
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'No registered MoneyTracker user found with this username.';
      setUserCheckResult({ exists: false, message: errorMsg, error: errorMsg });
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleOpenCreateModal = () => {
    setCurrentEditingFriend(null);
    setUserCheckResult(null);
    setUsernameChecking(false);
    setFormData({
      name: '',
      username: '',
      phone: '',
      email: '',
      relationshipTag: 'Friend',
      avatarEmoji: '👤',
      avatarColor: '#6366f1',
      notes: ''
    });
    setFriendModalOpen(true);
  };

  const handleOpenEditModal = (friend) => {
    setCurrentEditingFriend(friend);
    setUserCheckResult(null);
    setUsernameChecking(false);
    setFormData({
      name: friend.name || '',
      username: friend.pendingUsername || friend.connectedUser?.username || '',
      phone: friend.phone || '',
      email: friend.email || '',
      relationshipTag: friend.relationshipTag || 'Friend',
      avatarEmoji: friend.avatarEmoji || '👤',
      avatarColor: friend.avatarColor || '#6366f1',
      notes: friend.notes || ''
    });
    setFriendModalOpen(true);
  };

  const handleTogglePermission = (friend) => {
    setSyncModal({ open: true, friend });
  };

  const handleConfirmPermissionChange = async (friend, targetPerm) => {
    try {
      await api.put(`/friends/${friend.id}/permission`, { permission: targetPerm });
      await fetchFriends(false);
      if (activeLedger?.friend?.id === friend.id) {
        await loadFriendLedger(friend.id, false);
      }
      window.dispatchEvent(new Event('transaction-updated'));
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to update permission');
      throw err;
    }
  };

  const handleCloseFriendModal = () => {
    setFriendModalOpen(false);
    setCurrentEditingFriend(null);
    setUserCheckResult(null);
    setUsernameChecking(false);
    onCloseFriendModal?.();
  };

  // Close active history ledger drawer on mobile Back button
  useModalBackHandler(Boolean(activeLedger), () => {
    setActiveLedger(null);
    onCloseHistory?.();
  });

  // Close Add/Edit friend modal on mobile Back button
  useModalBackHandler(friendModalOpen, handleCloseFriendModal);

  const handleSaveFriend = async (e) => {
    e.preventDefault();
    
    // Check if a username is entered
    const rawUsername = (formData.username || '').trim();
    if (rawUsername) {
      const cleanInput = rawUsername.replace(/^@/, '').toLowerCase();
      // Check if already verified as existing
      const isAlreadyVerified = userCheckResult?.exists && 
        (userCheckResult?.user?.username?.toLowerCase() === cleanInput || userCheckResult?.user?.email?.toLowerCase() === rawUsername.toLowerCase() || userCheckResult?.user?.id === rawUsername);

      if (!isAlreadyVerified) {
        // Run verification check before saving
        setUsernameChecking(true);
        try {
          const res = await api.get(`/friends/search-user?username=${encodeURIComponent(rawUsername)}`);
          const data = res?.exists !== undefined ? res : (res?.data || res);
          setUserCheckResult(data);

          if (!data?.exists || !data?.user) {
            alert(`⚠️ No MoneyTracker user found for "${rawUsername}".\n\nPlease enter a valid username/email, or clear the username field to save as an offline friend.`);
            setUsernameChecking(false);
            return;
          }

          // Update name if empty
          if (data.user.name && !formData.name.trim()) {
            formData.name = data.user.name;
          }
        } catch (err) {
          const errorMsg = err.response?.data?.error || err.message || `No user found for "${rawUsername}"`;
          setUserCheckResult({ exists: false, message: errorMsg, error: errorMsg });
          alert(`⚠️ ${errorMsg}\n\nPlease enter a valid username/email, or clear the username field to save as an offline friend.`);
          setUsernameChecking(false);
          return;
        } finally {
          setUsernameChecking(false);
        }
      }
    }

    try {
      const editId = currentEditingFriend?.id || currentEditingFriend?._id || editingFriend?.id || editingFriend?._id;
      if (editId) {
        await api.put(`/friends/${editId}`, formData);
      } else {
        const res = await api.post('/friends', formData);
        const data = res?.data !== undefined ? res.data : res;
        if (data?.matchedUser) {
          alert(`🎉 Friend added! Account @${data.matchedUser.username} was found and a connection request has been sent to them.`);
        }
      }
      handleCloseFriendModal();
      await fetchFriends();
      window.dispatchEvent(new Event('transaction-updated'));
    } catch (err) {
      alert(`Save friend error: ${err.message}`);
    }
  };

  const handleDeleteFriend = async (id) => {
    if (!confirm('Are you sure you want to delete this friend? All transaction logs will be removed.')) return;
    try {
      await api.delete(`/friends/${id}`);
      if (activeLedger?.friend?.id === id) setActiveLedger(null);
      await fetchFriends();
      window.dispatchEvent(new Event('transaction-updated'));
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleSettleSubmit = async (payload) => {
    try {
      await api.post('/transactions/settle', payload);
      setSettleModal({ open: false, friendId: '', friendName: '', amount: 0 });
      await fetchFriends();
      if (activeLedger) {
        await loadFriendLedger(payload.friendId);
      }
      window.dispatchEvent(new Event('transaction-updated'));
    } catch (err) {
      alert(`Settlement error: ${err.message}`);
    }
  };

  const filteredFriends = (friends || []).filter(f => {
    if (filter === 'OWES_YOU' && f.currentBalance <= 0) return false;
    if (filter === 'YOU_OWE' && f.currentBalance >= 0) return false;
    if (filter === 'SETTLED' && f.currentBalance !== 0) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        f.name?.toLowerCase().includes(q) ||
        (f.relationshipTag && f.relationshipTag.toLowerCase().includes(q)) ||
        (f.phone && f.phone.includes(q))
      );
    }
    return true;
  });

  if (loading) {
    return <ColorfulLoader fullScreen={false} minHeight="min-h-[260px] sm:min-h-[400px]" message="Loading Friends Circle..." submessage="Fetching contacts, individual ledgers and shared dues..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Friends Circle
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage peer debts, view individual running ledgers & send WhatsApp reminders
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => onOpenAddTx('', 'split')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            title="Split group bill among friends"
          >
            <Users className="w-4 h-4" />
            <span>Split Bill</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Friend</span>
          </button>
        </div>
      </div>

      {/* Pending Connection Requests Banner */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3 bg-gradient-to-r from-purple-50/90 via-indigo-50/60 to-pink-50/90 border border-purple-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs sm:text-sm font-black text-purple-950 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-purple-600 animate-ping" />
              <span>Pending Connection Requests ({pendingRequests.length})</span>
            </h3>
            <span className="text-[11px] text-purple-700 font-bold bg-white/90 px-2.5 py-0.5 rounded-full border border-purple-200">
              Manage connection requests · Pending friends remain active in your circle
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingRequests.map(req => {
              const isIncoming = req.connectionStatus === 'REQUEST_RECEIVED' || req.connectionStatus === 'PENDING_MATCH';
              const isOutgoing = req.connectionStatus === 'REQUEST_SENT';
              const isLoading = pendingActionLoading === req.id;

              return (
                <div key={req.id} className="bg-white rounded-2xl p-3 sm:p-4 border border-purple-100 shadow-2xs flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-2xs flex-shrink-0"
                        style={{ backgroundColor: req.avatarColor || '#6366f1' }}
                      >
                        {req.avatarEmoji || '👤'}
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                          {req.name}
                        </div>
                        <div className="text-[11px] text-purple-700 font-mono font-bold mt-0.5">
                          @{req.connectedUser?.username || req.pendingUsername || 'user'}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isIncoming ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isIncoming ? 'Incoming' : 'Request Sent'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isIncoming ? 'Wants to connect with you' : 'Waiting for user to accept'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isIncoming ? (
                        <>
                          <button
                            onClick={() => handleIgnoreRequest(req.id)}
                            disabled={isLoading}
                            className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            disabled={isLoading}
                            className="px-3.5 py-1 rounded-xl text-[11px] font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-2xs transition-all flex items-center gap-1"
                          >
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                            <span>Accept</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          disabled={isLoading}
                          className="px-3 py-1 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                        >
                          {isLoading ? 'Cancelling...' : 'Cancel Request'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friend by name, tag, phone number..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'OWES_YOU', label: 'Owes You ↗️' },
            { id: 'YOU_OWE', label: 'You Owe ↙️' },
            { id: 'SETTLED', label: 'Settled ✅' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filter === btn.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Friends Cards Grid */}
      {friends.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 shadow-sm">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-indigo-500/25">
            👥
          </div>
          <h3 className="font-black text-xl text-slate-900">Your Friends Circle is Empty</h3>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto font-medium leading-relaxed">
            Add friends, flatmates, travel buddies, or colleagues to keep tabs on who paid what and settle up seamlessly.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white text-xs font-black px-6 py-3 rounded-xl shadow-md shadow-indigo-500/20 hover:scale-105 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Your First Friend</span>
          </button>
        </div>
      ) : filteredFriends.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border-dashed">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-900">No Friends Match Filters</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No contacts match the filter criteria. Try adjusting your search query or filter tags.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFriends.map(friend => (
            <FriendCard
              key={friend.id}
              friend={friend}
              onAddTx={(id) => onOpenAddTx(id)}
              onViewHistory={(id) => loadFriendLedger(id)}
              onSettle={(id, amt, name) => setSettleModal({ open: true, friendId: id, friendName: name, amount: amt })}
              onRemind={(id, amt, name, phone, type = 'OWED') => setWhatsappModal({ open: true, friendName: name, amount: amt, phone, type })}
              onShareCode={(id, name) => setShareModal({ open: true, friendId: id, friendName: name })}
              onEdit={(f) => handleOpenEditModal(f)}
              onDelete={handleDeleteFriend}
              onLinkAccount={(f) => setLinkModal({ open: true, friend: f })}
              onTogglePermission={handleTogglePermission}
            />
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FRIEND LEDGER HISTORY LOADING OVERLAY */}
      {/* ------------------------------------------------------------- */}
      {ledgerLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <ColorfulLoader fullScreen={false} message="Loading Friend Ledger..." submessage="Fetching transaction history and statements..." />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FRIEND LEDGER HISTORY MODAL DRAWER */}
      {/* ------------------------------------------------------------- */}
      {activeLedger && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] m-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between gap-2.5 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/90 flex-shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
                <div 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-xs border border-slate-200 flex-shrink-0"
                  style={{ backgroundColor: activeLedger.friend.avatarColor || '#6366f1' }}
                >
                  {activeLedger.friend.avatarEmoji || '👤'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-lg font-extrabold text-slate-900 truncate max-w-[120px] xs:max-w-[200px] sm:max-w-[260px]">{activeLedger.friend.name}</h2>
                    {activeLedger.friend.connectionStatus === 'CONNECTED' && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* You Setting (Clickable / Changeable) */}
                        <button
                          onClick={() => handleTogglePermission(activeLedger.friend)}
                          title={`Your sync mode: ${activeLedger.friend.permission === 'AUTHORIZED' ? 'Instant Sync' : 'Approval Mode'} (Click to change)`}
                          className={`group text-[10px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1 border transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.03] active:scale-95 ${
                            activeLedger.friend.permission === 'AUTHORIZED'
                              ? 'bg-amber-100/90 text-amber-950 border-amber-300 hover:bg-amber-200 hover:border-amber-400'
                              : 'bg-indigo-50 text-indigo-950 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300'
                          }`}
                        >
                          <span className="text-slate-500 font-bold">You:</span>
                          {activeLedger.friend.permission === 'AUTHORIZED' ? (
                            <Zap className="w-3 h-3 text-amber-600 fill-amber-500 flex-shrink-0" />
                          ) : (
                            <Clock className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                          )}
                          <span>{activeLedger.friend.permission === 'AUTHORIZED' ? 'Instant' : 'Approval'}</span>
                          <span className={`inline-flex items-center gap-0.5 text-[8.5px] font-bold px-1 py-0.2 rounded border transition-all ${
                            activeLedger.friend.permission === 'AUTHORIZED'
                              ? 'bg-amber-200/90 text-amber-900 border-amber-300/80 group-hover:bg-amber-300'
                              : 'bg-indigo-100 text-indigo-800 border-indigo-200 group-hover:bg-indigo-200'
                          }`}>
                            <span>Change</span>
                            <ChevronDown className="w-2.5 h-2.5 text-current group-hover:translate-y-0.5 transition-transform" />
                          </span>
                        </button>

                        {/* Friend's Setting (Read-Only) */}
                        <span
                          title={`@${activeLedger.friend.connectedUser?.username || activeLedger.friend.pendingUsername || activeLedger.friend.name} set sync with you to ${activeLedger.friend.friendPermission === 'AUTHORIZED' ? 'Authorized (Instant)' : 'Normal (Approval)'} (managed by them)`}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 border shadow-2xs select-none ${
                            activeLedger.friend.friendPermission === 'AUTHORIZED'
                              ? 'bg-emerald-100/90 text-emerald-900 border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <span className="text-slate-500 font-bold">@{activeLedger.friend.connectedUser?.username || activeLedger.friend.pendingUsername || 'Friend'}:</span>
                          {activeLedger.friend.friendPermission === 'AUTHORIZED' ? <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500" /> : <Clock className="w-3 h-3 text-slate-500" />}
                          <span>{activeLedger.friend.friendPermission === 'AUTHORIZED' ? 'Instant' : 'Approval'}</span>
                        </span>
                      </div>
                    )}
                    {activeLedger.friend.connectionStatus === 'REQUEST_SENT' && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 border border-amber-300 bg-amber-100/90 text-amber-950 shadow-2xs select-none">
                        <Clock className="w-3 h-3 text-amber-600 flex-shrink-0" />
                        <span>Request Sent: @{activeLedger.friend.connectedUser?.username || activeLedger.friend.pendingUsername || 'friend'} (Pending)</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-500">{activeLedger.friend.relationshipTag || 'Friend'}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setShareModal({ open: true, friendId: activeLedger.friend.id, friendName: activeLedger.friend.name })}
                  className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors"
                  title="Generate Share Code"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Share Code</span>
                </button>
                <button
                  onClick={() => printFriendStatement(activeLedger)}
                  className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Print Formal Ledger Statement"
                >
                  <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveLedger(null);
                    onCloseHistory?.();
                  }}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
                  aria-label="Close"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Balance Status Banner */}
            <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
              <div className={`rounded-2xl p-3.5 sm:p-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 border ${
                activeLedger.currentBalance > 0
                  ? 'bg-emerald-50 border-emerald-200'
                  : activeLedger.currentBalance < 0
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-[10px] sm:text-xs uppercase font-extrabold text-slate-500 tracking-wider">
                    Current Running Balance
                  </span>
                  <div className={`text-lg sm:text-2xl font-black mt-0.5 ${
                    activeLedger.currentBalance > 0
                      ? 'text-emerald-800'
                      : activeLedger.currentBalance < 0
                      ? 'text-rose-800'
                      : 'text-slate-800'
                  }`}>
                    {activeLedger.currentBalance > 0 && `Friend Owes You ₹${activeLedger.currentBalance.toLocaleString()}`}
                    {activeLedger.currentBalance < 0 && `You Owe Friend ₹${Math.abs(activeLedger.currentBalance).toLocaleString()}`}
                    {activeLedger.currentBalance === 0 && 'All Dues Settled (₹0)'}
                  </div>
                </div>

                <div className="flex gap-2 w-full xs:w-auto">
                  {activeLedger.currentBalance !== 0 && (
                    <button
                      onClick={() => setSettleModal({ open: true, friendId: activeLedger.friend.id, friendName: activeLedger.friend.name, amount: Math.abs(activeLedger.currentBalance) })}
                      className="flex-1 xs:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Settle Up</span>
                    </button>
                  )}
                  <button
                    onClick={() => setWhatsappModal({ 
                      open: true, 
                      friendName: activeLedger.friend.name, 
                      amount: Math.abs(activeLedger.currentBalance || 0), 
                      phone: activeLedger.friend.phone,
                      type: (activeLedger.currentBalance || 0) > 0 ? 'OWED' : (activeLedger.currentBalance || 0) < 0 ? 'YOU_OWE' : 'SETTLED'
                    })}
                    className="flex-1 xs:flex-initial bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 border border-emerald-300 active:scale-[0.98] transition-all"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>{activeLedger.currentBalance > 0 ? 'Remind' : 'WhatsApp'}</span>
                  </button>
                </div>
              </div>

              {/* Chronological Timeline */}
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2.5 sm:mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-600" />
                  <span>Ledger Progression & History ({activeLedger.transactions.length})</span>
                </h3>

                {activeLedger.transactions.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-500 font-medium">No transactions recorded yet.</p>
                ) : (
                  <div className="space-y-2 sm:space-y-2.5">
                    {activeLedger.transactions.map((t) => {
                      const isGiven = t.type === 'GIVEN' || t.impactOnUser > 0;
                      return (
                        <div key={t.id} className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all flex items-center justify-between gap-2">
                          <div className="space-y-0.5 sm:space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900">{t.note}</span>
                              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200/60">
                                {t.category}
                              </span>
                              {t.splitGroupId && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSplitGroupId(t.splitGroupId)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
                                  title="View Group Split Bill Details"
                                >
                                  <Users className="w-3 h-3 text-indigo-600" />
                                  <span>Group Split</span>
                                </button>
                              )}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
                              📅 {t.date} {t.time || ''} • via {t.paymentMethod || 'UPI'}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className={`text-xs sm:text-sm font-extrabold ${isGiven ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {isGiven ? '+' : '-'}₹{t.amount.toLocaleString()}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-slate-500 font-semibold mt-0.5 font-mono">
                              Bal: ₹{t.runningBalance.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD / EDIT FRIEND MODAL */}
      {/* ------------------------------------------------------------- */}
      {friendModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] m-auto">
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/90 flex-shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate min-w-0 flex-1">
                {(currentEditingFriend?.id || editingFriend?.id) ? 'Edit Friend Details' : 'Add Friend to Circle'}
              </h2>
              <button
                type="button"
                onClick={handleCloseFriendModal}
                className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 active:text-slate-900 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors flex-shrink-0 ml-auto"
                aria-label="Close"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFriend} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>MoneyTracker @Username or User ID (Optional)</span>
                  <span className="text-[10px] text-purple-600 font-semibold">For account linking</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <AtSign className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\s+/g, '').toLowerCase();
                        setFormData({ ...formData, username: val });
                        setUserCheckResult(null);
                      }}
                      placeholder="e.g. amit456 (Leave blank if offline friend)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-bold focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCheckMoneyTrackerUser(formData.username)}
                    disabled={usernameChecking || !formData.username.trim()}
                    className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center gap-1.5 transition-all disabled:opacity-50 flex-shrink-0 shadow-xs"
                  >
                    {usernameChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Check</span>
                  </button>
                </div>

                {/* Helper hint if blank */}
                {!formData.username.trim() && !userCheckResult && (
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <span>💡</span>
                    <span>If you don't know their username, leave this blank to save as a standard offline friend.</span>
                  </p>
                )}

                {/* Verification result card */}
                {userCheckResult && (
                  <div className="mt-2.5 animate-fadeIn">
                    {userCheckResult.exists ? (
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-black text-emerald-900">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>User Found: {userCheckResult.user.name}</span>
                          </div>
                          <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md font-extrabold">
                            @{userCheckResult.user.username}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          ✓ Full name set to <strong>{userCheckResult.user.name}</strong>. A connection request will be sent when you click Save Friend.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-xs space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-1.5 font-black text-rose-900">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>{userCheckResult.error || `No user found for "${formData.username}"`}</span>
                        </div>
                        <p className="text-[11px] text-rose-700">
                          Enter a valid MoneyTracker username, or clear it to save as an offline friend.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, username: '' }));
                            setUserCheckResult(null);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-200/70 hover:bg-rose-200 px-2.5 py-1 rounded-lg transition-colors mt-1"
                        >
                          <span>✕ Clear username (Save as offline friend)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tag / Group
                  </label>
                  <select
                    value={formData.relationshipTag}
                    onChange={(e) => setFormData({ ...formData, relationshipTag: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="Roommate">Roommate 🏠</option>
                    <option value="College Friend">College Friend 🎓</option>
                    <option value="Colleague">Colleague 💼</option>
                    <option value="Trip Buddy">Trip Buddy ✈️</option>
                    <option value="Family">Family 👨‍👩‍👧</option>
                    <option value="Friend">Friend 👤</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Avatar Emoji
                  </label>
                  <input
                    type="text"
                    value={formData.avatarEmoji}
                    onChange={(e) => setFormData({ ...formData, avatarEmoji: e.target.value })}
                    placeholder="🍕, 🚗, ☕, 😎"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-center text-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Badge Color
                  </label>
                  <input
                    type="color"
                    value={formData.avatarColor}
                    onChange={(e) => setFormData({ ...formData, avatarColor: e.target.value })}
                    className="w-full h-9 sm:h-10 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Flat 402, Goa trip group"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2 pt-2 sm:pt-3 border-t border-slate-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCloseFriendModal}
                  className="flex-1 xs:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 xs:flex-initial bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 sm:py-3 rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-center"
                >
                  Save Friend
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Settle Modal */}
      <SettleModal
        isOpen={settleModal.open}
        onClose={() => setSettleModal({ open: false, friendId: '', friendName: '', amount: 0 })}
        onSettle={handleSettleSubmit}
        friendId={settleModal.friendId}
        friendName={settleModal.friendName}
        initialAmount={settleModal.amount}
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={whatsappModal.open}
        onClose={() => setWhatsappModal({ open: false, friendName: '', amount: 0, phone: '', type: 'OWED' })}
        friendName={whatsappModal.friendName}
        amount={whatsappModal.amount}
        phone={whatsappModal.phone}
        type={whatsappModal.type}
      />

      {/* Share Code Modal */}
      <ShareCodeModal
        isOpen={shareModal.open}
        onClose={() => setShareModal({ open: false, friendId: '', friendName: '' })}
        friendId={shareModal.friendId}
        friendName={shareModal.friendName}
      />

      {/* Link Account Modal */}
      <LinkAccountModal
        isOpen={linkModal.open}
        onClose={() => setLinkModal({ open: false, friend: null })}
        friend={linkModal.friend}
        onUpdated={() => {
          fetchFriends(false);
          if (activeLedger) loadFriendLedger(activeLedger.friend.id, false);
          window.dispatchEvent(new Event('transaction-updated'));
        }}
      />


      {/* Sync Permission Modal */}
      <SyncPermissionModal
        isOpen={syncModal.open}
        friend={syncModal.friend}
        onClose={() => setSyncModal({ open: false, friend: null })}
        onConfirm={handleConfirmPermissionChange}
      />

      {/* Split Group Breakdown Modal */}
      <SplitGroupModal
        isOpen={Boolean(selectedSplitGroupId)}
        onClose={() => setSelectedSplitGroupId(null)}
        splitGroupId={selectedSplitGroupId}
        onSplitDeleted={() => {
          fetchFriends(false);
          if (activeLedger) loadFriendLedger(activeLedger.friend.id, false);
        }}
      />

    </div>
  );
}
