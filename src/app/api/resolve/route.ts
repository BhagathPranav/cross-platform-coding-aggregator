import { NextRequest, NextResponse } from 'next/server';
import { dbService, CodingProblem } from '@/lib/db';
import { parseProblemUrl } from '@/lib/parser';
import { fetchLeetCodeTitle } from '@/lib/leetcodeApi';
import { findPlatformMatches } from '@/lib/matcher';

// In-memory caching for database problems list (1-minute TTL)
let cachedProblems: CodingProblem[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 1000; // 60 seconds

async function getProblemsCached(): Promise<CodingProblem[]> {
  const now = Date.now();
  if (!cachedProblems || (now - cacheTime) > CACHE_DURATION) {
    console.log('[API Resolve] Cache miss or TTL expired. Querying PocketBase database...');
    cachedProblems = await dbService.getProblems();
    cacheTime = now;
  } else {
    console.log('[API Resolve] Cache hit. Retrieving problems from in-memory cache.');
  }
  return cachedProblems;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let { slug, url } = body;

    // Extract slug from URL if a LeetCode URL is provided
    if (url) {
      const parsed = parseProblemUrl(url);
      if (parsed && parsed.platform === 'leetcode') {
        slug = parsed.slug;
      }
    }

    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'LeetCode slug or url is required' },
        { status: 400 }
      );
    }

    console.log(`[API Resolve] Resolving LeetCode slug: "${slug}"`);

    // 1. Fetch the canonical title from the Alfa-LeetCode API
    let canonicalTitle = await fetchLeetCodeTitle(slug);

    // 2. Graceful Fallback if the API fetch fails
    if (!canonicalTitle) {
      canonicalTitle = slug
        .split(/[-_]+/)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      console.log(`[API Resolve] LeetCode API lookup failed. Normalizing slug fallback: "${canonicalTitle}"`);
    }

    // 3. Query the cached database problems list
    const problems = await getProblemsCached();

    // 4. Pass the canonical title and problem data to the Fuzzy Matcher
    const matchedProblem = findPlatformMatches(canonicalTitle!, problems);

    return NextResponse.json({
      success: true,
      title: canonicalTitle,
      problem: matchedProblem
    });
  } catch (error: any) {
    console.error('[API Resolve] Resolution route error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
