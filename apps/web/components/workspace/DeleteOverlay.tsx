"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Trash2 } from "lucide-react";
import { useCalm } from "../landing/Reveal";

export type DeletePhase = "deleting" | "done";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Razorpay-style delete overlay.
 *
 * Masks API latency with a guaranteed ~1s animation:
 * `deleting` (spinner ring + pulsing trash + progress bar) morphs
 * into `done` (spring check). Caller holds it open for >=1000ms.
 */
export default function DeleteOverlay({
  open,
  phase,
  title,
  subtitle,
}: {
  open: boolean;
  phase: DeletePhase;
  title: string;
  subtitle?: string;
}) {
  const calm = useCalm();
  const done = phase === "done";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label={done ? "Deleted" : title}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/25 p-4 backdrop-blur-[6px]"
          initial={calm ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={calm ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={calm ? false : { opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={calm ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="relative flex w-full max-w-[320px] flex-col items-center overflow-hidden rounded-2xl border border-line bg-white px-6 pt-7 pb-6 text-center shadow-pop dark:border-[#272727] dark:bg-[#181818]"
          >
            {/* icon orb */}
            <div className="relative flex h-[76px] w-[76px] items-center justify-center">
              {/* spinning ring while deleting */}
              {!done && !calm ? (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-rosy border-r-rosy/40"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                />
              ) : null}
              {/* soft pulse ring while deleting */}
              {!done && !calm ? (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-rosy/20"
                  animate={{ scale: [1, 1.18], opacity: [0.7, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                />
              ) : null}

              <motion.div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  done ? "bg-emerald-500" : "bg-rosy"
                } shadow-[0_12px_32px_-10px_rgba(244,63,94,0.55)]`}
                initial={calm ? false : { scale: 0.8 }}
                animate={
                  calm
                    ? undefined
                    : done
                      ? { scale: [1, 1.12, 1] }
                      : { scale: [1, 1.05, 1] }
                }
                transition={
                  done
                    ? { duration: 0.4, ease: EASE }
                    : { duration: 1, repeat: Infinity, ease: "easeInOut" }
                }
              >
                <AnimatePresence mode="wait" initial={false}>
                  {done ? (
                    <motion.span
                      key="check"
                      initial={calm ? false : { scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 480, damping: 22 }}
                      className="flex items-center justify-center text-white"
                    >
                      <Check size={26} strokeWidth={3} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="trash"
                      initial={calm ? false : { scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center text-white"
                    >
                      <Trash2 size={24} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* copy */}
            <h2 className="mt-4 text-[16px] font-semibold tracking-[-0.01em] text-ink dark:text-white">
              {done ? "Deleted" : title}
            </h2>
            <p className="mt-1 min-h-[20px] text-[13px] leading-snug text-ink-soft dark:text-[#A1A1AA]">
              {done ? (subtitle ?? "Gone for good.") : (subtitle ?? "Moving it out of the way…")}
            </p>

            {/* progress bar — indeterminate while deleting, fills on done */}
            <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-soft dark:bg-white/10">
              {done ? (
                <motion.div
                  className="h-full w-full origin-left rounded-full bg-emerald-500"
                  initial={{ scaleX: 0.6 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.35, ease: EASE }}
                />
              ) : calm ? (
                <div className="h-full w-1/3 rounded-full bg-rosy" />
              ) : (
                <motion.div
                  className="h-full w-1/3 rounded-full bg-rosy"
                  animate={{ x: ["-110%", "310%"] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-faint">
              {done ? (
                "All cleaned up"
              ) : (
                <>
                  Deleting
                  {!calm ? (
                    <motion.span
                      className="flex gap-[3px]"
                      aria-hidden
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span className="h-1 w-1 rounded-full bg-current" />
                    </motion.span>
                  ) : null}
                </>
              )}
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
