"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  neighborhood,
  nodeById,
  type GraphEdge,
  type GraphNode,
} from "./graph-utils";
import { useCalm } from "./Reveal";

const NODES: GraphNode[] = [
  { id: "vault", label: "VaultGraph", x: 400, y: 280, radius: 46 },
  { id: "documents", label: "Documents", x: 400, y: 78, radius: 30, accent: "#0284c7" },
  { id: "notes", label: "Notes", x: 156, y: 166, radius: 30, accent: "#4f46e5" },
  { id: "projects", label: "Projects", x: 644, y: 166, radius: 30, accent: "#16a34a" },
  { id: "people", label: "People", x: 146, y: 394, radius: 30, accent: "#0d9488" },
  { id: "research", label: "Research", x: 654, y: 394, radius: 30, accent: "#d97706" },
  { id: "ideas", label: "Ideas", x: 252, y: 488, radius: 30, accent: "#e11d48" },
  { id: "databases", label: "Databases", x: 548, y: 488, radius: 30, accent: "#7c3aed" },
];

const EDGES: GraphEdge[] = [
  { from: "vault", to: "documents" },
  { from: "vault", to: "notes" },
  { from: "vault", to: "projects" },
  { from: "vault", to: "people" },
  { from: "vault", to: "research" },
  { from: "vault", to: "ideas" },
  { from: "vault", to: "databases" },
  { from: "notes", to: "documents" },
  { from: "projects", to: "documents" },
  { from: "ideas", to: "databases" },
  { from: "research", to: "databases" },
  { from: "people", to: "notes" },
  { from: "people", to: "ideas" },
];

const DESKTOP_VB = { x: 0, y: 0, w: 800, h: 560 };
const MOBILE_VB = { x: 70, y: 30, w: 660, h: 500 };

const line = (a: GraphNode, b: GraphNode) =>
  `M ${a.x} ${a.y} L ${b.x} ${b.y}`;

const NODE_BASE =
  "cursor-pointer fill-white stroke-line outline-none transition-[opacity,stroke] duration-300 data-[center=true]:fill-ink data-[center=true]:stroke-ink data-[hot=true]:stroke-accent data-[hot=true]:stroke-[2.4px] data-[dim=true]:opacity-30";
const LABEL_BASE =
  "font-sans text-[15px] font-medium tracking-[-0.01em] fill-muted transition-[opacity,fill] duration-300 data-[center=true]:fill-ink data-[center=true]:text-[17px] data-[center=true]:font-bold data-[hot=true]:fill-ink data-[dim=true]:opacity-30";

