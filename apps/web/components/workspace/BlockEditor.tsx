"use client";

import { AnimatePresence } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Link2,
  Plus,
  Trash2,
  Wand2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ContextMenu, { type MenuItem } from "./ContextMenu";
import DatabaseView from "./DatabaseView";
import SlashCommandMenu, { slashMatches } from "./SlashCommandMenu";
import { uid, type Block, type BlockType, type DbRow } from "./data";

/* ---------------- inline markdown ---------------- */

function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|~~[^~\n]+~~|\[[^\]\n]+\]\([^)\n]+\))/g;
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) {
      out.push(<strong key={k} className="font-semibold">{t.slice(2, -2)}</strong>);
    } else if (t.startsWith("*")) {
      out.push(<em key={k}>{t.slice(1, -1)}</em>);
    } else if (t.startsWith("`")) {
      out.push(
        <code key={k} className="rounded bg-soft px-1 py-px font-mono text-[0.9em] text-rosy dark:bg-white/10">
          {t.slice(1, -1)}
        </code>
      );
    } else if (t.startsWith("~~")) {
      out.push(<s key={k} className="text-faint">{t.slice(2, -2)}</s>);
    } else {
      const mt = /\[([^\]]+)\]\(([^)]+)\)/.exec(t);
      out.push(
        <a
          key={k}
          href={mt?.[2]}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-ink underline decoration-line underline-offset-2 hover:decoration-ink dark:text-white"
        >
          {mt?.[1] ?? t}
        </a>
      );
    }
    k += 1;
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* ---------------- markdown shortcuts ---------------- */

