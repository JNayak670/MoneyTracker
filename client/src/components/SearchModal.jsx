import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, User, ArrowRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useModalBackHandler from '../hooks/useModalBackHandler';

export default function SearchModal({ isOpen, onClose, onViewFriend, onOpenAddTx }) {
  useModalBackHandler(isOpen, onClose);

  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setFriends([]);
      setTransactions([]);
      return;
    }

    const loadInitial = async () => {
      try {
        setLoading(true);
        const [friendsRes, txRes] = await Promise.all([
          api.get('/friends'),
          api.get('/transactions?limit=20')
        ]);
        setFriends(friendsRes.data || []);
        setTransactions(txRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(query.toLowerCase()) ||
    (f.phone && f.phone.includes(query)) ||
    (f.relationshipTag && f.relationshipTag.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredTx = transactions.filter(t => 
    (t.note && t.note.toLowerCase().includes(query.toLowerCase())) ||
    (t.friend?.name && t.friend.name.toLowerCase().includes(query.toLowerCase())) ||
    (t.category && t.category.toLowerCase().includes(query.toLowerCase()))
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-8 sm:pt-20 px-3 sm:px-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends, notes, categories..."
            autoFocus
            className="w-full text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {/* Quick Share Code Banner */}
          <div 
            onClick={() => {
              onClose();
              navigate('/share');
            }}
            className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 hover:border-purple-300 transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center text-sm shadow-xs font-black">
                🔑
              </div>
              <div>
                <div className="text-xs font-black text-purple-950">Enter 6-Digit Share Code</div>
                <div className="text-[10px] text-purple-700 font-semibold">Inspect time-limited friend statement ledger</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-purple-600" />
          </div>

          {/* Friends Section */}
          <div>
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
              Friends ({filteredFriends.length})
            </div>
            {filteredFriends.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">No matching friends found.</p>
            ) : (
              <div className="space-y-1.5">
                {filteredFriends.slice(0, 5).map(f => (
                  <div
                    key={f.id}
                    onClick={() => {
                      onClose();
                      onViewFriend(f.id);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-xs"
                        style={{ backgroundColor: f.avatarColor || '#6366f1' }}
                      >
                        {f.avatarEmoji || '👤'}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">{f.name}</div>
                        <div className="text-[10px] text-slate-500">{f.relationshipTag || 'Friend'} • {f.phone || 'No phone'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-black ${
                        f.currentBalance > 0 ? 'text-emerald-600' : f.currentBalance < 0 ? 'text-rose-600' : 'text-slate-500'
                      }`}>
                        {f.currentBalance > 0 ? `+₹${f.currentBalance}` : f.currentBalance < 0 ? `-₹${Math.abs(f.currentBalance)}` : 'Settled'}
                      </div>
                      <div className="text-[9px] text-slate-400 font-semibold">
                        {f.currentBalance > 0 ? 'Owes you' : f.currentBalance < 0 ? 'You owe' : '₹0'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transactions Section */}
          <div>
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
              Transactions ({filteredTx.length})
            </div>
            {filteredTx.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">No matching transactions found.</p>
            ) : (
              <div className="space-y-1.5">
                {filteredTx.slice(0, 5).map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onClose();
                      navigate('/transactions');
                    }}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate max-w-[220px]">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 text-xs">
                        {t.type === 'GIVEN' ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownLeft className="w-4 h-4 text-rose-600" />}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-800 truncate">{t.note}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{t.date} • {t.friend?.name || 'Friend'}</div>
                      </div>
                    </div>
                    <div className={`text-xs font-black ${t.impactOnUser > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.impactOnUser > 0 ? '+' : '-'}₹{t.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
