import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Friends from './pages/Friends';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import SharedLedger from './pages/SharedLedger';
import TransactionForm from './components/TransactionForm';
import api from './services/api';

function AppLayout() {
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
      setFriendsList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [addTxModalOpen]);

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
    setEditingFriend(friendObj);
    navigate('/friends');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar onOpenAddModal={() => handleOpenAddTx('')} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                onOpenAddTx={handleOpenAddTx} 
                onOpenAddFriend={() => handleOpenAddFriend(null)}
                onViewFriendHistory={handleViewFriendHistory}
              />
            } 
          />
          <Route 
            path="/friends" 
            element={
              <Friends 
                onOpenAddTx={handleOpenAddTx}
                editingFriend={editingFriend}
                onOpenAddFriend={handleOpenAddFriend}
                onCloseFriendModal={() => setEditingFriend(null)}
                historyFriendId={historyFriendId}
                onCloseHistory={() => setHistoryFriendId(null)}
              />
            } 
          />
          <Route 
            path="/transactions" 
            element={<Transactions onOpenAddTx={() => handleOpenAddTx('')} />} 
          />
          <Route 
            path="/analytics" 
            element={<Analytics />} 
          />
          <Route 
            path="/share" 
            element={<SharedLedger />} 
          />
          <Route 
            path="/share/:code" 
            element={<SharedLedger />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Add Transaction Modal */}
      <TransactionForm
        isOpen={addTxModalOpen}
        onClose={() => setAddTxModalOpen(false)}
        onSave={handleSaveTransaction}
        friends={friendsList}
        preselectedFriendId={preselectedFriendId}
      />
    </div>
  );
}

function MainRouter() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold text-xs">Loading MoneyTracker...</p>
        </div>
      </div>
    );
  }

  // 1. Authenticated User -> Render full AppLayout with Navbar & active route
  if (user) {
    return <AppLayout />;
  }

  // 2. Unauthenticated visitor accessing /share or /share/:code -> Render public SharedLedger
  if (location.pathname.startsWith('/share')) {
    return <SharedLedger />;
  }

  // 3. Otherwise redirect to login
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Dedicated Independent Admin Portal (Protected by Gmail & Passkey) */}
          <Route path="/admin" element={<Admin />} />
          
          {/* Universal Main Router for App & Public Share */}
          <Route path="/*" element={<MainRouter />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
