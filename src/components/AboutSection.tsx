'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Database, Link2, Sun, Info } from 'lucide-react';



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

      {/* RIGHT CARD: 3D Infinite Tunnel (60% width on Desktop) */}
      <div className="lg:col-span-7 relative w-full h-full min-h-[400px] bg-[#F4F3EF] rounded-[3rem] border border-black/10 overflow-hidden flex items-center justify-center">
        
        {/* The center focal point */}
        <div className="absolute z-10 w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center text-white font-mono font-bold text-2xl shadow-2xl">
          {"{ }"}
        </div>

        {/* The hypnotic scaling frames */}
        {/* We use strict dimensions and absolute Flexbox centering so scale never conflicts. */}
        {/* We iterate 10 times to form a deep, infinite staggered tunnel. */}
        {[...Array(10)].map((_, i) => {
          // Vibrant platform/brand colors to cycle through
          const colors = [
            'border-gray-300', 
            'border-[#FFB800]', // Mustard
            'border-[#FF6442]', // Coral
            'border-[#D1B3FF]'  // Lavender
          ];
          const colorClass = colors[i % colors.length];

          return (
            <motion.div
              key={i}
              // bg-transparent and thick borders (3px) create the essential wireframe look.
              className={`absolute border-[3px] bg-transparent ${colorClass}`}
              // We explicitly set equal dimensions here to maintain the square geometry during scaling.
              style={{ width: '200px', height: '200px', borderRadius: '2rem' }} 
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{
                scale: [0.1, 4],         // Start tiny, scale up massively past the screen bounds
                opacity: [0, 1, 1, 0]    // Fade in, stay visible, fade out right before edge
              }}
              transition={{
                duration: 6,             // Total journey time for one frame
                repeat: Infinity,        // Loop forever
                ease: "linear",          // Constant speed is crucial for the tunnel illusion
                delay: i * 0.6,          // Stagger frames perfectly to form the infinite corridor
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
