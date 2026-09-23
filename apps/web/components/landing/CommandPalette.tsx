"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  CornerDownLeft,
  Database,
  FileText,
  KeyRound,
  Network,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { Reveal, SectionHeading, useCalm } from "./Reveal";

type Result = {
  id: string;
  title: string;
  kind: string;
  detail: string;
  icon: typeof FileText;
  accent: string;
};

const RESULTS: Result[] = [
  { id: "auth", title: "Authentication", kind: "Note", detail: "Engineering · 14 links", icon: KeyRound, accent: "#4f46e5" },
  { id: "pg", title: "PostgreSQL", kind: "Database", detail: "Engineering · 31 links", icon: Database, accent: "#16a34a" },
  { id: "backend", title: "Backend Architecture", kind: "Page", detail: "Engineering · 22 links", icon: FileText, accent: "#0b0b10" },
  { id: "dist", title: "Distributed Systems", kind: "Note", detail: "Engineering · 19 links", icon: Network, accent: "#e11d48" },
  { id: "api", title: "API Design Guidelines", kind: "Page", detail: "Engineering · 11 links", icon: FileText, accent: "#d97706" },
  { id: "onboard", title: "Onboarding Checklist", kind: "Project", detail: "Team · 6 links", icon: FileText, accent: "#0284c7" },
];

export default function CommandPalette() {
  const calm = useCalm();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [opened, setOpened] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RESULTS;
    return RESULTS.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.kind.toLowerCase().includes(q) ||
        r.detail.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setOpened(null);
  }, []);

  // Global ⌘K / Ctrl+K toggle, Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), calm ? 0 : 120);
      return () => clearTimeout(t);
    }
  }, [open, calm]);

  const choose = (r: Result) => {
    setOpened(r.title);
    setTimeout(close, 1100);
  };

  const onInputKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      const r = filtered[active];
      if (r) choose(r);
    }
  };

  const activeResult = filtered[active];

  return (
    <section
      className="relative scroll-mt-[72px] py-[120px] max-md:py-[76px]"
      aria-label="Command palette"
    >
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <SectionHeading
          eyebrow="Instant search"
          title={
            <>
              Press <Kbd>⌘</Kbd> <Kbd>K</Kbd>.
              <br />
              Find anything.
            </>
          }
          lede="Every note, database and person is one keystroke away. Try it — this palette is live."
        />

        <Reveal className="flex justify-center">
          <button
            className="inline-flex w-full max-w-[560px] items-center gap-3 rounded-box border border-line bg-white px-[18px] py-[15px] text-[15px] text-faint shadow-card transition-all duration-200 hover:border-[#cfcfda] hover:shadow-pop"
            onClick={() => setOpen(true)}
            aria-label="Open command palette"
          >
            <Search size={16} />
            <span>Search your knowledge...</span>
            <span className="ml-auto inline-flex gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
        </Reveal>

        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-[80] flex items-start justify-center bg-[rgba(11,11,16,0.32)] px-4 pt-[12vh] pb-4 backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: calm ? 0 : 0.2 }}
              onClick={close}
            >
              <motion.div
                className="w-full max-w-[600px] overflow-hidden rounded-[18px] border border-line bg-white shadow-pop"
                role="dialog"
                aria-modal="true"
                aria-label="Search your knowledge"
                initial={calm ? false : { opacity: 0, scale: 0.96, y: -14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={calm ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 border-b border-mist px-[18px] py-4">
                  <Search size={17} className="shrink-0 text-faint" />
                  <input
                    ref={inputRef}
                    className="flex-1 border-none bg-transparent text-base tracking-[-0.01em] text-ink outline-none placeholder:text-faint"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onInputKey}
                    placeholder="Search your knowledge..."
                    aria-label="Search your knowledge"
                    role="combobox"
                    aria-expanded="true"
                    aria-controls="palette-results"
                    aria-activedescendant={
                      activeResult ? `palette-${activeResult.id}` : undefined
                    }
                  />
                  <kbd
                    className="cursor-pointer rounded-md border border-line px-2 py-[3px] font-mono text-[11px] text-faint"
                    onClick={close}
                  >
                    esc
                  </kbd>
                </div>

                <div
                  id="palette-results"
                  role="listbox"
                  className="max-h-[320px] overflow-y-auto p-2"
                >
                  {filtered.length === 0 && (
                    <p className="px-[18px] py-[26px] text-center text-[14.5px] text-muted">
                      No results for “{query}”. Press <Kbd>N</Kbd> to create it.
                    </p>
                  )}
                  {filtered.map((r, i) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.id}
                        id={`palette-${r.id}`}
                        role="option"
                        aria-selected={i === active}
                        className={`flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left transition-colors duration-100 ${
                          i === active ? "bg-soft" : ""
                        }`}
                        data-active={i === active}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => choose(r)}
                      >
                        <span
                          className={`inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-soft ${
                            i === active ? "border border-line bg-white" : ""
                          }`}
                          style={{ color: r.accent }}
                        >
                          <Icon size={16} strokeWidth={2} />
                        </span>
                        <span className="flex min-w-0 flex-col leading-[1.4]">
                          <span className="overflow-hidden text-[14.5px] font-semibold tracking-[-0.01em] text-ellipsis whitespace-nowrap">
                            {r.title}
                          </span>
                          <span className="text-xs text-faint">
                            {r.kind} · {r.detail}
                          </span>
                        </span>
                        {i === active ? (
                          <CornerDownLeft size={14} className="ml-auto shrink-0 text-accent" />
                        ) : (
                          <ArrowUpRight size={14} className="ml-auto shrink-0 text-line" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-[18px] border-t border-mist px-[18px] py-3 text-xs text-faint">
                  <span className="inline-flex items-center gap-[5px]">
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd> navigate
                  </span>
                  <span className="inline-flex items-center gap-[5px]">
                    <Kbd>↵</Kbd> open
                  </span>
                  <span className="inline-flex items-center gap-[5px]">
                    <Kbd>esc</Kbd> close
                  </span>
                </div>

                <AnimatePresence>
                  {opened && (
                    <motion.p
                      className="px-[18px] pb-3.5 text-[13.5px] font-semibold text-accent-deep"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      Opening {opened}…
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="vg-kbd">{children}</kbd>;
}
