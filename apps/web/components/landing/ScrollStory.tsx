"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SectionHeading, useCalm } from "./Reveal";

const STAGES = [
  {
    id: "capture",
    step: "Stage 1",
    title: "Capture.",
    body: "A blank page becomes a note. Just start typing — VaultGraph keeps the shape of your thinking.",
  },
  {
    id: "connect",
    step: "Stage 2",
    title: "Connect.",
    body: "A second piece of knowledge appears. A connection line forms between them, automatically.",
  },
  {
    id: "discover",
    step: "Stage 3",
    title: "Discover.",
    body: "The view zooms out. Related notes, people and projects surface around what you're reading.",
  },
  {
    id: "build",
    step: "Stage 4",
    title: "Build.",
    body: "Everything becomes a connected workspace — a living graph you can navigate, search and grow.",
  },
];

function StoryVisual({ stage, calm }: { stage: number; calm: boolean }) {
  const showSecond = stage >= 1;
  const showContext = stage >= 2;
  const showFrame = stage >= 3;

  return (
    <svg
      viewBox="0 0 520 430"
      className="block h-auto w-full"
      role="img"
      aria-label="Animation of notes connecting into a workspace"
    >
      {showFrame && (
        <motion.g
          initial={calm ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="tbox"
        >
          <rect
            x="18"
            y="18"
            width="484"
            height="394"
            rx="26"
            className="fill-none stroke-ink/16 stroke-[1.6px]"
            strokeDasharray="8 7"
          />
          <g>
            <rect x="42" y="34" width="118" height="26" rx="13" className="fill-ink" />
            <text x="101" y="51" textAnchor="middle" className="fill-white font-sans text-[12.5px] font-semibold tracking-[0.02em]">
              Workspace
            </text>
          </g>
        </motion.g>
      )}

      <motion.g
        animate={calm ? undefined : { scale: showContext ? 0.78 : 1 }}
        transition={{ type: "spring", stiffness: 60, damping: 18 }}
        className="tbox"
      >
        {/* context nodes (discover) */}
        <motion.g
          initial={false}
          animate={{ opacity: showContext ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        >
          {[
            { x: 84, y: 92, l: "Paper" },
            { x: 436, y: 96, l: "Person" },
            { x: 70, y: 320, l: "Idea" },
            { x: 448, y: 322, l: "Project" },
          ].map((n) => (
            <g key={n.l}>
              <circle cx={n.x} cy={n.y} r="20" className="fill-white stroke-line stroke-[1.5px]" />
              <circle cx={n.x} cy={n.y} r="5" className="fill-brand" />
              <text x={n.x} y={n.y + 36} textAnchor="middle" className="fill-ink-soft font-sans text-[13px] font-medium">
                {n.l}
              </text>
            </g>
          ))}
          <path d="M100 108 200 190" className="fill-none stroke-[#d8d8e1] stroke-[1.3px]" strokeDasharray="4 6" />
          <path d="M420 112 340 190" className="fill-none stroke-[#d8d8e1] stroke-[1.3px]" strokeDasharray="4 6" />
          <path d="M86 304 200 270" className="fill-none stroke-[#d8d8e1] stroke-[1.3px]" strokeDasharray="4 6" />
          <path d="M432 306 340 272" className="fill-none stroke-[#d8d8e1] stroke-[1.3px]" strokeDasharray="4 6" />
        </motion.g>

        {/* note one */}
        <motion.g
          initial={calm ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <rect x="150" y="130" width="150" height="120" rx="16" className="fill-white stroke-line stroke-[1.5px] [filter:drop-shadow(0_10px_24px_rgba(11,11,16,0.1))]" />
          <rect x="170" y="152" width="88" height="11" rx="5.5" className="fill-ink" />
          <rect x="170" y="172" width="110" height="7" rx="3.5" className="fill-[#dcdce4]" />
          <rect x="170" y="186" width="96" height="7" rx="3.5" className="fill-[#dcdce4]" />
          <rect x="170" y="200" width="104" height="7" rx="3.5" className="fill-[#dcdce4]" />
          <text x="170" y="232" className="fill-faint font-mono text-[11px] tracking-[0.1em] uppercase">Note</text>
        </motion.g>

        {/* note two */}
        {showSecond && (
          <motion.g
            initial={calm ? false : { opacity: 0, x: 60, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 19 }}
          >
            <rect x="300" y="220" width="150" height="120" rx="16" className="fill-brand-faint stroke-brand/40 stroke-[1.5px] [filter:drop-shadow(0_10px_24px_rgba(79,70,229,0.16))]" />
            <rect x="320" y="242" width="76" height="11" rx="5.5" className="fill-ink" />
            <rect x="320" y="262" width="104" height="7" rx="3.5" className="fill-[#dcdce4]" />
            <rect x="320" y="276" width="88" height="7" rx="3.5" className="fill-[#dcdce4]" />
            <text x="320" y="308" className="fill-faint font-mono text-[11px] tracking-[0.1em] uppercase">Research</text>
          </motion.g>
        )}

        {/* connection */}
        {showSecond && (
          <motion.path
            d="M 300 200 C 320 210, 300 235, 315 245"
            className="fill-none stroke-brand stroke-[2.2px]"
            initial={calm ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          />
        )}
        {showSecond && (
          <motion.circle
            cx="308"
            cy="222"
            r="7"
            className="fill-brand stroke-white stroke-[2.5px] tbox"
            initial={calm ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 400, damping: 16 }}
          />
        )}
      </motion.g>
    </svg>
  );
}

export default function ScrollStory() {
  const calm = useCalm();
  const [stage, setStage] = useState(0);

  return (
    <section className="relative scroll-mt-[72px] py-[120px] max-md:py-[76px]" id="how">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              Capture. Connect.
              <br />
              Discover. Build.
            </>
          }
          lede="Scroll through the lifecycle of an idea — from a blank page to a living workspace."
        />

        <div className="grid grid-cols-[1.05fr_0.95fr] items-start gap-[72px] max-[900px]:grid-cols-1 max-[900px]:gap-7">
          <div className="relative">
            <div className="sticky top-[110px] rounded-card border border-line bg-white px-7 pt-7 pb-5 shadow-card max-[900px]:top-[84px] max-[900px]:p-4 max-[900px]:pb-3">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(480px_260px_at_50%_0%,var(--color-brand-faint),transparent_70%)]" aria-hidden="true" />
              <div className="relative">
                <StoryVisual stage={stage} calm={calm} />
              </div>
              <div className="flex justify-center gap-2 px-0 pt-3.5 pb-1.5">
                {STAGES.map((s, i) => (
                  <button
                    key={s.id}
                    className={`h-[34px] w-[34px] rounded-full border text-[13px] font-bold transition-all duration-250 ${
                      i === stage
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white text-ink-soft"
                    }`}
                    data-active={i === stage}
                    onClick={() => {
                      setStage(i);
                      document
                        .getElementById(`story-${s.id}`)
                        ?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
                    }}
                    aria-label={`Go to ${s.title}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pb-[10vh] max-[900px]:pb-0">
            {STAGES.map((s, i) => (
              <motion.article
                key={s.id}
                id={`story-${s.id}`}
                className={`rounded-2xl px-3 py-11 transition-opacity duration-400 max-[900px]:px-1 max-[900px]:py-[30px] ${
                  i === stage ? "opacity-100" : "opacity-[0.38]"
                }`}
                data-active={i === stage}
                onViewportEnter={() => setStage(i)}
                viewport={{ amount: 0.55 }}
                initial={calm ? false : { y: 32 }}
                whileInView={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="font-mono text-xs font-semibold tracking-[0.16em] text-brand uppercase">
                  {s.step}
                </span>
                <h3 className="mt-2.5 text-[clamp(30px,3.4vw,42px)] leading-[1.1] font-semibold tracking-[-0.03em]">
                  {s.title}
                </h3>
                <p className="mt-3 max-w-[420px] text-[17px] leading-[1.65] text-ink-soft">
                  {s.body}
                </p>
                <span className="mt-5 block h-0.5 w-[120px] overflow-hidden rounded-sm bg-line" aria-hidden="true">
                  <motion.span
                    className="block h-full w-full origin-left bg-brand"
                    initial={false}
                    animate={{ scaleX: i === stage ? 1 : i < stage ? 1 : 0 }}
                    transition={{ duration: i === stage ? 2.4 : 0.3, ease: "easeOut" }}
                  />
                </span>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
