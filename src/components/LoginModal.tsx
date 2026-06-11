'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Database, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/app/providers';

export function LoginModal() {
  const { loginModalOpen, setLoginModalOpen, login, register, isMock } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLoginModalOpen(false);
      }
    };
    if (loginModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Reset state
      setError('');
      setEmail('');
      setPassword('');
      setUsername('');
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loginModalOpen, setLoginModalOpen]);

  // Close modal when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setLoginModalOpen(false);
    }
  };

  if (!loginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || (isSignUp && !username)) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await register(username, email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="login-modal-backdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
    >
      <div
        ref={modalRef}
        id="login-modal"
        className="w-full max-w-md glass-panel rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden relative transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95 duration-200 bg-white dark:bg-slate-950"
      >
        {/* Connection status header bar */}
        <div className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold ${isMock ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
          {isMock ? (
            <>
              <ShieldAlert size={12} />
              <span>Simulated Auth Mode (PocketBase offline)</span>
            </>
          ) : (
            <>
              <Database size={12} />
              <span>Live Auth Mode (Connected to PocketBase)</span>
            </>
          )}
        </div>

        {/* Close Button */}
        <button
          id="close-login-modal"
          onClick={() => setLoginModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {isSignUp ? 'Create an Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              {isSignUp 
                ? 'Sign up to keep track of your aggregate bookmarks' 
                : 'Sign in to access your coding bookmarks'}
            </p>
          </div>

          {error && (
            <div 
              id="login-error-alert"
              className="flex items-start gap-2.5 p-4 mb-6 rounded-xl border border-red-500/15 bg-red-500/5 text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Username
                </label>
                <input
                  id="signup-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="coder_pro"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                  required={isSignUp}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                required
              />
            </div>

            <button
              id="submit-auth-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none hover:shadow-lg hover:shadow-indigo-500/20 text-sm"
            >
              {submitting ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle Panel */}
          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button
              id="toggle-auth-mode"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
