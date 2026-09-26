"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCalm } from "../landing/Reveal";

const EASE = [0.22, 1, 0.36, 1] as const;

function KiraFace({ size = 40 }: { size?: number }) {
  const calm = useCalm();

  return (
    <span
      aria-hidden
      className="relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand via-violetish to-rosy shadow-[0_8px_24px_-8px_rgba(79,70,229,0.6)]"
      style={{ width: size, height: size }}
    >
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          className="absolute top-[34%] h-[16%] w-[9%] rounded-full bg-white"
          style={{
            left: i === 0 ? "28%" : "63%",
          }}
          animate={
            calm
              ? undefined
              : {
                  scaleY: [1, 1, 0.12, 1, 1],
                }
          }
          transition={
            calm
              ? undefined
              : {
                  duration: 4.2,
                  repeat: Infinity,
                  times: [0, 0.92, 0.95, 0.98, 1],
                }
          }
        />
      ))}

      <span className="absolute top-[54%] left-[18%] h-[12%] w-[18%] rounded-full bg-white/40 blur-[1px]" />
      <span className="absolute top-[54%] right-[18%] h-[12%] w-[18%] rounded-full bg-white/40 blur-[1px]" />

      <svg
        viewBox="0 0 20 10"
        className="absolute bottom-[20%] w-[38%]"
        fill="none"
        aria-hidden
      >
        <path
          d="M4 3.5C6.5 7 13.5 7 16 3.5"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function FloatingBits() {
  const calm = useCalm();

  if (calm) return null;

  const bits = ["✦", "♥", "✿", "⋆", "♡"];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {bits.map((bit, i) => (
        <motion.span
          key={i}
          className="absolute text-[13px]"
          style={{
            left: `${12 + i * 18}%`,
            top: "58%",
            color: i % 2 ? "#f43f5e" : "#4f46e5",
            opacity: 0.7,
          }}
          initial={{
            y: 0,
            opacity: 0,
            scale: 0.6,
          }}
          animate={{
            y: -120,
            opacity: [0, 0.9, 0],
            scale: [0.6, 1.1, 0.9],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 0.45,
            ease: "easeOut",
          }}
        >
          {bit}
        </motion.span>
      ))}
    </div>
  );
}

export default function AskKira() {
  const calm = useCalm();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={
          calm
            ? undefined
            : {
                y: -1,
                scale: 1.01,
              }
        }
        whileTap={
          calm
            ? undefined
            : {
                scale: 0.98,
              }
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        className="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border border-brand/20 bg-gradient-to-br from-brand-soft via-white to-rosy/10 px-2.5 py-2.5 text-left shadow-mini transition-colors hover:border-brand/40 dark:from-white/10 dark:via-transparent dark:to-rosy/10"
      >
        {!calm && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            initial={{ x: "-120%" }}
            animate={{ x: "120%" }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              repeatDelay: 2.4,
              ease: "easeInOut",
            }}
          />
        )}

        <motion.span
          animate={
            calm
              ? undefined
              : {
                  y: [0, -2.5, 0],
                  rotate: [0, -4, 3, 0],
                }
          }
          transition={
            calm
              ? undefined
              : {
                  duration: 2.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
          className="relative"
        >
          <KiraFace size={34} />

          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white bg-mint" />
          </span>
        </motion.span>

        <span className="relative min-w-0 flex-1">
          <span className="flex items-center gap-1 text-[13.5px] font-semibold tracking-[-0.01em] text-ink dark:text-white">
            Ask Kira

          </span>

          <span className="block truncate text-[11.5px] text-ink-soft dark:text-[#A1A1AA]">
            Coming soon
          </span>
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Ask Kira — coming soon"
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          >
            <motion.button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink/25 backdrop-blur-[6px]"
              initial={calm ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              initial={
                calm
                  ? false
                  : {
                      opacity: 0,
                      scale: 0.92,
                      y: 16,
                    }
              }
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={
                calm
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      scale: 0.95,
                      y: 10,
                    }
              }
              transition={{
                duration: 0.32,
                ease: EASE,
              }}
              className="relative w-full max-w-[320px] overflow-hidden rounded-3xl border border-line bg-white px-6 pt-8 pb-6 text-center shadow-pop dark:border-[#272727] dark:bg-[#181818]"
            >
              <FloatingBits />

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close Kira"
                className="absolute top-3 right-3 rounded-full p-1.5 text-faint transition-colors hover:bg-soft hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={15} />
              </button>

              <motion.div
                animate={
                  calm
                    ? undefined
                    : {
                        y: [0, -6, 0],
                      }
                }
                transition={
                  calm
                    ? undefined
                    : {
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
                className="flex justify-center"
              >
                <KiraFace size={64} />
              </motion.div>

              <h2 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-ink dark:text-white">
                Kira is coming soon.
              </h2>

              <p className="mx-auto mt-1.5 max-w-[240px] text-[13.5px] leading-relaxed text-ink-soft dark:text-[#A1A1A]">
                We&apos;re still building this one.
                <br />
                Kira will be able to work with your workspace soon.
              </p>

              <div className="mt-5 flex items-center justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-brand"
                    animate={
                      calm
                        ? undefined
                        : {
                            y: [0, -4, 0],
                            opacity: [0.4, 1, 0.4],
                          }
                    }
                    transition={
                      calm
                        ? undefined
                        : {
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }
                    }
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-5 w-full rounded-full bg-ink py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-black dark:bg-white dark:text-ink dark:hover:bg-white/85"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
