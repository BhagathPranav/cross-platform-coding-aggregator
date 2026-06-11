import { NextRequest, NextResponse } from 'next/server';
import { dbService, CodingProblem } from '@/lib/db';
import { findPlatformLink, verifyMatch } from '@/lib/discovery';

export async function POST(req: NextRequest) {
  try {
    const { title: reqTitle, leetcodeSlug } = await req.json();

    if (!leetcodeSlug) {
      return NextResponse.json(
        { success: false, message: 'leetcodeSlug is required' },
        { status: 400 }
      );
    }

    console.log(`[API Route] Incoming request for slug: "${leetcodeSlug}" with title suggestion: "${reqTitle}"`);

    // 1. Check cache in database
    let problem: CodingProblem | null = await dbService.findProblemByLeetcodeSlug(leetcodeSlug);
    
    let isNew = false;
    let title = reqTitle || '';
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    let leetcodeUrl = problem?.leetcode_url || `https://leetcode.com/problems/${leetcodeSlug}/`;

    if (!problem) {
      isNew = true;
      console.log(`[API Route] Cache miss. Problem with slug "${leetcodeSlug}" not found in DB. Resolving from LeetCode...`);
      
      // Try to fetch official details from LeetCode API
      try {
        const response = await fetch('https://leetcode.com/api/problems/all/', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 3600 }
        });
        if (response.ok) {
          const data = await response.json();
          const found = data.stat_status_pairs.find(
            (p: any) => p.stat.question__title_slug === leetcodeSlug
          );
          if (found) {
            title = found.stat.question__title;
            const diffLevel = found.difficulty.level; // 1 = Easy, 2 = Medium, 3 = Hard
            difficulty = diffLevel === 1 ? 'Easy' : diffLevel === 3 ? 'Hard' : 'Medium';
          }
        }
      } catch (err) {
        console.error('[API Route] Failed to fetch problem details from LeetCode API:', err);
      }

      if (!title) {
        // Generate title from slug
        title = leetcodeSlug
          .split(/[-_]+/)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }

      // Create initial record
      problem = await dbService.createProblem({
        title,
        difficulty,
        leetcode_url: leetcodeUrl,
      });

      if (!problem) {
        throw new Error('Failed to create problem record in database');
      }
    } else {
      title = problem.title;
      difficulty = problem.difficulty;
    }

    // 2. Identify missing platform links
    const missingPlatforms: { platform: string; domain: string; key: keyof CodingProblem }[] = [];
    if (!problem.gfg_url) {
      missingPlatforms.push({ platform: 'geeksforgeeks', domain: 'geeksforgeeks.org', key: 'gfg_url' });
    }
    if (!problem.hackerrank_url) {
      missingPlatforms.push({ platform: 'hackerrank', domain: 'hackerrank.com', key: 'hackerrank_url' });
    }
    if (!problem.codechef_url) {
      missingPlatforms.push({ platform: 'codechef', domain: 'codechef.com', key: 'codechef_url' });
    }
    if (!problem.codeforces_url) {
      missingPlatforms.push({ platform: 'codeforces', domain: 'codeforces.com', key: 'codeforces_url' });
    }

    // If there are no missing links, return the cached result immediately
    if (missingPlatforms.length === 0) {
      console.log(`[API Route] Cache hit. All platform links exist for "${title}".`);
      return NextResponse.json({ success: true, problem });
    }

    console.log(`[API Route] Cache partial miss. Discovered ${missingPlatforms.length} missing links for "${title}". Starting dynamic discovery...`);

    // 3. Fire dynamic searches in parallel
    const searchPromises = missingPlatforms.map(async (p) => {
      try {
        const result = await findPlatformLink(title, p.domain);
        if (result) {
          // Verify matches using string-similarity (Dice's Coefficient)
          const isValid = verifyMatch(title, result.title);
          if (isValid) {
            return { key: p.key, link: result.link };
          }
          console.warn(`[API Route] Verification failed for ${p.platform}. Discovered title: "${result.title}" does not match original: "${title}".`);
        }
      } catch (err) {
        console.error(`[API Route] Search failed for ${p.platform}:`, err);
      }
      return { key: p.key, link: null };
    });

    const searchResults = await Promise.all(searchPromises);

    // 4. Update the problem record with newly discovered and verified URLs
    const updates: any = {};
    let hasNewLinks = false;
    for (const result of searchResults) {
      if (result.link) {
        updates[result.key] = result.link;
        hasNewLinks = true;
      }
    }

    if (hasNewLinks) {
      console.log(`[API Route] Saving verified links to PocketBase:`, updates);
      const updatedProblem = await dbService.updateProblemUrls(problem.id, updates);
      if (updatedProblem) {
        problem = updatedProblem;
      }
    } else {
      console.log(`[API Route] No new matching links discovered for "${title}".`);
    }

    return NextResponse.json({ success: true, problem });
  } catch (error: any) {
    console.error('[API Route] Search/caching error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
