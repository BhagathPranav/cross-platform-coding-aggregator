import { CodingProblem } from './db';

/**
 * Parses a coding platform URL and extracts the problem identifier/slug.
 * Supports LeetCode, Codeforces, HackerRank, CodeChef, and GeeksforGeeks.
 * 
 * @param {string} url - The URL string entered by the user.
 * @returns {{ platform: string; slug: string } | null} The parsed platform name and problem slug/id, or null if invalid.
 */
export function parseProblemUrl(url: string): { platform: string; slug: string } | null {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl) return null;
    
    // Convert e.g. leetcode.com/problems/... to a standard format for URL parsing
    const standardUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
    const parsed = new URL(standardUrl);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;

    if (host.includes('leetcode.com')) {
      const match = path.match(/\/problems\/([a-zA-Z0-9-]+)/);
      if (match) return { platform: 'leetcode', slug: match[1] };
    } else if (host.includes('codeforces.com')) {
      // Matches standard problem url format: /problemset/problem/123/A or /contest/123/problem/A
      const matchProblemset = path.match(/\/problemset\/problem\/(\d+)\/([a-zA-Z0-9]+)/i);
      if (matchProblemset) return { platform: 'codeforces', slug: `${matchProblemset[1]}${matchProblemset[2]}` };
      
      const matchContest = path.match(/\/contest\/(\d+)\/problem\/([a-zA-Z0-9]+)/i);
      if (matchContest) return { platform: 'codeforces', slug: `${matchContest[1]}${matchContest[2]}` };
    } else if (host.includes('hackerrank.com')) {
      const match = path.match(/\/challenges\/([a-zA-Z0-9-]+)/);
      if (match) return { platform: 'hackerrank', slug: match[1] };
    } else if (host.includes('codechef.com')) {
      const match = path.match(/\/problems\/([a-zA-Z0-9-]+)/);
      if (match) return { platform: 'codechef', slug: match[1] };
    } else if (host.includes('geeksforgeeks.org')) {
      const match = path.match(/\/problems\/([a-zA-Z0-9-]+)/);
      if (match) return { platform: 'geeksforgeeks', slug: match[1] };
    }
  } catch (e) {
    // Fail silently and return null if url is invalid
  }
  return null;
}

/**
 * Searches the problem list for a match based on a parsed URL slug.
 * Looks for exact title match, substring match, or matches in the URL strings.
 * 
 * @param {CodingProblem[]} problems - List of available coding problems.
 * @param {string} slug - The extracted problem identifier/slug.
 * @returns {CodingProblem | null} The matching problem or null if no match found.
 */
export function findProblemBySlug(problems: CodingProblem[], slug: string): CodingProblem | null {
  if (!slug) return null;
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const prob of problems) {
    // 1. Check title match (cleaned of punctuation and spaces)
    const cleanTitle = prob.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanTitle === cleanSlug || cleanTitle.includes(cleanSlug) || cleanSlug.includes(cleanTitle)) {
      return prob;
    }

    // 2. Check if the URL strings contain the slug
    const urls = [
      prob.leetcodeUrl,
      prob.codeforcesUrl,
      prob.hackerrankUrl,
      prob.codechefUrl,
      prob.geeksforgeeksUrl
    ];

    for (const url of urls) {
      if (url) {
        const urlLower = url.toLowerCase();
        // Extract pathname to check for slug match to prevent domain matching
        try {
          const path = new URL(url).pathname.toLowerCase();
          if (path.includes(slug.toLowerCase())) {
            return prob;
          }
        } catch (e) {
          if (urlLower.includes(slug.toLowerCase())) {
            return prob;
          }
        }
      }
    }
  }
  return null;
}
