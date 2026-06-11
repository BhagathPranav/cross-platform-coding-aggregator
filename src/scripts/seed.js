const PocketBase = require('pocketbase/cjs');

// Read from env or use defaults
const url = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@aggregator.local';
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123456789';

const PROBLEMS_TO_SEED = [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    leetcode_url: 'https://leetcode.com/problems/two-sum/',
    codeforces_url: 'https://codeforces.com/problemset/problem/1/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/two-sum/problem',
    codechef_url: 'https://www.codechef.com/problems/TWOSUM',
    geeksforgeeks_url: 'https://www.geeksforgeeks.org/problems/two-sum-problem/'
  },
  {
    title: 'LRU Cache',
    difficulty: 'Hard',
    leetcode_url: 'https://leetcode.com/problems/lru-cache/',
    codeforces_url: 'https://codeforces.com/problemset/problem/5/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/lru-cache/problem',
    codechef_url: 'https://www.codechef.com/problems/LRUCH',
    geeksforgeeks_url: 'https://www.geeksforgeeks.org/problems/lru-cache/'
  },
  {
    title: 'Merge Sort',
    difficulty: 'Medium',
    leetcode_url: 'https://leetcode.com/problems/sort-an-array/',
    codeforces_url: 'https://codeforces.com/problemset/problem/10/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/mergesort/problem',
    codechef_url: 'https://www.codechef.com/problems/MERGESORT',
    geeksforgeeks_url: 'https://www.geeksforgeeks.org/problems/merge-sort/'
  },
  {
    title: 'Binary Search',
    difficulty: 'Easy',
    leetcode_url: 'https://leetcode.com/problems/binary-search/',
    codeforces_url: 'https://codeforces.com/problemset/problem/12/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/binary-search/problem',
    codechef_url: 'https://www.codechef.com/problems/BSEARCH',
    geeksforgeeks_url: 'https://www.geeksforgeeks.org/problems/binary-search/'
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    leetcode_url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    codeforces_url: 'https://codeforces.com/problemset/problem/15/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/longest-substring-without-repeating-characters/problem',
    codechef_url: 'https://www.codechef.com/problems/LSTRN',
    geeksforgeeks_url: 'https://www.geeksforgeeks.org/problems/longest-substring-without-repeating-characters/'
  },
  {
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    leetcode_url: 'https://leetcode.com/problems/reverse-linked-list/',
    codeforces_url: 'https://codeforces.com/problemset/problem/20/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/reverse-linked-list/problem',
    codechef_url: 'https://www.codechef.com/problems/REVLIST',
    geeksforgeeks_url: 'https://www.geeksforgeeks.org/problems/reverse-a-linked-list/'
  },
  {
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    leetcode_url: 'https://leetcode.com/problems/valid-parentheses/',
    codeforces_url: 'https://codeforces.com/problemset/problem/26/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/valid-parentheses/problem',
    codechef_url: 'https://www.codechef.com/problems/PARENTH',
    geeksforgeeks_url: 'https://www.geeksforgeeks.org/problems/parenthesis-checker/'
  },
  {
    title: 'Kth Largest Element in an Array',
    difficulty: 'Medium',
    leetcode_url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
    codeforces_url: 'https://codeforces.com/problemset/problem/32/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/kth-largest-element-in-an-array/problem',
    codechef_url: 'https://www.codechef.com/problems/KTHLAR',
    geeksforgeeks_url: 'https://www.geeksforgeeks.org/problems/k-largest-elements/'
  },
  {
    title: '3Sum',
    difficulty: 'Medium',
    leetcode_url: 'https://leetcode.com/problems/3sum/',
    codeforces_url: 'https://codeforces.com/problemset/problem/42/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/three-sum/problem',
    codechef_url: 'https://www.codechef.com/problems/THREESUM',
    geeksforgeeks_url: 'https://www.geeksforgeeks.org/problems/3-sum-free/'
  },
  {
    title: 'Min Stack',
    difficulty: 'Medium',
    leetcode_url: 'https://leetcode.com/problems/min-stack/',
    codeforces_url: 'https://codeforces.com/problemset/problem/50/A',
    hackerrank_url: 'https://www.hackerrank.com/challenges/min-stack/problem',
    codechef_url: 'https://www.codechef.com/problems/MINSTACK',
    geeksforgeeks_url: 'https://www.geeksforgeeks.org/problems/special-stack/'
  }
];

