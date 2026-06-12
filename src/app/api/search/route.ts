import { NextRequest, NextResponse } from 'next/server';
import { dbService, CodingProblem } from '@/lib/db';
import { getCrossPlatformLinks } from '@/lib/aiRouter';

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
    
    let title = reqTitle || '';
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    let leetcodeUrl = problem?.leetcode_url || `https://leetcode.com/problems/${leetcodeSlug}/`;

    if (!problem) {
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
    const missingPlatforms: string[] = [];
    if (!problem.gfg_url) missingPlatforms.push('geeksforgeeks');
    if (!problem.hackerrank_url) missingPlatforms.push('hackerrank');
    if (!problem.codechef_url) missingPlatforms.push('codechef');
    if (!problem.codeforces_url) missingPlatforms.push('codeforces');

    // If there are no missing links, return the cached result immediately
    if (missingPlatforms.length === 0) {
      console.log(`[API Route] Cache hit. All platform links exist for "${title}".`);
      return NextResponse.json({ success: true, problem });
    }

    console.log(`[API Route] Missing links for ${missingPlatforms.join(', ')}. Using AI Router with web search...`);

    // 3. Use the new search-augmented AI router (searches web → feeds to LLM → validated URLs)
    const aiLinks = await getCrossPlatformLinks(title);

    // 4. Map AI results to DB column names and update
    const keyMap: Record<string, keyof CodingProblem> = {
      geeksforgeeks: 'gfg_url',
      hackerrank: 'hackerrank_url',
      codechef: 'codechef_url',
      codeforces: 'codeforces_url',
    };

    const updates: Partial<Record<string, string>> = {};
    let hasNewLinks = false;

    for (const platform of missingPlatforms) {
      const url = aiLinks[platform];
      if (url) {
        const dbKey = keyMap[platform];
        if (dbKey) {
          updates[dbKey] = url;
          hasNewLinks = true;
        }
      }
    }

    if (hasNewLinks) {
      console.log(`[API Route] Saving AI-discovered links to PocketBase:`, updates);
      const updatedProblem = await dbService.updateProblemUrls(problem.id, updates);
      if (updatedProblem) {
        problem = updatedProblem;
      }
    } else {
      console.log(`[API Route] No matching links discovered for "${title}".`);
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
