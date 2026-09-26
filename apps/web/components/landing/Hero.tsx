"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import KnowledgeGraph from "./KnowledgeGraph";
import { Magnetic } from "./Navbar";
import { useCalm } from "./Reveal";

const line: Variants = {
  hidden: { opacity: 0, y: 44 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Hero() {
  const calm = useCalm();

  return (
    <section className="overflow-hidden pt-[176px] pb-10 text-center max-md:pt-[132px]" id="top">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div className="mx-auto max-w-[860px]">
          <motion.p
            className="inline-flex items-center gap-2.5 rounded-pill border border-line bg-white px-[18px] py-2 font-mono text-xs font-semibold tracking-[0.2em] text-ink-soft uppercase shadow-mini"
            initial={calm ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="h-[7px] w-[7px] rounded-full bg-brand animate-pulse-dot" />
            The knowledge workspace
          </motion.p>

          <h1 className="mt-[30px] text-[clamp(46px,8vw,96px)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance">
            <motion.span
              custom={0}
              variants={line}
              initial={calm ? false : "hidden"}
              animate="show"
              className="block"
            >
              Your knowledge,
            </motion.span>
            <motion.span
              custom={1}
              variants={line}
              initial={calm ? false : "hidden"}
              animate="show"
              className="block"
            >
              <em className="bg-[linear-gradient(100deg,var(--color-ink)_30%,var(--color-brand-deep)_75%)] bg-clip-text font-serif font-medium tracking-[-0.02em] text-transparent italic">
                beautifully connected.
              </em>
            </motion.span>
          </h1>

          <motion.p
            className="mx-auto mt-[26px] max-w-[560px] text-[clamp(17px,2.2vw,20px)] leading-[1.65] text-ink-soft text-pretty"
            initial={calm ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            Capture ideas, organize knowledge, connect everything that matters.
          </motion.p>

          <motion.div
            className="mt-[38px] flex flex-wrap items-center justify-center gap-3.5"
            initial={calm ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            <Magnetic>
              <a
                href="/register"
                className="group inline-flex items-center gap-2.5 rounded-pill bg-ink px-7 py-[15px] text-[15.5px] font-semibold tracking-[-0.01em] text-white shadow-card transition-all duration-250 hover:bg-brand hover:shadow-[0_12px_32px_-12px_rgba(79,70,229,0.55)]"
              >
                Start building
                <ArrowRight size={16} strokeWidth={2.2} className="transition-transform duration-250 group-hover:translate-x-1" />
              </a>
            </Magnetic>
            <a
              href="#product"
              className="inline-flex items-center gap-2.5 rounded-pill border border-line bg-white px-7 py-[15px] text-[15.5px] font-semibold tracking-[-0.01em] transition-all duration-250 hover:border-ink hover:bg-soft"
            >
              <LayoutDashboard size={16} strokeWidth={2} />
              Explore the workspace
            </a>
          </motion.div>
        </div>

        <motion.div
          className="relative mt-[72px] max-md:mt-12"
          initial={calm ? false : { opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <KnowledgeGraph />
          <p className="mt-1.5 font-mono text-xs tracking-[0.04em] text-faint">
            Live preview — hover the nodes to trace connections
          </p>
        </motion.div>
      </div>
    </section>
  );
}
