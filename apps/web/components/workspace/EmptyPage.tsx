"use client";

import { motion } from "framer-motion";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { PageIcon } from "./PageIcon";
import VaultMark from "./VaultMark";
import type { TrashItem } from "./data";
import { useCalm } from "../landing/Reveal";

/** "2h ago" style stamp for trash rows (full date kept in title attr). */
function formatDeletedAt(iso: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return iso;
  const diff = Date.now() - time;
  if (diff < 0) return "just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(time).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Sparing, cute empty states with the geometric VaultMark. */
export function EmptyPage({
  title,
  hint,
  actionLabel,
  onAction,
}: {
  title: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const calm = useCalm();
  return (
    <motion.div
      initial={calm ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col items-center justify-center px-6 py-20 text-center"
    >
      <VaultMark size={64} />
      <h2 className="mt-5 text-[19px] font-semibold tracking-[-0.02em] text-ink dark:text-white">
        {title}
      </h2>
      <p className="mt-1.5 max-w-[260px] text-[13.5px] leading-relaxed text-ink-soft dark:text-[#A1A1AA]">
        {hint}
      </p>
      {actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-black dark:bg-white dark:text-ink dark:hover:bg-white/85"
        >
          <Plus size={14} /> {actionLabel}
        </button>
      ) : null}
    </motion.div>
  );
}

/** Trash: restore, delete forever, or empty it all. */
export function TrashView({
  trash,
  deletingIds,
  emptying,
  onRestore,
  onDeleteForever,
  onEmpty,
}: {
  trash: TrashItem[];
  deletingIds?: Set<string>;
  emptying?: boolean;
  onRestore: (id: string) => void;
  onDeleteForever: (id: string) => void;
  onEmpty: () => void;
}) {
  if (trash.length === 0) {
    return (
      <EmptyPage title="Trash is empty." hint="Deleted pages rest here for 30 days. Nothing to mourn yet." />
    );
  }
  return (
    <div className="mx-auto w-full max-w-[850px] px-6 py-10 sm:px-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] text-ink dark:text-white">
            Trash
          </h1>
          <p className="mt-1 text-[14px] text-ink-soft dark:text-[#A1A1AA]">
            {trash.length} {trash.length === 1 ? "page" : "pages"} · deleted pages rest for 30 days
          </p>
        </div>
        <button
          onClick={onEmpty}
          disabled={emptying || trash.length === 0}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-rosy transition-colors hover:bg-rosy/10 disabled:opacity-60"
        >
          {emptying ? (
            <span
              aria-hidden
              className="block h-3.5 w-3.5 animate-spin rounded-full border-[2px] border-rosy/30 border-t-rosy"
            />
          ) : null}
          {emptying ? "Emptying…" : "Empty trash"}
        </button>
      </div>
      <div className="mt-6 space-y-1">
        {trash.map((t) => {
          const deleting = deletingIds?.has(t.page.id) ?? false;
          return (
          <div
            key={t.page.id}
            className={`group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-soft dark:hover:bg-white/5 ${deleting ? "pointer-events-none opacity-50" : ""}`}
          >
            <PageIcon icon={t.page.icon} size={17} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-ink dark:text-white">
                {t.page.title || "Untitled"}
              </span>
              <span className="block text-[12px] text-faint" title={new Date(Date.parse(t.deletedAt)).toString()}>
                Deleted {formatDeletedAt(t.deletedAt)}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => onRestore(t.page.id)}
                disabled={deleting}
                title="Restore this page"
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-white hover:text-ink disabled:opacity-60 dark:text-[#A1A1AA] dark:hover:bg-white/10 dark:hover:text-white"
              >
                <RotateCcw size={12} /> Restore
              </button>
              <button
                onClick={() => onDeleteForever(t.page.id)}
                disabled={deleting}
                title="Delete forever"
                aria-label={deleting ? `Deleting ${t.page.title || "Untitled"}` : `Delete ${t.page.title || "Untitled"} forever`}
                className="rounded-md p-1.5 text-faint transition-colors hover:bg-white hover:text-rosy disabled:opacity-60 dark:hover:bg-white/10"
              >
                {deleting ? (
                  <span
                    aria-hidden
                    className="block h-[14px] w-[14px] animate-spin rounded-full border-[2px] border-rosy/30 border-t-rosy"
                  />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </span>
          </div>
          );
        })}
      </div>
    </div>
  );
}
