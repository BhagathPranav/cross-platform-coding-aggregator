'use server';

import PocketBase from 'pocketbase';
import { CodingProblem } from '@/lib/db';
import { parseProblemUrl } from '@/lib/parser';
import { getCrossPlatformLinks } from '@/lib/aiRouter';

// Admin details for database caching (read on server only)
const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@aggregator.local';
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123456789';

interface ResolveResponse {
  success: boolean;
  problem?: CodingProblem;
  message?: string;
}

/**
 * Checks if two problem titles are equivalent, ignoring capitalization, punctuation,
 * common stop words, plural forms, and distinguishing numeric suffixes/roman numerals.
 */
function areTitlesEquivalent(title1: string, title2: string): boolean {
  const t1 = title1.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const t2 = title2.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

  const getNumbersOrNumerals = (text: string) => {
    return text.split(/\s+/)
      .map(w => w.trim())
      .filter(w => /^(?:[0-9]+|i+|iv|v|vi|vii|viii|ix|x)$/i.test(w));
  };

  const nums1 = getNumbersOrNumerals(t1);
  const nums2 = getNumbersOrNumerals(t2);

  // If they have different numbers/numerals, they are not equivalent
  if (nums1.join(',') !== nums2.join(',')) {
    return false;
  }

  const stopWords = new Set([
    'solve', 'solver', 'problem', 'the', 'a', 'an', 'in', 'of', 
    'to', 'for', 'with', 'and', 'or', 'is', 'on', 'at', 'by', 
    'from', 'checker', 'design', 'implementation', 'program'
  ]);

  // Normalize words: stem plural 's' or 'es' to singular
  const getKeywords = (text: string) => {
    return text.split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 1 && !stopWords.has(w))
      .map(w => {
        if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
        if (w.endsWith('es')) return w.slice(0, -2);
        if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
        return w;
      });
  };

  const keys1 = getKeywords(t1);
  const keys2 = getKeywords(t2);

  if (keys1.length === 0 || keys2.length === 0) return false;

  const set2 = new Set(keys2);

  // Calculate overlap
  const intersect = keys1.filter(k => set2.has(k) || keys2.some(k2 => k2.includes(k) || k.includes(k2)));
  
  const minLen = Math.min(keys1.length, keys2.length);
  return intersect.length >= minLen || (intersect.length / Math.max(keys1.length, keys2.length)) >= 0.5;
}


/**
 * Server Action that parses a pasted URL, extracts its problem details from platform APIs/scraping,
 * uses the AI Router to find cross-platform URLs via real web search,
 * and caches it in the PocketBase collection.
 */
