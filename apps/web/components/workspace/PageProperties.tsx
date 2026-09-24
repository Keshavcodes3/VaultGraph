"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Star, X } from "lucide-react";
import { PageIcon } from "./PageIcon";
import type { ActivityItem, PageItem } from "./data";
import { useCalm } from "../landing/Reveal";

interface PropsPanelProps {
  open: boolean;
  page: PageItem | null;
  parentTitle: string | null;
  activity: ActivityItem[];
  ownerName?: string;
  onToggleFav: () => void;
  onClose: () => void;
}

/** Contextual slide-over: properties + activity. Never a dashboard. */
export default function PageProperties(p: PropsPanelProps) {
  const calm = useCalm();

  return (
    <AnimatePresence initial={false}>
      {p.open && p.page ? (
        <motion.aside
          key="props"
          initial={calm ? false : { width: 0, opacity: 0 }}
          animate={{ width: 300, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="hidden shrink-0 overflow-hidden border-l border-line bg-white lg:block dark:border-[#272727] dark:bg-[#111111]"
        >
          <div className="flex h-full w-[300px] flex-col">
            <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-[#272727]">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-ink dark:text-white">
                <PageIcon icon={p.page.icon} size={16} />
                <span className="max-w-[180px] truncate">{p.page.title || "Untitled"}</span>
              </span>
              <button
                onClick={p.onClose}
                aria-label="Close properties"
                className="rounded-md p-1.5 text-faint transition-colors hover:bg-soft hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <p className="pb-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">
                Properties
              </p>
              <dl className="space-y-1 text-[13px]">
                <div className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5">
                  <dt className="text-faint">Created</dt>
                  <dd className="text-ink dark:text-[#F5F5F5]">—</dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5">
                  <dt className="text-faint">Updated</dt>
                  <dd className="text-ink dark:text-[#F5F5F5]">{p.page.updatedAt}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5">
                  <dt className="text-faint">Owner</dt>
                  <dd className="text-ink dark:text-[#F5F5F5]">{p.ownerName ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5">
                  <dt className="text-faint">Parent</dt>
                  <dd className="max-w-[150px] truncate text-ink dark:text-[#F5F5F5]">
                    {p.parentTitle ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5">
                  <dt className="text-faint">Status</dt>
                  <dd className="text-ink capitalize dark:text-[#F5F5F5]">
                    {(p.page.status ?? "draft").replace("-", " ")}
                  </dd>
                </div>
                <button
                  onClick={p.onToggleFav}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-soft dark:hover:bg-white/5"
                >
                  <span className="text-faint">Favorite</span>
                  <Star
                    size={14}
                    fill={p.page.favorite ? "currentColor" : "none"}
                    className={p.page.favorite ? "text-amberish" : "text-faint"}
                  />
                </button>
              </dl>

              <p className="pt-5 pb-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">
                Activity
              </p>
              <div className="space-y-3">
                {p.activity.map((a) => (
                  <div key={a.id} className="flex gap-2.5 px-1">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-line dark:bg-[#272727]" />
                    <div className="min-w-0">
                      <p className="text-[12.5px] leading-snug text-ink dark:text-[#F5F5F5]">
                        {a.text}
                      </p>
                      <p className="mt-0.5 font-mono text-[10.5px] text-faint">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
