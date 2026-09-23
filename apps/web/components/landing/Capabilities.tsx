"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  FlaskConical,
  FolderKanban,
  Network,
  NotebookPen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { neighborhood, type GraphEdge } from "./graph-utils";
import { Reveal, SectionHeading, useCalm } from "./Reveal";

type Capability = {
  id: string;
  label: string;
  kind: string;
  desc: string;
  icon: typeof FileText;
  accent: string;
  tint: string;
  x: number;
  y: number;
};

const ITEMS: Capability[] = [
  { id: "notes", label: "Notes", kind: "Capture", desc: "Fast, calm pages for everything you think. Blocks, embeds and backlinks included.", icon: NotebookPen, accent: "#4f46e5", tint: "#eef0ff", x: 230, y: 62 },
  { id: "documents", label: "Documents", kind: "Publish", desc: "Long-form specs and RFCs that stay linked to the work they describe.", icon: FileText, accent: "#0284c7", tint: "#f0f9ff", x: 376, y: 146 },
  { id: "research", label: "Research", kind: "Explore", desc: "Papers, highlights and field notes — annotated, sourced, connected.", icon: FlaskConical, accent: "#d97706", tint: "#fffbeb", x: 376, y: 314 },
  { id: "projects", label: "Projects", kind: "Build", desc: "Milestones and decisions wired directly to the knowledge behind them.", icon: FolderKanban, accent: "#16a34a", tint: "#f0fdf4", x: 230, y: 398 },
  { id: "knowledge", label: "Knowledge", kind: "Compound", desc: "Notes that reference each other grow more valuable over time.", icon: BookOpen, accent: "#7c3aed", tint: "#f5f3ff", x: 84, y: 314 },
  { id: "connections", label: "Connections", kind: "Weave", desc: "Bidirectional links form the graph — no folders required.", icon: Network, accent: "#e11d48", tint: "#fdf2f8", x: 84, y: 146 },
];

const RELATIONS: Record<string, string[]> = {
  notes: ["documents", "research", "connections"],
  documents: ["notes", "projects"],
  research: ["notes", "knowledge"],
  projects: ["documents", "connections", "knowledge"],
  knowledge: ["research", "projects", "connections"],
  connections: ["notes", "projects", "knowledge"],
};

const HUB = { x: 230, y: 230 };

const EDGES: GraphEdge[] = [
  ...ITEMS.map((c) => ({ from: "hub", to: c.id })),
  { from: "notes", to: "documents" },
  { from: "notes", to: "research" },
  { from: "notes", to: "connections" },
  { from: "documents", to: "projects" },
  { from: "research", to: "knowledge" },
  { from: "projects", to: "connections" },
  { from: "projects", to: "knowledge" },
  { from: "knowledge", to: "connections" },
];

const point = (id: string) =>
  id === "hub" ? HUB : ITEMS.find((c) => c.id === id) ?? HUB;

