'use server';

import PocketBase from 'pocketbase';
import { CodingProblem } from '@/lib/db';
import { parseProblemUrl } from '@/lib/parser';

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
 * Standardizes a title string for fuzzy comparison by removing spaces and punctuation.
 */
function getCleanCompare(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
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
 * Generates common URL slug candidates from a problem title.
 */
function getSlugCandidates(title: string): string[] {
  const clean = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim();
  const words = clean.split(/\s+/);
  const standard = words.join('-');
  
  const candidates = new Set<string>();
  candidates.add(standard);

  // Variations for "solve" / "solver"
  if (words.includes('solver') || words.includes('solve')) {
    const coreWords = words.filter(w => w !== 'solver' && w !== 'solve' && w !== 'the');
    candidates.add(`solve-${coreWords.join('-')}`);
    candidates.add(`solve-the-${coreWords.join('-')}`);
    candidates.add(coreWords.join('-'));
  }
  
  // Variations for "reverse"
  if (words[0] === 'reverse') {
    const coreWords = words.slice(1).filter(w => w !== 'a' && w !== 'an' && w !== 'the');
    candidates.add(`reverse-${coreWords.join('-')}`);
    candidates.add(`reverse-a-${coreWords.join('-')}`);
  }

  // Variations for plurals/singulars
  const singularWords = words.map(w => {
    if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    return w;
  });
  candidates.add(singularWords.join('-'));

  return Array.from(candidates);
}

/**
 * Checks if a candidate URL exists on a coding platform.
 * Follows redirects to resolve correct GFG URLs.
 */
async function findValidUrl(
  candidates: string[], 
  platform: 'geeksforgeeks' | 'hackerrank' | 'codechef'
): Promise<string | null> {
  for (const slug of candidates) {
    let url = '';
    if (platform === 'geeksforgeeks') {
      url = `https://www.geeksforgeeks.org/problems/${slug}/1`;
    } else if (platform === 'hackerrank') {
      url = `https://www.hackerrank.com/challenges/${slug}/problem`;
    } else if (platform === 'codechef') {
      url = `https://www.codechef.com/problems/${slug.toUpperCase().replace(/-/g, '')}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      });

      if (platform === 'geeksforgeeks') {
        if (response.ok || response.status === 301 || response.status === 302) {
          const finalUrl = response.url;
          if (finalUrl && finalUrl.includes('/problems/') && !finalUrl.endsWith('/problems/')) {
            // Read HTML text to verify it's not a generic/error page (which GFG serves with HTTP 200)
            const html = await response.text();
            if (html.includes('Something went wrong') || html.includes('Oops!!') || html.includes('<title>Practice | GeeksforGeeks')) {
              continue; // This is a server-side error page, not a valid problem!
            }
            return finalUrl;
          }
        }
      } else {
        if (response.ok) {
          return response.url || url;
        }
      }
    } catch (e) {
      // Ignore network errors and try next candidate
    }
  }
  return null;
}

/**
 * Server Action that parses a pasted URL, extracts its problem details from platform APIs/scraping,
 * matches equivalent titles, and caches it in the PocketBase collection.
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
    let leetcodeUrl = '';
    let codeforcesUrl = '';
    let hackerrankUrl = '';
    let codechefUrl = '';
    let geeksforgeeksUrl = '';

    console.log(`Resolving URL for platform: ${platform}, slug: ${slug}`);

    // 2. Fetch platform data
    if (platform === 'leetcode') {
      leetcodeUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
      try {
        const response = await fetch('https://leetcode.com/api/problems/all/', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 3600 } // cache for an hour
        });
        if (response.ok) {
          const data = await response.json();
          const found = data.stat_status_pairs.find(
            (p: any) => p.stat.question__title_slug === slug
          );
          if (found) {
            title = found.stat.question__title;
            const diffLevel = found.difficulty.level; // 1 = Easy, 2 = Medium, 3 = Hard
            difficulty = diffLevel === 1 ? 'Easy' : diffLevel === 3 ? 'Hard' : 'Medium';
          }
        }
      } catch (err) {
        console.error('Failed LeetCode API fetch:', err);
      }
    } 
    else if (platform === 'codeforces') {
      codeforcesUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
      try {
        // Codeforces slug is contestId + index (e.g. 123A)
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
      // Fallback for HTML Scraping (HackerRank, CodeChef, GeeksforGeeks)
      const targetUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
      if (platform === 'hackerrank') hackerrankUrl = targetUrl;
      else if (platform === 'codechef') codechefUrl = targetUrl;
      else if (platform === 'geeksforgeeks') geeksforgeeksUrl = targetUrl;

      try {
        const response = await fetch(targetUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (response.ok) {
          const html = await response.text();
          const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            let extractedTitle = titleMatch[1].trim();
            // Clean site suffixes
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

    // 3. Connect to database to check for existing equivalents and merge URLs
    const pbAdmin = new PocketBase(pbUrl);
    let resolvedProblem: CodingProblem | null = null;
    let existingRecordId: string | null = null;

    try {
      // Authenticate as Admin
      await pbAdmin.collection('_superusers').authWithPassword(adminEmail, adminPassword);

      // Get all problems from DB to check for equivalents
      const allProblems = await pbAdmin.collection('problems').getFullList();
      const existingMatch = allProblems.find(p => areTitlesEquivalent(p.title, title));

      if (existingMatch) {
        existingRecordId = existingMatch.id;
        // Merge URLs: prefer new resolved URL if populated, otherwise use existing
        leetcodeUrl = leetcodeUrl || existingMatch.leetcode_url || '';
        codeforcesUrl = codeforcesUrl || existingMatch.codeforces_url || '';
        hackerrankUrl = hackerrankUrl || existingMatch.hackerrank_url || '';
        codechefUrl = codechefUrl || existingMatch.codechef_url || '';
        geeksforgeeksUrl = geeksforgeeksUrl || existingMatch.geeksforgeeks_url || '';
        
        // Use the existing problem title and difficulty to keep it consistent
        title = existingMatch.title;
        difficulty = existingMatch.difficulty as any;
        console.log(`Found equivalent problem in DB: "${title}" (ID: ${existingRecordId}). Merging URLs.`);
      }
    } catch (pbErr) {
      console.warn('PocketBase admin connection failed during initial lookup, using local representation:', pbErr);
    }

    // 4. Resolve remaining missing URLs across platforms
    const candidates = getSlugCandidates(title);

    // Search LeetCode API if LeetCode URL is not yet resolved
    if (!leetcodeUrl) {
      try {
        const lcResponse = await fetch('https://leetcode.com/api/problems/all/', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 3600 }
        });
        if (lcResponse.ok) {
          const lcData = await lcResponse.json();
          const match = lcData.stat_status_pairs.find(
            (p: any) => areTitlesEquivalent(p.stat.question__title, title)
          );
          if (match) {
            leetcodeUrl = `https://leetcode.com/problems/${match.stat.question__title_slug}/`;
            console.log(`- Matched LeetCode equivalent URL: ${leetcodeUrl}`);
          }
        }
      } catch (e) {}
    }

    // Search Codeforces API if Codeforces URL is not yet resolved
    if (!codeforcesUrl) {
      try {
        const cfResponse = await fetch('https://codeforces.com/api/problemset.problems', {
          next: { revalidate: 3600 }
        });
        if (cfResponse.ok) {
          const cfData = await cfResponse.json();
          const match = cfData.result.problems.find(
            (p: any) => areTitlesEquivalent(p.name, title)
          );
          if (match) {
            codeforcesUrl = `https://codeforces.com/problemset/problem/${match.contestId}/${match.index}`;
            console.log(`- Matched Codeforces equivalent URL: ${codeforcesUrl}`);
          }
        }
      } catch (e) {}
    }

    // Auto-discover GeeksforGeeks if missing
    if (!geeksforgeeksUrl) {
      const gfgUrlFound = await findValidUrl(candidates, 'geeksforgeeks');
      if (gfgUrlFound) {
        geeksforgeeksUrl = gfgUrlFound;
        console.log(`- Discovered GeeksforGeeks URL: ${geeksforgeeksUrl}`);
      }
    }

    // Auto-discover HackerRank if missing
    if (!hackerrankUrl) {
      const hrUrlFound = await findValidUrl(candidates, 'hackerrank');
      if (hrUrlFound) {
        hackerrankUrl = hrUrlFound;
        console.log(`- Discovered HackerRank URL: ${hackerrankUrl}`);
      }
    }

    // Auto-discover CodeChef if missing
    if (!codechefUrl) {
      const ccUrlFound = await findValidUrl(candidates, 'codechef');
      if (ccUrlFound) {
        codechefUrl = ccUrlFound;
        console.log(`- Discovered CodeChef URL: ${codechefUrl}`);
      }
    }

    // 5. Save/Update record in database
    try {
      if (existingRecordId) {
        // Update existing record
        const r = await pbAdmin.collection('problems').update(existingRecordId, {
          leetcode_url: leetcodeUrl || null,
          codeforces_url: codeforcesUrl || null,
          hackerrank_url: hackerrankUrl || null,
          codechef_url: codechefUrl || null,
          geeksforgeeks_url: geeksforgeeksUrl || null
        });

        resolvedProblem = {
          id: r.id,
          title: r.title,
          difficulty: r.difficulty as 'Easy' | 'Medium' | 'Hard',
          leetcodeUrl: r.leetcode_url || undefined,
          codeforcesUrl: r.codeforces_url || undefined,
          hackerrankUrl: r.hackerrank_url || undefined,
          codechefUrl: r.codechef_url || undefined,
          geeksforgeeksUrl: r.geeksforgeeks_url || undefined,
        };
        console.log(`Updated problem "${title}" in DB with merged/resolved URLs.`);
      } else {
        // Create new record
        const r = await pbAdmin.collection('problems').create({
          title,
          difficulty,
          leetcode_url: leetcodeUrl || null,
          codeforces_url: codeforcesUrl || null,
          hackerrank_url: hackerrankUrl || null,
          codechef_url: codechefUrl || null,
          geeksforgeeks_url: geeksforgeeksUrl || null
        });

        resolvedProblem = {
          id: r.id,
          title: r.title,
          difficulty: r.difficulty as 'Easy' | 'Medium' | 'Hard',
          leetcodeUrl: r.leetcode_url || undefined,
          codeforcesUrl: r.codeforces_url || undefined,
          hackerrankUrl: r.hackerrank_url || undefined,
          codechefUrl: r.codechef_url || undefined,
          geeksforgeeksUrl: r.geeksforgeeks_url || undefined,
        };
        console.log(`Cached new problem "${title}" in PocketBase successfully.`);
      }
    } catch (pbErr) {
      console.warn('PocketBase save/update failed, returning in-memory representation:', pbErr);
      resolvedProblem = {
        id: existingRecordId || `mock-resolved-${Date.now()}`,
        title,
        difficulty,
        leetcodeUrl: leetcodeUrl || undefined,
        codeforcesUrl: codeforcesUrl || undefined,
        hackerrankUrl: hackerrankUrl || undefined,
        codechefUrl: codechefUrl || undefined,
        geeksforgeeksUrl: geeksforgeeksUrl || undefined,
      };
    }

    return { success: true, problem: resolvedProblem };
  } catch (error: any) {
    console.error('Seeding process failed:', error);
    return { success: false, message: error.message || 'Server resolution failed' };
  }
}
