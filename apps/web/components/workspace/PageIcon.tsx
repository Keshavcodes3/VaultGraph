"use client";

import * as icons from "lucide-react";

/**
 * Page icon renderer. Supports emoji ("🚀") and
 * Lucide icons ("lucide:Rocket"), plus an empty state.
 */
export function PageIcon({
  icon,
  size = 15,
  className = "",
}: {
  icon: string;
  size?: number;
  className?: string;
}) {
  if (!icon) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center rounded border border-dashed border-line text-faint ${className}`}
        style={{ width: size + 2, height: size + 2, fontSize: size - 4 }}
      >
        ∅
      </span>
    );
  }
  if (icon.startsWith("lucide:")) {
    const name = icon.slice("lucide:".length);
    const Cmp = (icons as unknown as Record<string, icons.LucideIcon>)[name];
    if (Cmp) return <Cmp size={size} className={`shrink-0 ${className}`} />;
  }
  return (
    <span aria-hidden="true" className={`shrink-0 ${className}`} style={{ fontSize: size }}>
      {icon}
    </span>
  );
}
