import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  AtSign, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function EditUsernameModal({ isOpen, onClose }) {
  const { user, updateSettings } = useAuth();
  
  const [usernameInput, setUsernameInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState(null); // { available: boolean, message: string }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync current username on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const initial = user?.username || '';
      setUsernameInput(initial);
      setAvailability(null);
      setError('');
      setSuccess('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, user]);

  // Debounced username availability check
  useEffect(() => {
    const clean = usernameInput.replace(/^@/, '').toLowerCase().trim();
    
    if (!clean) {
      setAvailability(null);
      setChecking(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(clean)) {
      setAvailability({
        available: false,
        isFormatError: true,
        message: 'Must be 3-20 letters, numbers, or underscores.'
      });
      setChecking(false);
      return;
    }

    if (user?.username && clean === user.username.toLowerCase()) {
      setAvailability({
        available: true,
        isSame: true,
        message: 'This is currently your username.'
      });
      setChecking(false);
      return;
    }

    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-username?username=${clean}`);
        setAvailability({
          available: res.available,
          message: res.available ? `@${clean} is available!` : 'This username is already taken.'
        });
      } catch (err) {
        setAvailability({
          available: false,
          message: err.response?.data?.error || 'Could not verify username.'
        });
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [usernameInput, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const clean = usernameInput.replace(/^@/, '').toLowerCase().trim();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(clean)) {
      setError('Username must be 3 to 20 letters, numbers, or underscores.');
      return;
    }

    if (user?.username && clean === user.username.toLowerCase()) {
      onClose();
      return;
    }

    if (availability && !availability.available) {
      setError(availability.message || 'Please choose an available username.');
      return;
    }

    try {
      setSaving(true);
      await updateSettings({ username: clean });
      setSuccess(`Your username has been updated to @${clean}!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update username. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isButtonDisabled = 
    saving || 
    checking || 
    !usernameInput.trim() || 
    (availability && !availability.available) ||
    (user?.username && usernameInput.replace(/^@/, '').toLowerCase().trim() === user.username.toLowerCase());

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-inner">
              <AtSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {user?.username ? 'Change Your @Username' : 'Set Your @Username'}
              </h2>
              <p className="text-xs text-purple-100 font-medium">
                Your unique handle for instant friend connections & sync
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Alerts */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Choose Unique Handle
              </label>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-600 font-black text-base select-none">
                  @
                </span>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value.replace(/^@/, '').toLowerCase().trim());
                    setError('');
                  }}
                  placeholder="amit456"
                  maxLength={20}
                  className={`w-full bg-slate-50 border rounded-2xl pl-9 pr-10 py-3 text-sm text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    availability?.available && !availability?.isSame
                      ? 'border-emerald-400 focus:ring-emerald-400/20 bg-emerald-50/20'
                      : availability && !availability?.available
                      ? 'border-rose-400 focus:ring-rose-400/20 bg-rose-50/20'
                      : 'border-slate-200 focus:border-purple-600 focus:ring-purple-600/20'
                  }`}
                  autoFocus
                />

                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                  {checking && (
                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                  )}
                  {!checking && availability?.available && !availability?.isSame && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  {!checking && availability && !availability?.available && (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
              </div>

              {/* Status Message below input */}
              <div className="min-h-[20px] mt-1.5">
                {checking && (
                  <p className="text-[11px] text-purple-600 font-medium flex items-center gap-1">
                    <span>Checking availability...</span>
                  </p>
                )}
                {!checking && availability && (
                  <p className={`text-[11px] font-bold flex items-center gap-1 ${
                    availability.isSame 
                      ? 'text-slate-500' 
                      : availability.available 
                      ? 'text-emerald-600' 
                      : availability.isFormatError 
                      ? 'text-amber-600' 
                      : 'text-rose-600'
                  }`}>
                    <span>{availability.message}</span>
                  </p>
                )}
                {!checking && !availability && (
                  <p className="text-[11px] text-slate-400 font-medium">
                    3 to 20 letters, numbers, or underscores (e.g. rahul_89)
                  </p>
                )}
              </div>
            </div>

            {/* Quick helper tip */}
            <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-3 text-xs text-purple-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-purple-800">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Why do you need an @username?</span>
              </div>
              <p className="text-[11px] text-purple-700/90 leading-relaxed">
                Friends can find and connect with you using your @handle instead of sharing private email addresses.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isButtonDisabled}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-600/25 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save @Username</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