export default function Capabilities() {
  const calm = useCalm();
  const [active, setActive] = useState("notes");
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (calm || !auto) return;
    const t = setInterval(() => {
      setActive((a) => {
        const i = ITEMS.findIndex((c) => c.id === a);
        const next = ITEMS[(i + 1) % ITEMS.length];
        return next ? next.id : a;
      });
    }, 3400);
    return () => clearInterval(t);
  }, [calm, auto]);

  const near = neighborhood(EDGES, active);
  const item = ITEMS.find((c) => c.id === active) ?? ITEMS[0];
  if (!item) return null;
  const Icon = item.icon;

  const touch = (id: string) => {
    setAuto(false);
    setActive(id);
  };

  return (
    <section
      className="relative scroll-mt-[72px] py-[120px] max-md:py-[76px]"
      id="features"
    >
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <SectionHeading
          eyebrow="Capabilities"
          title={
            <>
              Six surfaces,
              <br />
              one connected mind.
            </>
          }
          lede="Hover through the constellation — every capability links to the others, just like your knowledge will."
        />

        <div className="grid grid-cols-[1fr_380px] items-center gap-6 max-[960px]:grid-cols-1">
          <Reveal className="relative rounded-card border border-line bg-white p-5 shadow-card">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(420px_240px_at_50%_0%,var(--color-accent-faint),transparent_70%)]"
              aria-hidden="true"
            />
            <svg
              viewBox="0 0 460 460"
              className="relative block h-auto w-full"
              role="img"
              aria-label="Constellation of VaultGraph capabilities"
            >
              {EDGES.map((e) => {
                const a = point(e.from);
                const b = point(e.to);
                const hot =
                  e.from === active || e.to === active;
                const dim = !near.has(e.from) || !near.has(e.to);
                return (
                  <motion.line
                    key={`${e.from}-${e.to}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    className="transition-[stroke] duration-300"
                    initial={false}
                    animate={{ opacity: dim ? 0.06 : hot ? 0.95 : 0.4 }}
                    transition={{ duration: 0.3 }}
                    stroke={hot ? "#4f46e5" : "#d8d8e1"}
                    strokeWidth={hot ? 2 : 1.3}
                  />
                );
              })}

              <g>
                <circle cx={HUB.x} cy={HUB.y} r={26} className="fill-ink" />
                <text x={HUB.x} y={HUB.y + 1} textAnchor="middle" dominantBaseline="central" className="fill-white font-sans text-[20px] font-bold">
                  V
                </text>
                <text x={HUB.x} y={HUB.y + 44} textAnchor="middle" className="fill-muted font-sans text-[13px] font-semibold">
                  VaultGraph
                </text>
              </g>

              {ITEMS.map((c, i) => {
                const isActive = c.id === active;
                const dimmed = !near.has(c.id);
                return (
                  <motion.g
                    key={c.id}
                    initial={calm ? false : { opacity: 0, scale: 0.6 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="tbox"
                  >
                    {isActive && (
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={34}
                        className="tbox animate-halo fill-none stroke-[1.6px] opacity-70"
                        style={{ stroke: c.accent }}
                        strokeDasharray="4 6"
                      />
                    )}
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={24}
                      className="cursor-pointer fill-white stroke-line stroke-[1.6px] outline-none transition-opacity duration-300 data-[active=true]:stroke-[2.4px] data-[dim=true]:opacity-30 [filter:drop-shadow(0_6px_14px_rgba(11,11,16,0.1))]"
                      data-active={isActive}
                      data-dim={dimmed}
                      style={isActive ? { stroke: c.accent } : undefined}
                      onMouseEnter={() => touch(c.id)}
                      onFocus={() => touch(c.id)}
                      onClick={() => touch(c.id)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${c.label} capability`}
                    />
                    <circle cx={c.x} cy={c.y} r={5.5} fill={c.accent} pointerEvents="none" />
                    <text
                      x={c.x}
                      y={c.y + 42}
                      textAnchor="middle"
                      className="font-sans text-[14.5px] font-medium fill-muted transition-[opacity,fill] duration-300 data-[active=true]:fill-ink data-[active=true]:font-bold data-[dim=true]:opacity-30"
                      data-active={isActive}
                      data-dim={dimmed}
                      pointerEvents="none"
                    >
                      {c.label}
                    </text>
                  </motion.g>
                );
              })}
            </svg>
          </Reveal>

          <div className="flex flex-col gap-[18px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={item.id}
                className="min-h-[380px] rounded-card border border-line bg-white px-7 py-[30px] shadow-card max-[960px]:min-h-0"
                initial={calm ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={calm ? { opacity: 0 } : { opacity: 0, y: -14 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <span
                  className="mb-1.5 inline-flex h-12 w-12 items-center justify-center rounded-[14px]"
                  style={{ background: item.tint, color: item.accent }}
                >
                  <Icon size={22} strokeWidth={2} />
                </span>
                <p className="font-mono text-[11.5px] font-semibold tracking-[0.14em] text-accent uppercase">
                  {item.kind}
                </p>
                <h3 className="mt-1.5 text-[30px] font-semibold tracking-[-0.03em]">
                  {item.label}
                </h3>
                <p className="mt-2.5 text-[15.5px] leading-[1.65] text-muted">
                  {item.desc}
                </p>
                <p className="mt-[22px] text-xs font-bold tracking-[0.08em] text-faint uppercase">
                  Connects with
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {(RELATIONS[item.id] ?? []).map((id) => {
                    const rel = ITEMS.find((c) => c.id === id);
                    if (!rel) return null;
                    return (
                      <button
                        key={id}
                        className="inline-flex items-center gap-2 rounded-full border border-line px-[15px] py-2 text-[13.5px] font-semibold text-muted transition-all duration-200 hover:border-ink hover:text-ink"
                        onClick={() => touch(id)}
                        onMouseEnter={() => touch(id)}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: rel.accent }}
                        />
                        {rel.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2">
              {ITEMS.map((c) => (
                <button
                  key={c.id}
                  className={`h-2 rounded-full bg-line transition-all duration-300 ${
                    c.id === active ? "w-[26px] bg-ink" : "w-2"
                  }`}
                  data-active={c.id === active}
                  onClick={() => touch(c.id)}
                  aria-label={`Show ${c.label}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
