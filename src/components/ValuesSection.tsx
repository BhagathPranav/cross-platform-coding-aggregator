'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

/*
 * Pixel-art grid definitions.
 * Each shape is a 2D boolean grid (12 rows × 16 cols).
 * Cells are rendered at 24×24px to align with the CSS graph-paper grid.
 */

// Shape 1: Code brackets  < / >
const BRACKETS: boolean[][] = (() => {
  const g = Array.from({ length: 12 }, () => Array(16).fill(false));
  [[2,2],[3,1],[4,0],[5,0],[6,0],[7,1],[8,2]].forEach(([r,c]) => { g[r][c] = true; g[r][c+1] = true; });
  [[2,8],[3,8],[3,7],[4,7],[5,7],[5,6],[6,6],[7,6],[7,5],[8,5]].forEach(([r,c]) => { g[r][c] = true; });
  [[2,11],[3,12],[4,13],[5,13],[6,13],[7,12],[8,11]].forEach(([r,c]) => { g[r][c] = true; g[r][c+1] = true; });
  return g;
})();

// Shape 2: Sparkle / star burst
const STAR: boolean[][] = (() => {
  const g = Array.from({ length: 12 }, () => Array(16).fill(false));
  [[1,7],[1,8],[2,7],[2,8],[3,7],[3,8],[4,7],[4,8],[5,7],[5,8],[6,7],[6,8],[7,7],[7,8],[8,7],[8,8],[9,7],[9,8],[10,7],[10,8]].forEach(([r,c]) => { g[r][c] = true; });
  [[5,3],[5,4],[5,5],[5,6],[5,9],[5,10],[5,11],[5,12],[6,3],[6,4],[6,5],[6,6],[6,9],[6,10],[6,11],[6,12]].forEach(([r,c]) => { g[r][c] = true; });
  [[3,5],[3,10],[4,6],[4,9],[7,6],[7,9],[8,5],[8,10]].forEach(([r,c]) => { g[r][c] = true; });
  return g;
})();

// Shape 3: Heart
const HEART: boolean[][] = (() => {
  const g = Array.from({ length: 12 }, () => Array(16).fill(false));
  const rows: [number, number[]][] = [
    [0, [3,4,5,   10,11,12]],
    [1, [2,3,4,5,6,  9,10,11,12,13]],
    [2, [1,2,3,4,5,6,7,8,9,10,11,12,13,14]],
    [3, [1,2,3,4,5,6,7,8,9,10,11,12,13,14]],
    [4, [1,2,3,4,5,6,7,8,9,10,11,12,13,14]],
    [5, [2,3,4,5,6,7,8,9,10,11,12,13]],
    [6, [3,4,5,6,7,8,9,10,11,12]],
    [7, [4,5,6,7,8,9,10,11]],
    [8, [5,6,7,8,9,10]],
    [9, [6,7,8,9]],
    [10,[7,8]],
  ];
  rows.forEach(([r, cols]) => cols.forEach(c => { if (c < 16) g[r][c] = true; }));
  return g;
})();

const CELL = 24;
const GRID_COLS = 16;

function PixelArt({ shape, color }: { shape: boolean[][]; color: string }) {
  const w = GRID_COLS * CELL;
  const h = 12 * CELL;
  return (
    <div className="relative" style={{ width: w, height: h }}>
      {shape.flatMap((row, ri) =>
        row.map((on, ci) =>
          on ? (
            <motion.div
              key={`${ri}-${ci}`}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                delay: (ri * GRID_COLS + ci) * 0.008,
                duration: 0.3,
                ease: 'backOut',
              }}
              style={{
                position: 'absolute',
                top: ri * CELL,
                left: ci * CELL,
                width: CELL,
                height: CELL,
                backgroundColor: color,
                borderRadius: 3,
              }}
            />
          ) : null
        )
      )}
    </div>
  );
}

const VALUES = [
  {
    shape: BRACKETS,
    color: '#00D26A',
    title: 'For Coders',
    desc: 'Everything starts with the developer experience. From instant URL resolution to seamless cross-platform search, coders always come first.',
    accent: '#00D26A',
  },
  {
    shape: STAR,
    color: '#FF6442',
    title: 'By Intelligence',
    desc: 'Nothing is guesswork. Every link is resolved through AI-powered matching, ensuring you find the right problem across every platform, every time.',
    accent: '#FF6442',
  },
  {
    shape: HEART,
    color: '#FFB800',
    title: 'With Precision',
    desc: 'At the heart of everything we build. We care about accuracy, speed, and the seamless experience of navigating the competitive coding ecosystem.',
    accent: '#FFB800',
  },
];

const cardVariants: any = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function ValuesSection() {
  return (
    <section className="w-full max-w-[1600px] mx-auto my-24 px-4 md:px-6">

      {/* Header Pill */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full bg-[#007AFF] rounded-[2rem] py-6 md:py-8 px-8 md:px-12 flex justify-between items-center mb-6 border border-[#111111]/10 shadow-lg shadow-blue-500/10"
      >
        <div className="flex items-center gap-2 text-[#FFB800]">
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
            <ArrowDown size={22} strokeWidth={3} />
          </motion.div>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 0.15 }}>
            <ArrowDown size={22} strokeWidth={3} />
          </motion.div>
        </div>
        <h2 className="text-black text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight">
          What defines us
        </h2>
        <div className="flex items-center gap-2 text-[#FFB800]">
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
            <ArrowDown size={22} strokeWidth={3} />
          </motion.div>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 0.15 }}>
            <ArrowDown size={22} strokeWidth={3} />
          </motion.div>
        </div>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {VALUES.map((v, i) => (
          <motion.div
            key={v.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="bg-[#007AFF] rounded-[2.5rem] border border-[#111111]/10 overflow-hidden flex flex-col cursor-default shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/15 transition-shadow duration-300"
          >
            {/* Graph-paper grid area with pixel art */}
            <div
              className="w-full relative border-b border-[#111111]/20 flex items-center justify-center overflow-hidden"
              style={{
                height: 'clamp(280px, 30vw, 450px)',
                backgroundImage:
                  'linear-gradient(rgba(0, 0, 0, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.5) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                backgroundPosition: 'center center',
              }}
            >
              <PixelArt shape={v.shape} color={v.color} />
            </div>

            {/* Typography area */}
            <div className="p-8 md:p-10 text-center flex-1 flex flex-col justify-center">
              {/* Accent dot */}
              <div className="flex justify-center mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.accent }} />
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black mb-4 text-[#111111] tracking-tight">
                {v.title}
              </h3>
              <p className="text-sm md:text-base font-medium leading-relaxed text-[#111111]/70 max-w-sm mx-auto">
                {v.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
