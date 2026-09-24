"use client";

import { motion } from "framer-motion";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  neighborhood,
  nodeById,
  type GraphEdge,
  type GraphNode,
} from "./graph-utils";
import { Reveal, SectionHeading, useCalm } from "./Reveal";

type Meta = { kind: string; blurb: string };

const BASE_NODES: GraphNode[] = [
  { id: "vault", label: "VaultGraph", x: 400, y: 290, radius: 40 },
  { id: "database", label: "Database", x: 230, y: 180, radius: 30, accent: "#16a34a" },
  { id: "api", label: "API", x: 570, y: 180, radius: 30, accent: "#4f46e5" },
  { id: "project", label: "Project", x: 570, y: 405, radius: 30, accent: "#d97706" },
  { id: "research", label: "Research", x: 230, y: 405, radius: 30, accent: "#0284c7" },
  { id: "postgres", label: "PostgreSQL", x: 110, y: 105, radius: 24, accent: "#16a34a" },
  { id: "auth", label: "Authentication", x: 370, y: 60, radius: 24, accent: "#4f46e5" },
  { id: "endpoints", label: "Endpoints", x: 690, y: 105, radius: 24, accent: "#4f46e5" },
  { id: "people", label: "People", x: 400, y: 80, radius: 24, accent: "#0d9488" },
  { id: "docs", label: "Documents", x: 85, y: 330, radius: 24, accent: "#0284c7" },
  { id: "ideas", label: "Ideas", x: 695, y: 290, radius: 24, accent: "#e11d48" },
  { id: "distsys", label: "Dist. Systems", x: 400, y: 500, radius: 24, accent: "#e11d48" },
];

const BASE_EDGES: GraphEdge[] = [
  { from: "vault", to: "database" },
  { from: "vault", to: "api" },
  { from: "vault", to: "project" },
  { from: "vault", to: "research" },
  { from: "vault", to: "people" },
  { from: "database", to: "postgres" },
  { from: "database", to: "auth" },
  { from: "api", to: "endpoints" },
  { from: "api", to: "auth" },
  { from: "project", to: "ideas" },
  { from: "research", to: "docs" },
  { from: "research", to: "distsys" },
];

const EXTRA: Record<string, { nodes: GraphNode[]; edges: GraphEdge[] }> = {
  database: {
    nodes: [
      { id: "backups", label: "Backups", x: 150, y: 262, radius: 22, accent: "#16a34a" },
      { id: "migrations", label: "Migrations", x: 305, y: 55, radius: 22, accent: "#16a34a" },
    ],
    edges: [
      { from: "database", to: "backups" },
      { from: "database", to: "migrations" },
    ],
  },
  api: {
    nodes: [{ id: "webhooks", label: "Webhooks", x: 700, y: 180, radius: 22, accent: "#4f46e5" }],
    edges: [{ from: "api", to: "webhooks" }],
  },
  project: {
    nodes: [{ id: "roadmap", label: "Roadmap", x: 660, y: 480, radius: 22, accent: "#d97706" }],
    edges: [{ from: "project", to: "roadmap" }],
  },
  research: {
    nodes: [{ id: "papers", label: "Papers", x: 140, y: 470, radius: 22, accent: "#0284c7" }],
    edges: [{ from: "research", to: "papers" }],
  },
};

const META: Record<string, Meta> = {
  vault: { kind: "Workspace", blurb: "Everything you know, in one connected home." },
  database: { kind: "Collection", blurb: "Structured knowledge with relations." },
  api: { kind: "Collection", blurb: "Endpoints, contracts and examples." },
  project: { kind: "Project", blurb: "Goals, milestones and decisions." },
  research: { kind: "Collection", blurb: "Papers, notes and field findings." },
  postgres: { kind: "Note", blurb: "Indexing, pooling and migrations." },
  auth: { kind: "Note", blurb: "Sessions, OAuth and token rotation." },
  endpoints: { kind: "Note", blurb: "REST shapes, errors and versioning." },
  people: { kind: "People", blurb: "Who knows what, and how to reach them." },
  docs: { kind: "Documents", blurb: "Specs, RFCs and long-form writing." },
  ideas: { kind: "Ideas", blurb: "Seeds waiting to become projects." },
  distsys: { kind: "Note", blurb: "Queues, retries and consensus." },
  backups: { kind: "Note", blurb: "Snapshots, restores and drills." },
  migrations: { kind: "Note", blurb: "Schema evolution without downtime." },
  webhooks: { kind: "Note", blurb: "Events, retries and signatures." },
  roadmap: { kind: "Project", blurb: "What ships next, and why." },
  papers: { kind: "Research", blurb: "Annotated reading list." },
};