async function seed() {
  const pb = new PocketBase(url);

  console.log(`Connecting to PocketBase at ${url}...`);

  try {
    // 1. Try to create the admin account first (if it's a completely fresh setup)
    try {
      await pb.admins.create({
        email: adminEmail,
        password: adminPassword,
        passwordConfirm: adminPassword,
      });
      console.log(`Admin account ${adminEmail} created successfully.`);
    } catch (adminExistsError) {
      // Admin might already exist, which is fine
    }

    // 2. Authenticate as admin
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('Authenticated successfully as Admin.');

    // 3. Create 'problems' collection if not exists
    let problemsCol;
    try {
      problemsCol = await pb.collections.getOne('problems');
      console.log('Collection "problems" already exists.');
    } catch (e) {
      console.log('Creating "problems" collection...');
      problemsCol = await pb.collections.create({
        name: 'problems',
        type: 'base',
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'difficulty', type: 'text', required: true },
          { name: 'leetcode_url', type: 'text' },
          { name: 'codeforces_url', type: 'text' },
          { name: 'hackerrank_url', type: 'text' },
          { name: 'codechef_url', type: 'text' },
          { name: 'geeksforgeeks_url', type: 'text' }
        ],
        listRule: '', // anyone can list
        viewRule: '', // anyone can view
        createRule: null, // admin only
        updateRule: null, // admin only
        deleteRule: null  // admin only
      });
      console.log('Collection "problems" created successfully.');
    }

    // 4. Create 'bookmarks' collection if not exists
    try {
      await pb.collections.getOne('bookmarks');
      console.log('Collection "bookmarks" already exists.');
    } catch (e) {
      console.log('Creating "bookmarks" collection...');
      await pb.collections.create({
        name: 'bookmarks',
        type: 'base',
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            maxSelect: 1,
            collectionId: '_pb_users_auth_',
            cascadeDelete: true
          },
          {
            name: 'problem',
            type: 'relation',
            required: true,
            maxSelect: 1,
            collectionId: problemsCol.id,
            cascadeDelete: true
          }
        ],
        listRule: '@request.auth.id != "" && user = @request.auth.id', // user can see their own
        viewRule: '@request.auth.id != "" && user = @request.auth.id', // user can view their own
        createRule: '@request.auth.id != "" && user = @request.auth.id', // user can create their own
        updateRule: '@request.auth.id != "" && user = @request.auth.id', // user can update their own
        deleteRule: '@request.auth.id != "" && user = @request.auth.id'  // user can delete their own
      });
      console.log('Collection "bookmarks" created successfully.');
    }

    // 5. Seed problems
    console.log('Seeding coding problems...');
    for (const prob of PROBLEMS_TO_SEED) {
      try {
        // Check if problem already exists by title
        const existing = await pb.collection('problems').getList(1, 1, {
          filter: `title = "${prob.title}"`
        });

        if (existing.items.length === 0) {
          await pb.collection('problems').create(prob);
          console.log(`- Inserted: "${prob.title}"`);
        } else {
          console.log(`- Skipped (already exists): "${prob.title}"`);
        }
      } catch (err) {
        console.error(`- Error inserting "${prob.title}":`, err.message);
      }
    }

    console.log('Database seeding finished successfully!');

  } catch (error) {
    console.error('Seeding process failed:', error.message || error);
    process.exit(1);
  }
}

seed();
