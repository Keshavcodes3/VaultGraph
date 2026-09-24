"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { mulberry32 } from "./graph-utils";
import { useCalm } from "./Reveal";

type Phase = "idle" | "knowledge" | "connections" | "collapse";

export default function KnowledgeCounter() {
  const calm = useCalm();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });
  const [phase, setPhase] = useState<Phase>("idle");

  const n1 = useMotionValue(0);
  const n2 = useMotionValue(0);
  const n1Text = useTransform(n1, (v) =>
    Math.round(v).toLocaleString("en-US")
  );
  const n2Text = useTransform(n2, (v) =>
    Math.round(v).toLocaleString("en-US")
  );

  const { nodes, edges } = useMemo(() => {
    const rand = mulberry32(20260214);
    const nodes = Array.from({ length: 26 }, (_, i) => ({
      id: i,
      x: 50 + rand() * 900,
      y: 50 + rand() * 500,
      r: 3.5 + rand() * 7,
    }));
    const seen = new Set<string>();
    const edges: Array<{ a: number; b: number }> = [];
    const link = (a: number, b: number) => {
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (a !== b && !seen.has(key) && edges.length < 46) {
        seen.add(key);
        edges.push({ a, b });
      }
    };
    nodes.forEach((_, i) => {
      link(i, (i + 1) % nodes.length);
      link(i, Math.floor(rand() * nodes.length));
    });
    return { nodes, edges };
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (calm) {
      n1.set(349);
      n2.set(1284);
      setPhase("collapse");
      return;
    }
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    setPhase("knowledge");
    const c1 = animate(n1, 347, {
      duration: 1.9,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => {
        if (cancelled) return;
        // 347 … 348 … 349, one new idea at a time.
        timers.push(
          setTimeout(() => !cancelled && n1.set(348), 650),
          setTimeout(() => !cancelled && n1.set(349), 1300),
          setTimeout(() => {
            if (cancelled) return;
            setPhase("connections");
            animate(n2, 1284, {
              duration: 2.4,
              ease: [0.22, 1, 0.36, 1],
              onComplete: () => {
                if (cancelled) return;
                timers.push(
                  setTimeout(() => !cancelled && setPhase("collapse"), 900)
                );
              },
            });
          }, 2100)
        );
      },
    });

    return () => {
      cancelled = true;
      c1.stop();
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, calm]);

  const graphActive = phase === "connections" || phase === "collapse";

  return (
    <section
      className="relative scroll-mt-[72px] py-[120px] max-md:py-[76px]"
      aria-label="Signature moment"
    >
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div
          ref={ref}
          className="relative flex min-h-[560px] items-center justify-center overflow-hidden rounded-[28px] border border-mist bg-white px-6 py-[60px] shadow-pop max-sm:min-h-[480px] max-sm:px-2 max-sm:py-5"
        >
          <svg
            viewBox="0 0 1000 600"
            className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
              graphActive ? "opacity-55" : "opacity-0"
            }`}
            data-active={graphActive}
            aria-hidden="true"
          >
            {edges.map(({ a, b }, i) => {
              const na = nodes[a];
              const nb = nodes[b];
              if (!na || !nb) return null;
              return (
                <motion.line
                  key={`${a}-${b}`}
                  x1={na.x}
                  y1={na.y}
                  x2={nb.x}
                  y2={nb.y}
                  className="stroke-[#c4c4f2] stroke-[1.2px]"
                  initial={calm ? false : { pathLength: 0, opacity: 0 }}
                  animate={
                    graphActive
                      ? { pathLength: 1, opacity: 0.75 }
                      : { pathLength: 0, opacity: 0 }
                  }
                  transition={{
                    duration: 0.9,
                    delay: graphActive ? i * 0.035 : 0,
                  }}
                />
              );
            })}
            {nodes.map((n) => (
              <motion.circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r={n.r}
                className="fill-white stroke-brand stroke-[1.4px] stroke-opacity-55 tbox"
                initial={calm ? false : { opacity: 0, scale: 0 }}
                animate={graphActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                transition={{ duration: 0.5 }}
              />
            ))}
          </svg>

          <div className="relative max-w-[760px] bg-[radial-gradient(closest-side,rgba(255,255,255,0.92),transparent)] p-10 text-center max-sm:px-2 max-sm:py-5">
            {phase !== "collapse" ? (
              <>
                <p
                  className={`text-[clamp(26px,4.4vw,46px)] leading-[1.25] font-semibold tracking-[-0.03em] text-balance transition-all duration-500 ${
                    phase === "connections"
                      ? "text-[clamp(20px,3vw,28px)] opacity-45"
                      : ""
                  }`}
                  data-dim={phase === "connections"}
                >
                  You have{" "}
                  <motion.span className="font-bold tabular-nums">{n1Text}</motion.span>{" "}
                  pieces of knowledge.
                </p>
                {(phase === "connections") && (
                  <motion.p
                    className="mt-[18px] text-[clamp(26px,4.4vw,46px)] leading-[1.25] font-semibold tracking-[-0.03em] text-balance"
                    initial={calm ? false : { opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  >
                    We found{" "}
                    <motion.span className="font-bold text-brand tabular-nums">{n2Text}</motion.span>{" "}
                    connections.
                  </motion.p>
                )}
              </>
            ) : (
              <motion.p
                className="text-[clamp(40px,7vw,84px)] leading-[1.05] font-semibold tracking-[-0.04em] text-balance"
                initial={calm ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                Think in <em className="font-serif font-medium text-brand-deep italic">connections.</em>
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
