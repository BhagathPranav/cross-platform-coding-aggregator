// src/lib/searchTool.ts
// Searches for coding problem URLs and validates them with real HTTP requests.
// No LLM guessing — only returns URLs confirmed to be alive.

/**
 * Search for a problem on a specific platform and return a verified URL.
 * Returns null if no valid URL is found.
 */
export async function searchAndVerifyUrl(
  problemTitle: string,
  platform: PlatformConfig,
): Promise<string | null> {
  console.log(`[SearchTool] Searching ${platform.name} for: "${problemTitle}"`);

  // Step 1: Get candidate URLs from search
  const candidates = await getCandidateUrls(problemTitle, platform);

  if (candidates.length === 0) {
    console.log(`[SearchTool] No candidates found for ${platform.name}`);
    return null;
  }

  console.log(`[SearchTool] Found ${candidates.length} candidates for ${platform.name}:`, candidates);

  // Step 2: Validate each candidate with a real HTTP request (first valid one wins)
  for (const url of candidates) {
    const isValid = await validateUrl(url);
    if (isValid) {
      console.log(`[SearchTool] ✅ Verified URL for ${platform.name}: ${url}`);
      return url;
    }
    console.log(`[SearchTool] ❌ Invalid URL (404/error): ${url}`);
  }

  console.log(`[SearchTool] No valid URLs for ${platform.name} after validation`);
  return null;
}

// ─── Platform Configs ───────────────────────────────────────────────────────
export interface PlatformConfig {
  name: string;
  domain: string;
  /** URL path segment that problem pages must contain */
  pathMustInclude: string;
  /** Construct the search query */
  buildQuery: (title: string) => string;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    name: 'geeksforgeeks',
    domain: 'geeksforgeeks.org',
    pathMustInclude: '/problems/',
    buildQuery: (t) => `site:geeksforgeeks.org/problems/ ${t}`,
  },
  {
    name: 'hackerrank',
    domain: 'hackerrank.com',
    pathMustInclude: '/challenges/',
    buildQuery: (t) => `site:hackerrank.com/challenges/ ${t}`,
  },
  {
    name: 'codechef',
    domain: 'codechef.com',
    pathMustInclude: '/problems/',
    buildQuery: (t) => `site:codechef.com/problems/ ${t}`,
  },
  {
    name: 'codeforces',
    domain: 'codeforces.com',
    pathMustInclude: '/problem/',
    buildQuery: (t) => `site:codeforces.com/problemset/problem/ ${t}`,
  },
];

// ─── Step 1: Get candidate URLs from Serper or DuckDuckGo ───────────────────

async function getCandidateUrls(title: string, platform: PlatformConfig): Promise<string[]> {
  const query = platform.buildQuery(title);
  const serperKey = process.env.SERPER_API_KEY;

  let rawUrls: string[] = [];

  if (serperKey) {
    rawUrls = await searchWithSerper(query, serperKey);
  }

  if (rawUrls.length === 0) {
    rawUrls = await searchWithDuckDuckGo(query);
  }

  // Filter: must be on correct domain and contain the right path
  return rawUrls.filter(url => {
    const lower = url.toLowerCase();
    return (
      lower.includes(platform.domain) &&
      lower.includes(platform.pathMustInclude)
    );
  });
}

async function searchWithSerper(query: string, apiKey: string): Promise<string[]> {
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 5 }),
    });

    if (!res.ok) {
      console.error(`[SearchTool/Serper] HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    const organic: { link?: string }[] = data.organic ?? [];
    return organic.map(r => r.link).filter((u): u is string => !!u);
  } catch (err) {
    console.error('[SearchTool/Serper] Failed:', err);
    return [];
  }
}

async function searchWithDuckDuckGo(query: string): Promise<string[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!res.ok) return [];
    const html = await res.text();
    if (html.includes('bots use DuckDuckGo too')) return [];

    const results: string[] = [];
    const tagRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>/gi;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(html)) !== null && results.length < 5) {
      let rawHref = match[1].replace(/&amp;/g, '&');
      let decodedUrl = rawHref;
      if (decodedUrl.startsWith('//')) decodedUrl = 'https:' + decodedUrl;
      if (decodedUrl.includes('uddg=')) {
        const idx = decodedUrl.indexOf('uddg=');
        decodedUrl = decodeURIComponent(decodedUrl.substring(idx + 5).split('&')[0]);
      }
      if (decodedUrl.startsWith('http') && !decodedUrl.includes('duckduckgo.com')) {
        results.push(decodedUrl);
      }
    }

    return results;
  } catch (err) {
    console.error('[SearchTool/DDG] Failed:', err);
    return [];
  }
}

// ─── Step 2: Validate URL with real HTTP request ────────────────────────────

async function validateUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Check both status and that we didn't get redirected to a generic page
    if (!res.ok) return false;

    const finalUrl = res.url;

    // Reject if redirected to homepage or generic practice page
    if (
      finalUrl.endsWith('.com/') ||
      finalUrl.endsWith('.org/') ||
      finalUrl.includes('/practice') && !finalUrl.includes('/problems/')
    ) {
      return false;
    }

    // For GFG: read a bit of the body to check for "page is gone" error
    if (url.includes('geeksforgeeks.org')) {
      const body = await res.text();
      if (
        body.includes('that page is gone') ||
        body.includes('Something went wrong') ||
        body.includes('Oops!!')
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
