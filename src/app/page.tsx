'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, LogIn, LogOut, User, Bookmark, 
  Sparkles, Info, RefreshCw, SlidersHorizontal, ArrowRight, X,
  LayoutGrid, List
} from 'lucide-react';
import { dbService, CodingProblem } from '@/lib/db';
import { useAuth } from '@/app/providers';
import { ResultsCard } from '@/components/ResultsCard';
import { LoginModal } from '@/components/LoginModal';
import { AboutSection } from '@/components/AboutSection';
import { ValuesSection } from '@/components/ValuesSection';
import { FooterSection } from '@/components/FooterSection';
import { parseProblemUrl, findProblemBySlug, normalizeTitleToSlug } from '@/lib/parser';
import { resolveProblemAction } from '@/app/actions/resolveProblem';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Interactive controls state
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'title' | 'difficulty' | 'links'>('title');

  // Scroll to search section slowly and smoothly
  const handleScrollToSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    const target = document.getElementById('search-section');
    if (!container || !target) return;

    const start = container.scrollTop;
    const targetOffsetTop = target.offsetTop - 24; // Align with some spacing
    const change = targetOffsetTop - start;
    const duration = 1400; // Slower 1.4-second scroll for a premium feel
    let startTime: number | null = null;

    // Cubic Ease-In-Out
    const easeInOutCubic = (t: number, b: number, c: number, d: number) => {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t * t + b;
      t -= 2;
      return (c / 2) * (t * t * t + 2) + b;
    };

    const animateScroll = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = easeInOutCubic(elapsed, start, change, duration);
      
      container.scrollTop = progress;

      if (elapsed < duration) {
        requestAnimationFrame(animateScroll);
      } else {
        container.scrollTop = targetOffsetTop;
      }
    };

    requestAnimationFrame(animateScroll);
  };

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
    setError(null);
    setResolvingSuccess('');
    
    try {
      const res = await resolveProblemAction(searchQuery);
      if (res.success && res.problem) {
        setProblems(prev => [res.problem!, ...prev]);
        setResolvingSuccess(`Successfully resolved "${res.problem.title}" and cached in database!`);
        setResolvedLinks(res.problem);
        setSearchQuery('');
      } else {
        setError(res.message || 'Failed to resolve the problem from the live URL.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during resolution.');
    } finally {
      setResolving(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (isSearchQueryUrl) {
      handleResolveProblem();
      return;
    }

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

  // Suggestion pill click resolution
  const handleSuggestionClick = async (query: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    setError(null);
    setResolvedLinks(null);

    try {
      const response = await fetch('/api/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: query }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve platform links');
      }

      const data = await response.json();
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

  // Display ONLY bookmarked problems in the bottom section, filtered by difficulty and sorted
  const filteredProblems = useMemo(() => {
    let result = problems.filter(p => bookmarks.includes(p.id));

    if (selectedDifficulty !== 'All') {
      result = result.filter(p => p.difficulty === selectedDifficulty);
    }

    // Sort problems
    result.sort((a, b) => {
      const titleA = (a.title || '').toLowerCase();
      const titleB = (b.title || '').toLowerCase();
      
      if (sortBy === 'title') {
        return titleA.localeCompare(titleB);
      }
      
      if (sortBy === 'difficulty') {
        const diffWeight = { Easy: 1, Medium: 2, Hard: 3 };
        const diffA = diffWeight[a.difficulty] || 2;
        const diffB = diffWeight[b.difficulty] || 2;
        return diffA - diffB;
      }
      
      if (sortBy === 'links') {
        const countActiveLinks = (p: CodingProblem) => {
          let count = 0;
          if (p.leetcode_url) count++;
          if (p.codeforces_url) count++;
          if (p.hackerrank_url) count++;
          if (p.codechef_url) count++;
          if (p.gfg_url) count++;
          return count;
        };
        return countActiveLinks(b) - countActiveLinks(a); // Descending (more links first)
      }
      
      return 0;
    });

    return result;
  }, [problems, selectedDifficulty, bookmarks, sortBy]);

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F8E9E2] flex items-center justify-center">
        <RefreshCw className="animate-spin text-stone-400 dark:text-stone-600" size={32} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-screen overflow-y-auto custom-scrollbar flex flex-col p-4 md:p-6 lg:p-8 bg-[#F8E9E2] transition-colors duration-300 gap-6 md:gap-8">
      
      {/* Hero Section */}
      <section className="relative w-full h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden flex flex-col items-center justify-center text-center px-6 shadow-xl shrink-0">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.png"
            alt="Coworking space"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* FLOATING HEADER NAVBAR */}
        <header className="absolute top-6 left-6 right-6 z-50 flex items-center justify-between px-6 md:px-12 h-20 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-black font-extrabold text-lg shadow-sm">
              C
            </div>
            <div className="flex flex-col text-left">
              <span className="text-lg font-black tracking-tight text-white leading-none">
                codemash.
              </span>
              <span className="text-[8px] font-bold text-white/60 tracking-widest uppercase block mt-1.5 leading-none">
                UNIQUE CODING AGGREGATOR
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Sign in/out */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-white/10">
                  <User size={12} className="text-white" />
                  <span className="text-xs font-semibold text-white/90">{user.username}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-5 py-2.5 rounded-full border border-white/20 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-all text-white flex items-center gap-2 text-xs font-bold cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-xs cursor-pointer hover:bg-stone-200 transition"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl w-full flex flex-col items-center justify-center mt-20 animate-slide-up">
          <div className="inline-flex items-center gap-1.5 px-4.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] font-bold mb-8 uppercase tracking-widest border border-white/5 animate-float">
            <Sparkles size={11} className="text-blue-400" />
            <span>Search Problem Links Universally</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[1.1] mb-6 font-sans">
            Search Once. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Solve Everywhere.</span>
          </h1>
          
          <p className="text-base md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
            Find equivalent coding problem URLs across LeetCode, Codeforces, HackerRank, CodeChef, and GeeksforGeeks inside a unified search panel.
          </p>

          <button
            onClick={handleScrollToSearch}
            className="bg-[#111111] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-stone-900 hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
          >
            <span>Start Searching</span>
            <span>↗</span>
          </button>
        </div>
      </section>

      {/* SEARCH & RESULTS SECTION */}
      <section id="search-section" className="w-full max-w-[1400px] mx-auto flex flex-col gap-8 md:gap-12 pb-32 scroll-mt-6 px-4 md:px-8">
        
        {/* Yellow Bento Search Card */}
        <div className="bg-[#FFB800] p-10 md:p-16 lg:p-20 rounded-[3.5rem] text-[#111111] shadow-[8px_8px_0px_0px_#111111] border-2 border-[#111111] w-full flex flex-col items-center text-center relative overflow-hidden group">
          
          {/* Subtle Grid Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: `radial-gradient(#111111 2px, transparent 2px)`,
            backgroundSize: '24px 24px'
          }} />

          <h2 className="text-4xl md:text-6xl font-black mb-5 tracking-tighter leading-[1.05] z-10">
            Find your problem.
          </h2>
          <p className="text-base md:text-lg font-bold text-[#111111]/80 max-w-xl mb-10 z-10 leading-relaxed">
            Paste a platform URL or search by problem title to instantly lookup mapping links across other coding platforms.
          </p>
          
          <form onSubmit={handleSearch} className="relative group w-full max-w-2xl mx-auto z-10">
            <div className="relative flex items-center bg-white rounded-full overflow-hidden pl-6 pr-3.5 py-4 border-2 border-[#111111] shadow-[4px_4px_0px_0px_#111111] focus-within:shadow-[6px_6px_0px_0px_#111111] focus-within:translate-y-[-2px] focus-within:translate-x-[-2px] transition-all duration-200">
              <Search className="text-stone-500 shrink-0" size={24} />
              
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Paste coding link or search problem title (e.g. 'Two Sum')..."
                className="w-full bg-transparent border-0 outline-none text-stone-900 placeholder-stone-400 px-4 text-sm sm:text-base font-semibold"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-2 rounded-full text-stone-400 hover:bg-stone-100 transition-colors mr-2 cursor-pointer"
                  title="Clear search"
                >
                  <X size={18} />
                </button>
              )}

              <button
                type="submit"
                className="px-7 py-3 rounded-full bg-[#111111] hover:bg-stone-900 text-white text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95"
              >
                <span>Search</span>
                <span>↗</span>
              </button>
            </div>
          </form>

          {/* Suggestion Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8 max-w-2xl mx-auto z-10">
            <span className="text-xs font-black text-[#111111]/60 uppercase tracking-widest">Trending:</span>
            {[
              { label: 'Two Sum', query: 'Two Sum' },
              { label: 'Watermelon', query: 'Watermelon' },
              { label: '3Sum', query: '3Sum' },
              { label: 'Reverse List', query: 'Reverse a Linked List' },
              { label: 'Edit Distance', query: 'Edit Distance' }
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleSuggestionClick(chip.query)}
                className="px-4.5 py-2 rounded-full text-xs font-black bg-white/40 hover:bg-white border-2 border-[#111111]/10 hover:border-[#111111] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm hover:shadow-[3px_3px_0px_0px_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px]"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Paste URL detection indicator */}
          {matchedUrlPlatform && (
            <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#111111]/10 text-[#111111] text-xs font-black border border-[#111111]/20 animate-in fade-in slide-in-from-top-1 duration-150 mt-8 z-10">
              <Info size={14} className="shrink-0" />
              <span>Detected pasted URL from <strong className="font-extrabold">{matchedUrlPlatform.toUpperCase()}</strong>! Press Enter to resolve...</span>
            </div>
          )}
        </div>

        {/* SEARCH FEEDBACK ALERTS */}
        {(resolvingSuccess || error) && (
          <div className="max-w-2xl mx-auto w-full animate-slide-up">
            {resolvingSuccess && (
              <div className="flex items-center justify-between gap-2 px-5 py-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 text-emerald-600 text-sm font-semibold">
                <div className="flex items-center gap-2.5">
                  <Info size={16} className="shrink-0" />
                  <span>{resolvingSuccess}</span>
                </div>
                <button onClick={() => setResolvingSuccess('')} className="p-1 rounded-full hover:bg-emerald-500/10 text-emerald-500 cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-between gap-2 px-5 py-4 rounded-2xl border border-rose-500/15 bg-rose-500/5 text-rose-600 text-sm font-semibold">
                <div className="flex items-center gap-2.5">
                  <Info size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="p-1 rounded-full hover:bg-rose-500/10 text-rose-500 cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* DYNAMIC SEARCH RESULT CARD */}
        {(isLoading || resolving || resolvedLinks) && (
          <div className="max-w-3xl mx-auto w-full animate-slide-up">
            {resolving ? (
              <div className="glass-panel rounded-[2.5rem] border-2 border-[#111111] p-16 flex flex-col items-center justify-center text-center space-y-5 bg-white shadow-[6px_6px_0px_0px_#111111]">
                <RefreshCw className="animate-spin text-[#EE4D2D]" size={40} />
                <h4 className="text-2xl font-black text-stone-900">Resolving Problem Details</h4>
                <p className="text-sm font-bold text-stone-500 max-w-md leading-relaxed">
                  Contacting platform API endpoints, matching equivalent problem URLs, and saving to your database. This may take a few seconds...
                </p>
              </div>
            ) : isLoading ? (
              <div className="glass-panel rounded-[2.5rem] border-2 border-[#111111] p-10 space-y-6 animate-pulse bg-white shadow-[6px_6px_0px_0px_#111111]">
                <div className="h-6 bg-stone-200 rounded-md w-1/4" />
                <div className="h-10 bg-stone-200 rounded-md w-3/4" />
                <div className="h-32 bg-stone-200 rounded-md w-full" />
              </div>
            ) : resolvedLinks ? (
              <div className="space-y-5">
                <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-600" />
                  <span>Resolved Result</span>
                </h3>
                <ResultsCard problem={resolvedLinks} layoutMode="grid" />
              </div>
            ) : null}
          </div>
        )}

        {/* BOOKMARKED PROBLEMS SECTION */}
        <div id="bookmarks-section" className="animate-slide-up pt-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b-2 border-[#111111] pb-8 mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-[#111111] tracking-tighter flex items-center gap-3.5">
              <Bookmark className="fill-[#111111] text-[#111111]" size={44} />
              <span>Bookmarked Problems</span>
            </h2>
            
            <div className="flex flex-row flex-nowrap items-center gap-3 md:gap-4 lg:gap-6 justify-start lg:justify-end w-full lg:w-auto overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 shrink-0 select-none">
              
              {/* Difficulty Filter */}
              <div className="flex items-center gap-2 bg-white border-2 border-[#111111] rounded-2xl p-1.5 shadow-[3px_3px_0px_0px_#111111]">
                <div className="flex items-center gap-1 text-stone-500 pl-2 pr-1 shrink-0">
                  <SlidersHorizontal size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Difficulty</span>
                </div>
                <div className="flex items-center gap-1">
                  {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        selectedDifficulty === diff
                          ? 'bg-[#111111] text-white'
                          : 'hover:bg-stone-100 text-stone-600'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting Filter */}
              <div className="flex items-center gap-2 bg-white border-2 border-[#111111] rounded-2xl p-1.5 shadow-[3px_3px_0px_0px_#111111]">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 pl-2 pr-1">Sort By</span>
                <div className="flex items-center gap-1">
                  {[
                    { id: 'title', label: 'Title' },
                    { id: 'difficulty', label: 'Difficulty' },
                    { id: 'links', label: 'Solved count' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id as any)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        sortBy === option.id
                          ? 'bg-[#111111] text-white'
                          : 'hover:bg-stone-100 text-stone-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Toggle */}
              <div className="flex items-center gap-1 bg-white border-2 border-[#111111] rounded-2xl p-1.5 shadow-[3px_3px_0px_0px_#111111] shrink-0">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`p-2 rounded-xl transition duration-200 cursor-pointer ${
                    layoutMode === 'grid' ? 'bg-[#111111] text-white' : 'text-stone-500 hover:bg-stone-100'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  className={`p-2 rounded-xl transition duration-200 cursor-pointer ${
                    layoutMode === 'list' ? 'bg-[#111111] text-white' : 'text-stone-500 hover:bg-stone-100'
                  }`}
                  title="List view"
                >
                  <List size={16} />
                </button>
              </div>

            </div>
          </div>

          {filteredProblems.length > 0 ? (
            <div className={layoutMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10" 
              : "flex flex-col gap-6"
            }>
              {filteredProblems.map((problem) => (
                <ResultsCard key={problem.id} problem={problem} layoutMode={layoutMode} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-8 bg-[#EE4D2D] rounded-[3rem] border-2 border-[#111111] shadow-[8px_8px_0px_0px_#111111] max-w-xl mx-auto">
              <div className="h-16 w-16 rounded-full border border-[#111111] bg-white flex items-center justify-center mx-auto mb-6 text-[#EE4D2D] shadow-[3px_3px_0px_0px_#111111]">
                <Bookmark size={28} className="fill-[#EE4D2D] text-[#EE4D2D]" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">No bookmarked problems</h3>
              <p className="text-sm text-white/90 mt-3 max-w-xs mx-auto leading-relaxed font-bold">
                Any problems you bookmark will appear here for quick access. Try searching a problem above!
              </p>
            </div>
          )}
        </div>

        {/* Database fallback mode information pill */}
        {isMock && (
          <div className="max-w-2xl mx-auto w-full mt-20 p-5 rounded-3xl border border-amber-500/10 bg-amber-500/5 text-amber-600 flex items-start gap-4">
            <Info size={20} className="shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Offline Simulated Workspace</h4>
              <p className="text-xs font-medium opacity-90 mt-1 leading-relaxed">
                The client database is running in mock mode. All bookmarks will be saved directly into your local browser storage. Start PocketBase on port 8090 and refresh to unlock secure cross-device database features.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ABOUT SECTION */}
      <AboutSection />

      {/* VALUES SECTION */}
      <ValuesSection />

      {/* FOOTER SECTION */}
      <FooterSection />

      {/* AUTH LOGIN DIALOG */}
      <LoginModal />
    </div>
  );
}
