/**
 * Fetches the canonical problem title from the Alfa-LeetCode API using its title slug.
 * 
 * @param {string} slug - The title slug of the LeetCode problem.
 * @returns {Promise<string | null>} The problem title if found, or null.
 */
export async function fetchLeetCodeTitle(slug: string): Promise<string | null> {
  const url = `https://alfa-leetcode-api.onrender.com/select?titleSlug=${slug}`;
  console.log(`[Alfa-LeetCode API] Fetching title for slug: "${slug}" from: ${url}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Alfa-LeetCode API] Request failed with status ${res.status}: ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    if (data && data.title) {
      console.log(`[Alfa-LeetCode API] Resolved canonical title: "${data.title}"`);
      return data.title;
    } else {
      console.warn(`[Alfa-LeetCode API] Title field not found in response:`, data);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`[Alfa-LeetCode API] Failed to fetch slug "${slug}":`, err);
  }

  return null;
}
