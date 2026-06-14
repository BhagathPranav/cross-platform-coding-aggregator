# 🌐 Cross-Platform Coding Aggregator

A robust, full-stack web application designed to track, aggregate, and instantly search coding problems across multiple competitive programming platforms. Built with modern web standards, it ensures a seamless experience whether you are connected to the database or working offline.

## ✨ Key Features

* **Universal Problem Parsing:** Automatically parses and maps complex URL slugs for platforms like LeetCode, Codeforces, HackerRank, CodeChef, and GeeksforGeeks using custom JSDoc-documented Regex patterns.
* **Instant Fuzzy Search:** Instantly query your aggregated problem resolution list with high-performance client-side fuzzy matching.
* **Dual-Engine Fallback:** A built-in state controller guarantees high availability. If the backend is unreachable, the system safely transitions down to simulated sessions using `localStorage`.
* **Fluid & Responsive UI:** Experience 3D concentric card transitions, hardware-accelerated layouts, and sleek Light/Dark mode transitions powered by bespoke HSL color tokens.

---

## 🛠️ Tech Stack & Architecture

### Frontend & Core Framework
* **[Next.js 16 (App Router)](https://nextjs.org/):** Leverages React Server Components (RSC) and Server Actions for fast server-side execution and clean layout routing.
* **[React 19](https://react.dev/):** Utilizes the latest stable features, including new hooks, advanced resource loading, and performance optimizations.
* **TypeScript:** Fully typed codebase ensuring robust refactoring, type safety, and deep code autocomplete support across APIs and models.

### UI, Styling & Animations
* **[Tailwind CSS v4](https://tailwindcss.com/):** Hardware-accelerated layouts utilizing Tailwind's new CSS-first stylesheet configuration for modern styling primitives.
* **[Framer Motion v12](https://www.framer.com/motion/):** Powers fluid micro-animations optimized with GPU hardware layers (`will-change`).
* **Lucide React:** Modern, lightweight, and customizable vector icon pack.
* **Bespoke CSS Variables:** Curated HSL color tokens designed for seamless, automatic Light/Dark mode toggling.

### Backend & Data Layer
* **[PocketBase (v0.27.0)](https://pocketbase.io/):** A lightweight, single-file Go backend with embedded SQLite, auth, and real-time subscriptions for rapid prototyping. It handles SQL schemas, relation hooks, and automatic cascading deletes.
* **Offline-First Controller:** Graceful degradation to local storage ensures zero data-entry loss during backend downtime.

### Search & Mappings
* **[Fuse.js (v7)](https://fusejs.io/):** Powerful, lightweight client-side fuzzy search and matching library.
* **Regex Platform Parsers:** A custom engine of JSDoc-documented matching patterns built to securely extract platform domains and problem IDs from raw URLs.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher recommended)
* npm, pnpm, or yarn
* PocketBase executable

### Local Development

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/BhagathPranav/cross-platform-coding-aggregator.git](https://github.com/BhagathPranav/cross-platform-coding-aggregator.git)
   cd cross-platform-coding-aggregator
