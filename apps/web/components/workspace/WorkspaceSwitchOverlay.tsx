"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import VaultMark from "./VaultMark";
import { useCalm } from "../landing/Reveal";

const EASE = [0.22, 1, 0.36, 1] as const;

const STATUS_LINES = [
  "Fetching pages…",
  "Waking up projects…",
  "Dusting off the trash…",
  "Polishing pixels…",
];

/**
 * Cute full-shell takeover shown while switching workspaces.
 * Masks the refetch of pages / projects / trash with a playful
 * ~1s beat (orbiting dots + cycling status lines + shimmer bar),
 * so the sidebar never flashes the previous workspace's data.
 */
export default function WorkspaceSwitchOverlay({
  open,
  workspaceName,
}: {
  open: boolean;
  workspaceName: string;
}) {
  const calm = useCalm();
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (!open) {
      setLine(0);
      return;
    }
    const t = window.setInterval(
      () => setLine((v) => (v + 1) % STATUS_LINES.length),
      750
    );
    return () => window.clearInterval(t);
  }, [open ]);

  const initial = (workspaceName.trim().charAt(0) || "V").toUpperCase();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label={`Switching to ${workspaceName}`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-white/72 p-4 backdrop-blur-[10px] dark:bg-[#111111]/78"
          initial={calm ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={calm ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.div
            initial={calm ? false : { opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={calm ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.34, ease: EASE }}
            className="relative flex w-full max-w-[300px] flex-col items-center overflow-hidden rounded-3xl border border-line bg-white px-6 pt-7 pb-6 text-center shadow-pop dark:border-[#2b2b32] dark:bg-[#181818]"
          >
            {/* avatar with orbiting dots */}
            <div className="relative flex h-[84px] w-[84px] items-center justify-center">
              {!calm && (
                <>
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full border border-dashed border-brand/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  />
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      aria-hidden
                      className="absolute inset-0"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: -i * 0.73,
                      }}
                    >
                      <span
                        className={`absolute top-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full ${
                          i === 1 ? "bg-rosy" : i === 2 ? "bg-mint" : "bg-brand"
                        }`}
                      />
                    </motion.span>
                  ))}
                </>
              )}
              <motion.div
                animate={calm ? undefined : { y: [0, -4, 0] }}
                transition={calm ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-[22px] font-bold text-white shadow-card dark:bg-white dark:text-ink"
              >
                {initial}
              </motion.div>
            </div>

            <h2 className="mt-4 max-w-full truncate text-[16px] font-semibold tracking-[-0.01em] text-ink dark:text-white">
              {workspaceName}
            </h2>

            <div className="mt-1 flex h-[20px] items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={line}
                  initial={calm ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={calm ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  className="text-[13px] text-ink-soft dark:text-[#b8b8c2]"
                >
                  {STATUS_LINES[line]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* shimmer progress */}
            <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-soft dark:bg-white/10">
              {calm ? (
                <div className="h-full w-1/3 rounded-full bg-brand" />
              ) : (
                <motion.div
                  className="h-full w-1/3 rounded-full bg-gradient-to-r from-brand via-violetish to-rosy"
                  animate={{ x: ["-110%", "310%"] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </div>

            <p className="mt-3 flex items-center gap-1 text-[11px] font-medium text-faint">
              <VaultMark size={14} />
              gathering everything together
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
