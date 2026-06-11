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
import { parseProblemUrl, findProblemBySlug } from '@/lib/parser';
import { resolveProblemAction } from '@/app/actions/resolveProblem';
import Fuse from 'fuse.js';

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, logout, setLoginModalOpen, bookmarks, isMock } = useAuth();

  // State Management
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [matchedUrlPlatform, setMatchedUrlPlatform] = useState<string | null>(null);

  // Resolution States
  const [resolving, setResolving] = useState(false);
  const [resolvingError, setResolvingError] = useState('');
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

  const handleResolveProblem = async () => {
    if (!searchQuery.trim()) return;
    setResolving(true);
    setResolvingError('');
    setResolvingSuccess('');
    
    try {
      const res = await resolveProblemAction(searchQuery);
      if (res.success && res.problem) {
        setProblems(prev => [res.problem!, ...prev]);
        setResolvingSuccess(`Successfully resolved "${res.problem.title}" and cached in database!`);
        setSearchQuery('');
      } else {
        setResolvingError(res.message || 'Failed to resolve the problem from the live URL.');
      }
    } catch (err: any) {
      setResolvingError(err.message || 'An unexpected error occurred during resolution.');
    } finally {
      setResolving(false);
    }
  };

  // Initialize Fuse.js for fuzzy searching on problem fields
  const fuse = useMemo(() => {
    return new Fuse(problems, {
      keys: ['title'],
      threshold: 0.35,
    });
  }, [problems]);

  // Core Search & Filtering Processing
  const filteredProblems = useMemo(() => {
    let result = [...problems];

    // 1. Check if Bookmarked Only is enabled
    if (showBookmarksOnly) {
      result = result.filter(p => bookmarks.includes(p.id));
    }

    // 2. Filter by difficulty
    if (selectedDifficulty !== 'All') {
      result = result.filter(p => p.difficulty === selectedDifficulty);
    }

    // 3. Process search query
    if (searchQuery.trim()) {
      const urlMatch = parseProblemUrl(searchQuery);
      
      if (urlMatch) {
        // Input is a valid URL, search using parsed slug
        const matchedProblem = findProblemBySlug(problems, urlMatch.slug);
        if (matchedProblem) {
          result = result.filter(p => p.id === matchedProblem.id);
        } else {
          result = []; // No match found for this URL
        }
      } else {
        // Standard text fuzzy search
        const fuzzyResults = fuse.search(searchQuery);
        result = result.filter(p => fuzzyResults.some(fr => fr.item.id === p.id));
      }
    }

    return result;
  }, [problems, searchQuery, selectedDifficulty, showBookmarksOnly, bookmarks, fuse]);

  // Auto-detect URL input and show indicator
  useEffect(() => {
    const urlMatch = parseProblemUrl(searchQuery);
    if (urlMatch) {
      setMatchedUrlPlatform(urlMatch.platform);
    } else {
      setMatchedUrlPlatform(null);
    }
  }, [searchQuery]);

  // Handle simulated loader when typing/searching to enhance user experience
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSearchLoading(true);
    const timeout = setTimeout(() => {
      setSearchLoading(false);
    }, 350);
    return () => clearTimeout(timeout);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
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
          <div className="relative group">
            
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
                  onClick={handleClearSearch}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold font-mono border border-slate-200 dark:border-slate-700/50">
                🔍 fuzzy
              </div>
            </div>
          </div>

          {/* Paste URL detection indicator */}
          {matchedUrlPlatform && (
            <div className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-500/15 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
              <Info size={14} className="shrink-0" />
              <span>Detected pasted URL from <strong>{matchedUrlPlatform.toUpperCase()}</strong>! Resolving equivalents...</span>
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

          {resolvingError && (
            <div className="mt-3 flex items-center justify-between gap-1.5 px-4 py-3 rounded-xl border border-rose-500/15 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-sm font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-2">
                <Info size={16} className="shrink-0" />
                <span>{resolvingError}</span>
              </div>
              <button onClick={() => setResolvingError('')} className="p-1 rounded-full hover:bg-rose-500/10 text-rose-500 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          )}
        </section>

        {/* FILTER BAR SECTION */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/50 dark:border-slate-950 pb-5 mb-8">
          
          {/* Main Filter Tabs */}
          <div className="flex items-center gap-2.5 bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 self-start">
            <button
              id="filter-all-btn"
              onClick={() => setShowBookmarksOnly(false)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!showBookmarksOnly ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              All Problems ({problems.length})
            </button>
            <button
              id="filter-bookmarks-btn"
              onClick={() => setShowBookmarksOnly(true)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${showBookmarksOnly ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <Bookmark size={14} className={showBookmarksOnly ? 'fill-indigo-500 text-indigo-500' : ''} />
              <span>Bookmarks ({bookmarks.length})</span>
            </button>
          </div>

          {/* Difficulty and Filter settings */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-slate-400 mr-1.5">
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
        </section>

        {/* RESULTS GRID / LOADER */}
        <section className="flex-1">
          {resolving ? (
            // Resolving server action loading state
            <div className="col-span-full glass-panel border border-indigo-500/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-xl shadow-indigo-500/5">
              <RefreshCw className="animate-spin text-indigo-500" size={36} />
              <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Resolving Problem Details</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                Contacting platform API endpoints, matching equivalent problem URLs, and saving to your database. This may take a few seconds...
              </p>
            </div>
          ) : searchLoading ? (
            // Skeleton loader state
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-panel border border-slate-200/50 dark:border-slate-900 rounded-2xl p-6 space-y-4 animate-pulse">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4" />
                  <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                  <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
                </div>
              ))}
            </div>
          ) : filteredProblems.length > 0 ? (
            // Results list
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProblems.map((problem) => (
                <ResultsCard key={problem.id} problem={problem} />
              ))}
            </div>
          ) : isSearchQueryUrl ? (
            // Unresolved URL resolver card
            <div className="text-center py-16 px-6 glass-panel rounded-3xl max-w-xl mx-auto border border-indigo-500/20 shadow-xl shadow-indigo-500/5">
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-5 text-indigo-500">
                <Sparkles size={26} className="animate-float" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Pasted Link is not in Database</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                This appears to be a valid URL from <strong>{matchedUrlPlatform?.toUpperCase()}</strong>, but it hasn't been mapped in our database yet. Would you like to resolve it automatically?
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
          ) : (
            // Generic Empty Search State
            <div className="text-center py-16 px-4 glass-panel rounded-3xl max-w-xl mx-auto border border-dashed border-slate-200 dark:border-slate-800">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Search size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No coding problems found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                {showBookmarksOnly 
                  ? "You haven't bookmarked any problems matching this query yet." 
                  : "We couldn't match this query to any sample problems. Try searching 'Two Sum' or paste a URL."}
              </p>
              
              {!showBookmarksOnly && (
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={() => setSearchQuery('Two Sum')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <span>Try "Two Sum" query</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              )}
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
