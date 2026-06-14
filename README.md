<div align="center">
  <h1>🚀 Codemash</h1>
  <p><b>Unified Cross-Platform Coding Aggregator & Bookmark Engine</b></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![PocketBase](https://img.shields.io/badge/PocketBase-v0.27-lightgrey?style=flat-square)](https://pocketbase.io/)
  [![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-ff0055?style=flat-square&logo=framer)](https://www.framer.com/motion/)
</div>

<br/>

> **Codemash** is a high-performance web application designed to solve the fragmentation in the competitive programming ecosystem. By aggregating challenges across **LeetCode, Codeforces, HackerRank, CodeChef, and GeeksforGeeks**, it allows developers to search once, map equivalent problems instantly, and sync unified bookmarks across a resilient, self-healing database architecture.

Designed with a premium editorial aesthetic, glassmorphic interfaces, and a sophisticated dual-engine storage pattern, Codemash is built to demonstrate production-readiness, edge-case handling, and advanced frontend engineering.

---

## 🏗️ Engineering & Architectural Deep Dive

This project was engineered to solve complex, real-world frontend and distributed database challenges. These highlights represent the core technical achievements of the application:

### 1. Resilient Offline-First "Dual-Engine" Architecture
To guarantee zero downtime and immediate usability, the application implements a transparent storage facade. 
* **The Challenge:** Users drop off if forced to authenticate immediately, and network latency can degrade perceived performance.
* **The Solution:** Developed a transparent **Offline Simulated Mode**. When unauthenticated or if the remote PocketBase server is unreachable, the app automatically falls back to `localStorage` to simulate authentication, sessions, and bookmark persistence. Upon successful login, the app seamlessly transitions to server-side synchronization without interrupting the user experience.

### 2. Self-Healing State Synchronization & Migration
Migrating local, offline guest data to a live relational database without duplicating records or breaking primary keys requires complex state management.
* **The Challenge:** Guest sessions use static mock IDs (e.g., `prob-1`), while the live PostgreSQL/SQLite database generates dynamic alphanumeric IDs.
* **The Solution:** Engineered a self-healing middleware pipeline in TypeScript. Upon authentication, the storage service automatically parses local data, queries the live database for existing matches, and performs a real-time state mutation to map mock IDs to authoritative database IDs. This eliminates cache mismatching and ensures 100% data integrity during the offline-to-online transition.

### 3. Concurrency Management & SDK Optimization
Optimizing data fetching on initial component mount to prevent network throttling.
* **The Challenge:** By default, the PocketBase SDK aggressively auto-cancels pending duplicate HTTP requests, throwing `ClientResponseError: isAbort` during parallel component mounting.
* **The Solution:** Bypassed the default auto-cancellation bottlenecks by architecting custom `requestKey: null` query parameter injections into the data-fetching layer. This allows safe, concurrent parallel database reads, reducing initial page load metrics and eliminating network abort errors.

### 4. Mathematical Animation Interpolation (Custom Engine)
Standard browser scrolling lacked the premium, deliberate pacing required for the application's aesthetic.
* **The Challenge:** Native `scroll-behavior: smooth` provides zero control over duration or easing curves.
* **The Solution:** Built a bespoke, math-driven scroll engine using `requestAnimationFrame`. Implemented a custom **Cubic Ease-In-Out** interpolation function (`t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2`) to calculate precise sub-pixel viewport mutations over a strict 1.4-second duration, delivering a high-end, cinematic scroll experience.

### 5. Hardware-Accelerated 3D Render Optimization
The application features a heavy, infinite concentric 3D wireframe tunnel animation rendering in real-time.
* **The Challenge:** Infinite scaling animations routinely cause main-thread blocking, GPU layout thrashing, and extreme frame drops on lower-end devices.
* **The Solution:** Heavily optimized the Framer Motion render cycle. Implemented a strict maximum scale boundary, utilized hardware-accelerated CSS layers via the `will-change: transform, opacity` property, and built a custom React SSR hydration guard. This offloads the rendering exclusively to the GPU, locking the animation at a buttery-smooth 60fps even on mobile devices.

---

## 🛠️ Tech Stack & Ecosystem

**Frontend Core:**
* **Next.js 16** (App Router, React 19, Server Components)
* **TypeScript** (Strict mode, custom interfaces, utility types)

**Styling & Presentation:**
* **Tailwind CSS v4** (Post-CSS, custom layout grids, custom CSS variables)
* **Framer Motion v12** (Complex orchestration, 3D CSS perspective animations)
* **Lucide React** (Consistent, scalable vector iconography)

**Data & Search Layer:**
* **PocketBase v0.27** (Go-based embedded backend, real-time subscriptions, auth)
* **Fuse.js v7** (Client-side fuzzy searching, weighted keyword indexing)

---

## 📂 Project Architecture

```text
├── public/                 # Static public assets and upscaled hero backdrops
├── src/
│   ├── app/                # Next.js App Router (Layouts, Pages, Providers)
│   │   ├── globals.css     # CSS custom variables, glassmorphism, scrollbars
│   │   ├── layout.tsx      # Root Layout & SEO configuration
│   │   ├── page.tsx        # Main dashboard (Search engine, controls, unified lists)
│   │   └── providers.tsx   # Auth Context (PocketBase vs Mock state controller)
│   ├── components/         # Premium UI Modules
│   │   ├── AboutSection.tsx# Concentric wireframe 3D tunnel animation engine
│   │   ├── FooterSection.tsx# Calmer, slow-drifting footer brand graphics
│   │   ├── LoginModal.tsx  # Authentication modal with state validation
│   │   ├── PlatformIcon.tsx# Custom SVG platform brand marks component
│   │   ├── ResultsCard.tsx # Detailed mapping card with platform launch keys
│   │   └── ui/             # Reusable atomic UI components
│   ├── lib/                # Shared Utility & Logic Layer
│   │   ├── db.ts           # DB service, self-healing sync, seeder lookup logic
│   │   ├── parser.ts       # URL slug extractor and platform regex resolver
│   │   └── pocketbase.ts   # PocketBase singleton client & generic types
│   └── scripts/            # Database CI/CD Utilities
│       └── seed.js         # Schema compiler and initial records seeder
🚀 Local Development Setup
Prerequisites
Node.js (v18 or higher)

Git

1. Frontend Setup
Clone the repository and install dependencies:

Bash
git clone [https://github.com/BhagathPranav/cross-platform-coding-aggregator.git](https://github.com/BhagathPranav/cross-platform-coding-aggregator.git)
cd cross-platform-coding-aggregator
npm install
Start the Next.js development server:

Bash
npm run dev
Note: The application will automatically initialize in Mock Mode, allowing you to test UI, search, and local bookmarks immediately at http://localhost:3000 without a backend.

🗄️ Backend Setup (PocketBase)
To experience the full distributed system, authentication, and live data persistence, run the local PocketBase server.

1. Initialize the Database
Download the executable for your OS from pocketbase.io.

Place the executable outside your src folder and start the server:

Bash
./pocketbase serve
(The server runs locally on port 8090 by default).

2. Environment Configuration
Create a .env.local file in the root of the Next.js project to point the frontend to your local database instance:

Code snippet
NEXT_PUBLIC_POCKETBASE_URL=[http://127.0.0.1:8090](http://127.0.0.1:8090)
POCKETBASE_ADMIN_EMAIL=admin@aggregator.local
POCKETBASE_ADMIN_PASSWORD=admin123456789
3. Database Seeding
Instead of manually configuring collections in the PocketBase Admin UI, run the automated seeder script. This script connects to the backend, defines the schema constraints for problems and bookmarks, registers the admin superuser, and seeds a robust set of interconnected coding challenges.

Bash
npm run seed
