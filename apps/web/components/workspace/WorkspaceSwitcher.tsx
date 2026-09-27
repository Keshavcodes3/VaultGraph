"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Settings, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SidebarWorkspace } from "./WorkspaceSidebar";
import { useCalm } from "../landing/Reveal";

/** Workspace switcher dropdown — your workspaces, create, delete, settings. */
export default function WorkspaceSwitcher({
  open,
  currentId,
  workspaces,
  loading,
  deletingIds,
  onSelect,
  onCreate,
  onDelete,
  onClose,
}: {
  open: boolean;
  currentId: string | null;
  workspaces: SidebarWorkspace[];
  loading: boolean;
  deletingIds?: Set<string>;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const calm = useCalm();
  const ref = useRef<HTMLDivElement>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  // Two-step delete confirm: first click arms, second click fires.
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(confirmTimer.current), []);

  const armDelete = (id: string) => {
    window.clearTimeout(confirmTimer.current);
    setConfirmId(id);
    confirmTimer.current = window.setTimeout(() => setConfirmId(null), 3000);
  };

  const fireDelete = (id: string) => {
    window.clearTimeout(confirmTimer.current);
    setConfirmId(null);
    onDelete(id);
    onClose();
  };

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

  useEffect(() => {
    if (!open) {
      setCreating(false);
      setDraft("");
      setConfirmId(null);
    }
  }, [open ]);

  const submitCreate = () => {
    const name = draft.trim();
    if (!name) return;
    onCreate(name);
    setDraft("");
    setCreating(false);
    onClose();
  };

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
            {loading ? (
              <div className="space-y-1 px-1 py-1" aria-label="Loading workspaces">
                <div className="h-11 animate-pulse rounded-lg bg-soft dark:bg-white/5" />
                <div className="h-11 animate-pulse rounded-lg bg-soft dark:bg-white/5" />
              </div>
            ) : workspaces.length === 0 ? (
              <p className="px-2 py-2 text-[12.5px] text-faint">
                No workspaces yet. Create your first below.
              </p>
            ) : (
              workspaces.map((w) => {
                const active = w.id === currentId;
                const initial = (w.name.trim().charAt(0) || "V").toUpperCase();
                const deleting = deletingIds?.has(w.id) ?? false;
                const confirming = confirmId === w.id;
                return (
                  <div
                    key={w.id}
                    className={`group flex w-full items-center gap-1 rounded-lg px-1 py-1 transition-colors hover:bg-soft dark:hover:bg-white/10 ${deleting ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <button
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        onSelect(w.id);
                        onClose();
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1 py-1 text-left"
                    >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink text-[12px] font-bold text-white dark:bg-white dark:text-ink">
                      {initial}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[13px] font-medium text-ink dark:text-[#F5F5F5]">
                        {w.name}
                      </span>
                    </span>
                    {active ? <Check size={14} className="shrink-0 text-ink dark:text-white" /> : null}
                  </button>
                    {deleting ? (
                      <span
                        role="status"
                        aria-label={`Deleting ${w.name}`}
                        className="block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-[2px] border-rosy/30 border-t-rosy"
                      />
                    ) : confirming ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fireDelete(w.id);
                        }}
                        aria-label={`Confirm delete ${w.name}`}
                        className="shrink-0 rounded-md bg-rosy/10 px-2 py-1 text-[12px] font-semibold text-rosy transition-colors hover:bg-rosy hover:text-white"
                      >
                        Sure?
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          armDelete(w.id);
                        }}
                        aria-label={`Delete ${w.name}`}
                        title={`Delete ${w.name}`}
                        className="shrink-0 rounded p-1 text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:text-rosy focus-visible:opacity-100 max-md:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t border-line p-1 dark:border-[#272727]">
            {creating ? (
              <div className="flex items-center gap-1.5 p-1">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitCreate();
                    if (e.key === "Escape") setCreating(false);
                  }}
                  placeholder="Workspace name…"
                  aria-label="New workspace name"
                  className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink outline-none placeholder:text-faint focus:border-ink/30 dark:border-[#272727] dark:bg-transparent dark:text-white"
                />
                <button
                  onClick={submitCreate}
                  disabled={!draft.trim()}
                  className="h-8 shrink-0 rounded-lg bg-ink px-3 text-[13px] font-semibold text-white transition-colors hover:bg-black disabled:opacity-40 dark:bg-white dark:text-ink dark:hover:bg-white/85"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] text-ink transition-colors hover:bg-soft dark:text-[#F5F5F5] dark:hover:bg-white/10"
              >
                <Plus size={14} className="text-faint" /> Create workspace
              </button>
            )}
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] text-ink transition-colors hover:bg-soft dark:text-[#F5F5F5] dark:hover:bg-white/10">
              <Settings size={14} className="text-faint" /> Workspace settings
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
