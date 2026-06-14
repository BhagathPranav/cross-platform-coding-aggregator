'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300"
    >
      <div
        ref={modalRef}
        id="login-modal"
        className="w-full max-w-md rounded-[2.5rem] overflow-hidden relative transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95 duration-200 bg-[#F8E9E2] shadow-xl border border-[#e8e2d8]"
      >
        {/* Close Button */}
        <button
          id="close-login-modal"
          onClick={() => setLoginModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-500 hover:text-[#111111] hover:bg-stone-200/50 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black tracking-tight text-[#111111]">
              {isSignUp ? 'Create an Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-stone-600 mt-2">
              {isSignUp 
                ? 'Sign up to keep track of your aggregate bookmarks' 
                : 'Sign in to access your coding bookmarks'}
            </p>
          </div>

          {error && (
            <div 
              id="login-error-alert"
              className="flex items-start gap-2.5 p-4 mb-6 rounded-2xl border border-red-500/15 bg-red-500/5 text-red-600 text-sm animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">
                  Username
                </label>
                <input
                  id="signup-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="coder_pro"
                  className="w-full px-4 py-3.5 rounded-2xl border border-[#e8e2d8] bg-white text-[#111111] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-sm"
                  required={isSignUp}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 rounded-2xl border border-[#e8e2d8] bg-white text-[#111111] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 rounded-2xl border border-[#e8e2d8] bg-white text-[#111111] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-sm"
                required
              />
            </div>

            <button
              id="submit-auth-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 mt-8 bg-[#111111] hover:bg-stone-900 text-white font-bold rounded-full transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none hover:shadow-md text-sm cursor-pointer shadow-sm"
            >
              {submitting ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle Panel */}
          <div className="mt-6 text-center text-sm">
            <span className="text-stone-600">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button
              id="toggle-auth-mode"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#EE4D2D] hover:text-[#d33a1c] font-bold hover:underline cursor-pointer"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
