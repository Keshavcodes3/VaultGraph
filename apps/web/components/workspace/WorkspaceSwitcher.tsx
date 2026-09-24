"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Settings } from "lucide-react";
import { useEffect, useRef } from "react";
import { WORKSPACES } from "./data";
import { useCalm } from "../landing/Reveal";

/** Workspace switcher dropdown — your workspaces, create, settings. */
export default function WorkspaceSwitcher({
  open,
  currentId,
  onSelect,
  onClose,
}: {
  open: boolean;
  currentId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const calm = useCalm();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={ref}
          role="menu"
          aria-label="Switch workspace"
          initial={calm ? false : { opacity: 0, y: -5, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -5, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-[calc(100%+6px)] left-0 z-[70] w-[248px] overflow-hidden rounded-xl border border-line bg-white shadow-pop dark:border-[#272727] dark:bg-[#181818]"
        >
          <p className="px-3 pt-2.5 pb-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-faint uppercase dark:text-[#A1A1AA]">
            Your workspaces
          </p>
          <div className="p-1">
            {WORKSPACES.map((w) => {
              const active = w.id === currentId;
              return (
                <button
                  key={w.id}
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    onSelect(w.id);
                    onClose();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-soft dark:hover:bg-white/10"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink text-[12px] font-bold text-white dark:bg-white dark:text-ink">
                    {w.initial}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-[13px] font-medium text-ink dark:text-[#F5F5F5]">
                      {w.name}
                    </span>
                    <span className="block truncate text-[11px] text-faint dark:text-[#A1A1AA]">
                      {w.plan}
                    </span>
                  </span>
                  {active ? <Check size={14} className="shrink-0 text-ink dark:text-white" /> : null}
                </button>
              );
            })}
          </div>
          <div className="border-t border-line p-1 dark:border-[#272727]">
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] text-ink transition-colors hover:bg-soft dark:text-[#F5F5F5] dark:hover:bg-white/10">
              <Plus size={14} className="text-faint" /> Create workspace
            </button>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] text-ink transition-colors hover:bg-soft dark:text-[#F5F5F5] dark:hover:bg-white/10">
              <Settings size={14} className="text-faint" /> Workspace settings
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
