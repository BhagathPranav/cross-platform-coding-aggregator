import { normalizeTitleToSlug } from './parser';

/**
 * Generates probabilistic platform-specific URL permutations for a problem title.
 * 
 * @param {string} title - The title of the problem.
 * @returns {Record<string, string[]>} Record of platform names to lists of potential URLs.
 */
export function generatePermutations(title: string): Record<string, string[]> {
  const slug = normalizeTitleToSlug(title);
  if (!slug) {
    return {
      leetcode: [],
      geeksforgeeks: [],
      hackerrank: [],
      codechef: [],
      codeforces: []
    };
  }

  // GeeksforGeeks permutations
  const gfgPermutations = [
    `https://www.geeksforgeeks.org/problems/${slug}/1`,
    `https://www.geeksforgeeks.org/problems/${slug}-problem/1`,
    `https://www.geeksforgeeks.org/problems/${slug}/`,
    `https://www.geeksforgeeks.org/problems/${slug}-problem/`
  ];

  // HackerRank permutations
  const hackerrankPermutations = [
    `https://www.hackerrank.com/challenges/${slug}/problem`
  ];

  // CodeChef permutations
  // e.g. "two-sum" -> "TWOSUM" and "TWO-SUM"
  const cleanCodechefSlug = slug.toUpperCase().replace(/-/g, '');
  const codechefPermutations = [
    `https://www.codechef.com/problems/${cleanCodechefSlug}`,
    `https://www.codechef.com/problems/${slug.toUpperCase()}`
  ];

  // LeetCode permutations
  const leetcodePermutations = [
    `https://leetcode.com/problems/${slug}/`
  ];

  return {
    leetcode: leetcodePermutations,
    geeksforgeeks: gfgPermutations,
    hackerrank: hackerrankPermutations,
    codechef: codechefPermutations,
    codeforces: [] // Codeforces URLs require numeric contest IDs which cannot be generated probabilistically
  };
}

/**
 * Validates a single URL using a HEAD request (or GET for GeeksforGeeks) with a strict timeout.
 * 
 * @param {string} url - The URL to validate.
 * @param {number} timeoutMs - Timeout limit in milliseconds. Default is 1500ms.
 * @returns {Promise<boolean>} True if the URL is valid, false otherwise.
 */
export async function validateUrl(url: string, timeoutMs: number = 1500): Promise<boolean> {
  const isGFG = url.includes('geeksforgeeks.org');
  const method = isGFG ? 'GET' : 'HEAD';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.status !== 200) {
      return false;
    }

    if (isGFG) {
      // GeeksforGeeks false-positive verification (they return 200 for error pages)
      const html = await res.text();
      if (
        html.includes('Something went wrong') ||
        html.includes('Oops!!') ||
        html.includes('<title>Practice | GeeksforGeeks')
      ) {
        return false;
      }
    }

    return true;
  } catch (err) {
    clearTimeout(timeoutId);
    return false;
  }
}

/**
 * Validates all candidate URL permutations for a title in parallel.
 * 
 * @param {string} title - The problem title.
 * @returns {Promise<Record<string, string | null>>} Map of platform to validated URL (or null).
 */
export async function validatePlatformPermutations(title: string): Promise<Record<string, string | null>> {
  const permutations = generatePermutations(title);
  const platforms = ['leetcode', 'geeksforgeeks', 'hackerrank', 'codechef', 'codeforces'];

  const results = await Promise.all(
    platforms.map(async (platform) => {
      const urls = permutations[platform] || [];
      if (urls.length === 0) {
        return { platform, url: null };
      }

      // Check all URLs for this platform in parallel
      const validations = await Promise.all(
        urls.map(async (url) => {
          const isValid = await validateUrl(url);
          return isValid ? url : null;
        })
      );

      // Find the first URL that validated successfully
      const validUrl = validations.find((u) => u !== null) || null;
      return { platform, url: validUrl };
    })
  );

  const urlMap: Record<string, string | null> = {};
  for (const r of results) {
    urlMap[r.platform] = r.url;
  }

  return urlMap;
}
