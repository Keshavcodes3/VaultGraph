"use client";

import {
  ChevronDown,
  ChevronRight,
  Star,
  Link2,
  Ellipsis,
  FilePlus2,
  Files,
  FolderInput,
  Pencil,
  StarOff,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ContextMenu, { type MenuItem } from "./ContextMenu";
import { PageIcon } from "./PageIcon";
import type { DropPosition, PageItem } from "./data";

export interface MoveTarget {
  id: string | null;
  title: string;
}

interface ItemProps {
  page: PageItem;
  depth: number;
  active: boolean;
  open: boolean;
  deleting?: boolean;
  onToggle: () => void;
  dropPos: DropPosition | null;
  moveTargets: MoveTarget[];
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onFavorite: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCopyLink: (id: string) => void;
  onMoveTo: (pageId: string, parentId: string | null) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string, pos: DropPosition) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

/** One quiet tree row. Actions reveal on hover; ⋯ / right-click opens the menu. */
export default function SidebarItem(p: ItemProps) {
  const { page } = p;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(page.title);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const kids = page.children ?? [];

  useEffect(() => {
    if (editing) {
      setDraft(page.title);
      const t = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
      return () => window.clearTimeout(t);
    }
  }, [editing, page.title]);

  // Keep the rename draft in sync with external renames (e.g. page canvas)
  // so the next edit never starts from a stale previous name.
  useEffect(() => {
    if (!editing) setDraft(page.title);
  }, [page.title, editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== page.title) p.onRename(page.id, draft.trim());
  };

  const openMenu = (x: number, y: number) => setMenu({ x, y });

  const menuItems: MenuItem[] = [
    { id: "open", label: "Open", icon: <FilePlus2 size={14} />, action: () => p.onSelect(page.id) },
    { id: "sub", label: "Add sub-page", icon: <FilePlus2 size={14} />, action: () => p.onAddChild(page.id) },
    { id: "rename", label: "Rename", hint: "↵", icon: <Pencil size={14} />, action: () => setEditing(true) },
    { id: "dup", label: "Duplicate", icon: <Files size={14} />, action: () => p.onDuplicate(page.id) },
    {
      id: "move",
      label: "Move to",
      icon: <FolderInput size={14} />,
      children: p.moveTargets
        .filter((t) => t.id !== page.id)
        .map((t) => ({
          id: t.id ?? "top",
          label: t.title,
          action: () => p.onMoveTo(page.id, t.id),
        })),
    },
    page.favorite
      ? { id: "unfav", label: "Remove from favorites", icon: <StarOff size={14} />, action: () => p.onFavorite(page.id) }
      : { id: "fav", label: "Add to favorites", icon: <Star size={14} />, action: () => p.onFavorite(page.id) },
    { id: "link", label: "Copy link", icon: <Link2 size={14} />, action: () => p.onCopyLink(page.id) },
    { id: "del", label: "Delete", icon: <Trash2 size={14} />, danger: true, action: () => p.onDelete(page.id) },
  ];

  return (
    <div className="relative">
      {/* insertion indicator */}
      {p.dropPos === "before" ? (
        <span className="absolute top-0 right-1 left-1 z-10 h-[2px] rounded-full bg-ink dark:bg-white" style={{ marginLeft: 6 + p.depth * 14 }} />
      ) : null}

      <div
        role="treeitem"
        aria-selected={p.active}
        aria-expanded={kids.length ? p.open : undefined}
        draggable={!editing}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.effectAllowed = "move";
          try {
            e.dataTransfer.setData("text/plain", page.id);
          } catch { /* noop */ }
          p.onDragStart(page.id);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const r = e.currentTarget.getBoundingClientRect();
          const rel = (e.clientY - r.top) / r.height;
          p.onDragOver(page.id, rel < 0.25 ? "before" : rel > 0.75 ? "after" : "inside");
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          p.onDragLeave();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          p.onDrop();
        }}
        onDragEnd={p.onDragEnd}
        onClick={() => p.onSelect(page.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          openMenu(e.clientX, e.clientY);
        }}
        style={{ paddingLeft: 4 + p.depth * 14 }}
        className={`group flex cursor-pointer items-center gap-[3px] rounded-md py-[5px] pr-1 text-[13.5px] transition-colors duration-120 ${
          p.deleting
            ? "pointer-events-none opacity-50"
            : p.dropPos === "inside"
              ? "bg-soft ring-1 ring-ink/20 dark:bg-white/10 dark:ring-white/30"
              : p.active
                ? "bg-soft font-medium text-ink dark:bg-white/10 dark:text-[#F5F5F5]"
                : "text-ink-soft hover:bg-soft hover:text-ink dark:text-[#A1A1AA] dark:hover:bg-white/5 dark:hover:text-[#F5F5F5]"
        }`}
      >
        {kids.length > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              p.onToggle();
            }}
            aria-label={p.open ? "Collapse" : "Expand"}
            className="rounded p-[3px] text-faint transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
          >
            {p.open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : (
          <span className="w-[19px] shrink-0" />
        )}

        <PageIcon icon={page.icon} size={15} />

        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              else if (e.key === "Escape") setEditing(false);
              e.stopPropagation();
            }}
            aria-label="Rename page"
            className="min-w-0 flex-1 rounded border border-line bg-white px-1 py-px text-[13.5px] text-ink outline-none dark:border-[#272727] dark:bg-black dark:text-white"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate">{page.title || "Untitled"}</span>
        )}

        {p.deleting ? (
          <span
            role="status"
            aria-label={`Deleting ${page.title || "Untitled"}`}
            className="block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-[2px] border-rosy/30 border-t-rosy"
          />
        ) : null}

        {page.favorite && !editing ? (
          <Star size={11} fill="currentColor" className="shrink-0 text-amberish" />
        ) : null}

        {!editing ? (
          <span className="flex shrink-0 items-center opacity-0 transition-opacity duration-120 group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                openMenu(r.left - 190, r.bottom + 6);
              }}
              aria-label="Page actions"
              className="rounded p-1 text-faint transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Ellipsis size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                p.onAddChild(page.id);
              }}
              aria-label="Add sub-page"
              className="rounded p-1 text-faint transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FilePlus2 size={12} />
            </button>
          </span>
        ) : null}
      </div>

      {p.dropPos === "after" ? (
        <span className="absolute right-1 bottom-0 left-1 z-10 h-[2px] rounded-full bg-ink dark:bg-white" style={{ marginLeft: 6 + p.depth * 14 }} />
      ) : null}

      {menu ? (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
      ) : null}
    </div>
  );
}
