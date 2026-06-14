'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

/*
 * Floating colored blocks that drift around the brand grid area.
 * x/y are percentage positions, w/h in px, color is the fill.
 */
const BLOCKS = [
  { x: 48, y: 6,  w: 56, h: 28, color: '#9B5DE5' },
  { x: 35, y: 25, w: 28, h: 56, color: '#0066FF' },
  { x: 39, y: 30, w: 28, h: 28, color: '#FFB800' },
  { x: 25, y: 52, w: 28, h: 28, color: '#FF6442' },
  { x: 70, y: 55, w: 56, h: 28, color: '#00B050' },
  { x: 12, y: 72, w: 28, h: 28, color: '#FFB800' },
  { x: 78, y: 12, w: 28, h: 56, color: '#FF6442' },
  { x: 85, y: 40, w: 28, h: 28, color: '#0066FF' },
  { x: 60, y: 38, w: 28, h: 28, color: '#9B5DE5' },
  { x: 18, y: 15, w: 56, h: 28, color: '#00D26A' },
  { x: 55, y: 70, w: 28, h: 56, color: '#EE4D2D' },
  { x: 90, y: 68, w: 28, h: 28, color: '#00B050' },
];

const GRID_CELL = 28;

export function FooterSection() {
  const handleScrollToSearch = () => {
    const el = document.getElementById('search-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="w-full max-w-[1600px] mx-auto px-4 md:px-6 mb-8 mt-16">

      {/* CTA Bar */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-5"
      >
        {/* Left pill — CTA */}
        <motion.button
          onClick={handleScrollToSearch}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 sm:flex-none sm:w-[38%] bg-[#EE4D2D] hover:bg-[#d4432a] text-[#111111] rounded-full py-6 md:py-7 px-10 text-xl md:text-2xl lg:text-3xl font-black tracking-tight cursor-pointer transition-colors text-center shadow-lg shadow-red-500/15"
        >
          Start aggregating
        </motion.button>

        {/* Right pill — Input-like */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex-1 bg-[#FFB800] hover:bg-[#f5b000] rounded-full py-6 md:py-7 px-10 flex items-center cursor-pointer transition-colors shadow-lg shadow-amber-500/15"
          onClick={handleScrollToSearch}
        >
          <span className="text-[#111111]/40 text-lg md:text-xl lg:text-2xl font-bold select-none">
            Paste your first problem URL here...
          </span>
        </motion.div>

        {/* Arrow button */}
        <motion.button
          onClick={handleScrollToSearch}
          whileHover={{ scale: 1.08, rotate: 15 }}
          whileTap={{ scale: 0.95 }}
          className="shrink-0 w-16 h-16 md:w-20 md:h-20 bg-[#111111] hover:bg-stone-800 rounded-full flex items-center justify-center cursor-pointer transition-colors self-center sm:self-stretch shadow-lg shadow-black/20"
        >
          <ArrowUpRight size={30} strokeWidth={2.5} className="text-white" />
        </motion.button>
      </motion.div>

      {/* Brand Grid Area */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="relative w-full rounded-[2.5rem] overflow-hidden border border-[#111111]/10 shadow-sm"
        style={{
          height: 'clamp(400px, 55vw, 620px)',
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.06) 1px, transparent 1px)',
          backgroundSize: `${GRID_CELL}px ${GRID_CELL}px`,
          backgroundPosition: 'center center',
          backgroundColor: '#F8E9E2',
        }}
      >
        {/* Animated floating color blocks */}
        {BLOCKS.map((b, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{
              delay: 0.3 + i * 0.06,
              duration: 0.5,
              ease: 'backOut',
            }}
            animate={{
              y: [0, -4, 0, 4, 0],
              x: [0, 2, 0, -2, 0],
            }}
            // @ts-expect-error — framer motion transition override for animate
            transition={{
              delay: 0.3 + i * 0.06,
              duration: 0.5,
              ease: 'backOut',
              y: { repeat: Infinity, duration: (4 + (i % 3)) * 2, ease: 'easeInOut', delay: i * 0.3 },
              x: { repeat: Infinity, duration: (5 + (i % 4)) * 2, ease: 'easeInOut', delay: i * 0.2 },
            }}
            style={{
              top: `${b.y}%`,
              left: `${b.x}%`,
              width: b.w,
              height: b.h,
              backgroundColor: b.color,
              borderRadius: 3,
              boxShadow: `0 4px 12px ${b.color}30`,
            }}
          />
        ))}

        {/* Large brand text — bottom-left */}
        <motion.div
          className="absolute bottom-6 left-6 md:bottom-12 md:left-12 lg:bottom-16 lg:left-16"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        >
          <h2
            className="text-[#111111] leading-[0.85] tracking-tighter select-none"
            style={{ fontSize: 'clamp(4.5rem, 14vw, 12rem)', fontWeight: 900 }}
          >
            codemash.
          </h2>
        </motion.div>

        {/* Subtle tagline */}
        <motion.p
          className="absolute top-8 left-8 md:top-12 md:left-12 text-[#111111]/40 text-sm md:text-base font-bold uppercase tracking-[0.2em] select-none"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Unifying competitive coding
        </motion.p>
      </motion.div>

      {/* Footer Strip */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 px-2 pb-6"
      >
        {/* Left — Credits */}
        <div className="text-[#111111]/50 text-xs font-semibold text-center md:text-left tracking-wide">
          <p>© {new Date().getFullYear()} Codemash. Built for competitive coders everywhere.</p>
        </div>

        {/* Right — Links */}
        <div className="flex items-center gap-3">
          {['GitHub', 'Privacy Policy', 'Terms'].map((label) => (
            <motion.button
              key={label}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(17,17,17,0.08)' }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-2.5 rounded-full border border-[#111111]/12 text-[#111111]/60 text-xs font-bold hover:text-[#111111] transition-colors cursor-pointer"
            >
              {label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
