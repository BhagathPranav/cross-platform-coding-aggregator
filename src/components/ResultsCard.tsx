'use client';

import React, { useState } from 'react';
import { Bookmark, ExternalLink, Copy, Check } from 'lucide-react';
import { PlatformIcon } from './PlatformIcon';
import { CodingProblem } from '@/lib/db';
import { useAuth } from '@/app/providers';
import { generateSearchLinks } from '@/lib/parser';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface ResultsCardProps {
  problem: any;
  layoutMode?: 'grid' | 'list';
}

export function ResultsCard({ problem, layoutMode = 'grid' }: ResultsCardProps) {
  const { bookmarks, toggleBookmark } = useAuth();
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  
  const problemId = problem?.id || problem?.problem?.id;

  const isBookmarked = problemId ? bookmarks.includes(problemId) : false;

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (problemId) {
      toggleBookmark(problemId);
    }
  };

  // 3D Tilt Effect Values
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useTransform(y, [0, 1], [10, -10]);
  const rotateY = useTransform(x, [0, 1], [-10, 10]);

  const springConfig = { damping: 25, stiffness: 250, mass: 0.5 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (layoutMode === 'list') return; // Disable tilt in list view
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  const difficultyColors = {
    Easy: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Medium: 'bg-amber-100 text-amber-800 border-amber-300',
    Hard: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  const rawDifficulty = problem?.problem?.difficulty || problem?.difficulty;
  const difficulty: 'Easy' | 'Medium' | 'Hard' = 
    (rawDifficulty === 'Easy' || rawDifficulty === 'Medium' || rawDifficulty === 'Hard') 
      ? rawDifficulty 
      : 'Medium';

  const title = problem?.problem?.title || problem?.title || '';

  const getPlatformUrl = (name: 'leetcode' | 'codeforces' | 'hackerrank' | 'codechef' | 'geeksforgeeks'): string | null => {
    if (!problem) return null;

    const dbKeys = {
      leetcode: ['leetcode', 'leetcode_url'],
      codeforces: ['codeforces', 'codeforces_url'],
      hackerrank: ['hackerrank', 'hackerrank_url'],
      codechef: ['codechef', 'codechef_url'],
      geeksforgeeks: ['geeksforgeeks', 'geeksforgeeks_url', 'gfg_url'],
    } as const;

    const keys = dbKeys[name];

    // Check top-level properties
    for (const key of keys) {
      if (problem[key] !== undefined && problem[key] !== null) {
        return problem[key];
      }
    }

    // Check nested problem properties
    if (problem.problem) {
      for (const key of keys) {
        if (problem.problem[key] !== undefined && problem.problem[key] !== null) {
          return problem.problem[key];
        }
      }
    }

    return null;
  };

  const handleCopyLink = async (e: React.MouseEvent, url: string, platformName: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPlatform(platformName);
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const platforms = [
    { 
      name: 'leetcode', 
      label: 'LeetCode', 
      brandBg: 'hover:bg-[#FFA116]/10 hover:border-[#FFA116]/30', 
      brandText: 'group-hover/row:text-[#FFA116]', 
      logoColor: '#FFA116' 
    },
    { 
      name: 'codeforces', 
      label: 'Codeforces', 
      brandBg: 'hover:bg-[#3182CE]/10 hover:border-[#3182CE]/30', 
      brandText: 'group-hover/row:text-[#3182CE]', 
      logoColor: '#3182CE' 
    },
    { 
      name: 'hackerrank', 
      label: 'HackerRank', 
      brandBg: 'hover:bg-[#2EC866]/10 hover:border-[#2EC866]/30', 
      brandText: 'group-hover/row:text-[#2EC866]', 
      logoColor: '#2EC866' 
    },
    { 
      name: 'codechef', 
      label: 'CodeChef', 
      brandBg: 'hover:bg-[#5B4636]/10 hover:border-[#5B4636]/30', 
      brandText: 'group-hover/row:text-[#8B5A2B]', 
      logoColor: '#5B4636' 
    },
    { 
      name: 'geeksforgeeks', 
      label: 'GeeksforGeeks', 
      brandBg: 'hover:bg-[#2F8D46]/10 hover:border-[#2F8D46]/30', 
      brandText: 'group-hover/row:text-[#2F8D46]', 
      logoColor: '#2F8D46' 
    },
  ] as const;

  if (layoutMode === 'list') {
    // Elegant compact horizontal card list view
    return (
      <div 
        className="w-full bg-[#EE4D2D] text-white rounded-[2rem] border-2 border-[#111111] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#111111] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300 relative overflow-hidden"
      >
        {/* Subtle Grid Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`,
          backgroundSize: '24px 24px'
        }} />

        <div className="flex-1 min-w-0 z-10">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-[#111111] bg-white text-black">
              {difficulty}
            </span>
            <span className="text-xs font-bold text-white/80">
              ID: #{problemId || 'Dynamic'}
            </span>
          </div>
          <h3 className="text-2xl font-black tracking-tight leading-snug truncate text-white">
            {title}
          </h3>
        </div>

        {/* Platforms links directly side by side */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 z-10">
          {platforms.map((platform) => {
            const rawUrl = getPlatformUrl(platform.name);
            const isAvailable = typeof rawUrl === 'string' && rawUrl.trim() !== '' && /^https?:\/\//i.test(rawUrl.trim());
            const href = isAvailable ? rawUrl.trim() : '#';

            if (!isAvailable) return null;

            return (
              <div key={platform.name} className="flex items-center gap-1 bg-white/20 border border-white/10 rounded-full px-4.5 py-2 hover:bg-white hover:text-black hover:border-[#111111] transition duration-200 group/btn">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-extrabold flex items-center gap-1.5 text-white group-hover/btn:text-[#111111]"
                >
                  <PlatformIcon name={platform.name} size={14} />
                  <span>{platform.label}</span>
                  <ExternalLink size={12} className="opacity-70" />
                </a>
                
                <button
                  onClick={(e) => handleCopyLink(e, href, platform.name)}
                  className="ml-1.5 p-1 rounded-full hover:bg-white/20 text-white group-hover/btn:text-[#111111] group-hover/btn:hover:bg-black/10 transition cursor-pointer"
                  title="Copy link"
                >
                  {copiedPlatform === platform.name ? (
                    <Check size={12} className="text-emerald-300 group-hover/btn:text-emerald-700 font-bold" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
            );
          })}

          {problemId && (
            <button
              onClick={handleBookmarkClick}
              className="p-2.5 rounded-full border border-[#111111] bg-white hover:bg-red-50 text-[#111111] transition duration-200 cursor-pointer ml-auto md:ml-2"
              title="Remove Bookmark"
            >
              <Bookmark size={15} className="fill-[#111111] text-[#111111]" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Large Interactive 3D Grid Card Layout
  return (
    <motion.div 
      id={`problem-card-${problemId || 'dynamic'}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: rotateXSpring,
        rotateY: rotateYSpring,
        transformStyle: 'preserve-3d',
      }}
      className="relative rounded-[3rem] p-10 md:p-12 lg:p-14 flex flex-col justify-between min-h-[520px] bg-[#EE4D2D] text-white border-2 border-[#111111] shadow-[8px_8px_0px_0px_#111111] hover:shadow-[16px_16px_0px_0px_#111111] hover:translate-x-[-6px] hover:translate-y-[-6px] transition-all duration-300 group overflow-hidden"
    >
      {/* Subtle Grid Background Pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
        backgroundImage: `radial-gradient(#ffffff 2.5px, transparent 2.5px)`,
        backgroundSize: '24px 24px'
      }} />

      <div style={{ transform: 'translateZ(30px)' }} className="transition-transform duration-300 z-10">
        {/* Header (Difficulty & Bookmark) */}
        <div className="flex items-center justify-between gap-4">
          <span className="px-4 py-2 rounded-full text-xs font-black border border-[#111111] bg-white text-black shadow-sm">
            {difficulty}
          </span>
          
          {problemId && (
            <button
              id={`bookmark-btn-${problemId}`}
              onClick={handleBookmarkClick}
              className="p-3.5 rounded-full border border-[#111111] bg-white hover:bg-red-50 text-[#111111] transition duration-200 cursor-pointer shadow-sm active:scale-90"
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark problem'}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark problem'}
            >
              <Bookmark
                size={20}
                className={`transition-all duration-300 ${
                  isBookmarked 
                    ? 'fill-[#111111] text-[#111111] scale-110' 
                    : 'text-[#111111]/40'
                }`}
              />
            </button>
          )}
        </div>

        {/* Problem Title */}
        <h3 className="mt-8 text-4xl lg:text-5xl font-black mb-8 tracking-tighter leading-[1.08] text-white line-clamp-3">
          {title}
        </h3>
      </div>

      {/* The Links List */}
      <div style={{ transform: 'translateZ(20px)' }} className="mt-auto transition-transform duration-300 z-10">
        <div className="flex flex-col gap-2.5">
          {platforms.map((platform) => {
            const rawUrl = getPlatformUrl(platform.name);
            const isAvailable = typeof rawUrl === 'string' && rawUrl.trim() !== '' && /^https?:\/\//i.test(rawUrl.trim());
            const href = isAvailable ? rawUrl.trim() : '#';
            const tooltip = isAvailable
              ? `Solve on ${platform.label}`
              : `${platform.label} link not available`;

            return (
              <div
                key={platform.name}
                className={`flex items-center justify-between px-5 py-4.5 rounded-2xl border border-transparent transition-all duration-200 group/row ${
                  !isAvailable 
                    ? 'opacity-30 pointer-events-none' 
                    : `bg-white/90 border-[#111111]/10 ${platform.brandBg} hover:bg-white hover:border-[#111111]`
                }`}
              >
                <a
                  id={`link-${problemId || 'dynamic'}-${platform.name}`}
                  href={href}
                  target={isAvailable ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  title={tooltip}
                  className="flex items-center gap-3.5 flex-1"
                >
                  <PlatformIcon name={platform.name} size={20} />
                  <span className={`text-base text-[#111111] ${isAvailable ? 'font-black' : 'font-normal'} ${platform.brandText} transition-colors duration-200`}>
                    {platform.label}
                  </span>
                </a>
                
                {isAvailable && (
                  <div className="flex items-center gap-3">
                    {/* Clipboard Copy Button */}
                    <button
                      onClick={(e) => handleCopyLink(e, href, platform.name)}
                      className="p-2 rounded-lg hover:bg-[#111111]/10 text-[#111111] transition duration-200 cursor-pointer relative"
                      title="Copy URL to clipboard"
                    >
                      {copiedPlatform === platform.name ? (
                        <Check size={16} className="text-emerald-700 font-bold" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>

                    <a 
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#111111] font-black text-xl transition-transform group-hover/row:translate-x-1 group-hover/row:-translate-y-1"
                    >
                      ↗
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