const line = (a: GraphNode, b: GraphNode) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`;

const NODE_BASE =
  "cursor-pointer fill-white stroke-line stroke-[1.6px] outline-none transition-[opacity,stroke] duration-250 data-[center=true]:fill-ink data-[center=true]:stroke-ink data-[hot=true]:stroke-brand data-[hot=true]:stroke-[2.6px] data-[dim=true]:opacity-25";
const LABEL_BASE =
  "font-sans text-sm font-medium fill-ink-soft transition-[opacity,fill] duration-250 data-[center=true]:fill-ink data-[center=true]:text-base data-[center=true]:font-bold data-[hot=true]:fill-ink data-[hot=true]:font-bold data-[dim=true]:opacity-25";

export default function GraphShowcase() {
  const calm = useCalm();
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("vault");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const q = window.matchMedia("(max-width: 640px)");
    const apply = () => setMobile(q.matches);
    apply();
    q.addEventListener("change", apply);
    return () => q.removeEventListener("change", apply);
  }, []);

  const nodes = useMemo(
    () => [...BASE_NODES, ...expanded.flatMap((id) => EXTRA[id]?.nodes ?? [])],
    [expanded]
  );
  const edges = useMemo(
    () => [...BASE_EDGES, ...expanded.flatMap((id) => EXTRA[id]?.edges ?? [])],
    [expanded]
  );

  const focus = hovered ?? selected;
  const near = useMemo(
    () => (focus ? neighborhood(edges, focus) : null),
    [edges, focus]
  );

  const selectedNode = nodeById(nodes, selected);
  const selectedMeta = META[selected] ?? { kind: "Note", blurb: "" };
  const linkCount = edges.filter(
    (e) => e.from === selected || e.to === selected
  ).length;
  const expandable = EXTRA[selected] && !expanded.includes(selected);

  const vb = mobile ? "20 10 720 540" : "0 0 800 560";

  const pick = (id: string) => {
    setSelected(id);
    setHovered(id);
  };

  return (
    <section
      className="relative scroll-mt-[72px] py-[120px] max-md:py-[76px]"
      aria-label="Knowledge graph showcase"
    >
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <SectionHeading
          eyebrow="Connections"
          title={
            <>
              Think in connections,
              <br />
              not folders.
            </>
          }
          lede="Hover to trace a neighborhood. Select a node to inspect it, expand it to grow the graph."
        />

        <Reveal>
          <div className="grid grid-cols-[1fr_300px] items-stretch gap-5 max-[960px]:grid-cols-1">
            <div className="relative min-h-[480px] overflow-hidden rounded-card border border-line bg-white shadow-card max-[960px]:min-h-[380px]">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_300px_at_50%_0%,var(--color-brand-faint),transparent_70%)]"
                aria-hidden="true"
              />
              <div className="absolute top-3.5 right-3.5 z-[2] flex gap-1.5 rounded-full border border-line bg-white/92 p-[5px] shadow-mini">
                <button
                  onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}
                  aria-label="Zoom out"
                  disabled={zoom <= 0.7}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-soft hover:text-ink disabled:cursor-default disabled:opacity-35"
                >
                  <Minus size={15} />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  aria-label="Reset zoom"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-soft hover:text-ink"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.15).toFixed(2)))}
                  aria-label="Zoom in"
                  disabled={zoom >= 1.5}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-soft hover:text-ink disabled:cursor-default disabled:opacity-35"
                >
                  <Plus size={15} />
                </button>
              </div>

              <svg
                viewBox={vb}
                className="relative block h-auto min-h-[480px] w-full max-[960px]:min-h-[380px]"
                role="img"
                aria-label="Interactive knowledge graph"
              >
                <motion.g
                  animate={calm ? undefined : { scale: zoom }}
                  transition={{ type: "spring", stiffness: 160, damping: 22 }}
                  className="tbox"
                >
                  {edges.map((e, i) => {
                    const a = nodeById(nodes, e.from);
                    const b = nodeById(nodes, e.to);
                    const isExtra = !BASE_EDGES.includes(e);
                    const hot = focus !== null && (e.from === focus || e.to === focus);
                    const dim = near !== null && !hot;
                    return (
                      <motion.path
                        key={`${e.from}-${e.to}`}
                        d={line(a, b)}
                        className="fill-none transition-[opacity,stroke] duration-250"
                        style={{
                          opacity: dim ? 0.08 : hot ? 1 : 0.5,
                          stroke: hot ? "#4f46e5" : "#d8d8e1",
                          strokeWidth: hot ? 2.2 : 1.4,
                        }}
                        initial={calm ? false : { pathLength: 0 }}
                        whileInView={calm ? undefined : { pathLength: 1 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.7, delay: isExtra ? 0 : 0.1 + i * 0.04 }}
                      />
                    );
                  })}

                  {nodes.map((n) => {
                    const isCenter = n.id === "vault";
                    const isExtra = !BASE_NODES.includes(n);
                    const dim = near !== null && !near.has(n.id);
                    const hot = focus === n.id;
                    const r = n.radius ?? 26;
                    return (
                      <motion.g
                        key={n.id}
                        initial={calm || !isExtra ? false : { opacity: 0, scale: 0.5 }}
                        animate={calm || !isExtra ? undefined : { opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="tbox"
                      >
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={r}
                          className={`${NODE_BASE} [filter:drop-shadow(0_6px_14px_rgba(11,11,16,0.1))]`}
                          data-hot={hot}
                          data-dim={dim}
                          data-center={isCenter}
                          onMouseEnter={() => setHovered(n.id)}
                          onMouseLeave={() => setHovered(null)}
                          onFocus={() => setHovered(n.id)}
                          onBlur={() => setHovered(null)}
                          onClick={() => pick(n.id)}
                          tabIndex={0}
                          role="button"
                          aria-label={`${n.label} — ${META[n.id]?.kind ?? "Note"}`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              pick(n.id);
                            }
                          }}
                        />
                        {!isCenter && (
                          <circle
                            cx={n.x}
                            cy={n.y - r + 8}
                            r={4}
                            fill={n.accent ?? "#4f46e5"}
                            pointerEvents="none"
                          />
                        )}
                        <text
                          x={n.x}
                          y={n.y + r + 19}
                          textAnchor="middle"
                          className={LABEL_BASE}
                          data-hot={hot}
                          data-dim={dim}
                          data-center={isCenter}
                          pointerEvents="none"
                        >
                          {n.label}
                        </text>
                      </motion.g>
                    );
                  })}
                </motion.g>
              </svg>
            </div>

            <aside
              className="sticky top-[110px] flex flex-col gap-2.5 self-start rounded-card border border-line bg-white px-6 py-[26px] shadow-mini max-[960px]:static"
              aria-live="polite"
            >
              <p className="font-mono text-[11.5px] font-semibold tracking-[0.14em] text-brand uppercase">
                {selectedMeta.kind}
              </p>
              <h3 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.025em]">
                {selectedNode.label}
              </h3>
              <p className="text-[14.5px] leading-[1.6] text-ink-soft">{selectedMeta.blurb}</p>
              <p className="mt-1 flex items-baseline gap-[7px] text-[13.5px] text-ink-soft">
                <span className="text-[22px] font-bold tracking-[-0.02em] text-ink">
                  {linkCount}
                </span>
                {linkCount === 1 ? "connection" : "connections"}
              </p>
              {expandable ? (
                <button
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-[18px] py-3 text-sm font-semibold text-white transition-colors duration-250 hover:bg-brand"
                  onClick={() => setExpanded((xs) => [...xs, selected])}
                >
                  <Plus size={15} strokeWidth={2.4} />
                  Expand node
                </button>
              ) : (
                <p className="mt-2 border-t border-dashed border-line pt-3 text-[13px] text-faint">
                  {EXTRA[selected]
                    ? "Expanded — children visible in the graph."
                    : "Leaf node — nothing further to expand."}
                </p>
              )}
              <div className="mt-1.5 border-t border-mist pt-3.5">
                <p className="mb-2.5 text-xs font-bold tracking-[0.08em] text-faint uppercase">
                  Directly connected
                </p>
                <div className="flex flex-wrap gap-[7px]">
                  {edges
                    .filter((e) => e.from === selected || e.to === selected)
                    .map((e) => {
                      const id = e.from === selected ? e.to : e.from;
                      return (
                        <button
                          key={id}
                          className="rounded-full border border-line px-[13px] py-1.5 text-[13px] font-medium text-ink-soft transition-all duration-200 hover:border-brand hover:bg-brand-faint hover:text-brand-deep"
                          onClick={() => pick(id)}
                        >
                          {nodeById(nodes, id).label}
                        </button>
                      );
                    })}
                </div>
              </div>
            </aside>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
