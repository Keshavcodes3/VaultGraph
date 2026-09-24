"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CornerDownLeft,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PageItem } from "./data";
import { PageIcon } from "./PageIcon";
import { useCalm } from "../landing/Reveal";

export interface PaletteAction {
  id: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  run: () => void;
}

/**
 * Centered command palette. Instant filtering, grouped results,
 * full keyboard control, quiet footer hints.
 */
export default function CommandPalette({
  open,
  pages,
  actions,
  onSelect,
  onClose,
}: {
  open: boolean;
  pages: PageItem[];
  actions: PaletteAction[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const calm = useCalm();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const needle = q.trim().toLowerCase();
  const matchedPages = useMemo(
    () =>
      !needle
        ? pages.slice(0, 6)
        : pages.filter(
            (p) =>
              p.title.toLowerCase().includes(needle) ||
              (p.description ?? "").toLowerCase().includes(needle)
          ),
    [pages, needle]
  );
  const matchedActions = useMemo(
    () =>
      !needle
        ? actions
        : actions.filter((a) => a.label.toLowerCase().includes(needle)),
    [actions, needle]
  );

  const total = matchedPages.length + matchedActions.length;

  useEffect(() => {
    setIdx(0);
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      const t = window.setTimeout(() => inputRef.current?.focus(), calm ? 0 : 60);
      return () => window.clearTimeout(t);
    }
  }, [open, calm]);

  if (!open) return null;

  const choose = (kind: "page" | "action", i: number) => {
    if (kind === "page") {
      const p = matchedPages[i];
      if (p) {
        onSelect(p.id);
        onClose();
      }
    } else {
      const a = matchedActions[i];
      if (a) {
        a.run();
        onClose();
      }
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((v) => (total === 0 ? 0 : (v + 1) % total));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((v) => (total === 0 ? 0 : (v - 1 + total) % total));
    } else if (e.key === "Enter") {
      if (idx < matchedPages.length) choose("page", idx);
      else choose("action", idx - matchedPages.length);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  let cursor = -1;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[14vh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-ink/25 backdrop-blur-[2px]"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        initial={calm ? false : { opacity: 0, y: -10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.99 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-line bg-white shadow-pop dark:border-[#272727] dark:bg-[#181818]"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5 dark:border-[#272727]">
          <Search size={16} className="shrink-0 text-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search pages, run commands, jump anywhere…"
            aria-label="Search or command"
            className="flex-1 border-none bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint focus:ring-0 dark:text-[#F5F5F5]"
          />
          <kbd className="rounded-md border border-line bg-soft px-1.5 py-0.5 font-mono text-[10.5px] text-faint dark:border-[#272727] dark:bg-white/10">
            esc
          </kbd>
        </div>

        <div className="max-h-[320px] overflow-y-auto p-2">
          {matchedPages.length > 0 ? (
            <>
              <p className="px-3 pt-1 pb-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">
                Pages
              </p>
              {matchedPages.map((p) => {
                cursor += 1;
                const i = cursor;
                return (
                  <button
                    key={p.id}
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => choose("page", matchedPages.indexOf(p))}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      i === idx ? "bg-soft dark:bg-white/10" : ""
                    }`}
                  >
                    <PageIcon icon={p.icon} size={17} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink dark:text-[#F5F5F5]">
                        {p.title || "Untitled"}
                      </span>
                      {p.description ? (
                        <span className="block truncate text-[12px] text-faint">
                          {p.description}
                        </span>
                      ) : null}
                    </span>
                    <CornerDownLeft size={13} className="shrink-0 text-faint" />
                  </button>
                );
              })}
            </>
          ) : null}

          {matchedActions.length > 0 ? (
            <>
              <p className="px-3 pt-2 pb-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">
                Commands
              </p>
              {matchedActions.map((a) => {
                cursor += 1;
                const i = cursor;
                return (
                  <button
                    key={a.id}
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => choose("action", matchedActions.indexOf(a))}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      i === idx ? "bg-soft dark:bg-white/10" : ""
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-soft text-ink-soft dark:border-[#272727] dark:bg-white/5 dark:text-[#A1A1AA]">
                      {a.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink dark:text-[#F5F5F5]">
                      {a.label}
                    </span>
                    <span className="font-mono text-[10.5px] text-faint">{a.hint}</span>
                  </button>
                );
              })}
            </>
          ) : null}

          {total === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-faint">
              Nothing for “{q}”. Press Enter to create it.
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-4 border-t border-line bg-soft/60 px-4 py-2.5 font-mono text-[10.5px] text-faint dark:border-[#272727] dark:bg-white/5">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto">⌘K palette · ⌘B sidebar</span>
        </div>
      </motion.div>
    </div>
  );
}

export function PaletteRoot(props: React.ComponentProps<typeof CommandPalette>) {
  return (
    <AnimatePresence>
      {props.open ? <CommandPalette {...props} /> : null}
    </AnimatePresence>
  );
}
