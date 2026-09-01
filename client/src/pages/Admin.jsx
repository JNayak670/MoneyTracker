import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Receipt, 
  Share2, 
  Coins, 
  Trash2, 
  RefreshCw, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ArrowRight,
  Database,
  Lock,
  Unlock,
  Key,
  Mail,
  KeyRound,
  LogOut,
  Sparkles,
  Eye,
  EyeOff,
  Server,
  Activity,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';

const ADMIN_TOKEN_KEY = 'moneytracker_admin_token';
const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Admin() {
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem(ADMIN_TOKEN_KEY) || '');
  const [email, setEmail] = useState('');
  const [passkey, setPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [serverStatus, setServerStatus] = useState('checking');

  // Dashboard state
  const [activeTab, setActiveTab] = useState('users');
  const [adminEmail, setAdminEmail] = useState('admin@gmail.com');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState('');

  // Change Admin Password state
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdEmail, setPwdEmail] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Check health on login page
  useEffect(() => {
    if (!adminToken) {
      axios.get(`${API_URL}/health`)
        .then(() => setServerStatus('online'))
        .catch(() => setServerStatus('offline'));
    }
  }, [adminToken]);

  // Admin Axios instance
  const adminApi = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    }
  });

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await axios.post(`${API_URL}/admin/login`, {
        email,
        passkey
      });

      const token = res.data.data.token;
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
      setAdminToken(token);
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Invalid Admin Gmail or Master Passkey.');
    } finally {
      setLoginLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@gmail.com');
    setPasskey('admin1234');
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminToken('');
    setEmail('');
    setPasskey('');
    setStats(null);
    setUsers([]);
    setTransactions([]);
    setShares([]);
  };

  const fetchAllData = async () => {
    if (!adminToken) return;
    try {
      setLoading(true);
      const [statsRes, usersRes, txRes, sharesRes, profileRes] = await Promise.all([
        adminApi.get('/admin/stats'),
        adminApi.get('/admin/users'),
        adminApi.get('/admin/transactions'),
        adminApi.get('/admin/shares'),
        adminApi.get('/admin/profile').catch(() => ({ data: { data: { email: 'admin@gmail.com' } } }))
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
      setTransactions(txRes.data.data);
      setShares(sharesRes.data.data);
      if (profileRes?.data?.data?.email) {
        setAdminEmail(profileRes.data.data.email);
        setPwdEmail(profileRes.data.data.email);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAdminLogout();
        setLoginError('Admin session expired. Please authenticate again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchAllData();
    }
  }, [adminToken]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!pwdCurrent.trim()) {
      setPwdError('Please enter your current master passkey.');
      return;
    }

    if (!pwdNew.trim()) {
      setPwdError('Please enter a new master passkey.');
      return;
    }

    if (pwdNew.trim().length < 4) {
      setPwdError('New passkey must be at least 4 characters long.');
      return;
    }

    if (pwdNew.trim() !== pwdConfirm.trim()) {
      setPwdError('New passkey and confirmation do not match.');
      return;
    }

    try {
      setPwdLoading(true);
      const res = await adminApi.put('/admin/change-password', {
        currentPasskey: pwdCurrent.trim(),
        newPasskey: pwdNew.trim(),
        newEmail: pwdEmail.trim() || undefined
      });

      setPwdSuccess(res.data.message || 'Admin Passkey updated successfully!');
      if (res.data.data?.email) {
        setAdminEmail(res.data.data.email);
      }
      setPwdCurrent('');
      setPwdNew('');
      setPwdConfirm('');
      setTimeout(() => setPwdSuccess(''), 6000);
    } catch (err) {
      setPwdError(err.response?.data?.error || 'Failed to change admin passkey. Check current credentials.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleUnlockUser = async (userId, userName) => {
    try {
      setActionLoadingId(userId);
      const res = await adminApi.put(`/admin/users/${userId}/unlock`);
      setMessage(res.data.message || `User ${userName} unlocked.`);
      await fetchAllData();
      setTimeout(() => setMessage(''), 3500);
    } catch (err) {
      alert(`Unlock failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetPin = async (userId, userName) => {
    const newPin = window.prompt(`Enter new 4-6 digit numeric PIN for user "${userName}":`, '1234');
    if (!newPin) return;

    if (!/^\d{4,6}$/.test(newPin.trim())) {
      alert('PIN must be 4 to 6 numeric digits.');
      return;
    }

    try {
      setActionLoadingId(userId);
      const res = await adminApi.put(`/admin/users/${userId}/reset-pin`, {
        newPin: newPin.trim()
      });
      setMessage(res.data.message || `PIN reset to ${newPin} for ${userName}.`);
      await fetchAllData();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert(`PIN Reset failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`⚠️ DANGER: Are you sure you want to permanently delete user "${userName}" and ALL their friends, transactions, and share codes? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(userId);
      const res = await adminApi.delete(`/admin/users/${userId}`);
      setMessage(res.data.message || 'User deleted successfully.');
      await fetchAllData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRevokeShare = async (shareId, code) => {
    if (!window.confirm(`Revoke share code ${code} immediately? Friends with this link will no longer have access.`)) {
      return;
    }

    try {
      await adminApi.delete(`/admin/shares/${shareId}`);
      setMessage(`Share code ${code} revoked.`);
      await fetchAllData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(`Revoke failed: ${err.response?.data?.error || err.message}`);
    }
  };

  // Filtered lists
  const filteredUsers = (users || []).filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = (transactions || []).filter(t => 
    t.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.friendName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredShares = (shares || []).filter(s => 
    s.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.friendName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // =========================================================================
  // 1. DEDICATED FULL-SCREEN ADMIN LOGIN PANEL
  // =========================================================================
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white relative overflow-hidden">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Mini Header */}
        <div className="max-w-7xl w-full mx-auto px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-xs font-black tracking-wider uppercase text-slate-300">
              Security Core v2.4
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-slate-400 font-mono text-[11px]">
              API: {serverStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Center Login Box */}
        <div className="flex-1 flex items-center justify-center p-4 z-10">
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl w-full max-w-md p-8 shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-800 flex items-center justify-center mx-auto shadow-xl shadow-purple-600/30 border border-purple-400/40">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-white">Administrator Portal</h1>
              <p className="text-xs text-slate-400 font-medium">
                Restricted Master Access. Authenticate with Admin Gmail & Passkey.
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Gmail Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gmail.com"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    Master Passkey
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasskey(!showPasskey)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 font-semibold flex items-center gap-1"
                  >
                    {showPasskey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPasskey ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasskey ? 'text' : 'password'}
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Enter master passkey"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-mono tracking-wider transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black py-3 rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loginLoading ? 'Verifying Credentials...' : 'Authorize & Unlock Console'}</span>
              </button>
            </form>

            {/* Quick Demo Fill & Return Link */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="text-[11px] font-bold text-purple-400 hover:text-purple-300 hover:underline"
              >
                ⚡ Autofill Demo Credentials
              </button>
              
              <Link
                to="/"
                className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>User App</span>
              </Link>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="max-w-7xl w-full mx-auto px-6 py-4 text-center text-[11px] text-slate-600 font-mono z-10">
          MoneyTracker Platform Administration • Master Node
        </div>

      </div>
    );
  }

  // =========================================================================
  // 2. STANDALONE MASTER ADMIN DASHBOARD (ONCE AUTHENTICATED)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      
      {/* Dedicated Standalone Admin Top Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight text-white">
                    MoneyTracker
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Master Admin
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Core Supervision Node</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('security')}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
                title="Admin Security & Password Settings"
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                <span>{adminEmail || 'admin@gmail.com'}</span>
              </button>

              <button
                onClick={fetchAllData}
                disabled={loading}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={handleAdminLogout}
                className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                title="Lock Admin Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lock Console</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Global Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-purple-400 text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>Total Accounts</span>
              </span>
              <span className="text-[10px] bg-purple-500/10 px-2 py-0.5 rounded text-purple-300">Live</span>
            </div>
            <div className="text-3xl font-black text-white">{stats?.totalUsers || 0}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Active platform users</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <Coins className="w-4 h-4" />
                <span>Total Volume</span>
              </span>
              <span className="text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-300">INR</span>
            </div>
            <div className="text-3xl font-black text-white">₹{(stats?.totalVolume || 0).toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">All recorded transactions</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-blue-400 text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4" />
                <span>Total Ledger Txns</span>
              </span>
              <span className="text-[10px] bg-blue-500/10 px-2 py-0.5 rounded text-blue-300">{stats?.totalFriends || 0} Circles</span>
            </div>
            <div className="text-3xl font-black text-white">{stats?.totalTransactions || 0}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Cross-friend ledger records</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-amber-400 text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <Share2 className="w-4 h-4" />
                <span>Active Share Codes</span>
              </span>
              <span className="text-[10px] bg-amber-500/10 px-2 py-0.5 rounded text-amber-300">Live</span>
            </div>
            <div className="text-3xl font-black text-white">{stats?.activeShares || 0}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Time-limited statements</div>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Tabs & Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Accounts ({(users || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'transactions'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Global Transactions ({(transactions || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('shares')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'shares'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Codes ({(shares || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'security'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
          </div>

          {/* Search Input (Hidden on Security tab) */}
          {activeTab !== 'security' && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          )}
        </div>

        {/* Tab 1: User Accounts Table */}
        {activeTab === 'users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 border-b border-slate-700/80 text-slate-400 uppercase tracking-wider font-extrabold">
                  <tr>
                    <th className="px-5 py-4">User Details</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Status & Security</th>
                    <th className="px-5 py-4">Friends</th>
                    <th className="px-5 py-4">Transactions</th>
                    <th className="px-5 py-4">Joined Date</th>
                    <th className="px-5 py-4 text-right">Admin Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500 text-xs">
                        No users match your query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-4 font-black text-white">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-xs text-white ${
                              u.isLocked
                                ? 'bg-gradient-to-tr from-rose-600 to-amber-600 animate-pulse'
                                : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                            }`}>
                              {u.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div>{u.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">ID: {u.id?.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-300 font-medium">{u.email}</td>
                        <td className="px-5 py-4">
                          {u.isLocked ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 font-black text-[11px] border border-rose-500/30 animate-pulse">
                                <Lock className="w-3 h-3" />
                                <span>LOCKED (5 Failed)</span>
                              </span>
                              <div className="text-[10px] text-rose-400 font-mono mt-0.5">
                                {u.lockedAt ? new Date(u.lockedAt).toLocaleTimeString() : 'Auto-locked'}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 font-bold text-[11px] border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-300">{u.friendsCount} Friends</td>
                        <td className="px-5 py-4 font-bold text-slate-300">{u.txCount} Txns</td>
                        <td className="px-5 py-4 text-slate-500 font-mono">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {u.isLocked && (
                              <button
                                onClick={() => handleUnlockUser(u.id, u.name)}
                                disabled={actionLoadingId === u.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold transition-colors"
                                title="Unlock User Account"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Unlock</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleResetPin(u.id, u.name)}
                              disabled={actionLoadingId === u.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 text-xs font-bold transition-colors"
                              title="Reset Security PIN"
                            >
                              <Key className="w-3.5 h-3.5" />
                              <span>Reset PIN</span>
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              disabled={deletingId === u.id}
                              className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded-lg transition-colors"
                              title="Delete User & Data"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Global Transactions Feed */}
        {activeTab === 'transactions' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 border-b border-slate-700/80 text-slate-400 uppercase tracking-wider font-extrabold">
                  <tr>
                    <th className="px-5 py-4">Date & Time</th>
                    <th className="px-5 py-4">Account Owner</th>
                    <th className="px-5 py-4">Friend Contact</th>
                    <th className="px-5 py-4">Flow / Type</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500 text-xs">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => {
                      const isGiven = t.type === 'GIVEN';
                      const isSettled = t.type === 'SETTLED';

                      return (
                        <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-5 py-4 text-slate-400 font-mono font-medium">
                            <div>{t.date}</div>
                            <div className="text-[10px] text-slate-500">{t.time || ''}</div>
                          </td>
                          <td className="px-5 py-4 font-bold text-white">
                            <div>{t.userName}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{t.userEmail}</div>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span>{t.friendEmoji}</span>
                              <span>{t.friendName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[11px] border ${
                              isSettled
                                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                                : isGiven
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            }`}>
                              {isSettled ? '🤝 Settled' : isGiven ? '↗️ Lent' : '↙️ Borrowed'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-300 font-medium">{t.category}</td>
                          <td className="px-5 py-4 text-slate-400 font-medium max-w-xs truncate">{t.note || '-'}</td>
                          <td className={`px-5 py-4 text-right font-black text-sm ${
                            isSettled ? 'text-cyan-400' : isGiven ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isSettled ? '' : isGiven ? '+' : '-'}₹{t.amount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Share Codes Inspector */}
        {activeTab === 'shares' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 border-b border-slate-700/80 text-slate-400 uppercase tracking-wider font-extrabold">
                  <tr>
                    <th className="px-5 py-4">6-Digit Code</th>
                    <th className="px-5 py-4">Created By</th>
                    <th className="px-5 py-4">Shared Friend</th>
                    <th className="px-5 py-4">Duration</th>
                    <th className="px-5 py-4">Status & Expiration</th>
                    <th className="px-5 py-4">Public Link</th>
                    <th className="px-5 py-4 text-right">Revoke</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {filteredShares.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500 text-xs">
                        No share codes generated yet.
                      </td>
                    </tr>
                  ) : (
                    filteredShares.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-4 font-black font-mono text-base text-purple-400 tracking-wider">
                          {s.code}
                        </td>
                        <td className="px-5 py-4 font-bold text-white">{s.userName}</td>
                        <td className="px-5 py-4 font-bold text-slate-300">{s.friendName}</td>
                        <td className="px-5 py-4 text-slate-400 font-medium">{s.durationMinutes} mins</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                            s.isExpired
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{s.isExpired ? 'Expired' : 'Active Live'}</span>
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {new Date(s.expiresAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <a
                            href={`/share/${s.code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-bold hover:underline"
                          >
                            <span>/share/{s.code}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleRevokeShare(s.id, s.code)}
                            className="p-2 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded-lg transition-colors"
                            title="Revoke Share Code"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Admin Security & Password Settings */}
        {activeTab === 'security' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3.5 pb-6 border-b border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/25">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Change Master Admin Passkey</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Update your master access passkey and administrator contact credentials
                  </p>
                </div>
              </div>

              {pwdError && (
                <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{pwdError}</span>
                </div>
              )}

              {pwdSuccess && (
                <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                    Admin Gmail Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={pwdEmail}
                      onChange={(e) => setPwdEmail(e.target.value)}
                      placeholder="admin@gmail.com"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-medium"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Used for future administrator console sign-ins.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-300 uppercase tracking-wider">
                      Current Master Passkey
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 font-semibold flex items-center gap-1"
                    >
                      {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showCurrent ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={pwdCurrent}
                      onChange={(e) => setPwdCurrent(e.target.value)}
                      placeholder="Enter current passkey (e.g. admin1234)"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-mono tracking-wider"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-300 uppercase tracking-wider">
                      New Master Passkey
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 font-semibold flex items-center gap-1"
                    >
                      {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showNew ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={pwdNew}
                      onChange={(e) => setPwdNew(e.target.value)}
                      placeholder="Enter new passkey (min 4 characters)"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-mono tracking-wider"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm New Master Passkey
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={pwdConfirm}
                      onChange={(e) => setPwdConfirm(e.target.value)}
                      placeholder="Re-enter new passkey to confirm"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-mono tracking-wider"
                      required
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-black py-3 px-4 rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{pwdLoading ? 'Saving New Passkey...' : 'Update Admin Passkey'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
