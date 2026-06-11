'use client';

import React from 'react';
import { Bookmark, ExternalLink } from 'lucide-react';
import { PlatformIcon } from './PlatformIcon';
import { CodingProblem } from '@/lib/db';
import { useAuth } from '@/app/providers';
import { generateSearchLinks } from '@/lib/parser';

interface ResultsCardProps {
  problem: CodingProblem;
}

export function ResultsCard({ problem }: ResultsCardProps) {
  const { bookmarks, toggleBookmark, setLoginModalOpen, user } = useAuth();
  
  const isBookmarked = bookmarks.includes(problem.id);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleBookmark(problem.id);
  };

  const difficultyColors = {
    Easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Hard: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  };

  const searchLinks = generateSearchLinks(problem.title);

  const platforms: {
    name: 'leetcode' | 'codeforces' | 'hackerrank' | 'codechef' | 'geeksforgeeks';
    label: string;
    url: string;
    isSearchRedirect: boolean;
  }[] = [
    { 
      name: 'leetcode', 
      label: 'LeetCode', 
      url: problem.leetcode_url || searchLinks.leetcode,
      isSearchRedirect: !problem.leetcode_url
    },
    { 
      name: 'codeforces', 
      label: 'Codeforces', 
      url: problem.codeforces_url || searchLinks.codeforces,
      isSearchRedirect: !problem.codeforces_url
    },
    { 
      name: 'hackerrank', 
      label: 'HackerRank', 
      url: problem.hackerrank_url || searchLinks.hackerrank,
      isSearchRedirect: !problem.hackerrank_url
    },
    { 
      name: 'codechef', 
      label: 'CodeChef', 
      url: problem.codechef_url || searchLinks.codechef,
      isSearchRedirect: !problem.codechef_url
    },
    { 
      name: 'geeksforgeeks', 
      label: 'GeeksforGeeks', 
      url: problem.gfg_url || searchLinks.geeksforgeeks,
      isSearchRedirect: !problem.gfg_url
    },
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
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {platforms.map((platform) => {
            const tooltip = platform.isSearchRedirect
              ? `Search on ${platform.label}`
              : `Solve on ${platform.label}`;

            return (
              <a
                id={`link-${problem.id}-${platform.name}`}
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                title={tooltip}
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
