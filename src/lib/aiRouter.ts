// src/lib/aiRouter.ts
// Search-Augmented AI Router: we proactively search for every platform FIRST,
// then feed the real search results to the LLM so it can only pick from
// verified URLs — no hallucination possible.

import { executeWebSearch } from './searchTool';

// ─── Platform definitions ───────────────────────────────────────────────────
const PLATFORMS = [
  { key: 'leetcode',       domain: 'leetcode.com',       pathHint: '/problems/' },
  { key: 'geeksforgeeks',  domain: 'geeksforgeeks.org',  pathHint: '/problems/' },
  { key: 'hackerrank',     domain: 'hackerrank.com',      pathHint: '/challenges/' },
  { key: 'codechef',       domain: 'codechef.com',        pathHint: '/problems/' },
  { key: 'codeforces',     domain: 'codeforces.com',      pathHint: '' },
] as const;

// ─── Main export ────────────────────────────────────────────────────────────
export async function getCrossPlatformLinks(problemName: string) {
  const isDev = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';

  const endpoint = isDev
    ? process.env.LOCAL_AI_URL
    : process.env.PROD_AI_URL;

  const aiKey = isDev ? process.env.LOCAL_AI_KEY : process.env.PROD_AI_KEY;

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (aiKey) {
    headers['Authorization'] = `Bearer ${aiKey}`;
  }

  try {
    // ── Step 1: Proactively search all platforms in parallel ──────────
    console.log(`[AI Router] Searching all platforms for: "${problemName}"`);

    const searchResults = await Promise.all(
      PLATFORMS.map(async (p) => {
        const query = `site:${p.domain}${p.pathHint} ${problemName}`;
        console.log(`[AI Router]   → Searching: "${query}"`);
        const result = await executeWebSearch(query);
        return { platform: p.key, query, result };
      }),
    );

    // ── Step 2: Build context block from real search data ────────────
    const searchContext = searchResults
      .map((sr) => `### ${sr.platform.toUpperCase()} (query: "${sr.query}")\n${sr.result}`)
      .join('\n\n');

    console.log('[AI Router] All searches complete. Sending results to LLM for URL extraction.');

    // ── Step 3: Send search results to LLM for intelligent extraction ─
    const systemPrompt = `You are a competitive programming URL extractor. You are given REAL search results from Google for each coding platform. Your ONLY job is to pick the correct URL from the search results.

RULES:
1. ONLY use URLs that appear in the search results below. NEVER invent or guess a URL.
2. If the search results for a platform are empty or do not contain a relevant match for the problem "${problemName}", set that platform to null.
3. The URL must point to the actual problem page, not a blog post, tutorial, or editorial.
4. Return ONLY a valid JSON object with this exact schema — no markdown fences, no commentary:
   { "leetcode": string | null, "geeksforgeeks": string | null, "hackerrank": string | null, "codechef": string | null, "codeforces": string | null }

SEARCH RESULTS:
${searchContext}`;

    const payload = {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Extract the correct URLs for the coding problem: "${problemName}". Only use URLs from the search results above.`,
        },
      ],
      response_format: { type: 'json_object' },
    };

    const response = await fetch(endpoint!, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`[AI Router] LLM returned HTTP ${response.status}: ${errText}`);

      // If the LLM is down, extract URLs directly from search results (no LLM needed)
      console.warn('[AI Router] LLM unavailable — falling back to direct extraction from search results.');
      return extractUrlsDirectly(searchResults, problemName);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = parseFinalAnswer(content);

    // Validate that the LLM didn't hallucinate — every non-null URL must appear in search results
    const validated = validateAgainstSearchResults(parsed, searchResults);
    console.log('[AI Router] Final validated result:', validated);
    return validated;

  } catch (error) {
    console.error('[AI Router] Fatal error:', error);
    return {};
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extract valid JSON from the LLM's final content string. */
function parseFinalAnswer(content: string | undefined | null): Record<string, string | null> {
  if (!content) return {};

  let cleaned = content.trim();
  // Strip markdown code fences if the model wraps its answer
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  try {
    const parsed = JSON.parse(cleaned);
    return {
      leetcode: parsed.leetcode ?? null,
      geeksforgeeks: parsed.geeksforgeeks ?? null,
      hackerrank: parsed.hackerrank ?? null,
      codechef: parsed.codechef ?? null,
      codeforces: parsed.codeforces ?? null,
    };
  } catch {
    console.error('[AI Router] Could not parse LLM JSON:', cleaned.slice(0, 300));
    return {};
  }
}

/**
 * Post-validation: ensures every URL the LLM returned actually appeared
 * in the search results. Nullifies any hallucinated URLs.
 */
function validateAgainstSearchResults(
  llmResult: Record<string, string | null>,
  searchResults: { platform: string; result: string }[],
): Record<string, string | null> {
  const validated: Record<string, string | null> = {};

  for (const sr of searchResults) {
    const url = llmResult[sr.platform];
    if (!url) {
      validated[sr.platform] = null;
      continue;
    }

    // Check if the URL (or a significant portion of it) actually appeared in the search text
    // Normalize both to compare (strip trailing slashes, protocol differences)
    const urlCore = url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (sr.result.includes(urlCore) || sr.result.includes(url)) {
      validated[sr.platform] = url;
    } else {
      console.warn(`[AI Router] Hallucination blocked: "${url}" not found in ${sr.platform} search results`);
      validated[sr.platform] = null;
    }
  }

  return validated;
}

/**
 * Direct extraction fallback: when the LLM is completely unavailable,
 * parse URLs directly from search result text using regex.
 * This ensures the system still works without any LLM.
 */
function extractUrlsDirectly(
  searchResults: { platform: string; query: string; result: string }[],
  problemName: string,
): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  const titleWords = problemName.toLowerCase().split(/\s+/);

  for (const sr of searchResults) {
    result[sr.platform] = null;

    // Extract all URLs from the search result text
    const urlRegex = /https?:\/\/[^\s)>\]"',]+/g;
    const urls = sr.result.match(urlRegex) || [];

    for (const url of urls) {
      const urlLower = url.toLowerCase();
      const platform = PLATFORMS.find(p => p.key === sr.platform);
      if (!platform) continue;

      // Must be on the correct domain
      if (!urlLower.includes(platform.domain)) continue;

      // Must be a problem page (not homepage, not blog)
      if (platform.pathHint && !urlLower.includes(platform.pathHint.toLowerCase())) continue;

      // Basic relevance check: at least one significant title word appears in URL
      const hasRelevantWord = titleWords.some(
        w => w.length > 2 && urlLower.includes(w),
      );

      if (hasRelevantWord) {
        result[sr.platform] = url.replace(/[.,;:!?]+$/, ''); // trim trailing punctuation
        break;
      }
    }
  }

  console.log('[AI Router] Direct extraction result:', result);
  return result;
}