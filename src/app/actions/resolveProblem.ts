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
            
            if (extractedTitle) {
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

    // 3. Cross-Platform Matching via APIs
    const cleanTitle = getCleanCompare(title);

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
            (p: any) => getCleanCompare(p.stat.question__title) === cleanTitle
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
            (p: any) => getCleanCompare(p.name) === cleanTitle
          );
          if (match) {
            codeforcesUrl = `https://codeforces.com/problemset/problem/${match.contestId}/${match.index}`;
            console.log(`- Matched Codeforces equivalent URL: ${codeforcesUrl}`);
          }
        }
      } catch (e) {}
    }

    // For other platforms, do not generate search redirection URLs. If not resolved, they remain empty.

    // 4. Save/Cache resolved problem in database
    const pbAdmin = new PocketBase(pbUrl);
    let resolvedProblem: CodingProblem;

    try {
      // Authenticate as Admin
      await pbAdmin.collection('_superusers').authWithPassword(adminEmail, adminPassword);

      // Check if problem already exists (avoid duplicates)
      const existing = await pbAdmin.collection('problems').getList(1, 1, {
        filter: `title = "${title}"`
      });

      if (existing.items.length > 0) {
        const r = existing.items[0];
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
        console.log(`Problem "${title}" already cached in DB.`);
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
        console.log(`Cached problem "${title}" in live PocketBase database successfully.`);
      }
    } catch (pbErr) {
      console.warn('PocketBase admin connection failed, returning in-memory mock record:', pbErr);
      // Fallback: Create mock cached problem
      resolvedProblem = {
        id: `mock-resolved-${Date.now()}`,
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