export default function KnowledgeGraph() {
  const calm = useCalm();
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Parallax + cursor glow (motion values: zero React re-renders)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 18 });
  const smy = useSpring(my, { stiffness: 60, damping: 18 });
  const edgeX = useTransform(smx, (v) => v * 7);
  const edgeY = useTransform(smy, (v) => v * 7);
  const nodeX = useTransform(smx, (v) => v * 14);
  const nodeY = useTransform(smy, (v) => v * 14);
  const gx = useMotionValue(0);
  const gy = useMotionValue(0);
  const glowX = useSpring(gx, { stiffness: 120, damping: 20 });
  const glowY = useSpring(gy, { stiffness: 120, damping: 20 });

  // Proximity scaling targets (rAF, direct DOM writes)
  const mouse = useRef<{ x: number; y: number; inside: boolean }>({
    x: 0,
    y: 0,
    inside: false,
  });
  const vbRef = useRef(DESKTOP_VB);
  const nodeEls = useRef(new Map<string, SVGGElement>());
  const scales = useRef(new Map<string, number>());
  const raf = useRef(0);

  useEffect(() => {
    vbRef.current = mobile ? MOBILE_VB : DESKTOP_VB;
  }, [mobile]);

  useEffect(() => {
    const q = window.matchMedia("(max-width: 640px)");
    const apply = () => setMobile(q.matches);
    apply();
    q.addEventListener("change", apply);
    return () => q.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (calm) return;
    const tick = () => {
      const m = mouse.current;
      for (const n of NODES) {
        const el = nodeEls.current.get(n.id);
        if (!el) continue;
        const target = m.inside
          ? 1 + 0.24 * Math.max(0, 1 - Math.hypot(m.x - n.x, m.y - n.y) / 175)
          : 1;
        const prev = scales.current.get(n.id) ?? 1;
        const next = prev + (target - prev) * 0.16;
        scales.current.set(n.id, next);
        el.style.transform = `scale(${next.toFixed(3)})`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [calm ]);

  const vb = mobile ? MOBILE_VB : DESKTOP_VB;

  const onMove = (e: React.MouseEvent) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
    const ny = (e.clientY - r.top) / r.height - 0.5;
    mx.set(nx);
    my.set(ny);
    gx.set(nx * r.width * 0.42);
    gy.set(ny * r.height * 0.42);
    const v = vbRef.current;
    mouse.current = {
      x: v.x + ((e.clientX - r.left) / r.width) * v.w,
      y: v.y + ((e.clientY - r.top) / r.height) * v.h,
      inside: true,
    };
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
    gx.set(0);
    gy.set(0);
    mouse.current.inside = false;
    setHovered(null);
  };

  const near = useMemo(
    () => (hovered ? neighborhood(EDGES, hovered) : null),
    [hovered]
  );

  const floatClass = (i: number) =>
    i % 3 === 0 ? "animate-float-a" : i % 3 === 1 ? "animate-float-b" : "animate-float-c";

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto w-full max-w-[860px] overflow-hidden rounded-[28px] border border-mist bg-white px-3 pt-3 pb-5 shadow-pop max-sm:rounded-[20px]"
      onMouseMove={calm ? undefined : onMove}
      onMouseLeave={onLeave}
    >
      <div className="bg-blueprint pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_0%,var(--color-accent-faint),transparent_70%)]"
        aria-hidden="true"
      />
      <motion.div
        className="pointer-events-none absolute top-[46%] left-1/2 -mt-[170px] -ml-[170px] h-[340px] w-[340px] bg-[radial-gradient(circle,rgba(79,70,229,0.12),transparent_65%)]"
        style={{ x: glowX, y: glowY }}
      />
      <svg
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className="relative block h-auto w-full overflow-visible"
        role="img"
        aria-label="Knowledge graph connecting notes, projects, research, ideas, documents, databases and people around VaultGraph"
      >
        {/* Edges */}
        <motion.g style={calm ? undefined : { x: edgeX, y: edgeY }}>
          {EDGES.map((e, i) => {
            const a = nodeById(NODES, e.from);
            const b = nodeById(NODES, e.to);
            const hot =
              hovered !== null && (e.from === hovered || e.to === hovered);
            const dim = near !== null && !hot;
            return (
              <g key={`${e.from}-${e.to}`}>
                <motion.path
                  d={line(a, b)}
                  className="fill-none transition-[opacity,stroke] duration-300"
                  style={{
                    opacity: dim ? 0.1 : hot ? 1 : 0.55,
                    stroke: hot ? "#4f46e5" : "#d8d8e1",
                    strokeWidth: hot ? 2 : 1.4,
                  }}
                  initial={calm ? false : { pathLength: 0 }}
                  whileInView={calm ? undefined : { pathLength: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.06 }}
                />
                {!calm && (
                  <path
                    d={line(a, b)}
                    className="pointer-events-none fill-none stroke-accent stroke-[1.4px] animate-dash"
                    strokeDasharray="4 10"
                    style={{ opacity: dim ? 0.04 : hot ? 0.9 : 0.3 }}
                  />
                )}
              </g>
            );
          })}
        </motion.g>

        {/* Nodes */}
        <motion.g style={calm ? undefined : { x: nodeX, y: nodeY }}>
          {NODES.map((n, i) => {
            const isCenter = n.id === "vault";
            const dim = near !== null && !near.has(n.id);
            const hot = hovered === n.id;
            const r = n.radius ?? 30;
            return (
              <motion.g
                key={n.id}
                initial={calm ? false : { opacity: 0, scale: 0.6 }}
                whileInView={calm ? undefined : { opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.7,
                  delay: 0.1 + i * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="tbox"
              >
                <g
                  ref={(el) => {
                    if (el) nodeEls.current.set(n.id, el);
                    else nodeEls.current.delete(n.id);
                  }}
                  className="tbox"
                >
                  <g className={calm ? undefined : `${floatClass(i)} tbox`}>
                    <g className={calm ? undefined : "animate-breathe tbox"}>
                      {isCenter && (
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={r + 12}
                          className="tbox animate-spin-slower fill-none stroke-accent/35 stroke-[1.4px]"
                          strokeDasharray="3 7"
                        />
                      )}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={r}
                        className={`${NODE_BASE} [filter:drop-shadow(0_6px_14px_rgba(11,11,16,0.1))]`}
                        data-hot={hot}
                        data-dim={dim}
                        data-center={isCenter}
                        onMouseEnter={() => setHovered(n.id)}
                        onFocus={() => setHovered(n.id)}
                        onBlur={() => setHovered(null)}
                        tabIndex={0}
                        role="button"
                        aria-label={`${n.label} node`}
                      />
                      {!isCenter && (
                        <circle
                          cx={n.x}
                          cy={n.y - r + 9}
                          r={4.5}
                          fill={n.accent}
                          pointerEvents="none"
                        />
                      )}
                      {isCenter && (
                        <text
                          x={n.x}
                          y={n.y + 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="pointer-events-none fill-white font-sans text-[26px] font-bold"
                        >
                          V
                        </text>
                      )}
                      <text
                        x={n.x}
                        y={n.y + r + 22}
                        textAnchor="middle"
                        className={`${LABEL_BASE} max-sm:text-base`}
                        data-hot={hot}
                        data-dim={dim}
                        data-center={isCenter}
                        pointerEvents="none"
                      >
                        {n.label}
                      </text>
                    </g>
                  </g>
                </g>
              </motion.g>
            );
          })}
        </motion.g>
      </svg>
    </div>
  );
}
