import { NextRequest, NextResponse } from 'next/server';
import { parseProblemUrl } from '@/lib/parser';
import { fetchLeetCodeTitle } from '@/lib/leetcodeApi';
import { getCrossPlatformLinks } from '@/lib/aiRouter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let { slug, url, title } = body;

    // If slug and url are missing but title is provided, try to extract slug or normalize title
    if (!slug && !url && title) {
      const parsed = parseProblemUrl(title);
      if (parsed) {
        url = title;
        if (parsed.platform === 'leetcode') {
          slug = parsed.slug;
        }
      } else {
        // Normalize title to slug
        slug = title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');
      }
    }

    // Extract slug from URL if a LeetCode URL is provided
    if (url) {
      const parsed = parseProblemUrl(url);
      if (parsed && parsed.platform === 'leetcode') {
        slug = parsed.slug;
      }
    }

    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'LeetCode slug, url, or title is required' },
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

    // 3. Always use the search-augmented AI Router to find verified URLs
    console.log(`[API Resolve] Calling AI Router (web search + LLM) for: "${canonicalTitle}"`);
    const aiLinks = await getCrossPlatformLinks(canonicalTitle!);

    return NextResponse.json({
      success: true,
      title: canonicalTitle,
      leetcode: aiLinks?.leetcode || `https://leetcode.com/problems/${slug}/`,
      geeksforgeeks: aiLinks?.geeksforgeeks || null,
      hackerrank: aiLinks?.hackerrank || null,
      codechef: aiLinks?.codechef || null,
      codeforces: aiLinks?.codeforces || null,
      problem: null
    });
  } catch (error: any) {
    console.error('[API Resolve] Resolution route error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
