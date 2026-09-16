import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePinModal from './ChangePinModal';
import SearchModal from './SearchModal';
import { 
  Users, 
  Receipt, 
  BarChart3, 
  PlusCircle, 
  LogOut, 
  Wallet, 
  Menu, 
  X, 
  Share2, 
  Sparkles,
  KeyRound,
  Shield,
  ChevronDown,
  Search
} from 'lucide-react';

export default function Navbar({ onOpenAddModal, onViewFriend }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: Wallet, activeBg: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30' },
    { name: 'Friends', path: '/friends', icon: Users, activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30' },
    { name: 'Transactions', path: '/transactions', icon: Receipt, activeBg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30' },
    { name: 'Analytics', path: '/analytics', icon: BarChart3, activeBg: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30' },
    { name: 'Share Ledger', path: '/share', icon: Share2, activeBg: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-500/30' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Logo Branding */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                🧭
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 bg-clip-text text-transparent">
                    MoneyTracker
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold leading-none mt-0.5">
                  Smart Peer Debt & Expense Circle
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-inner">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 ${
                      active
                        ? item.activeBg
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onOpenAddModal}
                className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Record Entry</span>
              </button>

              {/* User Profile Dropdown Menu */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100/80 transition-colors"
                  title="Profile Menu"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs border border-white">
                    {userInitial}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu Box */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fadeIn divide-y divide-slate-100">
                    <div className="px-4 py-2.5">
                      <p className="text-xs font-black text-slate-900 truncate">{user?.name || 'Demo Account'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        🇮🇳 Indian Rupee (₹)
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/share"
                        onClick={() => setProfileMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left"
                      >
                        <Share2 className="w-4 h-4 text-purple-500" />
                        <span>Inspect Share Code</span>
                      </Link>

                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setPinModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left"
                      >
                        <KeyRound className="w-4 h-4 text-indigo-500" />
                        <span>Change Security PIN</span>
                      </button>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Icon button */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                title="Search friends & transactions"
              >
                <Search className="w-5 h-5 text-slate-600" />
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden px-4 pt-2 pb-4 space-y-1.5 bg-white border-b border-slate-200 animate-fadeIn shadow-lg">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    active 
                      ? 'bg-brand-50 text-brand-700 border border-brand-200' 
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setPinModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50/60"
              >
                <KeyRound className="w-4 h-4" />
                <span>Change Security PIN</span>
              </button>
            </div>

            <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                  {userInitial}
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {user?.name || 'Demo Account'}
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-xs text-rose-600 font-bold hover:underline bg-rose-50 px-3 py-1.5 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Global Change PIN Modal */}
      <ChangePinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
      />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onViewFriend={(id) => {
          if (onViewFriend) onViewFriend(id);
        }}
        onOpenAddTx={onOpenAddModal}
      />
    </>
  );
}


