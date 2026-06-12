// src/lib/searchTool.ts
// Executes web searches on behalf of the LLM agent using Serper.dev API.

/**
 * Executes a Google search via the Serper.dev API and returns
 * a compressed string of the top results (link + snippet) for
 * the LLM to consume without burning too many tokens.
 *
 * Falls back to a DuckDuckGo HTML scrape if the Serper key is missing.
 */
export async function executeWebSearch(query: string): Promise<string> {
  const serperKey = process.env.SERPER_API_KEY;

  if (serperKey) {
    return searchWithSerper(query, serperKey);
  }

  console.warn('[SearchTool] SERPER_API_KEY not set — falling back to DuckDuckGo HTML scrape.');
  return searchWithDuckDuckGo(query);
}

// ---------------------------------------------------------------------------
//  Serper.dev (primary)
// ---------------------------------------------------------------------------
async function searchWithSerper(query: string, apiKey: string): Promise<string> {
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
      console.error(`[SearchTool/Serper] HTTP ${res.status}: ${res.statusText}`);
      return `Search failed with status ${res.status}. No results available.`;
    }

    const data = await res.json();
    const organic: { title?: string; link?: string; snippet?: string }[] =
      data.organic ?? [];

    if (organic.length === 0) {
      return 'No search results found for the query.';
    }

    // Compress to the top 3 results
    return organic
      .slice(0, 3)
      .map(
        (r, i) =>
          `[${i + 1}] ${r.title ?? '(no title)'}\n    URL: ${r.link ?? '(no link)'}\n    ${r.snippet ?? ''}`,
      )
      .join('\n\n');
  } catch (err) {
    console.error('[SearchTool/Serper] Fetch failed:', err);
    return 'Search request failed due to a network error.';
  }
}

// ---------------------------------------------------------------------------
//  DuckDuckGo HTML scrape (fallback)
// ---------------------------------------------------------------------------
async function searchWithDuckDuckGo(query: string): Promise<string> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!res.ok) {
      return `DuckDuckGo search failed with status ${res.status}.`;
    }

    const html = await res.text();

    if (html.includes('bots use DuckDuckGo too')) {
      return 'DuckDuckGo bot-protection triggered. No results available.';
    }

    // Parse <a> tags and extract result links
    const tagRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const results: { link: string; title: string }[] = [];
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(html)) !== null && results.length < 3) {
      let rawHref = match[1].replace(/&amp;/g, '&');
      const titleText = match[2].replace(/<[^>]+>/g, '').trim();

      let decodedUrl = rawHref;
      if (decodedUrl.startsWith('//')) {
        decodedUrl = 'https:' + decodedUrl;
      }
      if (decodedUrl.includes('uddg=')) {
        const uddgIndex = decodedUrl.indexOf('uddg=');
        const encodedUrl = decodedUrl.substring(uddgIndex + 5).split('&')[0];
        decodedUrl = decodeURIComponent(encodedUrl);
      }

      // Only keep external results (skip DDG internal links)
      if (
        decodedUrl.startsWith('http') &&
        !decodedUrl.includes('duckduckgo.com')
      ) {
        results.push({ link: decodedUrl, title: titleText });
      }
    }

    if (results.length === 0) {
      return 'No search results found for the query.';
    }

    return results
      .map(
        (r, i) =>
          `[${i + 1}] ${r.title}\n    URL: ${r.link}`,
      )
      .join('\n\n');
  } catch (err) {
    console.error('[SearchTool/DuckDuckGo] Fetch failed:', err);
    return 'Search request failed due to a network error.';
  }
}
