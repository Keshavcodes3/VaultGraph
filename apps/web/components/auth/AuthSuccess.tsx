"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCalm } from "../landing/Reveal";

const EASE = [0.22, 1, 0.36, 1] as const;

type AuthSuccessProps = {
  title: string;
  redirectTo?: string;
  duration?: number;
};

export default function AuthSuccess({
  title,
  redirectTo = "/",
  duration = 1800,
}: AuthSuccessProps) {
  const calm = useCalm();
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace(redirectTo);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [duration, redirectTo, router]);

  return (
    <motion.main
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-white"
      initial={calm ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Ambient blue atmosphere */}
      {!calm && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-blue-500/[0.06] blur-3xl"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{
            duration: 1.4,
            ease: EASE,
          }}
        />
      )}

      {/* Expanding payment-style rings */}
      {!calm && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute h-28 w-28 rounded-full border border-blue-500/20"
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 4.8, opacity: 0 }}
            transition={{
              duration: 1.2,
              delay: 0.25,
              ease: "easeOut",
            }}
          />

          <motion.div
            aria-hidden
            className="pointer-events-none absolute h-28 w-28 rounded-full border border-blue-400/15"
            initial={{ scale: 0.5, opacity: 0.6 }}
            animate={{ scale: 3.5, opacity: 0 }}
            transition={{
              duration: 1.1,
              delay: 0.4,
              ease: "easeOut",
            }}
          />
        </>
      )}

      <div className="relative flex flex-col items-center">
        {/* Main success orb */}
        <motion.div
          className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[#2563EB] shadow-[0_20px_70px_rgba(37,99,235,0.28)]"
          initial={
            calm
              ? false
              : {
                  opacity: 0,
                  scale: 0.35,
                  rotate: -12,
                }
          }
          animate={
            calm
              ? undefined
              : {
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                }
          }
          transition={{
            duration: 0.65,
            ease: EASE,
          }}
        >
          {/* Orbit dot */}
          {!calm && (
            <motion.span
              aria-hidden
              className="absolute -right-1 top-3 h-2.5 w-2.5 rounded-full bg-blue-300"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0, 1, 1, 0],
              }}
              transition={{
                delay: 0.45,
                duration: 0.9,
              }}
            />
          )}

          {/* Inner white circle */}
          <motion.div
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white"
            initial={calm ? false : { scale: 0 }}
            animate={calm ? undefined : { scale: 1 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 420,
              damping: 20,
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 30 30"
              fill="none"
              aria-hidden
            >
              <motion.path
                d="M7 15.5L12.5 21L23 9"
                stroke="#2563EB"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={calm ? false : { pathLength: 0 }}
                animate={calm ? undefined : { pathLength: 1 }}
                transition={{
                  delay: 0.48,
                  duration: 0.45,
                  ease: "easeOut",
                }}
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.div
          className="mt-9 text-center"
          initial={
            calm
              ? false
              : {
                  opacity: 0,
                  y: 14,
                }
          }
          animate={
            calm
              ? undefined
              : {
                  opacity: 1,
                  y: 0,
                }
          }
          transition={{
            delay: 0.72,
            duration: 0.5,
            ease: EASE,
          }}
        >
          <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-stone-900">
            {title}
          </h1>

          <p className="mt-2 text-[14px] text-stone-500">
            Your workspace is ready.
          </p>
        </motion.div>

        {/* Redirect indicator */}
        {!calm && (
          <motion.div
            className="mt-9 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 1,
              duration: 0.3,
            }}
          >
            <span className="text-[11px] font-medium text-stone-400">
              Opening VaultGraph
            </span>

            <motion.span
              className="flex h-1.5 w-1.5 rounded-full bg-blue-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
              }}
            />
          </motion.div>
        )}

        {/* Bottom progress */}
        {!calm && (
          <div className="mt-5 h-[2px] w-28 overflow-hidden rounded-full bg-blue-50">
            <motion.div
              className="h-full origin-left rounded-full bg-blue-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: duration / 1000,
                ease: "linear",
              }}
            />
          </div>
        )}
      </div>
    </motion.main>
  );
}
