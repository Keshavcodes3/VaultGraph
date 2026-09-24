"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCalm } from "../landing/Reveal";

export interface MenuItem {
  id: string;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  danger?: boolean;
  checked?: boolean;
  children?: MenuItem[];
  action?: () => void;
}

/**
 * Beautiful contextual menu. Fixed-positioned near (x, y),
 * clamped to the viewport, with one-level submenus and
 * full keyboard navigation.
 */
export default function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  const calm = useCalm();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });
  const [hi, setHi] = useState(0);
  const [openSub, setOpenSub] = useState<string | null>(null);

  // Clamp into viewport after measuring.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: Math.min(x, window.innerWidth - r.width - 8),
      y: Math.min(y, window.innerHeight - r.height - 8),
    });
  }, [x, y]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHi((h) => (h + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHi((h) => (h - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        const it = items[hi];
        if (it?.children) setOpenSub(it.id);
        else if (it?.action) {
          it.action();
          onClose();
        }
      }
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onClose);
    };
  }, [items, hi, onClose]);

  const fire = (it: MenuItem) => {
    if (it.children) {
      setOpenSub(openSub === it.id ? null : it.id);
      return;
    }
    it.action?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80]">
      <motion.div
        ref={ref}
        role="menu"
        initial={calm ? false : { opacity: 0, scale: 0.97, y: -3 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -3 }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        style={{ left: Math.max(pos.x, 8), top: Math.max(pos.y, 8) }}
        className="fixed w-[220px] overflow-visible rounded-xl border border-line bg-white p-1 shadow-pop dark:border-[#272727] dark:bg-[#181818]"
      >
        <AnimatePresence>
          {items.map((it, i) => (
            <div key={it.id} className="relative">
              <button
                role="menuitem"
                onMouseEnter={() => {
                  setHi(i);
                  setOpenSub(it.children ? it.id : null);
                }}
                onClick={() => fire(it)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[13px] transition-colors ${
                  it.danger
                    ? "text-rosy"
                    : "text-ink dark:text-[#F5F5F5]"
                } ${i === hi ? "bg-soft dark:bg-white/10" : ""}`}
              >
                <span className="w-4 shrink-0 text-faint dark:text-[#A1A1AA]">
                  {it.checked ? <Check size={14} /> : it.icon}
                </span>
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                {it.hint ? (
                  <span className="font-mono text-[10.5px] text-faint dark:text-[#A1A1AA]">
                    {it.hint}
                  </span>
                ) : null}
                {it.children ? <ChevronRight size={13} className="text-faint" /> : null}
              </button>

              <AnimatePresence>
                {it.children && openSub === it.id ? (
                  <motion.div
                    initial={calm ? false : { opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.13 }}
                    className="absolute top-0 left-[calc(100%+6px)] w-[200px] rounded-xl border border-line bg-white p-1 shadow-pop dark:border-[#272727] dark:bg-[#181818]"
                  >
                    {it.children.map((c) => (
                      <button
                        key={c.id}
                        role="menuitem"
                        onClick={() => {
                          c.action?.();
                          onClose();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[13px] text-ink transition-colors hover:bg-soft dark:text-[#F5F5F5] dark:hover:bg-white/10"
                      >
                        <span className="min-w-0 flex-1 truncate">{c.label}</span>
                      </button>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
