'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Database, Link2, Sun, Info } from 'lucide-react';

/*
 * Each tunnel "ring" carries multiple thin wall-panel strips.
 * Panels sit flush against the edges of the scaling square,
 * creating the illusion of colored tiles on corridor walls.
 *
 * position  → which wall: top / right / bottom / left
 * offset    → % distance along that wall edge (from the start corner)
 * span      → % length of the tile along that wall
 * thickness → % depth of the tile perpendicular to the wall
 * color     → hex fill
 */
type TileConfig = {
  position: 'top' | 'right' | 'bottom' | 'left';
  offset: number;
  span: number;
  thickness: number;
  color: string;
};

const RING_TILES: TileConfig[][] = [
  // Ring 0
  [
    { position: 'top',    offset: 5,  span: 55, thickness: 12, color: '#FF6442' },
    { position: 'right',  offset: 60, span: 35, thickness: 10, color: '#0066FF' },
  ],
  // Ring 1
  [
    { position: 'bottom', offset: 10, span: 45, thickness: 12, color: '#FFB800' },
    { position: 'left',   offset: 15, span: 40, thickness: 10, color: '#00B050' },
    { position: 'top',    offset: 60, span: 30, thickness: 8,  color: '#D1B3FF' },
  ],
  // Ring 2
  [
    { position: 'top',    offset: 0,  span: 40, thickness: 14, color: '#9B5DE5' },
    { position: 'right',  offset: 10, span: 50, thickness: 12, color: '#FF6442' },
    { position: 'bottom', offset: 55, span: 40, thickness: 10, color: '#00B050' },
  ],
  // Ring 3
  [
    { position: 'left',   offset: 5,  span: 30, thickness: 10, color: '#0066FF' },
    { position: 'bottom', offset: 5,  span: 50, thickness: 12, color: '#FFB800' },
    { position: 'right',  offset: 55, span: 40, thickness: 10, color: '#9B5DE5' },
  ],
  // Ring 4
  [
    { position: 'top',    offset: 10, span: 35, thickness: 10, color: '#FFB800' },
    { position: 'top',    offset: 55, span: 35, thickness: 12, color: '#FF6442' },
    { position: 'left',   offset: 20, span: 45, thickness: 12, color: '#D1B3FF' },
  ],
  // Ring 5
  [
    { position: 'right',  offset: 5,  span: 60, thickness: 14, color: '#FF6442' },
    { position: 'bottom', offset: 20, span: 35, thickness: 10, color: '#0066FF' },
  ],
  // Ring 6
  [
    { position: 'bottom', offset: 0,  span: 30, thickness: 10, color: '#00B050' },
    { position: 'bottom', offset: 40, span: 35, thickness: 12, color: '#FF6442' },
    { position: 'left',   offset: 50, span: 35, thickness: 10, color: '#FFB800' },
    { position: 'top',    offset: 30, span: 25, thickness: 8,  color: '#9B5DE5' },
  ],
  // Ring 7
  [
    { position: 'top',    offset: 5,  span: 60, thickness: 14, color: '#00B050' },
    { position: 'right',  offset: 25, span: 30, thickness: 10, color: '#0066FF' },
    { position: 'left',   offset: 60, span: 30, thickness: 10, color: '#FF6442' },
  ],
  // Ring 8
  [
    { position: 'left',   offset: 10, span: 50, thickness: 12, color: '#9B5DE5' },
    { position: 'right',  offset: 0,  span: 40, thickness: 12, color: '#FFB800' },
    { position: 'bottom', offset: 30, span: 40, thickness: 10, color: '#D1B3FF' },
  ],
  // Ring 9
  [
    { position: 'top',    offset: 20, span: 30, thickness: 10, color: '#0066FF' },
    { position: 'bottom', offset: 0,  span: 55, thickness: 12, color: '#00B050' },
    { position: 'right',  offset: 40, span: 50, thickness: 14, color: '#FF6442' },
  ],
];

function tileStyle(t: TileConfig): React.CSSProperties {
  // Tiles are positioned as percentage-based strips on the edges of the frame square
  switch (t.position) {
    case 'top':
      return { position: 'absolute', top: 0, left: `${t.offset}%`, width: `${t.span}%`, height: `${t.thickness}%`, backgroundColor: t.color };
    case 'bottom':
      return { position: 'absolute', bottom: 0, left: `${t.offset}%`, width: `${t.span}%`, height: `${t.thickness}%`, backgroundColor: t.color };
    case 'left':
      return { position: 'absolute', left: 0, top: `${t.offset}%`, height: `${t.span}%`, width: `${t.thickness}%`, backgroundColor: t.color };
    case 'right':
      return { position: 'absolute', right: 0, top: `${t.offset}%`, height: `${t.span}%`, width: `${t.thickness}%`, backgroundColor: t.color };
  }
}

const NUM_RINGS = 10;
const DURATION = 8;
const STAGGER = DURATION / NUM_RINGS; // 0.8s per ring