export async function resolveProblemAction(url: string): Promise<ResolveResponse> {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      return { success: false, message: 'URL cannot be empty' };
    }

    // 1. Parse URL to detect platform and slug
    const urlMatch = parseProblemUrl(cleanUrl);
    if (!urlMatch) {
      return { success: false, message: 'Unsupported coding platform. Please enter a valid URL from LeetCode, Codeforces, HackerRank, CodeChef, or GeeksforGeeks.' };
    }

    const { platform, slug } = urlMatch;
    let title = '';
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';

    // Store the pasted URL for the source platform
    let pastedPlatformUrls: Record<string, string> = {};
    const targetUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
    pastedPlatformUrls[platform] = targetUrl;

    console.log(`Resolving URL for platform: ${platform}, slug: ${slug}`);

    // 2. Fetch title and difficulty from the source platform
    if (platform === 'leetcode') {
      try {
        const response = await fetch('https://leetcode.com/api/problems/all/', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 3600 }
        });
        if (response.ok) {
          const data = await response.json();
          const found = data.stat_status_pairs.find(
            (p: any) => p.stat.question__title_slug === slug
          );
          if (found) {
            title = found.stat.question__title;
            const diffLevel = found.difficulty.level;
            difficulty = diffLevel === 1 ? 'Easy' : diffLevel === 3 ? 'Hard' : 'Medium';
          }
        }
      } catch (err) {
        console.error('Failed LeetCode API fetch:', err);
      }
    } 
    else if (platform === 'codeforces') {
      try {
        const match = slug.match(/^(\d+)([a-zA-Z\d]+)$/);
        if (match) {
          const contestId = parseInt(match[1]);
          const index = match[2].toUpperCase();

          const response = await fetch('https://codeforces.com/api/problemset.problems', {
            next: { revalidate: 3600 }
          });
          if (response.ok) {
            const data = await response.json();
            const found = data.result.problems.find(
              (p: any) => p.contestId === contestId && p.index === index
            );
            if (found) {
              title = found.name;
              const rating = found.rating || 0;
              if (rating === 0) difficulty = 'Medium';
              else if (rating < 1200) difficulty = 'Easy';
              else if (rating > 1800) difficulty = 'Hard';
              else difficulty = 'Medium';
            }
          }
        }
      } catch (err) {
        console.error('Failed Codeforces API fetch:', err);
      }
    } 
    else {
      // HTML Scraping fallback for HackerRank, CodeChef, GeeksforGeeks
      try {
        const response = await fetch(targetUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (response.ok) {
          const html = await response.text();
          const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            let extractedTitle = titleMatch[1].trim();
            extractedTitle = extractedTitle
              .replace(/\s*-\s*GeeksforGeeks.*/i, '')
              .replace(/\s*\|\s*HackerRank.*/i, '')
              .replace(/\s*\|\s*CodeChef.*/i, '')
              .replace(/\s*\|\s*LeetCode.*/i, '')
              .trim();
            
            const lowerExtracted = extractedTitle.toLowerCase();
            const isGenericTitle = lowerExtracted.includes('computer science portal') || 
                                   lowerExtracted === 'practice' || 
                                   lowerExtracted.includes('something went wrong');
            if (extractedTitle && !isGenericTitle) {
              title = extractedTitle;
            }
          }
        }
      } catch (err) {
        console.error(`Failed title scrape for ${platform}:`, err);
      }
    }

    // Fallback: If title extraction failed, generate from slug
    if (!title) {
      title = slug
        .split(/[-_]+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }

    console.log(`Resolved problem info: "${title}" (${difficulty})`);

    // 3. Use AI Router to find cross-platform URLs via real web search
    console.log(`[resolveProblemAction] Searching for cross-platform links for: "${title}"`);
    const aiLinks = await getCrossPlatformLinks(title);

    // Merge: prefer the pasted URL for its platform, use AI-discovered URLs for the rest
    const leetcodeUrl = platform === 'leetcode' ? targetUrl : (aiLinks?.leetcode || '');
    const codeforcesUrl = platform === 'codeforces' ? targetUrl : (aiLinks?.codeforces || '');
    const hackerrankUrl = platform === 'hackerrank' ? targetUrl : (aiLinks?.hackerrank || '');
    const codechefUrl = platform === 'codechef' ? targetUrl : (aiLinks?.codechef || '');
    const geeksforgeeksUrl = platform === 'geeksforgeeks' ? targetUrl : (aiLinks?.geeksforgeeks || '');

    console.log(`[resolveProblemAction] Final URLs:`, {
      leetcode: leetcodeUrl || null,
      codeforces: codeforcesUrl || null,
      hackerrank: hackerrankUrl || null,
      codechef: codechefUrl || null,
      geeksforgeeks: geeksforgeeksUrl || null,
    });

    // 4. Connect to database to check for existing equivalents and merge URLs
    const pbAdmin = new PocketBase(pbUrl);
    let resolvedProblem: CodingProblem | null = null;
    let existingRecordId: string | null = null;

    try {
      await pbAdmin.collection('_superusers').authWithPassword(adminEmail, adminPassword);

      const allProblems = await pbAdmin.collection('problems').getFullList();
      const existingMatch = allProblems.find(p => areTitlesEquivalent(p.title, title));

      if (existingMatch) {
        existingRecordId = existingMatch.id;
        // Use existing title and difficulty for consistency
        title = existingMatch.title;
        difficulty = existingMatch.difficulty as any;
        console.log(`Found equivalent problem in DB: "${title}" (ID: ${existingRecordId}). Merging URLs.`);
      }
    } catch (pbErr) {
      console.warn('PocketBase admin connection failed during initial lookup, using local representation:', pbErr);
    }

    // 5. Save/Update record in database
    const dbPayload = {
      leetcode_url: leetcodeUrl || null,
      codeforces_url: codeforcesUrl || null,
      hackerrank_url: hackerrankUrl || null,
      codechef_url: codechefUrl || null,
      geeksforgeeks_url: geeksforgeeksUrl || null
    };

    try {
      if (existingRecordId) {
        const r = await pbAdmin.collection('problems').update(existingRecordId, dbPayload);
        resolvedProblem = {
          id: r.id,
          title: r.title,
          difficulty: r.difficulty as 'Easy' | 'Medium' | 'Hard',
          leetcode_url: r.leetcode_url || null,
          codeforces_url: r.codeforces_url || null,
          hackerrank_url: r.hackerrank_url || null,
          codechef_url: r.codechef_url || null,
          gfg_url: r.geeksforgeeks_url || null,
        };
        console.log(`Updated problem "${title}" in DB with AI-discovered URLs.`);
      } else {
        const r = await pbAdmin.collection('problems').create({
          title,
          difficulty,
          ...dbPayload,
        });
        resolvedProblem = {
          id: r.id,
          title: r.title,
          difficulty: r.difficulty as 'Easy' | 'Medium' | 'Hard',
          leetcode_url: r.leetcode_url || null,
          codeforces_url: r.codeforces_url || null,
          hackerrank_url: r.hackerrank_url || null,
          codechef_url: r.codechef_url || null,
          gfg_url: r.geeksforgeeks_url || null,
        };
        console.log(`Cached new problem "${title}" in PocketBase with AI-discovered URLs.`);
      }
    } catch (pbErr) {
      console.warn('PocketBase save/update failed, returning in-memory representation:', pbErr);
      resolvedProblem = {
        id: existingRecordId || `mock-resolved-${Date.now()}`,
        title,
        difficulty,
        leetcode_url: leetcodeUrl || null,
        codeforces_url: codeforcesUrl || null,
        hackerrank_url: hackerrankUrl || null,
        codechef_url: codechefUrl || null,
        gfg_url: geeksforgeeksUrl || null,
      };
    }

    return { success: true, problem: resolvedProblem };
  } catch (error: any) {
    console.error('Seeding process failed:', error);
    return { success: false, message: error.message || 'Server resolution failed' };
  }
}
