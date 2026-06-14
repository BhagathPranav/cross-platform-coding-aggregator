import { NextRequest, NextResponse } from 'next/server';
import { parseProblemUrl } from '@/lib/parser';
import { fetchLeetCodeTitle } from '@/lib/leetcodeApi';
import { getCrossPlatformLinks } from '@/lib/aiRouter';
import { dbService, CodingProblem } from '@/lib/db';

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

  if (nums1.join(',') !== nums2.join(',')) {
    return false;
  }

  const stopWords = new Set([
    'solve', 'solver', 'problem', 'the', 'a', 'an', 'in', 'of', 
    'to', 'for', 'with', 'and', 'or', 'is', 'on', 'at', 'by', 
    'from', 'checker', 'design', 'implementation', 'program'
  ]);

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
  const intersect = keys1.filter(k => set2.has(k) || keys2.some(k2 => k2.includes(k) || k.includes(k2)));
  const minLen = Math.min(keys1.length, keys2.length);
  return intersect.length >= minLen || (intersect.length / Math.max(keys1.length, keys2.length)) >= 0.5;
}

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

    // 3. Check if it already exists in the database
    console.log(`[API Resolve] Checking DB for equivalent title of: "${canonicalTitle}"`);
    const problems = await dbService.getProblems();
    const existing = problems.find(p => areTitlesEquivalent(p.title, canonicalTitle!));

    let resolvedProblem: CodingProblem | null = null;
    
    if (existing) {
      resolvedProblem = existing;
      console.log(`[API Resolve] Found existing DB record for: "${canonicalTitle}" (ID: ${existing.id})`);
    } else {
      // 4. Always use the search-augmented AI Router to find verified URLs
      console.log(`[API Resolve] Calling AI Router (web search + LLM) for: "${canonicalTitle}"`);
      const aiLinks = await getCrossPlatformLinks(canonicalTitle!);

      // Cache the resolved problem in the database
      resolvedProblem = await dbService.createProblem({
        title: canonicalTitle || 'Unknown Problem',
        difficulty: 'Medium', // Default difficulty
        leetcode_url: aiLinks?.leetcode || `https://leetcode.com/problems/${slug}/`,
        codeforces_url: aiLinks?.codeforces || null,
        hackerrank_url: aiLinks?.hackerrank || null,
        codechef_url: aiLinks?.codechef || null,
        gfg_url: aiLinks?.geeksforgeeks || null
      });
      console.log(`[API Resolve] Cached new problem record in DB for: "${canonicalTitle}"`);
    }

    if (!resolvedProblem) {
      throw new Error('Failed to resolve or create the problem in the database.');
    }

    return NextResponse.json({
      success: true,
      id: resolvedProblem.id,
      title: resolvedProblem.title,
      difficulty: resolvedProblem.difficulty,
      leetcode: resolvedProblem.leetcode_url,
      geeksforgeeks: resolvedProblem.gfg_url,
      hackerrank: resolvedProblem.hackerrank_url,
      codechef: resolvedProblem.codechef_url,
      codeforces: resolvedProblem.codeforces_url,
      leetcode_url: resolvedProblem.leetcode_url,
      codeforces_url: resolvedProblem.codeforces_url,
      hackerrank_url: resolvedProblem.hackerrank_url,
      codechef_url: resolvedProblem.codechef_url,
      gfg_url: resolvedProblem.gfg_url,
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
