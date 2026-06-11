import { pb } from './pocketbase';

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  leetcodeUrl?: string;
  codeforcesUrl?: string;
  hackerrankUrl?: string;
  codechefUrl?: string;
  geeksforgeeksUrl?: string;
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
    leetcodeUrl: 'https://leetcode.com/problems/two-sum/',
    codeforcesUrl: 'https://codeforces.com/problemset/problem/1/A',
    hackerrankUrl: 'https://www.hackerrank.com/challenges/two-sum/problem',
    codechefUrl: 'https://www.codechef.com/problems/TWOSUM',
    geeksforgeeksUrl: 'https://www.geeksforgeeks.org/problems/two-sum-problem/'
  },
  {
    id: 'prob-2',
    title: 'LRU Cache',
    difficulty: 'Hard',
    leetcodeUrl: 'https://leetcode.com/problems/lru-cache/',
    codeforcesUrl: 'https://codeforces.com/problemset/problem/5/A',
    hackerrankUrl: 'https://www.hackerrank.com/challenges/lru-cache/problem',
    codechefUrl: 'https://www.codechef.com/problems/LRUCH',
    geeksforgeeksUrl: 'https://www.geeksforgeeks.org/problems/lru-cache/'
  },
  {
    id: 'prob-3',
    title: 'Merge Sort',
    difficulty: 'Medium',
    leetcodeUrl: 'https://leetcode.com/problems/sort-an-array/',
    codeforcesUrl: 'https://codeforces.com/problemset/problem/10/A',
    hackerrankUrl: 'https://www.hackerrank.com/challenges/mergesort/problem',
    codechefUrl: 'https://www.codechef.com/problems/MERGESORT',
    geeksforgeeksUrl: 'https://www.geeksforgeeks.org/problems/merge-sort/'
  },
  {
    id: 'prob-4',
    title: 'Binary Search',
    difficulty: 'Easy',
    leetcodeUrl: 'https://leetcode.com/problems/binary-search/',
    codeforcesUrl: 'https://codeforces.com/problemset/problem/12/A',
    hackerrankUrl: 'https://www.hackerrank.com/challenges/binary-search/problem',
    codechefUrl: 'https://www.codechef.com/problems/BSEARCH',
    geeksforgeeksUrl: 'https://www.geeksforgeeks.org/problems/binary-search/'
  },
  {
    id: 'prob-5',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    leetcodeUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    codeforcesUrl: 'https://codeforces.com/problemset/problem/15/A',
    hackerrankUrl: 'https://www.hackerrank.com/challenges/longest-substring-without-repeating-characters/problem',
    codechefUrl: 'https://www.codechef.com/problems/LSTRN',
    geeksforgeeksUrl: 'https://www.geeksforgeeks.org/problems/longest-substring-without-repeating-characters/'
  },
  {
    id: 'prob-6',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    leetcodeUrl: 'https://leetcode.com/problems/reverse-linked-list/',
    codeforcesUrl: 'https://codeforces.com/problemset/problem/20/A',
    hackerrankUrl: 'https://www.hackerrank.com/challenges/reverse-linked-list/problem',
    codechefUrl: 'https://www.codechef.com/problems/REVLIST',
    geeksforgeeksUrl: 'https://www.geeksforgeeks.org/problems/reverse-a-linked-list/'
  },
  {
    id: 'prob-7',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    leetcodeUrl: 'https://leetcode.com/problems/valid-parentheses/',
    codeforcesUrl: 'https://codeforces.com/problemset/problem/26/A',
    hackerrankUrl: 'https://www.hackerrank.com/challenges/valid-parentheses/problem',
    codechefUrl: 'https://www.codechef.com/problems/PARENTH',
    geeksforgeeksUrl: 'https://www.geeksforgeeks.org/problems/parenthesis-checker/'
  },
  {
    id: 'prob-8',
    title: 'Kth Largest Element in an Array',
    difficulty: 'Medium',
    leetcodeUrl: 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
    codeforcesUrl: 'https://codeforces.com/problemset/problem/32/A',
    hackerrankUrl: 'https://www.hackerrank.com/challenges/kth-largest-element-in-an-array/problem',
    codechefUrl: 'https://www.codechef.com/problems/KTHLAR',
    geeksforgeeksUrl: 'https://www.geeksforgeeks.org/problems/k-largest-elements/'
  },
  {
    id: 'prob-9',
    title: '3Sum',
    difficulty: 'Medium',
    leetcodeUrl: 'https://leetcode.com/problems/3sum/',
    codeforcesUrl: 'https://codeforces.com/problemset/problem/42/A',
    hackerrankUrl: 'https://www.hackerrank.com/challenges/three-sum/problem',
    codechefUrl: 'https://www.codechef.com/problems/THREESUM',
    geeksforgeeksUrl: 'https://www.geeksforgeeks.org/problems/3-sum-free/'
  },
  {
    id: 'prob-10',
    title: 'Min Stack',
    difficulty: 'Medium',
    leetcodeUrl: 'https://leetcode.com/problems/min-stack/',
    codeforcesUrl: 'https://codeforces.com/problemset/problem/50/A',
    hackerrankUrl: 'https://www.hackerrank.com/challenges/min-stack/problem',
    codechefUrl: 'https://www.codechef.com/problems/MINSTACK',
    geeksforgeeksUrl: 'https://www.geeksforgeeks.org/problems/special-stack/'
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
        leetcodeUrl: r.leetcode_url || undefined,
        codeforcesUrl: r.codeforces_url || undefined,
        hackerrankUrl: r.hackerrank_url || undefined,
        codechefUrl: r.codechef_url || undefined,
        geeksforgeeksUrl: r.geeksforgeeks_url || undefined,
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