const MD_RULES: { re: RegExp; type: BlockType; checked?: boolean }[] = [
  { re: /^###\s/, type: "h3" },
  { re: /^##\s/, type: "h2" },
  { re: /^#\s/, type: "h1" },
  { re: /^[-*]\s/, type: "bullet" },
  { re: /^\d+\.\s/, type: "numbered" },
  { re: /^\[\]\s/, type: "checkbox" },
  { re: /^\[x\]\s/i, type: "checkbox", checked: true },
  { re: /^>\s/, type: "quote" },
  { re: /^```$/, type: "code" },
];

const BLANK: Record<BlockType, string> = {
  paragraph: "",
  h1: "",
  h2: "",
  h3: "",
  bullet: "",
  numbered: "",
  checkbox: "",
  quote: "",
  divider: "",
  code: "",
  callout: "",
  toggle: "",
  image: "",
  video: "",
  file: "",
  table: "",
  database: "",
};

const TURN_INTO: { type: BlockType; label: string }[] = [
  { type: "paragraph", label: "Text" },
  { type: "h1", label: "Heading 1" },
  { type: "h2", label: "Heading 2" },
  { type: "h3", label: "Heading 3" },
  { type: "bullet", label: "Bulleted list" },
  { type: "numbered", label: "Numbered list" },
  { type: "checkbox", label: "To-do" },
  { type: "quote", label: "Quote" },
  { type: "code", label: "Code" },
  { type: "callout", label: "Callout" },
  { type: "toggle", label: "Toggle" },
  { type: "divider", label: "Divider" },
];

/* ---------------- url form for media blocks ---------------- */

function UrlForm({
  label,
  placeholder,
  action,
  onSubmit,
}: {
  label: string;
  placeholder: string;
  action: string;
  onSubmit: (url: string) => void;
}) {
  const [url, setUrl] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (url.trim()) onSubmit(url.trim());
      }}
      className="flex items-center gap-2 rounded-xl border border-dashed border-line bg-soft/50 px-3.5 py-3 dark:border-[#272727] dark:bg-white/5"
    >
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="min-w-0 flex-1 border-none bg-transparent p-0 text-[13.5px] text-ink outline-none placeholder:text-faint dark:text-white"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-black dark:bg-white dark:text-ink"
      >
        {action}
      </button>
    </form>
  );
}

/* ---------------- single block ---------------- */

interface BlockViewProps {
  block: Block;
  numbered: number | null;
  editing: boolean;
  selected: boolean;
  shouldFocus: boolean;
  onEdit: () => void;
  onStopEdit: () => void;
  onChange: (content: string, checked?: boolean) => void;
  onUrl: (url: string) => void;
  onTableCells: (cells: string[][]) => void;
  onEnter: () => void;
  onDelete: () => void;
  onMove: (dir: "up" | "down") => void;
  onDuplicate: () => void;
  onType: (t: BlockType) => void;
  onToggleSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  dbRows: DbRow[];
  onDbChange: (rows: DbRow[]) => void;
  ownerName?: string;
}

function BlockView(p: BlockViewProps) {
  const { block } = p;
  const [menu, setMenu] = useState(false);
  const [slash, setSlash] = useState(false);
  const [filter, setFilter] = useState("");
  const [hi, setHi] = useState(0);
  const [actionsAt, setActionsAt] = useState<{ x: number; y: number } | null>(null);
  const [toggleOpen, setToggleOpen] = useState(true);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
      if (p.shouldFocus) {
        el.focus({ preventScroll: true });
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.editing, block.content]);

  const matches = slashMatches(filter);

  const onInput = (v: string) => {
    // Markdown shortcuts convert the block on the fly.
    if (!v.startsWith("/") && block.type === "paragraph") {
      for (const rule of MD_RULES) {
        if (rule.re.test(v)) {
          p.onType(rule.type);
          p.onChange(v.replace(rule.re, ""), rule.checked);
          return;
        }
      }
    }
    p.onChange(v);
    if (v.startsWith("/")) {
      setMenu(true);
      setSlash(true);
      setFilter(v.slice(1));
      setHi(0);
    } else {
      setMenu(false);
      setSlash(false);
    }
  };

  const pick = (t: BlockType) => {
    p.onType(t);
    setMenu(false);
    setSlash(false);
  };

  function key(e: React.KeyboardEvent) {
    if (menu && slash && matches.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHi((h) => (h + 1) % matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHi((h) => (h - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        const hit = matches[hi];
        if (hit) {
          e.preventDefault();
          pick(hit);
          return;
        }
      }
    }
    if (e.key === "Enter" && !e.shiftKey && !menu) {
      e.preventDefault();
      p.onEnter();
    } else if (e.key === "Backspace" && block.content === "" && !menu) {
      e.preventDefault();
      if (block.type === "paragraph") p.onDelete();
      else p.onType("paragraph");
    } else if (e.key === "Escape") {
      setMenu(false);
      setSlash(false);
      p.onStopEdit();
    }
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(block.content);
    } catch {
      /* clipboard unavailable */
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.href.split("#")[0]}#${block.id}`
      );
    } catch {
      /* clipboard unavailable */
    }
  };

  const actionItems: MenuItem[] = [
    {
      id: "turn",
      label: "Turn into",
      icon: <Wand2 size={14} />,
      children: TURN_INTO.map((t) => ({
        id: t.type,
        label: t.label,
        action: () => p.onType(t.type),
      })),
    },
    { id: "dup", label: "Duplicate", icon: <Copy size={14} />, action: p.onDuplicate },
    { id: "copy", label: "Copy text", icon: <Copy size={14} />, action: () => void copyText() },
    { id: "link", label: "Copy link", icon: <Link2 size={14} />, action: () => void copyLink() },
    { id: "up", label: "Move up", icon: <ArrowUp size={14} />, action: () => p.onMove("up") },
    { id: "down", label: "Move down", icon: <ArrowDown size={14} />, action: () => p.onMove("down") },
    { id: "del", label: "Delete", icon: <Trash2 size={14} />, danger: true, action: p.onDelete },
  ];

  const openActions = (e: React.MouseEvent) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setActionsAt({ x: Math.max(r.left - 8, 8), y: r.bottom + 6 });
  };

  const inputCls =
    "w-full resize-none bg-transparent outline-none placeholder:text-faint focus:ring-0 border-none p-0";

  /* ----- structured blocks ----- */

  if (block.type === "image") {
    return (
      <BlockChrome
        selected={p.selected}
        onDragStart={p.onDragStart}
        onOpenActions={openActions}
        onToggleSelect={p.onToggleSelect}
      >
        <div className="py-1">
          {block.url ? (
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.url}
                alt={block.content || "Image"}
                loading="lazy"
                className="max-h-[320px] w-full rounded-lg border border-line object-cover dark:border-[#272727]"
              />
              <div className="flex items-center gap-3 px-1 pt-1.5">
                <input
                  value={block.content}
                  onChange={(e) => p.onChange(e.target.value)}
                  placeholder="Add a caption…"
                  aria-label="Image caption"
                  className="min-w-0 flex-1 border-none bg-transparent p-0 text-[13px] text-faint outline-none placeholder:text-faint"
                />
                <button
                  onClick={() => p.onUrl("")}
                  className="shrink-0 text-[12px] text-faint opacity-0 transition-opacity hover:text-ink group-hover/block:opacity-100 dark:hover:text-white"
                >
                  Replace
                </button>
              </div>
            </figure>
          ) : (
            <UrlForm
              label="Image URL"
              placeholder="Paste an image URL, then Embed…"
              action="Embed"
              onSubmit={p.onUrl}
            />
          )}
        </div>
        {actionsAt ? (
          <ContextMenu x={actionsAt.x} y={actionsAt.y} items={actionItems} onClose={() => setActionsAt(null)} />
        ) : null}
      </BlockChrome>
    );
  }

  if (block.type === "video") {
    return (
      <BlockChrome
        selected={p.selected}
        onDragStart={p.onDragStart}
        onOpenActions={openActions}
        onToggleSelect={p.onToggleSelect}
      >
        <div className="py-1">
          {block.url ? (
            <div>
              <video
                src={block.url}
                controls
                className="max-h-[320px] w-full rounded-lg border border-line bg-ink dark:border-[#272727]"
              />
              <button
                onClick={() => p.onUrl("")}
                className="px-1 pt-1 text-[12px] text-faint opacity-0 transition-opacity hover:text-ink group-hover/block:opacity-100 dark:hover:text-white"
              >
                Replace
              </button>
            </div>
          ) : (
            <UrlForm
              label="Video URL"
              placeholder="Paste a video URL, then Embed…"
              action="Embed"
              onSubmit={p.onUrl}
            />
          )}
        </div>
        {actionsAt ? (
          <ContextMenu x={actionsAt.x} y={actionsAt.y} items={actionItems} onClose={() => setActionsAt(null)} />
        ) : null}
      </BlockChrome>
    );
  }

  if (block.type === "file") {
    return (
      <BlockChrome
        selected={p.selected}
        onDragStart={p.onDragStart}
        onOpenActions={openActions}
        onToggleSelect={p.onToggleSelect}
      >
        <div className="flex items-center gap-3 rounded-xl border border-line bg-soft/60 px-3.5 py-3 dark:border-[#272727] dark:bg-white/5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink font-mono text-[10px] font-bold text-white dark:bg-white dark:text-ink">
            {((block.fileName ?? "FILE").split(".").pop() ?? "FILE").slice(0, 3).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium text-ink dark:text-white">
              {block.fileName ?? "Untitled file"}
            </span>
            <span className="block text-[12px] text-faint">{block.fileSize ?? "—"}</span>
          </span>
        </div>
        {actionsAt ? (
          <ContextMenu x={actionsAt.x} y={actionsAt.y} items={actionItems} onClose={() => setActionsAt(null)} />
        ) : null}
      </BlockChrome>
    );
  }

  if (block.type === "table") {
    const cells = block.tableCells ?? [["", "", ""], ["", "", ""]];    const setCell = (r: number, c: number, v: string) => {
      p.onTableCells(
        cells.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? v : cell)))
      );
    };
    return (
      <BlockChrome
        selected={p.selected}
        wide
        onDragStart={p.onDragStart}
        onOpenActions={openActions}
        onToggleSelect={p.onToggleSelect}
      >
        <div className="overflow-x-auto py-1">
          <table className="w-full border-collapse text-[13.5px]">
            <tbody>
              {cells.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`min-w-[120px] border border-line p-0 dark:border-[#272727] ${
                        ri === 0 ? "bg-soft/70 font-semibold dark:bg-white/5" : ""
                      }`}
                    >
                      <input
                        value={cell}
                        onChange={(e) => setCell(ri, ci, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Tab" && ri === cells.length - 1 && ci === row.length - 1) {
                            e.preventDefault();
                            p.onTableCells([...cells, row.map(() => "")]);
                          }
                        }}
                        aria-label={`Row ${ri + 1} column ${ci + 1}`}
                        className="w-full bg-transparent px-2.5 py-2 text-ink outline-none dark:text-white"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => p.onTableCells([...cells, cells[0].map(() => "")])}
            className="mt-1.5 flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] text-faint transition-colors hover:bg-soft hover:text-ink dark:hover:bg-white/5 dark:hover:text-white"
          >
            <Plus size={13} /> Add row
          </button>
        </div>
        {actionsAt ? (
          <ContextMenu x={actionsAt.x} y={actionsAt.y} items={actionItems} onClose={() => setActionsAt(null)} />
        ) : null}
      </BlockChrome>
    );
  }

  if (block.type === "database") {
    return (
      <BlockChrome
        selected={p.selected}
        wide
        onDragStart={p.onDragStart}
        onOpenActions={openActions}
        onToggleSelect={p.onToggleSelect}
      >
        <div className="py-1">
          <DatabaseView
            title={block.content || "Projects"}
            rows={p.dbRows}
            onChange={p.onDbChange}
            ownerName={p.ownerName}
          />
        </div>
        {actionsAt ? (
          <ContextMenu x={actionsAt.x} y={actionsAt.y} items={actionItems} onClose={() => setActionsAt(null)} />
        ) : null}
      </BlockChrome>
    );
  }

  if (block.type === "divider") {
    return (
      <BlockChrome
        selected={p.selected}
        onDragStart={p.onDragStart}
        onOpenActions={openActions}
        onToggleSelect={p.onToggleSelect}
      >
        <div className="flex items-center gap-3 py-2">
          <hr className="flex-1 border-line dark:border-[#272727]" />
        </div>
        {actionsAt ? (
          <ContextMenu x={actionsAt.x} y={actionsAt.y} items={actionItems} onClose={() => setActionsAt(null)} />
        ) : null}
      </BlockChrome>
    );
  }

  if (block.type === "toggle") {
    return (
      <BlockChrome
        selected={p.selected}
        onDragStart={p.onDragStart}
        onOpenActions={openActions}
        onToggleSelect={p.onToggleSelect}
      >
        <div>
          <button
            onClick={() => setToggleOpen((v) => !v)}
            className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-[15px] font-medium text-ink hover:bg-soft dark:text-white dark:hover:bg-white/5"
          >
            <span className={`text-faint transition-transform duration-150 ${toggleOpen ? "rotate-90" : ""}`}>
              ▶
            </span>
            {block.content || <span className="text-faint">Toggle</span>}
          </button>
          {toggleOpen ? (
            <div className="mt-1 ml-5 space-y-2 border-l border-line pl-4 dark:border-[#272727]">
              {(block.children ?? []).map((c) => (
                <p key={c.id} className="text-[14px] leading-[1.7] text-ink-soft dark:text-[#A1A1AA]">
                  {renderInline(c.content)}
                </p>
              ))}
            </div>
          ) : null}
        </div>
        {actionsAt ? (
          <ContextMenu x={actionsAt.x} y={actionsAt.y} items={actionItems} onClose={() => setActionsAt(null)} />
        ) : null}
      </BlockChrome>
    );
  }

  /* ----- text blocks: rendered until clicked, textarea while editing ----- */

  const emptyHint = (
    <span className="text-faint opacity-0 transition-opacity duration-120 group-hover/block:opacity-100">
      {block.type === "h1"
        ? "Heading 1"
        : block.type === "h2"
          ? "Heading 2"
          : block.type === "h3"
            ? "Heading 3"
            : block.type === "bullet" || block.type === "numbered"
              ? "List item"
              : block.type === "checkbox"
                ? "To-do"
                : block.type === "quote"
                  ? "Quote"
                  : block.type === "code"
                    ? "Write code…"
                    : block.type === "callout"
                      ? "Callout…"
                      : "Write, or press ‘/’ for commands…"}
    </span>
  );

  const readBody = () => {
    const body = block.content ? (
      <span className="whitespace-pre-wrap">{renderInline(block.content)}</span>
    ) : (
      emptyHint
    );
    switch (block.type) {
      case "h1":
        return (
          <div className="cursor-text py-1 text-[30px] font-bold tracking-[-0.02em] text-ink dark:text-white">
            {body}
          </div>
        );
      case "h2":
        return (
          <div className="cursor-text py-[3px] text-[22px] font-bold tracking-[-0.015em] text-ink dark:text-white">
            {body}
          </div>
        );
      case "h3":
        return (
          <div className="cursor-text py-[3px] text-[17px] font-bold text-ink dark:text-white">
            {body}
          </div>
        );
      case "bullet":
        return (
          <div className="flex cursor-text items-start gap-2.5 px-1 py-[3px]">
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink-soft dark:bg-[#A1A1AA]" />
            <span className="min-w-0 flex-1 text-[15px] leading-[1.7] text-ink dark:text-[#F5F5F5]">
              {body}
            </span>
          </div>
        );
      case "numbered":
        return (
          <div className="flex cursor-text items-start gap-2.5 px-1 py-[3px]">
            <span className="mt-[3px] w-5 shrink-0 text-right font-mono text-[13px] text-faint">
              {p.numbered ?? 1}.
            </span>
            <span className="min-w-0 flex-1 text-[15px] leading-[1.7] text-ink dark:text-[#F5F5F5]">
              {body}
            </span>
          </div>
        );
      case "checkbox":
        return (
          <div className="flex items-start gap-2.5 px-1 py-[3px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                p.onChange(block.content, !block.checked);
              }}
              aria-label="Toggle todo"
              aria-pressed={block.checked}
              className={`mt-[5px] flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[5px] border transition-all ${
                block.checked
                  ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink"
                  : "border-line bg-white hover:border-ink-soft dark:border-[#272727] dark:bg-transparent"
              }`}
            >
              {block.checked ? (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5 5 9l4.5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : null}
            </button>
            <div
              className={`min-w-0 flex-1 cursor-text text-[15px] leading-[1.7] ${
                block.checked ? "text-faint line-through" : "text-ink dark:text-[#F5F5F5]"
              }`}
            >
              {body}
            </div>
          </div>
        );
      case "quote":
        return (
          <div className="cursor-text border-l-[3px] border-ink py-0.5 pl-4 font-serif text-[16px] text-ink italic dark:border-white dark:text-white">
            {body}
          </div>
        );
      case "callout":
        return (
          <div className="flex cursor-text gap-2.5 rounded-xl border border-line bg-soft/60 p-3.5 dark:border-[#272727] dark:bg-white/5">
            <span className="text-[15px]">💡</span>
            <span className="min-w-0 flex-1 text-[14.5px] leading-[1.65] text-ink dark:text-[#F5F5F5]">
              {body}
            </span>
          </div>
        );
      case "code":
        return (
          <div className="overflow-hidden rounded-xl border border-line bg-ink dark:border-[#272727]">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-3.5 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rosy/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amberish/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-mint/80" />
              <span className="ml-2 font-mono text-[10.5px] text-white/40">
                {block.language ?? "ts"}
              </span>
            </div>
            <div className="cursor-text p-3.5 font-mono text-[13px] leading-[1.7] whitespace-pre-wrap text-white/90">
              {block.content || <span className="text-white/25">Write code…</span>}
            </div>
          </div>
        );
      default:
        return (
          <div className="cursor-text px-1 py-[3px] text-[15px] leading-[1.75] text-ink dark:text-[#F5F5F5]">
            {body}
          </div>
        );
    }
  };

  if (!p.editing) {
    return (
      <BlockChrome
        selected={p.selected}
        onDragStart={p.onDragStart}
        onOpenActions={openActions}
        onToggleSelect={p.onToggleSelect}
      >
        <div onClick={p.onEdit}>{readBody()}</div>
        {actionsAt ? (
          <ContextMenu x={actionsAt.x} y={actionsAt.y} items={actionItems} onClose={() => setActionsAt(null)} />
        ) : null}
      </BlockChrome>
    );
  }

  const sizeCls =
    block.type === "h1"
      ? "text-[30px] font-bold tracking-[-0.02em]"
      : block.type === "h2"
        ? "text-[22px] font-bold tracking-[-0.015em]"
        : block.type === "h3"
          ? "text-[17px] font-bold"
          : block.type === "quote"
            ? "font-serif text-[16px] italic"
            : "text-[15px] leading-[1.75]";
  const holder =
    block.type === "h1"
      ? "Heading 1"
      : block.type === "h2"
        ? "Heading 2"
        : block.type === "h3"
          ? "Heading 3"
          : block.type === "bullet" || block.type === "numbered"
            ? "List item"
            : block.type === "checkbox"
              ? "To-do"
              : block.type === "quote"
                ? "Quote"
                : block.type === "code"
                  ? "// code…"
                  : block.type === "callout"
                    ? "Callout…"
                    : "Write, or press '/' for commands…";

  const field = (
    <textarea
      ref={areaRef}
      rows={block.type === "code" ? 2 : 1}
      value={block.content}
      onChange={(e) => onInput(e.target.value)}
      onKeyDown={key}
      onBlur={() => {
        if (!menu) p.onStopEdit();
      }}
      placeholder={holder}
      spellCheck={block.type !== "code"}
      className={`${inputCls} ${sizeCls} text-ink dark:text-white`}
    />
  );

  const editBody =
    block.type === "bullet" ? (
      <div className="flex items-start gap-2.5 px-1">
        <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink-soft dark:bg-[#A1A1AA]" />
        <div className="min-w-0 flex-1">{field}</div>
      </div>
    ) : block.type === "numbered" ? (
      <div className="flex items-start gap-2.5 px-1">
        <span className="mt-[3px] w-5 shrink-0 text-right font-mono text-[13px] text-faint">
          {p.numbered ?? 1}.
        </span>
        <div className="min-w-0 flex-1">{field}</div>
      </div>
    ) : block.type === "checkbox" ? (
      <div className="flex items-start gap-2.5 px-1">
        <button
          onClick={() => p.onChange(block.content, !block.checked)}
          aria-label="Toggle todo"
          className={`mt-[5px] flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[5px] border transition-all ${
            block.checked
              ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink"
              : "border-line bg-white hover:border-ink-soft dark:border-[#272727] dark:bg-transparent"
          }`}
        >
          {block.checked ? (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6.5 5 9l4.5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : null}
        </button>
        <div className="min-w-0 flex-1">{field}</div>
      </div>
    ) : block.type === "quote" ? (
      <div className="border-l-[3px] border-ink py-0.5 pl-4 dark:border-white">{field}</div>
    ) : block.type === "callout" ? (
      <div className="flex gap-2.5 rounded-xl border border-line bg-soft/60 p-3.5 dark:border-[#272727] dark:bg-white/5">
        <span className="text-[15px]">💡</span>
        <div className="min-w-0 flex-1">{field}</div>
      </div>
    ) : block.type === "code" ? (
      <div className="overflow-hidden rounded-xl border border-line bg-ink dark:border-[#272727]">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-3.5 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rosy/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amberish/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-mint/80" />
          <span className="ml-2 font-mono text-[10.5px] text-white/40">
            {block.language ?? "ts"}
          </span>
        </div>
        <textarea
          ref={areaRef}
          rows={2}
          value={block.content}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={key}
          onBlur={() => {
            if (!menu) p.onStopEdit();
          }}
          placeholder="// code…"
          spellCheck={false}
          className="w-full resize-none border-none bg-transparent p-3.5 font-mono text-[13px] leading-[1.7] text-white/90 outline-none placeholder:text-white/25 focus:ring-0"
        />
      </div>
    ) : (
      <div className="px-1">{field}</div>
    );

  return (
    <BlockChrome
      selected={p.selected}
      onDragStart={p.onDragStart}
      onOpenActions={openActions}
      onToggleSelect={p.onToggleSelect}
    >
      {editBody}
      <AnimatePresence>
        {menu && slash ? (
          <SlashCommandMenu
            filter={filter}
            highlight={hi}
            onHighlight={setHi}
            onPick={pick}
          />
        ) : null}
      </AnimatePresence>
      {actionsAt ? (
        <ContextMenu x={actionsAt.x} y={actionsAt.y} items={actionItems} onClose={() => setActionsAt(null)} />
      ) : null}
    </BlockChrome>
  );
}

/* ---------------- chrome: hover rail + selection ---------------- */

function BlockChrome({
  selected,
  wide,
  onDragStart,
  onOpenActions,
  onToggleSelect,
  children,
}: {
  selected: boolean;
  wide?: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onOpenActions: (e: React.MouseEvent) => void;
  onToggleSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`group/block relative -ml-9 flex items-start gap-[2px] rounded-md py-[2px] pl-9 transition-colors duration-120 ${
        wide ? "lg:-mx-16" : ""
      } ${selected ? "bg-soft dark:bg-white/5" : ""}`}
    >
      <div className="absolute top-[6px] left-0 flex items-center opacity-0 transition-opacity duration-120 group-hover/block:opacity-100 focus-within:opacity-100 max-md:opacity-100">
        <button
          draggable
          onDragStart={onDragStart}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          aria-label="Drag to move · click to select"
          title="Drag to move · click to select"
          className="cursor-grab rounded p-1 text-faint transition-colors hover:bg-soft hover:text-ink active:cursor-grabbing dark:hover:bg-white/10 dark:hover:text-white"
        >
          <GripVertical size={15} />
        </button>
        <button
          onClick={onOpenActions}
          aria-label="Block actions"
          className="rounded p-1 text-faint transition-colors hover:bg-soft hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/* ---------------- editor ---------------- */

const clone = (blocks: Block[]): Block[] =>
  JSON.parse(JSON.stringify(blocks)) as Block[];

export default function BlockEditor({
  blocks,
  dbRows,
  onPatch,
  onDbChange,
  ownerName,
}: {
  blocks: Block[];
  dbRows: DbRow[];
  onPatch: (blocks: Block[]) => void;
  onDbChange: (rows: DbRow[]) => void;
  ownerName?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{ index: number; pos: "before" | "after" } | null>(null);
  const past = useRef<Block[][]>([]);
  const future = useRef<Block[][]>([]);
  const lastTypePush = useRef(0);

  const apply = (next: Block[], record = true) => {
    if (record) {
      past.current.push(clone(blocks));
      if (past.current.length > 50) past.current.shift();
      future.current = [];
    }
    onPatch(next);
  };

  // Typing coalesces: one snapshot per burst, so undo feels right.
  const applyTyping = (next: Block[]) => {
    const now = Date.now();
    if (now - lastTypePush.current > 1000) {
      past.current.push(clone(blocks));
      if (past.current.length > 50) past.current.shift();
      future.current = [];
      lastTypePush.current = now;
    }
    onPatch(next);
  };

  const undo = () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(clone(blocks));
    setSelected(new Set());
    onPatch(prev);
  };

  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(clone(blocks));
    setSelected(new Set());
    onPatch(next);
  };

  const change = (id: string, content: string, checked?: boolean) =>
    applyTyping(
      blocks.map((x) => (x.id === id ? { ...x, content, checked: checked ?? x.checked } : x))
    );

  const setUrl = (id: string, url: string) =>
    apply(blocks.map((x) => (x.id === id ? { ...x, url } : x)));

  const setCells = (id: string, cells: string[][]) =>
    apply(blocks.map((x) => (x.id === id ? { ...x, tableCells: cells } : x)));

  const makeBlock = (type: BlockType): Block => {
    const nb: Block = { id: uid("b"), type, content: BLANK[type] };
    if (type === "table") nb.tableCells = [["", "", ""], ["", "", ""]];
    if (type === "file") {
      nb.fileName = "Untitled attachment";
      nb.fileSize = "—";
    }
    if (type === "database") nb.content = "Projects";
    return nb;
  };

  const addAfter = (id: string | null, type: BlockType = "paragraph") => {
    const nb = makeBlock(type);
    setFocusId(nb.id);
    setEditingId(nb.id);
    setSelected(new Set());
    if (id === null) {
      apply([...blocks, nb]);
      return;
    }
    const i = blocks.findIndex((x) => x.id === id);
    const next = [...blocks];
    next.splice(i + 1, 0, nb);
    apply(next);
  };

  const remove = (id: string) => {
    if (blocks.length <= 1) return;
    const i = blocks.findIndex((x) => x.id === id);
    const target = blocks[i - 1] ?? blocks[i + 1];
    if (target) {
      setFocusId(target.id);
      setEditingId(target.id);
    }
    apply(blocks.filter((x) => x.id !== id));
  };

  const move = (id: string, dir: "up" | "down") => {
    const i = blocks.findIndex((x) => x.id === id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    const [m] = next.splice(i, 1);
    if (m) next.splice(j, 0, m);
    apply(next);
  };

  const dup = (id: string) => {
    const i = blocks.findIndex((x) => x.id === id);
    const src = blocks[i];
    if (i < 0 || !src) return;
    const nb = {
      ...src,
      id: uid("b"),
      tableCells: src.tableCells?.map((r) => [...r]),
    };
    setFocusId(nb.id);
    setEditingId(nb.id);
    const next = [...blocks];
    next.splice(i + 1, 0, nb);
    apply(next);
  };

  const retype = (id: string, t: BlockType) => {
    const src = blocks.find((x) => x.id === id);
    const patch: Partial<Block> =
      t === "table" && !src?.tableCells
        ? { type: t, tableCells: [["", "", ""], ["", "", ""]] }
        : t === "file" && !src?.fileName
          ? { type: t, fileName: "Untitled attachment", fileSize: "—" }
          : t === "database" && !src?.content
            ? { type: t, content: "Projects" }
            : { type: t };
    apply(blocks.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onBlockDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", id);
    } catch {
      /* noop */
    }
    setDragId(id);
  };

  const dropAt = (index: number, pos: "before" | "after") => {
    if (!dragId) return;
    const from = blocks.findIndex((x) => x.id === dragId);
    if (from < 0) return;
    const next = [...blocks];
    const [m] = next.splice(from, 1);
    if (!m) return;
    let to = index;
    if (from < index) to -= 1;
    next.splice(pos === "before" ? to : to + 1, 0, m);
    setDragId(null);
    setOver(null);
    apply(next);
  };

  const containerKeys = (e: React.KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    const tag = (e.target as HTMLElement).tagName;
    const inField = tag === "TEXTAREA" || tag === "INPUT";
    if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }
    if ((mod && e.key.toLowerCase() === "y") || (mod && e.shiftKey && e.key.toLowerCase() === "z")) {
      e.preventDefault();
      redo();
      return;
    }
    if (inField) return;
    if ((e.key === "Delete" || e.key === "Backspace") && selected.size > 0) {
      e.preventDefault();
      const keep = blocks.filter((x) => !selected.has(x.id));
      setSelected(new Set());
      apply(keep.length > 0 ? keep : [{ id: uid("b"), type: "paragraph", content: "" }]);
    } else if (e.key === "Escape") {
      setSelected(new Set());
    }
  };

  // Consecutive numbering per run of numbered blocks.
  const numbers = (() => {
    const out: (number | null)[] = [];
    let run = 0;
    for (const blk of blocks) {
      if (blk.type === "numbered") {
        run += 1;
        out.push(run);
      } else {
        run = 0;
        out.push(null);
      }
    }
    return out;
  })();

  return (
    <div onKeyDown={containerKeys} className="mt-4 space-y-[2px]">
      {blocks.map((blk, i) => (
        <div
          key={blk.id}
          className="relative"
          onDragOver={(e) => {
            if (!dragId || dragId === blk.id) return;
            e.preventDefault();
            const r = e.currentTarget.getBoundingClientRect();
            setOver({
              index: i,
              pos: e.clientY - r.top < r.height / 2 ? "before" : "after",
            });
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (over) dropAt(over.index, over.pos);
          }}
        >
          {dragId && over?.index === i && over.pos === "before" ? (
            <span className="absolute top-0 right-0 left-9 z-10 h-[2px] rounded-full bg-ink dark:bg-white" />
          ) : null}
          <BlockView
            block={blk}
            numbered={numbers[i] ?? null}
            editing={editingId === blk.id || focusId === blk.id}
            selected={selected.has(blk.id)}
            shouldFocus={focusId === blk.id}
            onEdit={() => {
              setEditingId(blk.id);
              setFocusId(null);
            }}
            onStopEdit={() => {
              setEditingId((v) => (v === blk.id ? null : v));
              setFocusId((v) => (v === blk.id ? null : v));
            }}
            onChange={(c, checked) => change(blk.id, c, checked)}
            onUrl={(url) => setUrl(blk.id, url)}
            onTableCells={(cells) => setCells(blk.id, cells)}
            onEnter={() => addAfter(blk.id)}
            onDelete={() => remove(blk.id)}
            onMove={(d) => move(blk.id, d)}
            onDuplicate={() => dup(blk.id)}
            onType={(t) => retype(blk.id, t)}
            onToggleSelect={() => toggleSelect(blk.id)}
            onDragStart={(e) => onBlockDragStart(e, blk.id)}
            dbRows={dbRows}
            onDbChange={onDbChange}
            ownerName={ownerName}
          />
          {dragId && over?.index === i && over.pos === "after" ? (
            <span className="absolute right-0 bottom-0 left-9 z-10 h-[2px] rounded-full bg-ink dark:bg-white" />
          ) : null}
        </div>
      ))}
      <button
        onClick={() => addAfter(blocks[blocks.length - 1]?.id ?? null)}
        className="flex items-center gap-2 rounded-md px-2 py-2 text-[13.5px] text-faint transition-colors hover:bg-soft hover:text-ink dark:hover:bg-white/5 dark:hover:text-white"
      >
        <Plus size={14} /> Write something, or press ‘/’…
      </button>
    </div>
  );
}
