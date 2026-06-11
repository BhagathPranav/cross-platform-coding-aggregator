import { pb } from './pocketbase';

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  leetcode_url: string | null;
  codeforces_url: string | null;
  hackerrank_url: string | null;
  codechef_url: string | null;
  gfg_url: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
}

// 10 Sample Coding Problems used as Mock Data / Seed Data
export const MOCK_PROBLEMS: CodingProblem[] = [
  {
    id: 'prob-1',
    title: 'Two Sum',
    difficulty: 'Easy',
    leetcode_url: 'https://leetcode.com/problems/two-sum/',
    codeforces_url: 'https://codeforces.com/problemset/problem/1/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/two-sum/problem',
    codechef_url: 'https://www.codechef.com/problems/TWOSUM',
    gfg_url: 'https://www.geeksforgeeks.org/problems/two-sum/'
  },
  {
    id: 'prob-2',
    title: 'LRU Cache',
    difficulty: 'Hard',
    leetcode_url: 'https://leetcode.com/problems/lru-cache/',
    codeforces_url: 'https://codeforces.com/problemset/problem/5/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/lru-cache/problem',
    codechef_url: 'https://www.codechef.com/problems/LRUCH',
    gfg_url: 'https://www.geeksforgeeks.org/problems/lru-cache/'
  },
  {
    id: 'prob-3',
    title: 'Merge Sort',
    difficulty: 'Medium',
    leetcode_url: 'https://leetcode.com/problems/sort-an-array/',
    codeforces_url: 'https://codeforces.com/problemset/problem/10/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/mergesort/problem',
    codechef_url: 'https://www.codechef.com/problems/MERGESORT',
    gfg_url: 'https://www.geeksforgeeks.org/problems/merge-sort/'
  },
  {
    id: 'prob-4',
    title: 'Binary Search',
    difficulty: 'Easy',
    leetcode_url: 'https://leetcode.com/problems/binary-search/',
    codeforces_url: 'https://codeforces.com/problemset/problem/12/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/binary-search/problem',
    codechef_url: 'https://www.codechef.com/problems/BSEARCH',
    gfg_url: 'https://www.geeksforgeeks.org/problems/binary-search/'
  },
  {
    id: 'prob-5',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    leetcode_url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    codeforces_url: 'https://codeforces.com/problemset/problem/15/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/longest-substring-without-repeating-characters/problem',
    codechef_url: 'https://www.codechef.com/problems/LSTRN',
    gfg_url: 'https://www.geeksforgeeks.org/problems/longest-substring-without-repeating-characters/'
  },
  {
    id: 'prob-6',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    leetcode_url: 'https://leetcode.com/problems/reverse-linked-list/',
    codeforces_url: 'https://codeforces.com/problemset/problem/20/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/reverse-linked-list/problem',
    codechef_url: 'https://www.codechef.com/problems/REVLIST',
    gfg_url: 'https://www.geeksforgeeks.org/problems/reverse-a-linked-list/'
  },
  {
    id: 'prob-7',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    leetcode_url: 'https://leetcode.com/problems/valid-parentheses/',
    codeforces_url: 'https://codeforces.com/problemset/problem/26/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/valid-parentheses/problem',
    codechef_url: 'https://www.codechef.com/problems/PARENTH',
    gfg_url: 'https://www.geeksforgeeks.org/problems/parenthesis-checker/'
  },
  {
    id: 'prob-8',
    title: 'Kth Largest Element in an Array',
    difficulty: 'Medium',
    leetcode_url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
    codeforces_url: 'https://codeforces.com/problemset/problem/32/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/kth-largest-element-in-an-array/problem',
    codechef_url: 'https://www.codechef.com/problems/KTHLAR',
    gfg_url: 'https://www.geeksforgeeks.org/problems/k-largest-elements/'
  },
  {
    id: 'prob-9',
    title: '3Sum',
    difficulty: 'Medium',
    leetcode_url: 'https://leetcode.com/problems/3sum/',
    codeforces_url: 'https://codeforces.com/problemset/problem/42/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/three-sum/problem',
    codechef_url: 'https://www.codechef.com/problems/THREESUM',
    gfg_url: 'https://www.geeksforgeeks.org/problems/3-sum-free/'
  },
  {
    id: 'prob-10',
    title: 'Min Stack',
    difficulty: 'Medium',
    leetcode_url: 'https://leetcode.com/problems/min-stack/',
    codeforces_url: 'https://codeforces.com/problemset/problem/50/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/min-stack/problem',
    codechef_url: 'https://www.codechef.com/problems/MINSTACK',
    gfg_url: 'https://www.geeksforgeeks.org/problems/special-stack/'
  }
];

