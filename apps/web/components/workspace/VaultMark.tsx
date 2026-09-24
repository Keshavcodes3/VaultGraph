"use client";

import { motion } from "framer-motion";
import { useCalm } from "../landing/Reveal";

/**
 * VaultMark — the tiny geometric VaultGraph companion.
 * Two dot eyes, a square vault body, one calm smile.
 * Appears only in empty states, never as a chatbot.
 */
export default function VaultMark({
  size = 56,
  animate = true,
}: {
  size?: number;
  animate?: boolean;
}) {
  const calm = useCalm();
  const body = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      {/* eyes */}
      <circle cx="23" cy="18" r="3.2" className="fill-ink dark:fill-white" />
      <circle cx="41" cy="18" r="3.2" className="fill-ink dark:fill-white" />
      {/* vault body */}
      <rect
        x="14"
        y="28"
        width="36"
        height="28"
        rx="9"
        className="fill-soft stroke-line dark:fill-[#181818] dark:stroke-[#272727]"
        strokeWidth="1.5"
      />
      {/* smile */}
      <path
        d="M26 41 Q32 46 38 41"
        className="stroke-ink dark:stroke-white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* feet */}
      <rect x="22" y="56" width="7" height="4" rx="2" className="fill-ink dark:fill-white" />
      <rect x="35" y="56" width="7" height="4" rx="2" className="fill-ink dark:fill-white" />
    </svg>
  );

  if (!animate || calm) return <div aria-hidden="true">{body}</div>;

  return (
    <motion.div
      aria-hidden="true"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      {body}
    </motion.div>
  );
}
