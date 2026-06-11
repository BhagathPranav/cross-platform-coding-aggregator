const PocketBase = require('pocketbase/cjs');

// Read from environment variables or use local defaults
const url = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://bhagathpranav-pocketbase-db.hf.space';
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@aggregator.local';
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123456789';

async function cleanSearchUrls() {
  const pb = new PocketBase(url);
  console.log(`Connecting to PocketBase at ${url}...`);

  try {
    // Authenticate as admin superuser (v0.24+ style)
    try {
      await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
      console.log('Authenticated successfully as Superuser.');
    } catch (e) {
      console.log('Superuser authentication failed, trying legacy admin auth...');
      await pb.admins.authWithPassword(adminEmail, adminPassword);
      console.log('Authenticated successfully as Admin (legacy).');
    }

    // Fetch all problems
    const records = await pb.collection('problems').getFullList({
      sort: 'title',
    });

    console.log(`Retrieved ${records.length} problems from database. Checking for search URLs...`);

    let updatedCount = 0;

    for (const record of records) {
      const updates = {};
      let needsUpdate = false;

      const urlFields = ['hackerrank_url', 'codechef_url', 'geeksforgeeks_url', 'codeforces_url'];

      for (const field of urlFields) {
        const val = record[field];
        if (val) {
          const lowerVal = val.toLowerCase();
          if (lowerVal.includes('search?search=') || lowerVal.includes('domains/algorithms?search=')) {
            updates[field] = null;
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        console.log(`Cleaning up search fallback URLs for problem: "${record.title}" (ID: ${record.id})`);
        await pb.collection('problems').update(record.id, updates);
        updatedCount++;
      }
    }

    console.log(`Database cleanup finished. Updated ${updatedCount} problem(s).`);

  } catch (error) {
    console.error('Cleanup process failed:', error.message || error);
    process.exit(1);
  }
}

cleanSearchUrls();
