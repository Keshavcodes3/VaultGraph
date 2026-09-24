"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import BlockEditor from "./BlockEditor";
import { PageIcon } from "./PageIcon";
import PageIconPicker from "./PageIconPicker";
import type { Block, DbRow, PageItem } from "./data";
import { useCalm } from "../landing/Reveal";

interface CanvasProps {
  page: PageItem;
  dbRows: DbRow[];
  isFresh: boolean;
  onPatchBlocks: (blocks: Block[]) => void;
  onMeta: (patch: Partial<PageItem>) => void;
  onDbChange: (rows: DbRow[]) => void;
}

/**
 * The thinking surface. No cards, no borders — just hierarchy,
 * whitespace and typography. Wide blocks (tables, databases)
 * break out of the 850px measure.
 */
export default function PageCanvas(p: CanvasProps) {
  const calm = useCalm();
  const [iconOpen, setIconOpen] = useState(false);
  const { page } = p;

  const wordCount = page.blocks.reduce(
    (acc, blk) =>
      acc + (blk.content.trim() ? blk.content.trim().split(/\s+/).length : 0),
    0
  );

  return (
    <motion.div
      key={page.id}
      initial={calm ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="group/canvas mx-auto w-full max-w-[850px] px-6 pb-24 sm:px-12"
    >
      {/* page identity */}
      <div className="pt-10">
        {page.icon ? (
          <button
            onClick={() => setIconOpen(true)}
            title="Change icon"
            aria-label="Change page icon"
            className="flex h-[68px] w-[68px] items-center justify-center rounded-xl text-[38px] transition-all hover:bg-soft dark:hover:bg-white/5"
          >
            <PageIcon icon={page.icon} size={38} />
          </button>
        ) : (
          <button
            onClick={() => setIconOpen(true)}
            className="mb-1 rounded-md px-2 py-1 text-[13px] text-faint opacity-0 transition-all hover:bg-soft hover:text-ink focus-visible:opacity-100 [@media(hover:hover)]:group-hover/canvas:opacity-100"
          >
            Add icon
          </button>
        )}
        <input
          value={page.title}
          onChange={(e) => p.onMeta({ title: e.target.value })}
          placeholder="Untitled"
          aria-label="Page title"
          className="mt-2 w-full border-none bg-transparent p-0 text-[clamp(32px,4.5vw,40px)] leading-[1.1] font-bold tracking-[-0.02em] text-ink outline-none placeholder:text-faint focus:ring-0 dark:text-white"
        />
        <input
          value={page.description ?? ""}
          onChange={(e) => p.onMeta({ description: e.target.value })}
          placeholder="Add a short description…"
          aria-label="Page description"
          className="mt-1.5 w-full border-none bg-transparent p-0 text-[15px] leading-relaxed text-ink-soft outline-none placeholder:text-faint focus:ring-0 dark:text-[#A1A1AA]"
        />
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px]">
          <span className="rounded-full border border-line bg-white px-2.5 py-1 text-ink-soft dark:border-[#272727] dark:bg-transparent dark:text-[#A1A1AA]">
            Updated {page.updatedAt}
          </span>
          {(page.tags ?? []).map((t) => (
            <span
              key={t}
              className="rounded-full bg-soft px-2.5 py-1 font-medium text-ink-soft dark:bg-white/10 dark:text-[#A1A1AA]"
            >
              #{t}
            </span>
          ))}
          {(page.backlinks ?? []).length > 0 ? (
            <span className="rounded-full bg-soft px-2.5 py-1 text-ink-soft dark:bg-white/10 dark:text-[#A1A1AA]">
              {(page.backlinks ?? []).length} backlinks
            </span>
          ) : null}
        </div>
      </div>

      {p.isFresh ? (
        <p className="mt-6 rounded-lg bg-soft/70 px-3 py-2.5 text-[13.5px] text-ink-soft dark:bg-white/5 dark:text-[#A1A1AA]">
          Start building. Type <kbd className="vg-kbd">/</kbd> for commands, or just
          start writing…
        </p>
      ) : null}

      <BlockEditor
        blocks={page.blocks}
        dbRows={p.dbRows}
        onPatch={p.onPatchBlocks}
        onDbChange={p.onDbChange}
      />

      <div className="mt-12 flex items-center gap-2 border-t border-line px-1 pt-4 font-mono text-[11px] text-faint">
        <span>
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {page.blocks.length} {page.blocks.length === 1 ? "block" : "blocks"}
        </span>
        <span aria-hidden="true">·</span>
        <span>Updated {page.updatedAt}</span>
      </div>

      <PageIconPicker
        open={iconOpen}
        current={page.icon}
        onPick={(icon) => p.onMeta({ icon })}
        onClose={() => setIconOpen(false)}
      />
    </motion.div>
  );
}
