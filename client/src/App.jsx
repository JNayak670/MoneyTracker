import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Friends from './pages/Friends';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import SharedLedger from './pages/SharedLedger';
import TransactionForm from './components/TransactionForm';
import NotificationToastContainer from './components/NotificationToastContainer';
import ColorfulLoader from './components/ColorfulLoader';
import api from './services/api';

function AppLayout({ children, onOpenAddTx, onViewFriendHistory }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 sm:pb-8">
      <Navbar 
        onOpenAddModal={() => onOpenAddTx('')} 
        onViewFriend={onViewFriendHistory}
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
}

function MainApp() {
  const { user, loading } = useAuth();
  const [addTxModalOpen, setAddTxModalOpen] = useState(false);
  const [preselectedFriendId, setPreselectedFriendId] = useState('');
  const [friendsList, setFriendsList] = useState([]);
  
  // Navigation state helpers for friends page
  const [editingFriend, setEditingFriend] = useState(null);
  const [historyFriendId, setHistoryFriendId] = useState(null);

  const navigate = useNavigate();

  const fetchFriends = async () => {
    try {
      const res = await api.get('/friends');
      const list = Array.isArray(res) ? res : (res?.data || []);
      setFriendsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load friends in App:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user, addTxModalOpen]);

  // Automatic live refresh:
  // 1. Silent periodic background poll every 4 seconds when tab is active
  // 2. Immediate auto-refresh when switching back to tab or focusing window
  useEffect(() => {
    if (!user) return;

    const triggerRefresh = () => {
      if (!document.hidden) {
        fetchFriends();
        window.dispatchEvent(new Event('transaction-updated'));
      }
    };

    // Auto-refresh interval (every 4 seconds)
    const interval = setInterval(triggerRefresh, 4000);

    // Auto-refresh when user focuses window or returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        triggerRefresh();
      }
    };

    window.addEventListener('focus', triggerRefresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', triggerRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const handleOpenAddTx = (friendId = '') => {
    setPreselectedFriendId(friendId);
    setAddTxModalOpen(true);
  };

  const handleSaveTransaction = async (payload) => {
    try {
      await api.post('/transactions', payload);
      setAddTxModalOpen(false);
      await fetchFriends();
      window.dispatchEvent(new Event('transaction-updated'));
    } catch (err) {
      alert(`Save error: ${err.message}`);
    }
  };

  const handleViewFriendHistory = (id) => {
    setHistoryFriendId(id);
    navigate('/friends');
  };

  const handleOpenAddFriend = (friendObj = null) => {
    setEditingFriend(friendObj || { isNew: true });
    navigate('/friends');
  };

  if (loading) {
    return <ColorfulLoader fullScreen={true} message="Initializing MoneyTracker..." submessage="Restoring session & securing ledger connections..." />;
  }

  return (
    <>
      <Routes>
        {/* Public Landing or Dashboard based on Auth */}
        <Route 
          path="/" 
          element={
            user ? (
              <AppLayout onOpenAddTx={handleOpenAddTx} onViewFriendHistory={handleViewFriendHistory}>
                <Dashboard 
                  onOpenAddTx={handleOpenAddTx} 
                  onOpenAddFriend={() => handleOpenAddFriend(null)}
                  onViewFriendHistory={handleViewFriendHistory}
                />
              </AppLayout>
            ) : (
              <Landing />
            )
          } 
        />

        {/* Friends Route */}
        <Route 
          path="/friends" 
          element={
            user ? (
              <AppLayout onOpenAddTx={handleOpenAddTx} onViewFriendHistory={handleViewFriendHistory}>
                <Friends 
                  onOpenAddTx={handleOpenAddTx}
                  editingFriend={editingFriend}
                  onOpenAddFriend={handleOpenAddFriend}
                  onCloseFriendModal={() => setEditingFriend(null)}
                  historyFriendId={historyFriendId}
                  onCloseHistory={() => setHistoryFriendId(null)}
                />
              </AppLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Transactions Route */}
        <Route 
          path="/transactions" 
          element={
            user ? (
              <AppLayout onOpenAddTx={handleOpenAddTx} onViewFriendHistory={handleViewFriendHistory}>
                <Transactions onOpenAddTx={() => handleOpenAddTx('')} />
              </AppLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Analytics Route */}
        <Route 
          path="/analytics" 
          element={
            user ? (
              <AppLayout onOpenAddTx={handleOpenAddTx} onViewFriendHistory={handleViewFriendHistory}>
                <Analytics />
              </AppLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Public Share Statement Routes */}
        <Route path="/share" element={<SharedLedger />} />
        <Route path="/share/:code" element={<SharedLedger />} />

        {/* Auth Routes */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

        {/* Dedicated Independent Admin Portal (Protected by Gmail & Passkey) */}
        <Route path="/admin" element={<Admin />} />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Add Transaction Modal */}
      {user && (
        <TransactionForm
          isOpen={addTxModalOpen}
          onClose={() => setAddTxModalOpen(false)}
          onSave={handleSaveTransaction}
          friends={friendsList}
          preselectedFriendId={preselectedFriendId}
          onOpenAddFriend={() => {
            setAddTxModalOpen(false);
            handleOpenAddFriend(null);
          }}
        />
      )}

      {/* Floating Side Toast Notifications for Arriving Alerts */}
      {user && <NotificationToastContainer />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <MainApp />
      </Router>
    </AuthProvider>
  );
}
