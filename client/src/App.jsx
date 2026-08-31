import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Friends from './pages/Friends';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Register from './pages/Register';
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
      // Reload current page data by dispatching custom event or state
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

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<AppLayout />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
