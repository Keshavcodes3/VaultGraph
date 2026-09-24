"use client";

import {
  Check,
  ChevronRight,
  Info,
  Link2,
  Menu,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import Tooltip from "./Tooltip";

export type SaveState = "saved" | "saving";

interface HeaderProps {
  crumbs: { id: string; title: string }[];
  status?: string;
  isFavorite?: boolean;
  saveState: SaveState;
  propsOpen: boolean;
  onSelectCrumb: (id: string) => void;
  onToggleFav: () => void;
  onCopyLink: () => void;
  onToggleProps: () => void;
  onOpenSidebar: () => void;
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-mist text-ink-soft dark:bg-white/10 dark:text-[#A1A1AA]",
  "in-review": "bg-amberish/10 text-amberish",
  published: "bg-mint/10 text-mint",
};

/** Quiet top bar: breadcrumb, autosave whisper, essential actions. */
export default function PageHeader(p: HeaderProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-line bg-white/85 px-3 backdrop-blur-md dark:border-[#272727] dark:bg-[#111111]/85">
      <div className="flex min-w-0 items-center gap-1 text-[13px]">
        <button
          onClick={p.onOpenSidebar}
          aria-label="Open sidebar"
          className="rounded-md p-1.5 text-ink-soft hover:bg-soft hover:text-ink md:hidden dark:text-[#A1A1AA] dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Menu size={15} />
        </button>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-0.5 overflow-hidden">
          {p.crumbs.map((c, i) => {
            const last = i === p.crumbs.length - 1;
            return (
              <span key={c.id} className="flex min-w-0 items-center gap-0.5">
                {i > 0 ? <ChevronRight size={13} className="shrink-0 text-faint" /> : null}
                <button
                  onClick={() => p.onSelectCrumb(c.id)}
                  aria-current={last ? "page" : undefined}
                  className={`truncate rounded px-1 py-0.5 transition-colors ${
                    last
                      ? "font-semibold text-ink dark:text-white"
                      : "text-ink-soft hover:bg-soft hover:text-ink dark:text-[#A1A1AA] dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  {c.title}
                </button>
              </span>
            );
          })}
        </nav>
        {p.status ? (
          <span
            className={`ml-1 hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase sm:inline-flex ${STATUS_STYLE[p.status] ?? STATUS_STYLE.draft}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {p.status.replace("-", " ")}
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {/* autosave whisper */}
        <span
          role="status"
          className="mr-1 hidden items-center gap-1.5 text-[12px] text-faint sm:flex"
        >
          {p.saveState === "saving" ? (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amberish" />
              Saving…
            </>
          ) : (
            <>
              <Check size={12} className="text-mint" />
              Saved
            </>
          )}
        </span>
        <Tooltip label={p.isFavorite ? "Remove favorite" : "Add favorite"}>
          <button
            onClick={p.onToggleFav}
            aria-pressed={p.isFavorite}
            aria-label="Toggle favorite"
            className="rounded-md p-2 transition-colors hover:bg-soft dark:hover:bg-white/10"
          >
            <Star
              size={15}
              fill={p.isFavorite ? "currentColor" : "none"}
              className={p.isFavorite ? "text-amberish" : "text-ink-soft dark:text-[#A1A1AA]"}
            />
          </button>
        </Tooltip>
        <Tooltip label={copied ? "Copied" : "Copy link"}>
          <button
            onClick={() => {
              p.onCopyLink();
              setCopied(true);
            }}
            aria-label="Copy link"
            className="rounded-md p-2 text-ink-soft transition-colors hover:bg-soft hover:text-ink dark:text-[#A1A1AA] dark:hover:bg-white/10 dark:hover:text-white"
          >
            {copied ? <Check size={15} className="text-mint" /> : <Link2 size={15} />}
          </button>
        </Tooltip>
        <Tooltip label="Properties" kbd="⌘I">
          <button
            onClick={p.onToggleProps}
            aria-pressed={p.propsOpen}
            aria-label="Toggle properties"
            className={`rounded-md p-2 transition-colors ${
              p.propsOpen
                ? "bg-soft text-ink dark:bg-white/10 dark:text-white"
                : "text-ink-soft hover:bg-soft hover:text-ink dark:text-[#A1A1AA] dark:hover:bg-white/10 dark:hover:text-white"
            }`}
          >
            <Info size={15} />
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
