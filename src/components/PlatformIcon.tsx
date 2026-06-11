import React from 'react';

type PlatformName = 'leetcode' | 'codeforces' | 'hackerrank' | 'codechef' | 'geeksforgeeks';

interface PlatformIconProps {
  name: PlatformName;
  className?: string;
  size?: number;
}

export function PlatformIcon({ name, className = '', size = 24 }: PlatformIconProps) {
  // SVG definitions with custom, recognizable layouts and core brand colors
  switch (name) {
    case 'leetcode':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={`fill-amber-500 hover:fill-amber-600 transition-colors ${className}`}
          aria-hidden="true"
        >
          <title>LeetCode</title>
          <path d="M13.483 0a1.39 1.39 0 0 0-.961.438L7.116 6.226a1.04 1.04 0 0 0-.074 1.394 1.018 1.018 0 0 0 1.44.074l5.361-5.748c.178-.18.423-.284.678-.284.524 0 .95.426.95.95v13.687c0 .524-.426.95-.95.95H5.437a.95.95 0 0 1-.95-.95V8.67a.95.95 0 0 1 .95-.95h3.048c.524 0 .95-.426.95-.95V5.82a.95.95 0 0 0-.95-.95H5.437c-3.003 0-5.437 2.434-5.437 5.437v7.712c0 3.003 2.434 5.437 5.437 5.437h9.124c3.003 0 5.437-2.434 5.437-5.437V1.388A1.388 1.388 0 0 0 13.483 0z" />
          <path d="M12.017 16.57a1.048 1.048 0 0 1-.741-.307l-3.376-3.377a1.048 1.048 0 1 1 1.482-1.482l2.635 2.635 6.012-6.012a1.048 1.048 0 1 1 1.482 1.482L12.758 16.26a1.048 1.048 0 0 1-.741.31z" />
        </svg>
      );
    case 'codeforces':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={`transition-opacity ${className}`}
          aria-hidden="true"
        >
          <title>Codeforces</title>
          {/* podium bars layout */}
          <rect x="2" y="10" width="5" height="14" rx="1.5" className="fill-blue-500" />
          <rect x="9.5" y="2" width="5" height="22" rx="1.5" className="fill-red-500" />
          <rect x="17" y="6" width="5" height="18" rx="1.5" className="fill-yellow-500" />
        </svg>
      );
    case 'hackerrank':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={`fill-emerald-500 hover:fill-emerald-600 transition-colors ${className}`}
          aria-hidden="true"
        >
          <title>HackerRank</title>
          <path d="M18.8 3H5.2A2.2 2.2 0 0 0 3 5.2v13.6A2.2 2.2 0 0 0 5.2 21h13.6a2.2 2.2 0 0 0 2.2-2.2V5.2A2.2 2.2 0 0 0 18.8 3zm-2.4 12.1a.9.9 0 0 1-.9.9h-1.6a.9.9 0 0 1-.9-.9v-2.3H11v2.3a.9.9 0 0 1-.9.9H8.5a.9.9 0 0 1-.9-.9V8.9a.9.9 0 0 1 .9-.9h1.6a.9.9 0 0 1 .9.9v2.3h2.9V8.9a.9.9 0 0 1 .9-.9h1.6a.9.9 0 0 1 .9.9v6.2z" />
        </svg>
      );
    case 'codechef':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={`fill-amber-950 dark:fill-amber-600 transition-colors ${className}`}
          aria-hidden="true"
        >
          <title>CodeChef</title>
          {/* Chef Hat outline */}
          <path d="M12 2C9.5 2 7.5 3.8 7.1 6.2C5.3 6.9 4 8.6 4 10.7c0 2.2 1.4 4 3.3 4.7c.4 2.4 2.4 4.2 4.7 4.2c2.3 0 4.3-1.8 4.7-4.2c1.9-.7 3.3-2.5 3.3-4.7c0-2.1-1.3-3.8-3.1-4.5C16.5 3.8 14.5 2 12 2zm0 15.6c-1.4 0-2.6-.9-3-2.2c.5-.2 1-.5 1.5-.9c.4.4.9.7 1.5.7c.6 0 1.1-.3 1.5-.7c.5.4 1 .7 1.5.9c-.4 1.3-1.6 2.2-3 2.2zm0-4.6c-.6 0-1-.4-1-1s.4-1 1-1s1 .4 1 1s-.4 1-1 1z" />
          <path d="M5.5 20h13a1.5 1.5 0 0 1 1.5 1.5V22H4v-.5A1.5 1.5 0 0 1 5.5 20z" />
        </svg>
      );
    case 'geeksforgeeks':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={`fill-green-600 hover:fill-green-700 transition-colors ${className}`}
          aria-hidden="true"
        >
          <title>GeeksforGeeks</title>
          {/* GfG Logo structure */}
          <path d="M12.116 2.182a10 10 0 0 0-7.834 7.644h3.111a7 7 0 0 1 5.215-4.721v5.6H6.182a10 10 0 0 0 7.644 7.834v-3.111a7 7 0 0 1-4.721-5.215h5.6v-8.031z" />
          <path d="M11.884 21.818a10 10 0 0 0 7.834-7.644h-3.111a7 7 0 0 1-5.215 4.721v-5.6h6.426a10 10 0 0 0-7.644-7.834v3.111a7 7 0 0 1 4.721 5.215h-5.6v8.031z" />
        </svg>
      );
    default:
      return null;
  }
}
