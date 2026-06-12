'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { 
  Search, Moon, Sun, LogIn, LogOut, User, Bookmark, 
  Sparkles, Info, RefreshCw, SlidersHorizontal, ArrowRight, X 
} from 'lucide-react';
import { dbService, CodingProblem } from '@/lib/db';
import { useAuth } from '@/app/providers';
import { ResultsCard } from '@/components/ResultsCard';
import { LoginModal } from '@/components/LoginModal';
import { parseProblemUrl, findProblemBySlug, normalizeTitleToSlug } from '@/lib/parser';
import { resolveProblemAction } from '@/app/actions/resolveProblem';

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, logout, setLoginModalOpen, bookmarks, isMock } = useAuth();

  // State Management
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resolvedLinks, setResolvedLinks] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Resolution States
  const [resolving, setResolving] = useState(false);
  const [resolvingSuccess, setResolvingSuccess] = useState('');

  // Fetch problems on mount
  useEffect(() => {
    setMounted(true);
    async function loadProblems() {
      const data = await dbService.getProblems();
      setProblems(data);
    }
    loadProblems();
  }, []);

  const isSearchQueryUrl = useMemo(() => {
    return !!parseProblemUrl(searchQuery);
  }, [searchQuery]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setResolvedLinks(null);

    try {
      // 1. Force a network request to the backend route instead of checking local DB
      const response = await fetch('/api/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: searchQuery }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve platform links');
      }

      const data = await response.json();
      
      // 2. Save the dynamic URLs returned by the API into a dedicated state variable
      // This payload should look like: { leetcode: '...', geeksforgeeks: '...', etc. }
      if (data.success) {
        setResolvedLinks(data);
      } else {
        throw new Error(data.message || 'Failed to resolve platform links');
      }

    } catch (err: any) {
      console.error("Search Error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveProblem = async () => {
    if (!searchQuery.trim()) return;
    setResolving(true);
    setError(null);
    setResolvingSuccess('');
    
    try {
      const res = await resolveProblemAction(searchQuery);
      if (res.success && res.problem) {
        setProblems(prev => [res.problem!, ...prev]);
        setResolvingSuccess(`Successfully resolved "${res.problem.title}" and cached in database!`);
        setSearchQuery('');
        setResolvedLinks(null);
      } else {
        setError(res.message || 'Failed to resolve the problem from the live URL.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during resolution.');
    } finally {
      setResolving(false);
    }
  };

  // Display ONLY bookmarked problems in the bottom section, filtered by difficulty
  const filteredProblems = useMemo(() => {
    let result = problems.filter(p => bookmarks.includes(p.id));

    if (selectedDifficulty !== 'All') {
      result = result.filter(p => p.difficulty === selectedDifficulty);
    }

    return result;
  }, [problems, selectedDifficulty, bookmarks]);

  // Auto-detect URL input and show indicator
  const matchedUrlPlatform = useMemo(() => {
    const urlMatch = parseProblemUrl(searchQuery);
    return urlMatch ? urlMatch.platform : null;
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResolvedLinks(null);
  };

  // Prevent hydration mismatches by returning loading placeholder until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative pb-20">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none animate-pulse-glow" />

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/50 dark:border-slate-800/40 bg-white/70 dark:bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/25">
              C
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Codemash
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            
            {/* Dark/Light mode toggle */}
            <button
              id="theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-slate-500 dark:text-slate-400"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <User size={14} className="text-indigo-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {user.username}
                  </span>
                </div>
                <button
                  id="signout-btn"
                  onClick={logout}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-sm font-semibold"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                id="signin-btn"
                onClick={() => setLoginModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold transition-all text-sm flex items-center gap-1.5 shadow-md hover:shadow-lg dark:shadow-none"
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT LANDING */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full flex flex-col justify-start pt-12 md:pt-20">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-6 animate-float">
            <Sparkles size={12} />
            <span>Search Problem Links Universally</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-none mb-6">
            Search Once. <br className="sm:hidden" />
            <span className="text-gradient">Solve Everywhere.</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
            Find equivalent coding problem URLs across LeetCode, Codeforces, HackerRank, CodeChef, and GeeksforGeeks inside a unified search panel.
          </p>
        </section>

        {/* UNIFIED SEARCH CONTAINER */}
        <section className="max-w-2xl mx-auto w-full mb-12">
          <form onSubmit={handleSearch} className="relative group">
            
            {/* Search Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-45 transition duration-300" />
            
            <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/30 dark:shadow-none pl-4 pr-2.5 py-2">
              <Search className="text-slate-400 shrink-0" size={20} />
              
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Paste coding link or search problem title (e.g. 'Two Sum')..."
                className="w-full bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 text-base"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1 cursor-pointer"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}

              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold border border-indigo-700/50 transition-colors cursor-pointer shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Paste URL detection indicator */}
          {matchedUrlPlatform && (
            <div className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-500/15 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
              <Info size={14} className="shrink-0" />
              <span>Detected pasted URL from <strong>{matchedUrlPlatform.toUpperCase()}</strong>! Press Enter or Search to resolve...</span>
            </div>
          )}

          {resolvingSuccess && (
            <div className="mt-3 flex items-center justify-between gap-1.5 px-4 py-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-sm font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-2">
                <Info size={16} className="shrink-0" />
                <span>{resolvingSuccess}</span>
              </div>
              <button onClick={() => setResolvingSuccess('')} className="p-1 rounded-full hover:bg-emerald-500/10 text-emerald-500 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-center justify-between gap-1.5 px-4 py-3 rounded-xl border border-rose-500/15 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-sm font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-2">
                <Info size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="p-1 rounded-full hover:bg-rose-500/10 text-rose-500 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          )}
        </section>

        {/* DYNAMIC SEARCH RESULT CARD */}
        {(isLoading || resolving || resolvedLinks || (searchQuery.trim() && isSearchQueryUrl)) && (
          <section className="max-w-2xl mx-auto w-full mb-12">
            {resolving ? (
              <div className="glass-panel border border-indigo-500/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-xl shadow-indigo-500/5">
                <RefreshCw className="animate-spin text-indigo-500" size={36} />
                <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Resolving Problem Details</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                  Contacting platform API endpoints, matching equivalent problem URLs, and saving to your database. This may take a few seconds...
                </p>
              </div>
            ) : isLoading ? (
              <div className="glass-panel border border-slate-200/50 dark:border-slate-900 rounded-2xl p-6 space-y-4 animate-pulse">
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4" />
                <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
              </div>
            ) : resolvedLinks ? (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-indigo-500" />
                  <span>Resolved Result</span>
                </h3>
                <ResultsCard problem={resolvedLinks} />
              </div>
            ) : searchQuery.trim() && isSearchQueryUrl ? (
              <div className="text-center py-10 px-6 glass-panel rounded-3xl max-w-xl mx-auto border border-indigo-500/20 shadow-xl shadow-indigo-500/5">
                <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-5 text-indigo-500">
                  <Sparkles size={26} className="animate-float" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Pasted Link is not in Database</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  This appears to be a valid URL from <strong>{matchedUrlPlatform?.toUpperCase()}</strong>, but it hasn&apos;t been mapped in our database yet. Would you like to resolve it automatically?
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    id="resolve-pasted-url-btn"
                    onClick={handleResolveProblem}
                    disabled={resolving}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/10 flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <RefreshCw size={14} className={resolving ? 'animate-spin' : ''} />
                    <span>{resolving ? 'Resolving...' : 'Resolve & Add Problem'}</span>
                  </button>
                  <button
                    onClick={handleClearSearch}
                    className="px-5 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold rounded-xl transition-all text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* BOOKMARKED PROBLEMS SECTION */}
        <section className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-5 mb-8">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Bookmark className="fill-indigo-500 text-indigo-500" size={20} />
              <span>Bookmarked Problems ({filteredProblems.length})</span>
            </h2>
            
            {/* Difficulty Filter */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 text-slate-400 mr-1.5">
                <SlidersHorizontal size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider">Difficulty</span>
              </div>
              
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedDifficulty === diff
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/10'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {filteredProblems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProblems.map((problem) => (
                <ResultsCard key={problem.id} problem={problem} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 glass-panel rounded-3xl max-w-xl mx-auto border border-dashed border-slate-200 dark:border-slate-800">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Bookmark size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No bookmarked problems</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Any problems you bookmark will appear here for quick access.
              </p>
            </div>
          )}
        </section>

        {/* Database fallback mode information pill */}
        {isMock && (
          <section className="max-w-2xl mx-auto w-full mt-14 p-4 rounded-2xl border border-amber-500/10 bg-amber-500/5 text-amber-600 dark:text-amber-400 flex items-start gap-3">
            <Info size={18} className="shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Offline Simulated Workspace</h4>
              <p className="text-xs font-medium opacity-90 mt-0.5 leading-relaxed">
                The client database is running in mock mode. All bookmarks will be saved directly into your local browser storage. Start PocketBase on port 8090 and refresh to unlock secure cross-device database features.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* AUTH LOGIN DIALOG */}
      <LoginModal />
    </div>
  );
}
