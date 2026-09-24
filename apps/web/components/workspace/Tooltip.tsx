"use client";

import type { ReactNode } from "react";

/** Tiny elegant tooltip. Appears on hover/focus, supports a kbd hint. */
export default function Tooltip({
  label,
  kbd,
  children,
  side = "bottom",
}: {
  label: string;
  kbd?: string;
  children: ReactNode;
  side?: "top" | "bottom";
}) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-[90] -translate-x-1/2 rounded-lg bg-ink px-2 py-1 font-mono text-[10.5px] whitespace-nowrap text-white opacity-0 shadow-pop transition-all duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 dark:bg-white dark:text-ink ${
          side === "top" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
        }`}
      >
        {label}
        {kbd ? <span className="ml-1.5 opacity-60">{kbd}</span> : null}
      </span>
    </span>
  );
}
