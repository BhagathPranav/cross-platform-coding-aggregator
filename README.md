# Codemash | Cross-Platform Coding Aggregator

**Codemash** is a responsive, dark-mode-enabled Next.js 14 web application designed to aggregate coding questions across five major platforms: **LeetCode**, **Codeforces**, **HackerRank**, **CodeChef**, and **GeeksforGeeks**. 

Search once, locate the equivalents, and save them to your profile instantly.

---

## 🚀 Key Features

* **Unified Search:** Accept problem title searches (with fuzzy matching) or direct URL pastes (auto-extracts platform & problem slug to find matching records).
* **Cross-Platform Links:** Click brand-specific buttons to redirect to active problem mappings, with unavailable links beautifully desaturated.
* **Transparent Mock Fallback:** Works completely out-of-the-box! If PocketBase is offline, the app switches to **Offline Simulated Mode** using `localStorage` for profile auth and bookmarks.
* **Responsive Dark/Light Mode:** Seamlessly switch themes using `next-themes` with responsive custom HSL CSS styling.
* **PocketBase Integration:** Sync your bookmarks and authentication safely when connecting to a local or remote PocketBase backend database.

---

## 🛠️ Tech Stack

* **Framework:** Next.js 14 (App Router, TypeScript)
* **Styling:** Tailwind CSS (v4 post-css layout) & custom CSS animations
* **Database & Auth:** PocketBase
* **Search Matching:** `fuse.js` (client-side fuzzy search)
* **Icons:** Lucide Icons

---

## 📦 Project Setup

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone or download the aggregator workspace.
2. In the project root, run npm install:
   ```bash
   npm install
   ```

### Running the App

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ PocketBase Database Setup (Optional)

To enable persistent, authenticated, cross-device bookmarks and database sync, configure a local PocketBase database:

1. **Download PocketBase:**
   Download the PocketBase binary for your operating system from [pocketbase.io](https://pocketbase.io/docs/).

2. **Start the PocketBase Server:**
   Move the binary to your desired folder and execute the start command (defaults to port `8090`):
   ```bash
   ./pocketbase serve
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root of your Next.js project:
   ```env
   NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
   POCKETBASE_ADMIN_EMAIL=admin@aggregator.local
   POCKETBASE_ADMIN_PASSWORD=admin123456789
   ```

4. **Seed the Database:**
   Once your PocketBase server is running on `http://127.0.0.1:8090`, run the seeding command in your project workspace:
   ```bash
   npm run seed
   ```
   *This script will automatically authenticate as admin, build the `problems` and `bookmarks` collections, and seed 10 sample coding problems (e.g. "Two Sum", "LRU Cache") with their matching URLs.*

---

## 📂 Project Structure

```
├── public/                # Static public assets
├── src/
│   ├── app/               # Next.js App Router (Layouts, Pages, Providers)
│   │   ├── globals.css    # Custom CSS variables, scrollbars & keyframes
│   │   ├── layout.tsx     # Root Layout, SEO headers
│   │   ├── page.tsx       # Landing page (Unified search panel)
│   │   └── providers.tsx  # Auth Context (PB/Mock fallback) & Theme Provider
│   ├── components/        # Shared components
│   │   ├── PlatformIcon.tsx   # Custom SVG platforms logos
│   │   ├── ResultsCard.tsx    # Card for display coding details & launch links
│   │   └── LoginModal.tsx     # Authentication and registration dialogue
│   ├── lib/               # Database and parsing utilities
│   │   ├── db.ts          # Unified service layer (with offline fallback logic)
│   │   ├── parser.ts      # URL detector & slug extractor (with JSDoc matching)
│   │   └── pocketbase.ts  # Client instance helper
│   └── scripts/           # Seeder scripts
│       └── seed.js        # PocketBase structure compiler and seeder
├── package.json
└── tsconfig.json
```
