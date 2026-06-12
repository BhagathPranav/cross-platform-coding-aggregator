// src/lib/aiRouter.ts
// No LLM, no guessing. Search + HTTP validate = only real URLs.

import { searchAndVerifyUrl, PLATFORMS } from './searchTool';

/**
 * Finds cross-platform URLs for a coding problem by:
 * 1. Searching Google (Serper) or DuckDuckGo for each platform
 * 2. Validating every candidate URL with a real HTTP request
 * 3. Only returning URLs that respond with HTTP 200
 *
 * No LLM is used. No hallucination is possible.
 */
export async function getCrossPlatformLinks(
  problemName: string,
): Promise<Record<string, string | null>> {
  console.log(`[AI Router] Finding verified URLs for: "${problemName}"`);

  // Search + validate all platforms in parallel
  const results = await Promise.all(
    PLATFORMS.map(async (platform) => {
      const url = await searchAndVerifyUrl(problemName, platform);
      return { name: platform.name, url };
    }),
  );

  const links: Record<string, string | null> = {
    leetcode: null,
    geeksforgeeks: null,
    hackerrank: null,
    codechef: null,
    codeforces: null,
  };

  for (const r of results) {
    links[r.name] = r.url;
  }

  console.log('[AI Router] Final verified links:', links);
  return links;
}