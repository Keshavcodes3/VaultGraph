"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Magnetic } from "./Navbar";
import { Reveal, useCalm } from "./Reveal";

function MiniGraph() {
  return (
    <svg width="30" height="20" viewBox="0 0 30 20" fill="none" aria-hidden="true">
      <motion.line
        x1="5" y1="10" x2="15" y2="5"
        stroke="currentColor" strokeWidth="1.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      />
      <motion.line
        x1="5" y1="10" x2="15" y2="15"
        stroke="currentColor" strokeWidth="1.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.12 }}
      />
      <motion.line
        x1="15" y1="5" x2="25" y2="10"
        stroke="currentColor" strokeWidth="1.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.19 }}
      />
      <motion.line
        x1="15" y1="15" x2="25" y2="10"
        stroke="currentColor" strokeWidth="1.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.26 }}
      />
      {[
        [5, 10],
        [15, 5],
        [15, 15],
        [25, 10],
      ].map(([cx, cy], i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          r="2.6"
          fill="currentColor"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 500, damping: 18 }}
          className="tbox"
        />
      ))}
    </svg>
  );
}

export default function FinalCTA() {
  const calm = useCalm();
  const [hover, setHover] = useState(false);

  return (
    <section className="pt-40 pb-[180px] text-center max-sm:pt-[100px] max-sm:pb-[120px]" id="cta">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <Reveal className="flex flex-col items-center">
          <p className="font-mono text-xs font-semibold tracking-[0.2em] text-faint uppercase">
            Begin today
          </p>
          <h2 className="mt-[18px] text-[clamp(48px,8.4vw,104px)] leading-[1.02] font-semibold tracking-[-0.045em]">
            Start somewhere.
          </h2>
          <div className="mt-[26px] flex flex-wrap justify-center gap-2.5 text-[clamp(16px,2.2vw,20px)] text-muted max-sm:flex-col max-sm:gap-1.5">
            <span className="px-1">Write a note.</span>
            <span className="px-1">Connect an idea.</span>
            <span className="px-1">Build something.</span>
          </div>
          <Magnetic>
            <a
              href="#top"
              className="mt-12 inline-flex items-center gap-3 rounded-pill bg-ink py-5 pr-9 pl-10 text-lg font-semibold tracking-[-0.015em] text-white shadow-pop transition-all duration-300 hover:bg-accent hover:shadow-[0_20px_50px_-16px_rgba(79,70,229,0.6)]"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onFocus={() => setHover(true)}
              onBlur={() => setHover(false)}
            >
              Enter VaultGraph
              <span className="inline-flex w-[30px] justify-center">
                <AnimatePresence mode="wait" initial={false}>
                  {hover && !calm ? (
                    <motion.span
                      key="graph"
                      className="inline-flex items-center"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.22 }}
                    >
                      <MiniGraph />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="arrow"
                      className="inline-flex items-center"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.22 }}
                    >
                      <ArrowRight size={20} strokeWidth={2.2} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </a>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  );
}
