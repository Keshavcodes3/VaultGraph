"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowUpRight,
  Database,
  FlaskConical,
  KeyRound,
  Lightbulb,
  Network,
  Braces,
} from "lucide-react";
import { useCalm } from "./Reveal";

type Chip = {
  id: string;
  title: string;
  meta: string;
  icon: typeof Database;
  accent: string;
  tint: string;
  left: string;
  top: string;
  layer: 0 | 1;
  float: 0 | 1 | 2;
};

const CHIPS: Chip[] = [
  { id: "api", title: "API Notes", meta: "18 pages · 42 links", icon: Braces, accent: "#4f46e5", tint: "#eef0ff", left: "6%", top: "14%", layer: 0, float: 0 },
  { id: "pg", title: "PostgreSQL", meta: "9 pages · 31 links", icon: Database, accent: "#16a34a", tint: "#f0fdf4", left: "60%", top: "4%", layer: 1, float: 1 },
  { id: "auth", title: "Authentication", meta: "12 pages · 27 links", icon: KeyRound, accent: "#d97706", tint: "#fffbeb", left: "68%", top: "56%", layer: 0, float: 2 },
  { id: "dist", title: "Distributed Systems", meta: "7 pages · 19 links", icon: Network, accent: "#e11d48", tint: "#fdf2f8", left: "4%", top: "60%", layer: 1, float: 1 },
  { id: "ideas", title: "Project Ideas", meta: "23 pages · 15 links", icon: Lightbulb, accent: "#7c3aed", tint: "#f5f3ff", left: "36%", top: "74%", layer: 0, float: 2 },
  { id: "research", title: "Research", meta: "14 pages · 38 links", icon: FlaskConical, accent: "#0284c7", tint: "#f0f9ff", left: "38%", top: "2%", layer: 1, float: 0 },
];

/** Approximate chip centers in a 1000x420 space, matching the % positions. */
const THREADS: Array<[number, number, number, number]> = [
  [170, 110, 730, 260],
  [700, 70, 800, 250],
  [150, 290, 640, 150],
  [470, 360, 480, 120],
  [470, 360, 800, 260],
];

export default function FloatingKnowledge() {
  const calm = useCalm();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 55, damping: 18 });
  const smy = useSpring(my, { stiffness: 55, damping: 18 });

  const backX = useTransform(smx, (v) => v * 22);
  const backY = useTransform(smy, (v) => v * 16);
  const frontX = useTransform(smx, (v) => v * 46);
  const frontY = useTransform(smy, (v) => v * 34);

  const floatClass = (f: number) =>
    f === 0 ? "animate-drift-a" : f === 1 ? "animate-drift-b" : "animate-drift-c";

  return (
    <section
      className="relative scroll-mt-[72px] py-[120px] max-md:py-[76px]"
      aria-label="Floating knowledge"
    >
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div
          className="relative h-[460px] overflow-hidden rounded-[28px] border border-mist bg-white shadow-card max-md:grid max-md:h-auto max-md:grid-cols-2 max-md:gap-2.5 max-md:p-4"
          onMouseMove={
            calm
              ? undefined
              : (e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  mx.set((e.clientX - r.left) / r.width - 0.5);
                  my.set((e.clientY - r.top) / r.height - 0.5);
                }
          }
          onMouseLeave={calm ? undefined : () => { mx.set(0); my.set(0); }}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_280px_at_50%_110%,var(--color-brand-faint),transparent_70%)]"
            aria-hidden="true"
          />
          {!calm && (
            <svg
              viewBox="0 0 1000 420"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {THREADS.map(([x1, y1, x2, y2], i) => (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  vectorEffect="non-scaling-stroke"
                  className="stroke-[#c9c9f5] stroke-[1.4px] opacity-65 animate-thread"
                  strokeDasharray="3 8"
                />
              ))}
            </svg>
          )}

          {CHIPS.map((c, i) => {
            const Icon = c.icon;
            const anchorStyle = calm
              ? { left: c.left, top: c.top }
              : {
                  left: c.left,
                  top: c.top,
                  x: c.layer === 0 ? backX : frontX,
                  y: c.layer === 0 ? backY : frontY,
                };
            return (
              <motion.div
                key={c.id}
                className="absolute z-[1] max-md:static"
                style={anchorStyle}
              >
                <div className={calm ? undefined : floatClass(c.float)}>
                <motion.article
                  className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white/94 px-4 py-[13px] whitespace-nowrap shadow-card transition-colors hover:border-[#cfcfda] max-md:whitespace-normal"
                  initial={calm ? false : { opacity: 0, y: 30, scale: 0.94 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.65, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={calm ? undefined : { scale: 1.04, y: -3 }}
                >
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
                    style={{ background: c.tint, color: c.accent }}
                  >
                    <Icon size={17} strokeWidth={2} />
                  </span>
                  <span className="flex flex-col leading-[1.35]">
                    <span className="text-[14.5px] font-semibold tracking-[-0.015em]">
                      {c.title}
                    </span>
                    <span className="text-xs font-medium text-faint max-md:hidden">
                      {c.meta}
                    </span>
                  </span>
                  <ArrowUpRight
                    size={15}
                    className=" -translate-x-1 text-faint opacity-0 transition-all duration-250 group-hover:translate-x-0 group-hover:opacity-100"
                  />
                </motion.article>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
