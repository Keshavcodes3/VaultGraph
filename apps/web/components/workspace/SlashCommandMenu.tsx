"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Table2,
  Database,
  ToggleRight,
  TriangleAlert,
  Clapperboard,
  FileUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { BlockType } from "./data";
import { useCalm } from "../landing/Reveal";

interface Entry {
  type: BlockType;
  label: string;
  hint: string;
  icon: React.ReactNode;
  group: "Basic" | "Media" | "Advanced";
}

const CATALOG: Entry[] = [
  { type: "paragraph", label: "Text", hint: "Plain paragraph", icon: <Pilcrow size={14} />, group: "Basic" },
  { type: "h1", label: "Heading 1", hint: "Large section", icon: <Heading1 size={14} />, group: "Basic" },
  { type: "h2", label: "Heading 2", hint: "Medium section", icon: <Heading2 size={14} />, group: "Basic" },
  { type: "h3", label: "Heading 3", hint: "Small section", icon: <Heading3 size={14} />, group: "Basic" },
  { type: "bullet", label: "Bulleted list", hint: "• item", icon: <List size={14} />, group: "Basic" },
  { type: "numbered", label: "Numbered list", hint: "1. item", icon: <ListOrdered size={14} />, group: "Basic" },
  { type: "checkbox", label: "To-do", hint: "Track tasks", icon: <CheckSquare size={14} />, group: "Basic" },
  { type: "quote", label: "Quote", hint: "Pull a line out", icon: <Quote size={14} />, group: "Basic" },
  { type: "image", label: "Image", hint: "Embed by URL", icon: <Image size={14} />, group: "Media" },
  { type: "video", label: "Video", hint: "Embed by URL", icon: <Clapperboard size={14} />, group: "Media" },
  { type: "file", label: "File", hint: "Attach a file", icon: <FileUp size={14} />, group: "Media" },
  { type: "code", label: "Code", hint: "Snippet block", icon: <Code size={14} />, group: "Advanced" },
  { type: "callout", label: "Callout", hint: "Highlighted note", icon: <TriangleAlert size={14} />, group: "Advanced" },
  { type: "table", label: "Table", hint: "Simple grid", icon: <Table2 size={14} />, group: "Advanced" },
  { type: "database", label: "Database", hint: "Projects view", icon: <Database size={14} />, group: "Advanced" },
  { type: "toggle", label: "Toggle", hint: "Collapsible", icon: <ToggleRight size={14} />, group: "Advanced" },
  { type: "divider", label: "Divider", hint: "Split sections", icon: <Minus size={14} />, group: "Advanced" },
];

const GROUPS = ["Basic", "Media", "Advanced"] as const;

/** Slash command menu. Filters instantly, fully keyboard-driven. */
export default function SlashCommandMenu({
  filter,
  highlight,
  onHighlight,
  onPick,
}: {
  filter: string;
  highlight: number;
  onHighlight: (i: number) => void;
  onPick: (t: BlockType) => void;
}) {
  const calm = useCalm();
  const flat = CATALOG.filter((c) =>
    `${c.label} ${c.hint} ${c.type}`.toLowerCase().includes(filter.toLowerCase())
  );

  // Keep the highlighted row visible.
  useEffect(() => {
    document
      .getElementById(`slash-${highlight}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  let cursor = -1;

  return (
    <motion.div
      role="listbox"
      aria-label="Add a block"
      initial={calm ? false : { opacity: 0, y: -4, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.99 }}
      transition={{ duration: 0.14 }}
      className="absolute top-full left-8 z-30 mt-1 max-h-[300px] w-[min(300px,calc(100vw-3rem))] overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-pop dark:border-[#272727] dark:bg-[#181818]"
    >
      <AnimatePresence>
        {flat.length === 0 ? (
          <p className="px-2.5 py-3 text-[13px] text-faint">No matches.</p>
        ) : (
          GROUPS.map((g) => {
            const inGroup = flat.filter((c) => c.group === g);
            if (inGroup.length === 0) return null;
            return (
              <div key={g}>
                <p className="px-2.5 pt-1.5 pb-1 font-mono text-[10px] font-semibold tracking-[0.1em] text-faint uppercase">
                  {g}
                </p>
                {inGroup.map((c) => {
                  cursor += 1;
                  const i = cursor;
                  return (
                    <button
                      key={c.type}
                      id={`slash-${i}`}
                      role="option"
                      aria-selected={i === highlight}
                      onMouseEnter={() => onHighlight(i)}
                      onClick={() => onPick(c.type)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        i === highlight ? "bg-soft dark:bg-white/10" : ""
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-soft text-ink-soft dark:border-[#272727] dark:bg-white/5 dark:text-[#A1A1AA]">
                        {c.icon}
                      </span>
                      <span>
                        <span className="block text-[13px] font-medium text-ink dark:text-[#F5F5F5]">
                          {c.label}
                        </span>
                        <span className="block text-[11.5px] text-faint">{c.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function slashMatches(filter: string): BlockType[] {
  return CATALOG.filter((c) =>
    `${c.label} ${c.hint} ${c.type}`.toLowerCase().includes(filter.toLowerCase())
  ).map((c) => c.type);
}
