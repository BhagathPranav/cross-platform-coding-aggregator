'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

export function Preloader() {
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    // Control scroll lock on body
    if (showPreloader) {
      document.body.classList.add('preloader-active');
    } else {
      document.body.classList.remove('preloader-active');
    }
    return () => {
      document.body.classList.remove('preloader-active');
    };
  }, [showPreloader]);

  useEffect(() => {
    // Wait for drawing, fill, and text fade-in animations to complete, then slide up
    const timer = setTimeout(() => {
      setShowPreloader(false);
    }, 2800); // 2.8s sequence hold time before starting exit animation

    return () => clearTimeout(timer);
  }, []);

  const logoPathVariants: Variants = {
    hidden: {
      pathLength: 0,
      fill: 'rgba(17, 17, 17, 0)',
    },
    visible: {
      pathLength: 1,
      fill: 'rgba(17, 17, 17, 1)',
      transition: {
        pathLength: { duration: 1.4, ease: 'easeInOut' as const },
        fill: { delay: 1.3, duration: 0.5, ease: 'easeIn' as const },
      },
    },
  };

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 1.3, // Animates in sync with logo fill
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const, // snappy easeOutExpo
      },
    },
  };

  const subtitleVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 0.5,
      y: 0,
      transition: {
        delay: 1.6, // Staggered slightly after title
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <AnimatePresence mode="wait">
      {showPreloader && (
        <motion.div
          initial={{ y: 0 }}
          exit={{ y: '-100vh' }}
          transition={{ ease: [0.76, 0, 0.24, 1] as const, duration: 1.0 }}
          className="fixed inset-0 z-[9999] bg-[#F8E9E2] flex flex-col items-center justify-center overflow-hidden select-none pointer-events-auto"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Stylized brackets { } logo */}
            <svg
              width="132"
              height="165"
              viewBox="0 0 120 150"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#111111]"
            >
              {/* Left Bracket */}
              <motion.path
                d="M 45,20 C 30,20 25,35 25,50 C 25,65 20,70 10,75 C 20,80 25,85 25,100 C 25,115 30,130 45,130"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={logoPathVariants}
                initial="hidden"
                animate="visible"
              />
              {/* Right Bracket */}
              <motion.path
                d="M 75,20 C 90,20 95,35 95,50 C 95,65 100,70 110,75 C 100,80 95,85 95,100 C 95,115 90,130 75,130"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={logoPathVariants}
                initial="hidden"
                animate="visible"
              />
            </svg>

            {/* Typography */}
            <div className="text-center space-y-2 mt-2">
              <motion.h1
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="text-6xl md:text-7xl font-black tracking-tighter text-[#111111] leading-none"
              >
                codemash.
              </motion.h1>
              <motion.p
                variants={subtitleVariants}
                initial="hidden"
                animate="visible"
                className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-[#111111] uppercase leading-none block pt-1"
              >
                Cross-Platform Aggregator
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
