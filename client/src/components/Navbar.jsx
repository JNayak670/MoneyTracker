import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePinModal from './ChangePinModal';
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
  ChevronDown
} from 'lucide-react';

export default function Navbar({ onOpenAddModal }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);

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
    { name: 'Dashboard', path: '/', icon: Wallet },
    { name: 'Friends', path: '/friends', icon: Users },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Share Ledger', path: '/share', icon: Share2 },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Logo Branding */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-xl shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                💸
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                    MoneyTracker
                  </span>
                  <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    INR ₹
                  </span>
                </div>
                <p className="hidden sm:block text-[10px] text-slate-500 font-semibold leading-none mt-0.5">
                  Smart Expense & Debt Ledger
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-inner">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-white text-brand-700 shadow-xs border border-slate-200/90'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-md shadow-brand-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Record Expense</span>
              </button>

              {/* User Profile Dropdown Menu */}
              <div className="relative pl-2.5 border-l border-slate-200" ref={profileRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100/80 transition-colors"
                  title="Profile Menu"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xs shadow-xs border border-white">
                    {userInitial}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-black text-slate-800 leading-tight truncate max-w-[100px]">
                      {user?.name || 'Account'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold leading-none">
                      Settings & PIN
                    </div>
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
            </div>

            {/* Mobile menu & Quick Action toggle */}
            <div className="sm:hidden flex items-center gap-2">
              <button
                onClick={onOpenAddModal}
                className="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-xl text-xs font-bold shadow-xs"
                title="Add Transaction"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
    </>
  );
}


