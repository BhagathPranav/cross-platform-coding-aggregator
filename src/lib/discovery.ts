import stringSimilarity from 'string-similarity';

/**
 * Generates common URL slug candidates from a problem title.
 */
function getSlugCandidates(title: string): string[] {
  const clean = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim();
  const words = clean.split(/\s+/);
  const standard = words.join('-');
  
  const candidates = new Set<string>();
  candidates.add(standard);

  // Variations for "solve" / "solver"
  if (words.includes('solver') || words.includes('solve')) {
    const coreWords = words.filter(w => w !== 'solver' && w !== 'solve' && w !== 'the');
    candidates.add(`solve-${coreWords.join('-')}`);
    candidates.add(`solve-the-${coreWords.join('-')}`);
    candidates.add(coreWords.join('-'));
  }
  
  // Variations for "reverse"
  if (words[0] === 'reverse') {
    const coreWords = words.slice(1).filter(w => w !== 'a' && w !== 'an' && w !== 'the');
    candidates.add(`reverse-${coreWords.join('-')}`);
    candidates.add(`reverse-a-${coreWords.join('-')}`);
  }

  // Variations for plurals/singulars
  const singularWords = words.map(w => {
    if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    return w;
  });
  candidates.add(singularWords.join('-'));

  return Array.from(candidates);
}

/**
 * Searches for a platform link using Google Custom Search API, DuckDuckGo HTML fallback,
 * or direct candidate fetches as a last resort.
 * 
 * @param {string} title - The problem title to search.
 * @param {string} domain - The target platform domain (e.g. 'leetcode.com', 'geeksforgeeks.org').
 * @returns {Promise<{ link: string; title: string } | null>} Discovered link and its title, or null.
 */
export async function findPlatformLink(title: string, domain: string): Promise<{ link: string; title: string } | null> {
  const query = `site:${domain} "${title}"`;
  
  // 1. Try Google Custom Search JSON API if keys are available
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  
  if (apiKey && cx) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const firstItem = data.items[0];
          console.log(`[Google Search] Found URL for ${domain}: ${firstItem.link}`);
          return {
            link: firstItem.link,
            title: firstItem.title || title
          };
        }
      } else {
        console.warn(`[Google Search] API error: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.error('[Google Search] Error running custom search:', err);
    }
  }

  // 2. Try DuckDuckGo HTML scraping search
  console.log(`[Discovery] Google API keys not available/failed. Trying DuckDuckGo for query: "${query}"`);
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (res.ok) {
      const html = await res.text();
      
      // Only parse if we didn't hit bot protection (which returns a challenge containing bot text)
      if (!html.includes('bots use DuckDuckGo too')) {
        const tagRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = tagRegex.exec(html)) !== null) {
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

          if (decodedUrl.includes(domain)) {
            if (
              (domain === 'leetcode.com' && !decodedUrl.includes('/problems/')) ||
              (domain === 'hackerrank.com' && !decodedUrl.includes('/challenges/')) ||
              (domain === 'geeksforgeeks.org' && !decodedUrl.includes('/problems/')) ||
              (domain === 'codechef.com' && !decodedUrl.includes('/problems/'))
            ) {
              continue;
            }

            console.log(`[DuckDuckGo] Extracted URL for ${domain}: ${decodedUrl}`);
            return {
              link: decodedUrl,
              title: titleText || title
            };
          }
        }
      } else {
        console.warn(`[DuckDuckGo] Bot protection triggered (status 202/Accepted).`);
      }
    } else {
      console.warn(`[DuckDuckGo] Request failed with status ${res.status}`);
    }
  } catch (err) {
    console.error('[DuckDuckGo] Fetch search failed:', err);
  }

  // 3. Fall back to Direct Candidate URLs checking
  console.log(`[Discovery] Search engines failed/blocked. Falling back to direct candidate checks for domain: ${domain}`);
  const candidates = getSlugCandidates(title);
  
  for (const slug of candidates) {
    let testUrl = '';
    if (domain.includes('geeksforgeeks.org')) {
      testUrl = `https://www.geeksforgeeks.org/problems/${slug}/1`;
    } else if (domain.includes('hackerrank.com')) {
      testUrl = `https://www.hackerrank.com/challenges/${slug}/problem`;
    } else if (domain.includes('codechef.com')) {
      testUrl = `https://www.codechef.com/problems/${slug.toUpperCase().replace(/-/g, '')}`;
    } else if (domain.includes('leetcode.com')) {
      testUrl = `https://leetcode.com/problems/${slug}/`;
    } else if (domain.includes('codeforces.com')) {
      continue; // Codeforces slugs are not easily guessable from title
    }

    try {
      const res = await fetch(testUrl, {
        method: 'GET',
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
        },
      });

      if (domain.includes('geeksforgeeks.org')) {
        if (res.ok || res.status === 301 || res.status === 302) {
          const finalUrl = res.url;
          if (finalUrl && finalUrl.includes('/problems/') && !finalUrl.endsWith('/problems/')) {
            const html = await res.text();
            if (html.includes('Something went wrong') || html.includes('Oops!!') || html.includes('<title>Practice | GeeksforGeeks')) {
              continue;
            }
            console.log(`[Direct Check] Validated GeeksforGeeks candidate link: ${finalUrl}`);
            return { link: finalUrl, title };
          }
        }
      } else {
        if (res.ok) {
          console.log(`[Direct Check] Validated candidate link for ${domain}: ${res.url || testUrl}`);
          return { link: res.url || testUrl, title };
        }
      }
    } catch (e) {
      // Ignore network errors and try next candidate
    }
  }

  return null;
}

/**
 * Verifies if the discovered page title is similar to the original problem title.
 * Uses string-similarity (Dice's Coefficient) with a threshold of 0.6.
 * 
 * @param {string} originalTitle - The original problem title.
 * @param {string} discoveredTitle - The title returned by the search result.
 * @returns {boolean} True if the match is verified, false otherwise.
 */
export function verifyMatch(originalTitle: string, discoveredTitle: string): boolean {
  if (!originalTitle || !discoveredTitle) return false;

  const cleanOriginal = originalTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip common platform name suffixes from the search result title
  const cleanDiscovered = discoveredTitle
    .replace(/\s*-\s*leetcode.*/i, '')
    .replace(/\s*\|\s*geeksforgeeks.*/i, '')
    .replace(/\s*-\s*geeksforgeeks.*/i, '')
    .replace(/\s*\|\s*hackerrank.*/i, '')
    .replace(/\s*\|\s*codechef.*/i, '')
    .replace(/\s*-\s*codeforces.*/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanOriginal || !cleanDiscovered) return false;

  const score = stringSimilarity.compareTwoStrings(cleanOriginal, cleanDiscovered);
  console.log(`[Verification] Original: "${cleanOriginal}" | Discovered: "${cleanDiscovered}" | Score: ${score.toFixed(4)}`);
  
  return score >= 0.6;
}
