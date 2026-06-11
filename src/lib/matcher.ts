import Fuse from 'fuse.js';

/**
 * Fuzzy matches a canonical problem title against a list of problem records using Fuse.js.
 * 
 * @param {string} canonicalTitle - The LeetCode canonical title.
 * @param {any[]} platformData - Array of stored coding problem objects from the database.
 * @returns {any | null} The closest matching problem object if score is within threshold, otherwise null.
 */
export function findPlatformMatches(canonicalTitle: string, platformData: any[]): any | null {
  if (!canonicalTitle || !platformData || platformData.length === 0) {
    return null;
  }

  // Configure Fuse.js options
  const fuseOptions = {
    keys: ['title'],
    threshold: 0.3, // strict threshold to prevent false-positive matching
    includeScore: true
  };

  const fuse = new Fuse(platformData, fuseOptions);
  const results = fuse.search(canonicalTitle);

  console.log(`[Fuzzy Matcher] Searching matches for: "${canonicalTitle}". Found ${results.length} results.`);
  
  if (results.length > 0) {
    const bestMatch = results[0];
    console.log(`[Fuzzy Matcher] Best match: "${bestMatch.item.title}" (Score: ${bestMatch.score?.toFixed(4)})`);
    return bestMatch.item;
  }

  console.log(`[Fuzzy Matcher] No satisfactory matches found within threshold for: "${canonicalTitle}"`);
  return null;
}
