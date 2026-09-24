"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Ban } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as icons from "lucide-react";
import { LUCIDE_ICONS, PAGE_ICONS } from "./data";
import { useCalm } from "../landing/Reveal";

/** Page icon picker — emoji, Lucide icons, or no icon at all. */
export default function PageIconPicker({
  open,
  current,
  onPick,
  onClose,
}: {
  open: boolean;
  current: string;
  onPick: (icon: string) => void;
  onClose: () => void;
}) {
  const calm = useCalm();
  const [tab, setTab] = useState<"emoji" | "lucide">(
    current.startsWith("lucide:") ? "lucide" : "emoji"
  );
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
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

  if (!open) return null;

  const needle = q.trim().toLowerCase();
  const emojis = needle
    ? PAGE_ICONS.filter((p) => p.name.includes(needle))
    : PAGE_ICONS;
  const lucide = needle
    ? LUCIDE_ICONS.filter((n) => n.toLowerCase().includes(needle))
    : LUCIDE_ICONS;

  return (
    <div className="fixed inset-0 z-[60]">
      <AnimatePresence>
        <motion.div
          ref={ref}
          role="dialog"
          aria-label="Choose page icon"
          initial={calm ? false : { opacity: 0, y: -6, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.99 }}
          transition={{ duration: 0.15 }}
          className="absolute top-[190px] left-4 w-[320px] overflow-hidden rounded-xl border border-line bg-white shadow-pop sm:left-10 dark:border-[#272727] dark:bg-[#181818]"
        >
          <div className="flex items-center gap-1 border-b border-line p-1.5 dark:border-[#272727]">
            {(["emoji", "lucide"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-[12.5px] font-medium capitalize transition-colors ${
                  tab === t
                    ? "bg-soft text-ink dark:bg-white/10 dark:text-white"
                    : "text-ink-soft hover:text-ink dark:text-[#A1A1AA] dark:hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
            <button
              onClick={() => {
                onPick("");
                onClose();
              }}
              title="Remove icon"
              aria-label="Remove icon"
              className="rounded-lg p-1.5 text-faint transition-colors hover:bg-soft hover:text-rosy"
            >
              <Ban size={14} />
            </button>
          </div>
          <div className="border-b border-line px-3 py-2 dark:border-[#272727]">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tab === "emoji" ? "Filter emoji…" : "Search icons…"}
              aria-label="Filter icons"
              className="w-full border-none bg-transparent text-[13px] text-ink outline-none placeholder:text-faint focus:ring-0 dark:text-white"
            />
          </div>
          {tab === "emoji" ? (
            <div className="grid max-h-[220px] grid-cols-8 gap-1 overflow-y-auto p-2.5">
              {emojis.length === 0 ? (
                <p className="col-span-8 px-2 py-4 text-center text-[12.5px] text-faint">
                  Nothing for “{q}”.
                </p>
              ) : (
                emojis.map(({ icon, name }) => (
                  <button
                    key={icon}
                    title={name}
                    onClick={() => {
                      onPick(icon);
                      onClose();
                    }}
                    className={`flex h-9 items-center justify-center rounded-lg text-[19px] transition-colors hover:bg-soft dark:hover:bg-white/10 ${
                      icon === current ? "bg-soft ring-1 ring-ink/20 dark:bg-white/10" : ""
                    }`}
                  >
                    {icon}
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="grid max-h-[220px] grid-cols-6 gap-1 overflow-y-auto p-2.5">
              {lucide.length === 0 ? (
                <p className="col-span-6 px-2 py-4 text-center text-[12.5px] text-faint">
                  Nothing for “{q}”.
                </p>
              ) : (
                lucide.map((name) => {
                  const Cmp = (icons as unknown as Record<string, icons.LucideIcon>)[name];
                  if (!Cmp) return null;
                  const id = `lucide:${name}`;
                  return (
                    <button
                      key={name}
                      title={name}
                      onClick={() => {
                        onPick(id);
                        onClose();
                      }}
                      className={`flex h-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-soft hover:text-ink dark:text-[#A1A1AA] dark:hover:bg-white/10 dark:hover:text-white ${
                        id === current ? "bg-soft ring-1 ring-ink/20 dark:bg-white/10" : ""
                      }`}
                    >
                      <Cmp size={17} />
                    </button>
                  );
                })
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
