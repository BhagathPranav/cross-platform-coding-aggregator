'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark, ExternalLink, Loader2 } from 'lucide-react';
import { PlatformIcon } from './PlatformIcon';
import { CodingProblem } from '@/lib/db';
import { useAuth } from '@/app/providers';

interface ResultsCardProps {
  problem: CodingProblem;
}

export function ResultsCard({ problem }: ResultsCardProps) {
  const { bookmarks, toggleBookmark, setLoginModalOpen, user } = useAuth();
  
  const isBookmarked = bookmarks.includes(problem.id);

  const [validatedUrls, setValidatedUrls] = useState<Record<string, string | null>>({
    leetcode: problem.leetcode_url,
    codeforces: problem.codeforces_url,
    hackerrank: problem.hackerrank_url,
    codechef: problem.codechef_url,
    geeksforgeeks: problem.gfg_url,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const cacheKey = `validated_links_${problem.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    
    // Check localStorage first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setValidatedUrls(parsed);
        return;
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    setLoading(true);
    fetch('/api/resolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: problem.title })
    })
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && data.urls) {
          const merged = {
            leetcode: problem.leetcode_url || data.urls.leetcode || null,
            codeforces: problem.codeforces_url || data.urls.codeforces || null,
            hackerrank: problem.hackerrank_url || data.urls.hackerrank || null,
            codechef: problem.codechef_url || data.urls.codechef || null,
            geeksforgeeks: problem.gfg_url || data.urls.geeksforgeeks || null,
          };
          setValidatedUrls(merged);
          localStorage.setItem(cacheKey, JSON.stringify(merged));
        }
      })
      .catch((err) => console.error('[ResultsCard] Dynamic resolve failed:', err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [problem]);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleBookmark(problem.id);
  };

  const difficultyColors = {
    Easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Hard: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  };

  const isValidProblemUrl = (url?: string | null) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('search?search=') || lowerUrl.includes('domains/algorithms?search=')) {
      return false;
    }
    return true;
  };

  const platforms: {
    name: 'leetcode' | 'codeforces' | 'hackerrank' | 'codechef' | 'geeksforgeeks';
    label: string;
    url: string | null | undefined;
  }[] = [
    { name: 'leetcode', label: 'LeetCode', url: validatedUrls.leetcode },
    { name: 'codeforces', label: 'Codeforces', url: validatedUrls.codeforces },
    { name: 'hackerrank', label: 'HackerRank', url: validatedUrls.hackerrank },
    { name: 'codechef', label: 'CodeChef', url: validatedUrls.codechef },
    { name: 'geeksforgeeks', label: 'GeeksforGeeks', url: validatedUrls.geeksforgeeks },
  ];

  return (
    <div 
      id={`problem-card-${problem.id}`}
      className="glass-panel group relative rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/20 flex flex-col justify-between h-full"
    >
      <div>
        {/* Header (Title, Difficulty, Bookmark) */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${difficultyColors[problem.difficulty]}`}>
              {problem.difficulty}
            </span>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
              {problem.title}
            </h3>
          </div>
          
          <button
            id={`bookmark-btn-${problem.id}`}
            onClick={handleBookmarkClick}
            className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105 active:scale-95 group/btn`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark problem'}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark problem'}
          >
            <Bookmark
              size={18}
              className={`transition-all duration-300 ${
                isBookmarked 
                  ? 'fill-indigo-500 text-indigo-500 scale-110 drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]' 
                  : 'text-slate-400 dark:text-slate-500 group-hover/btn:text-slate-600 dark:group-hover/btn:text-slate-300'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Platforms Link Grid */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Available Platforms
          </p>
          {loading && (
            <Loader2 size={12} className="animate-spin text-indigo-500" />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {platforms.map((platform) => {
            const isAvailable = isValidProblemUrl(platform.url);
            return isAvailable ? (
              <a
                id={`link-${problem.id}-${platform.name}`}
                key={platform.name}
                href={platform.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-500/30 transition-all duration-200 group/link"
              >
                <div className="flex items-center gap-2.5">
                  <PlatformIcon name={platform.name} size={18} />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors">
                    {platform.label}
                  </span>
                </div>
                <ExternalLink size={14} className="text-slate-400 group-hover/link:text-indigo-500 transition-colors opacity-0 group-hover/link:opacity-100 transform translate-x-[-4px] group-hover/link:translate-x-0 transition-transform duration-200" />
              </a>
            ) : (
              <div
                key={platform.name}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-900/30 bg-slate-100/40 dark:bg-slate-900/10 opacity-40 grayscale pointer-events-none select-none cursor-not-allowed"
                title="Not available on this platform"
              >
                <div className="flex items-center gap-2.5">
                  <PlatformIcon name={platform.name} size={18} className="opacity-60" />
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-600">
                    {platform.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