class DatabaseService {
  private useMock: boolean = true;
  private connectionChecked: boolean = false;

  constructor() {
    // Only verify server connection on client side
    if (typeof window !== 'undefined') {
      this.checkConnection();
    }
  }

  /**
   * Checks if the PocketBase backend is reachable.
   * If reachable, enables PocketBase mode. Otherwise, transparently activates mock mode.
   */
  async checkConnection(): Promise<boolean> {
    if (this.connectionChecked) return !this.useMock;
    try {
      // Try fetching health or simple request to see if server is online
      await pb.send('/api/health', {});
      this.useMock = false;
      console.log('Connected to PocketBase successfully! Real database mode activated.');
    } catch (e) {
      this.useMock = true;
      console.warn('PocketBase server not reachable. Running in Mock Mode with LocalStorage fallback.');
    }
    this.connectionChecked = true;
    return !this.useMock;
  }

  isMockMode(): boolean {
    return this.useMock;
  }

  /**
   * Returns list of all problems.
   */
  async getProblems(): Promise<CodingProblem[]> {
    const isOnline = await this.checkConnection();
    if (!isOnline) {
      return MOCK_PROBLEMS;
    }

    try {
      const records = await pb.collection('problems').getFullList({
        sort: 'title',
      });
      return records.map(r => ({
        id: r.id,
        title: r.title,
        difficulty: r.difficulty as 'Easy' | 'Medium' | 'Hard',
        leetcode_url: r.leetcode_url || null,
        codeforces_url: r.codeforces_url || null,
        hackerrank_url: r.hackerrank_url || null,
        codechef_url: r.codechef_url || null,
        gfg_url: r.geeksforgeeks_url || null,
      }));
    } catch (e) {
      console.error('PocketBase fetch problems failed, falling back to mock problems:', e);
      return MOCK_PROBLEMS;
    }
  }

  /**
   * Returns IDs of all bookmarked problems.
   */
  async getBookmarks(userId?: string): Promise<string[]> {
    const isOnline = await this.checkConnection();
    if (!isOnline || !userId) {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`bookmarks_${userId || 'guest'}`);
        return stored ? JSON.parse(stored) : [];
      }
      return [];
    }

    try {
      const records = await pb.collection('bookmarks').getFullList({
        filter: `user = "${userId}"`,
      });
      return records.map(r => r.problem);
    } catch (e) {
      console.error('PocketBase fetch bookmarks failed, falling back to localStorage:', e);
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`bookmarks_${userId}`);
        return stored ? JSON.parse(stored) : [];
      }
      return [];
    }
  }

  /**
   * Toggles bookmark state for a problem.
   */
  async toggleBookmark(userId: string, problemId: string): Promise<boolean> {
    const isOnline = await this.checkConnection();
    if (!isOnline) {
      if (typeof window !== 'undefined') {
        const key = `bookmarks_${userId}`;
        const stored = localStorage.getItem(key);
        let bookmarks: string[] = stored ? JSON.parse(stored) : [];
        const index = bookmarks.indexOf(problemId);
        let bookmarked = false;
        if (index > -1) {
          bookmarks.splice(index, 1);
        } else {
          bookmarks.push(problemId);
          bookmarked = true;
        }
        localStorage.setItem(key, JSON.stringify(bookmarks));
        return bookmarked;
      }
      return false;
    }

    try {
      // Check if bookmark exists
      try {
        const existing = await pb.collection('bookmarks').getFirstListItem(
          `user = "${userId}" && problem = "${problemId}"`
        );
        await pb.collection('bookmarks').delete(existing.id);
        return false; // un-bookmarked
      } catch (notFound) {
        // Create new bookmark
        await pb.collection('bookmarks').create({
          user: userId,
          problem: problemId,
        });
        return true; // bookmarked
      }
    } catch (e) {
      console.error('PocketBase toggle bookmark failed, toggling in localStorage:', e);
      if (typeof window !== 'undefined') {
        const key = `bookmarks_${userId}`;
        const stored = localStorage.getItem(key);
        let bookmarks: string[] = stored ? JSON.parse(stored) : [];
        const index = bookmarks.indexOf(problemId);
        let bookmarked = false;
        if (index > -1) {
          bookmarks.splice(index, 1);
        } else {
          bookmarks.push(problemId);
          bookmarked = true;
        }
        localStorage.setItem(key, JSON.stringify(bookmarks));
        return bookmarked;
      }
      return false;
    }
  }
}

export const dbService = new DatabaseService();