export function AboutSection() {
  const handleScrollToSearch = () => {
    const el = document.getElementById('search-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="w-full max-w-[1600px] mx-auto my-16 lg:my-20 px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-auto lg:h-[80vh] min-h-[750px] lg:min-h-[800px]">

      {/* LEFT CARD — col-span-5 */}
      <div className="lg:col-span-5 w-full h-full rounded-[3rem] border border-[#e8e2d8] bg-[#FDF0EB] p-8 md:p-12 lg:p-14 xl:p-20 flex flex-col justify-center shadow-sm z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-500 text-[10px] font-bold mb-6 uppercase tracking-widest w-fit">
          <Info size={12} />
          <span>Platform Overview</span>
        </div>

        <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black text-[#111111] leading-[1.1] mb-6 tracking-tighter">
          Coding platforms,<br />
          <span className="text-[#EE4D2D]">unified.</span>
        </h2>

        <p className="text-sm xl:text-base text-stone-500 font-medium leading-relaxed mb-8 max-w-xl">
          A new concept in competitive programming. Stop wasting time searching for equivalent problems across different sites. Codemash uses AI to instantly resolve problem URLs so you can focus on coding.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 mb-8">
          {[
            { icon: <Sparkles size={18} />, title: 'AI URL Resolution', desc: 'Instantly parses and maps problem links.' },
            { icon: <Database size={18} />,  title: 'Cross-Platform',    desc: 'Aggregates LeetCode, Codeforces, and more.' },
            { icon: <Link2 size={18} />,     title: 'Zero Dead Links',   desc: 'Keeps your journey smooth and live.' },
            { icon: <Sun size={18} />,       title: 'Dark/Light UI',     desc: 'Adapts seamlessly to your preference.' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-white border border-stone-100 text-[#EE4D2D] shrink-0 shadow-sm">{f.icon}</div>
              <div>
                <h4 className="font-bold text-sm xl:text-base text-[#111111] mb-0.5">{f.title}</h4>
                <p className="text-xs xl:text-sm text-stone-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleScrollToSearch}
          className="bg-[#111111] hover:bg-stone-900 text-white px-8 py-4 rounded-full font-bold w-max mt-2 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-98"
        >
          <span>Try it now</span>
          <span>↗</span>
        </button>
      </div>

      {/* RIGHT CARD: 3D Infinite Tunnel */}
      <div className="lg:col-span-7 relative aspect-square w-full h-full min-h-[400px] bg-[#F8E9E2] rounded-[3rem] border border-[#111111] overflow-hidden flex items-center justify-center mx-auto">
        
        {/* LAYER 1: Static Perspective Grid — all lines converge to center */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          {/* Corner diagonals */}
          <line x1="0" y1="0" x2="100%" y2="100%" stroke="#111111" strokeWidth="1.5" opacity="0.7" />
          <line x1="100%" y1="0" x2="0" y2="100%" stroke="#111111" strokeWidth="1.5" opacity="0.7" />
          {/* Cross-hair midlines */}
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#111111" strokeWidth="1.5" opacity="0.7" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#111111" strokeWidth="1.5" opacity="0.7" />
          {/* Secondary radials — top edge */}
          <line x1="25%" y1="0" x2="50%" y2="50%" stroke="#111111" strokeWidth="1" opacity="0.35" />
          <line x1="75%" y1="0" x2="50%" y2="50%" stroke="#111111" strokeWidth="1" opacity="0.35" />
          {/* Secondary radials — bottom edge */}
          <line x1="25%" y1="100%" x2="50%" y2="50%" stroke="#111111" strokeWidth="1" opacity="0.35" />
          <line x1="75%" y1="100%" x2="50%" y2="50%" stroke="#111111" strokeWidth="1" opacity="0.35" />
          {/* Secondary radials — left edge */}
          <line x1="0" y1="25%" x2="50%" y2="50%" stroke="#111111" strokeWidth="1" opacity="0.35" />
          <line x1="0" y1="75%" x2="50%" y2="50%" stroke="#111111" strokeWidth="1" opacity="0.35" />
          {/* Secondary radials — right edge */}
          <line x1="100%" y1="25%" x2="50%" y2="50%" stroke="#111111" strokeWidth="1" opacity="0.35" />
          <line x1="100%" y1="75%" x2="50%" y2="50%" stroke="#111111" strokeWidth="1" opacity="0.35" />
        </svg>

        {/* LAYER 2: Center vanishing-point box */}
        <div className="absolute z-30 w-16 h-16 bg-[#FDF0EB] border-2 border-[#111111] flex items-center justify-center text-[#111111] font-mono font-bold text-lg shadow-lg select-none pointer-events-none">
          {"{ }"}
        </div>

        {/* LAYER 3: Scaling corridor rings with wall-panel tiles */}
        {Array.from({ length: NUM_RINGS }, (_, i) => {
          const tiles = RING_TILES[i % RING_TILES.length];
          return (
            <motion.div
              key={i}
              className="absolute pointer-events-none"
              style={{
                width: 100,
                height: 100,
                // The visible corridor ring border
                border: '1.5px solid #111111',
              }}
              initial={{ scale: 0.05, opacity: 0 }}
              animate={{
                scale: [0.05, 20],
                opacity: [0, 0.85, 1, 1, 0],
              }}
              transition={{
                duration: DURATION,
                repeat: Infinity,
                ease: 'linear',
                delay: i * STAGGER,
              }}
            >
              {/* Thin colored wall-panel strips flush against the ring edges */}
              {tiles.map((tile, j) => (
                <div key={j} style={tileStyle(tile)} />
              ))}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
