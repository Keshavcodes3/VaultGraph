"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Kbd } from "./CommandPalette";
import { SectionHeading, useCalm } from "./Reveal";

const SHORTCUTS = [
  { id: "search", keys: ["⌘", "K"], action: "Search", desc: "Jump to anything, instantly." },
  { id: "new", keys: ["⌘", "N"], action: "New page", desc: "Capture before the thought fades." },
  { id: "cmd", keys: ["/"], action: "Commands", desc: "Blocks, links and actions inline." },
  { id: "esc", keys: ["Esc"], action: "Close", desc: "Dismiss anything, gracefully." },
];

function matches(e: KeyboardEvent, id: string): boolean {
  if (id === "search") return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
  if (id === "new") return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n";
  if (id === "cmd") return e.key === "/" && !e.metaKey && !e.ctrlKey;
  if (id === "esc") return e.key === "Escape";
  return false;
}

export default function Shortcuts() {
  const calm = useCalm();
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const onKey = (e: KeyboardEvent) => {
      const hit = SHORTCUTS.find((s) => matches(e, s.id));
      if (hit) {
        setFlash(hit.id);
        clearTimeout(t);
        t = setTimeout(() => setFlash(null), 900);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, []);

  return (
    <section
      className="relative scroll-mt-[72px] py-[120px] max-md:py-[76px]"
      aria-label="Keyboard shortcuts"
    >
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <SectionHeading
          eyebrow="Keyboard first"
          title="Tiny details, fast hands."
          lede="VaultGraph is built for flow. Try pressing the keys — the page notices."
        />

        <div className="grid grid-cols-4 gap-3.5 max-[900px]:grid-cols-2 max-[480px]:grid-cols-1">
          {SHORTCUTS.map((s, i) => (
            <motion.div
              key={s.id}
              className={`flex flex-col gap-2 rounded-box border bg-white px-[22px] py-[26px] transition-all duration-250 hover:shadow-card ${
                flash === s.id
                  ? "border-brand bg-brand-faint shadow-[0_0_0_4px_var(--color-brand-soft),var(--shadow-card)]"
                  : "border-line hover:border-[#d5d5de]"
              }`}
              data-flash={flash === s.id}
              initial={calm ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={calm ? undefined : { y: -4 }}
            >
              <span className="mb-1.5 inline-flex gap-1.5">
                {s.keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </span>
              <span className="text-[16.5px] font-semibold tracking-[-0.02em]">
                {s.action}
              </span>
              <span className="text-[13.5px] leading-[1.55] text-ink-soft">{s.desc}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
