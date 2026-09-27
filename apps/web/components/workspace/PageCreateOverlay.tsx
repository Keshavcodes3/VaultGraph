"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FilePlus2 } from "lucide-react";
import { useEffect, useState } from "react";
import VaultMark from "./VaultMark";
import { useCalm } from "../landing/Reveal";

const EASE = [0.22, 1, 0.36, 1] as const;

const STATUS_LINES = [
  "Planting seeds…",
  "Sharpening pencils…",
  "Opening the door…",
];

/**
 * Cute full-shell takeover shown while a new page is being created.
 * Masks the create round-trip with a playful ~1s beat, then the
 * caller navigates straight into the fresh page — no staring,
 * no double-clicks (the takeover blocks pointer input meanwhile).
 */
export default function PageCreateOverlay({ open }: { open: boolean }) {
  const calm = useCalm();
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (!open) {
      setLine(0);
      return;
    }
    const t = window.setInterval(
      () => setLine((v) => (v + 1) % STATUS_LINES.length),
      700
    );
    return () => window.clearInterval(t);
  }, [open ]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label="Creating your page"
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
            {/* sprouting page orb */}
            <div className="relative flex h-[84px] w-[84px] items-center justify-center">
              {!calm && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand border-r-brand/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                />
              )}
              {!calm && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-brand/20"
                  animate={{ scale: [1, 1.22], opacity: [0.7, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <motion.div
                animate={calm ? undefined : { y: [0, -5, 0], rotate: [0, -3, 0] }}
                transition={calm ? undefined : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_12px_32px_-10px_rgba(79,70,229,0.6)]"
              >
                <FilePlus2 size={26} />
              </motion.div>
            </div>

            <h2 className="mt-4 text-[16px] font-semibold tracking-[-0.01em] text-ink dark:text-white">
              Creating your page
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
                  className="h-full w-1/3 rounded-full bg-gradient-to-r from-brand via-violetish to-mint"
                  animate={{ x: ["-110%", "310%"] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </div>

            <p className="mt-3 flex items-center gap-1 text-[11px] font-medium text-faint">
              <VaultMark size={14} />
              taking you there in a sec
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
