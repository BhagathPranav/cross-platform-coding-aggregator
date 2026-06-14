# 🚀 Codemash | Unified Cross-Platform Coding Aggregator

**Codemash** is an advanced, high-performance web application built using **Next.js 16 (React 19)** and **PocketBase**. It aggregates coding challenges across five major platforms—**LeetCode**, **Codeforces**, **HackerRank**, **CodeChef**, and **GeeksforGeeks**—allowing developers to search once, map equivalent problems, and sync bookmarks across multiple platforms seamlessly.

Designed with a premium dark/light mode aesthetic, responsive glassmorphic interfaces, and a self-healing dual-engine storage architecture, Codemash is a complete production-ready showcase of modern web engineering.

---

## 🏗️ Architectural & Engineering Highlights

This project implements several advanced software engineering patterns designed to solve common real-world frontend and database challenges:

### 1. Transparent Dual-Engine Architecture
* **Offline Mock Fallback:** If the remote database is unreachable or offline, the app transparently switches to an **Offline Simulated Mode**. It continues to function seamlessly out-of-the-box by falling back to `localStorage` for simulated user authentication and bookmark storage.
* **Online Database Mode:** Once a connection is established with PocketBase, it transitions to server-side sync with minimal overhead.

### 2. Self-Healing Storage Migration
* **Dynamic ID Mapping:** Guest/mock sessions utilize static IDs (like `prob-1`, `prob-2`). The live database generates dynamic alphanumeric IDs (`36352a9k0l65z87`). 
* **State Synchronization:** The storage service automatically detects if local storage contains stale mock IDs when online (and vice-versa). It executes a self-healing lookup, queries the database, and heals the ID mappings in `localStorage` in real-time, eliminating caching mismatches.

### 3. PocketBase Request Deduplication
* **Auto-Cancellation Prevention:** By default, the PocketBase SDK auto-cancels pending duplicate HTTP requests, throwing `ClientResponseError: isAbort` on concurrent page-mount queries. 
* **Concurrent Resolution:** We resolved this by implementing custom `requestKey: null` query parameters on all database read operations, enabling safe parallel requests to execute without interference.

### 4. Custom Interpolated Smooth-Scroll Engine
* **Smooth Easing:** Instead of using browser-native `scroll-behavior: smooth` (which lacks duration controls), we built a custom easing engine using `requestAnimationFrame` and a **Cubic Ease-In-Out** mathematical interpolation function.
* **Premium UX:** This enables a slow, calm, and premium 1.4-second scroll effect to transition the viewport to the problems panel.

### 5. High-Performance 3D Animations
* **GPU Optimization:** The right-side infinite perspective tunnel is built using concentric Framer Motion rings.
* **Rendering Guard:** Includes an SSR hydration guard, a maximum scale boundary (capped at `8` to avoid GPU layout thrashing), and `will-change` CSS property layers to offload animations to the GPU, guaranteeing a consistent 60fps render.

---

## 🛠️ Tech Stack & Libraries

* **Framework:** Next.js 16 (App Router, TypeScript, React 19)
* **Animations:** Framer Motion (v12)
* **Styling:** Tailwind CSS (v4 post-css) & Custom CSS variables
* **Database & Auth:** PocketBase (v0.27.0)
* **Fuzzy Search:** Fuse.js (v7) for client-side problem indexing
* **Icons:** Lucide React

---

## 📂 Project Structure

```
├── public/                 # Static public assets (upscaled hero backdrops)
├── src/
│   ├── app/                # Next.js App Router (Layouts, Pages, Providers)
│   │   ├── globals.css     # CSS custom variables, glassmorphism, scrollbars
│   │   ├── layout.tsx      # Root Layout & SEO configuration
│   │   ├── page.tsx        # Main dashboard page (Search engine, controls, lists)
│   │   └── providers.tsx   # Auth Context (PocketBase vs Mock controller)
│   ├── components/         # Premium UI Components
│   │   ├── AboutSection.tsx # Concentric wireframe 3D tunnel animation
│   │   ├── FooterSection.tsx# Calmer, slow-drifting footer brand graphics
│   │   ├── LoginModal.tsx  # Authentication modal dialog
│   │   ├── PlatformIcon.tsx# Custom SVG platform brand marks
│   │   ├── ResultsCard.tsx # Detailed card with platform launch keys
│   │   └── ui/             # Core UI components
│   ├── lib/                # Shared Utility Layer
│   │   ├── db.ts           # Database service, self-healing sync, seeder lookup
│   │   ├── parser.ts       # URL slug extractor and platform regex resolver
│   │   └── pocketbase.ts   # PocketBase singleton client setup
│   └── scripts/            # Database Seed Utilities
│       └── seed.js         # Collection schema compiler and initial records seeder
```

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* NPM or Yarn

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BhagathPranav/cross-platform-coding-aggregator.git
   cd cross-platform-coding-aggregator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser. The application runs in **Mock Mode** automatically.

---

## 🗄️ Setting Up PocketBase Backend (Optional)

To enable live data persistence and authenticated users, configure a local or remote PocketBase database:

1. **Download PocketBase:**
   Get the appropriate binary from [pocketbase.io](https://pocketbase.io/).

2. **Run PocketBase:**
   Start the local server (listens on port `8090` by default):
   ```bash
   ./pocketbase serve
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the Next.js root:
   ```env
   NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
   POCKETBASE_ADMIN_EMAIL=admin@aggregator.local
   POCKETBASE_ADMIN_PASSWORD=admin123456789
   ```

4. **Seed the database:**
   Execute the seeder script. This automatically creates the schema collections (`problems`, `bookmarks`), registers the admin superuser, and seeds 10 complex coding challenges:
   ```bash
   npm run seed
   ```

---

## 📈 Key Resume Bullets (For Portfolios)
If you are adding this project to your resume, here are key highlights of what you accomplished:
* **Engineered a self-healing hybrid sync system** in TypeScript that detects and migrates offline guest bookmarks (`localStorage`) to dynamic PostgreSQL-based relational records on authentication, eliminating state mismatch.
* **Bypassed concurrent request auto-cancellation limits** in PocketBase by implementing custom request key bypasses, allowing parallel landing page calls to load simultaneously without network abort warnings.
* **Designed a custom math-interpolated smooth-scroll animator** using `requestAnimationFrame` and cubic-bezier interpolation to deliver a bespoke, high-end scroll progression that outperforms standard browser defaults.
* **Optimized heavy Framer Motion 3D rendering operations** using hardware-accelerated CSS layers (`will-change`), maximum-bounds constraints, and hydration guards, reducing layout thrashing and maintaining a smooth 60fps frame rate.
