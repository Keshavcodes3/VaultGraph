"use client";

import { useMemo } from "react";

/* ---------- ids ---------- */

let n = 0;
export const uid = (p = "id") => `${p}-${Date.now().toString(36)}-${n++}`;

/* ---------- blocks ---------- */

export type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "numbered"
  | "checkbox"
  | "quote"
  | "code"
  | "callout"
  | "divider"
  | "toggle"
  | "image"
  | "video"
  | "file"
  | "table"
  | "database";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  language?: string;
  url?: string;
  fileName?: string;
  fileSize?: string;
  tableCells?: string[][];
  children?: Block[];
}

export interface PageItem {
  id: string;
  title: string;
  /** emoji char, or "lucide:<Name>" for a Lucide icon */
  icon: string;
  description?: string;
  cover?: string;
  favorite?: boolean;
  updatedAt: string;
  status?: "draft" | "in-review" | "published";
  tags?: string[];
  backlinks?: string[];
  blocks: Block[];
  children?: PageItem[];
}

export interface TrashItem {
  page: PageItem;
  parentId: string | null;
  deletedAt: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  plan: string;
  initial: string;
}

/* ---------- covers + icons ---------- */

export interface Cover {
  id: string;
  label: string;
  cls: string;
}

export const COVERS: Cover[] = [
  { id: "iris", label: "Iris", cls: "from-brand-soft via-mist to-brand-faint" },
  { id: "ember", label: "Ember", cls: "from-amberish/15 via-mist to-rosy/10" },
  { id: "moss", label: "Moss", cls: "from-mint/15 via-mist to-tealish/10" },
  { id: "rose", label: "Rose", cls: "from-rosy/10 via-mist to-violetish/15" },
  { id: "tide", label: "Tide", cls: "from-skyish/15 via-mist to-tealish/15" },
  { id: "grape", label: "Grape", cls: "from-violetish/20 via-mist to-brand-soft" },
  { id: "paper", label: "Paper", cls: "from-mist via-soft to-mist" },
  { id: "ink", label: "Ink", cls: "from-ink via-[#23232e] to-brand-deep" },
];

export const PAGE_ICONS: { icon: string; name: string }[] = [
  { icon: "📄", name: "page" },
  { icon: "🧠", name: "brain" },
  { icon: "🏠", name: "home" },
  { icon: "🎨", name: "art design" },
  { icon: "🗺️", name: "map roadmap" },
  { icon: "⚡", name: "zap fast" },
  { icon: "🔄", name: "sync refresh" },
  { icon: "🔌", name: "api plug" },
  { icon: "📝", name: "note memo" },
  { icon: "💡", name: "idea" },
  { icon: "🎯", name: "target goal" },
  { icon: "📚", name: "books library" },
  { icon: "🔬", name: "research science" },
  { icon: "🚀", name: "rocket launch" },
  { icon: "🛠️", name: "tools build" },
  { icon: "📌", name: "pin" },
  { icon: "💬", name: "chat discuss" },
  { icon: "📊", name: "chart data" },
  { icon: "🎧", name: "music audio" },
  { icon: "🌱", name: "seedling growth" },
  { icon: "🔥", name: "fire hot" },
  { icon: "✨", name: "sparkles new" },
  { icon: "🧪", name: "experiment test" },
  { icon: "📦", name: "box package" },
  { icon: "🗂️", name: "archive files" },
  { icon: "📅", name: "calendar date" },
  { icon: "✅", name: "done check" },
  { icon: "❓", name: "question" },
  { icon: "🎬", name: "video film" },
  { icon: "🎵", name: "song" },
  { icon: "🏛️", name: "bank classic" },
  { icon: "🌌", name: "space galaxy" },
];

/** Small curated Lucide set for page icons (name = lucide export). */
export const LUCIDE_ICONS = [
  "Box",
  "Layers",
  "Cpu",
  "Globe",
  "Compass",
  "FlaskConical",
  "Palette",
  "Music",
  "Calendar",
  "Target",
  "Rocket",
  "BookOpen",
  "Lightbulb",
  "Settings",
  "Star",
  "Heart",
  "Zap",
  "Anchor",
] as const;

export const coverClass = (id?: string) =>
  COVERS.find((c) => c.id === id) ?? COVERS[0];

/* ---------- workspaces ---------- */

export const WORKSPACES: WorkspaceInfo[] = [
  { id: "vaultgraph", name: "VaultGraph", plan: "Team plan", initial: "V" },
  { id: "personal", name: "Personal", plan: "Free plan", initial: "P" },
  { id: "projects", name: "Side Projects", plan: "Free plan", initial: "S" },
];

/* ---------- databases ---------- */

export type DbStatus = "Building" | "Active" | "Planning" | "Paused" | "Done";

export interface DbRow {
  id: string;
  name: string;
  status: DbStatus;
  owner: string;
  updated: string;
}

export const DB_STATUSES: DbStatus[] = ["Planning", "Building", "Active", "Paused", "Done"];

export const INITIAL_DB: DbRow[] = [
  { id: uid("db"), name: "VaultGraph", status: "Building", owner: "Keshav", updated: "2m" },
  { id: uid("db"), name: "Animicon", status: "Active", owner: "Keshav", updated: "1h" },
  { id: uid("db"), name: "Krawl", status: "Planning", owner: "Keshav", updated: "3h" },
  { id: uid("db"), name: "Design tokens", status: "Done", owner: "Keshav", updated: "1d" },
  { id: uid("db"), name: "Sync engine", status: "Building", owner: "Keshav", updated: "2d" },
];

/* ---------- activity ---------- */

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
}

export const INITIAL_ACTIVITY: ActivityItem[] = [
  { id: uid("a"), text: "You published Design System", time: "1h ago" },
  { id: uid("a"), text: "VaultGraph Kernel moved to In review", time: "3h ago" },
  { id: uid("a"), text: "You created Roadmap", time: "Yesterday" },
];

/* ---------- seed pages ---------- */

const b = (
  type: BlockType,
  content: string,
  extra?: Partial<Block>
): Block => ({ id: uid("b"), type, content, ...extra });

export const INITIAL_PAGES: PageItem[] = [
  {
    id: "home",
    title: "Home",
    icon: "🏠",
    description: "Start here. Everything important lives one click away.",
    cover: "paper",
    updatedAt: "Just now",
    status: "published",
    tags: ["hub"],
    backlinks: ["Weekly Review", "Roadmap"],
    blocks: [
      b("h1", "Good morning, Keshav"),
      b(
        "paragraph",
        "Everything you capture lands here first — then VaultGraph files it into the right place and **links it** to what you already know."
      ),
      b("callout", "Vaulty indexed 14 new notes overnight and found 6 fresh connections."),
      b("database", "Projects"),
      b("h2", "Today"),
      b("checkbox", "Review the Sync Engine spec", { checked: true }),
      b("checkbox", "Sketch the empty-state", { checked: false }),
      b("checkbox", "Ship workspace UI pass", { checked: false }),
    ],
  },
  {
    id: "engineering",
    title: "Engineering",
    icon: "lucide:Cpu",
    description: "Systems, specs and decisions.",
    cover: "iris",
    favorite: true,
    updatedAt: "2m ago",
    status: "in-review",
    tags: ["engineering"],
    backlinks: ["Home"],
    blocks: [
      b("h1", "Engineering"),
      b("paragraph", "The source of truth for how VaultGraph gets built. Specs live here, **decisions** link back to discussions."),
      b("h2", "Areas"),
      b("bullet", "Backend — sync engine, API, storage"),
      b("bullet", "Frontend — workspace, editor, graph"),
      b("bullet", "Architecture — principles and trade-offs"),
    ],
    children: [
      {
        id: "backend",
        title: "Backend Architecture",
        icon: "⚙️",
        description: "Design decisions, APIs, services and infrastructure.",
        cover: "tide",
        updatedAt: "2m ago",
        status: "in-review",
        tags: ["engineering", "spec"],
        backlinks: ["CRDT Sync Spec", "API Guidelines"],
        blocks: [
          b("paragraph", "VaultGraph fuses **graph linkages** with a Notion-grade block model and Linear-fast keyboard flow."),
          b("callout", "Architecture rule: zero layout shift. The writing surface stays pure and distraction-free."),
          b("h2", "Design primitives"),
          b("bullet", "Sub-10ms block state mutation cycles"),
          b("bullet", "Fractional indexing for real-time merges"),
          b("h2", "Open questions"),
          b("checkbox", "Graph panel: force layout vs. radial?", { checked: true }),
          b("checkbox", "Citations inline or footnoted?", { checked: false }),
          b(
            "toggle",
            "Sync protocol details",
            {
              children: [
                b("paragraph", "Operations ship over WebSocket as compact patches with Lamport timestamps."),
                b("code", "op Patch = { id, clock, path, value }\napply(patch) // idempotent, commutative", { language: "ts" }),
              ],
            }
          ),
          b("quote", "Tools shape our thoughts, and thoughts shape our tools."),
          b("code", "const graph = await vault.links('kernel')\n// → 14 nodes, 31 edges", { language: "ts" }),
        ],
        children: [
          {
            id: "sync",
            title: "CRDT Sync Spec",
            icon: "🔄",
            updatedAt: "1h ago",
            status: "draft",
            blocks: [
              b("h1", "CRDT Sync Spec"),
              b("paragraph", "Operations, clocks and merge rules."),
              b("table", "", {
                tableCells: [
                  ["Op", "Clock", "Merge"],
                  ["insert", "Lamport", "commutative"],
                  ["delete", "Lamport", "tombstone"],
                ],
              }),
            ],
          },
        ],
      },
      {
        id: "frontend",
        title: "Frontend",
        icon: "🎨",
        updatedAt: "3h ago",
        status: "draft",
        blocks: [
          b("h1", "Frontend"),
          b("paragraph", "Workspace shell, editor and motion language."),
        ],
      },
    ],
  },
  {
    id: "vaultgraph",
    title: "VaultGraph",
    icon: "🧠",
    description: "Product, roadmap and the database of everything we ship.",
    cover: "grape",
    favorite: true,
    updatedAt: "1h ago",
    status: "published",
    tags: ["product"],
    backlinks: ["Home"],
    blocks: [
      b("h1", "VaultGraph"),
      b("paragraph", "One token set drives everything. Ink for text, brand for action, **soft surfaces** everywhere."),
      b("h2", "Type scale"),
      b("numbered", "Display — semibold, tight tracking"),
      b("numbered", "Body — relaxed 1.65 line height"),
      b("numbered", "Mono — eyebrows, keys, code"),
    ],
    children: [
      {
        id: "roadmap",
        title: "Roadmap",
        icon: "🗺️",
        updatedAt: "Yesterday",
        status: "draft",
        blocks: [
          b("h1", "Roadmap"),
          b("h2", "Now"),
          b("checkbox", "Workspace UI pass", { checked: true }),
          b("checkbox", "Citations", { checked: false }),
          b("h2", "Next"),
          b("bullet", "Offline-first sync"),
          b("bullet", "Public sharing"),
          b("divider", ""),
          b("paragraph", "Plans are versioned — every change links back to the discussion that caused it."),
        ],
      },
    ],
  },
  {
    id: "personal",
    title: "Personal",
    icon: "🌱",
    updatedAt: "2d ago",
    status: "draft",
    blocks: [
      b("paragraph", ""),
    ],
  },
];

/* ---------- tree helpers ---------- */

export function findPage(tree: PageItem[], id: string): PageItem | null {
  for (const p of tree) {
    if (p.id === id) return p;
    if (p.children) {
      const f = findPage(p.children, id);
      if (f) return f;
    }
  }
  return null;
}

export function flattenPages(tree: PageItem[]): PageItem[] {
  const out: PageItem[] = [];
  const walk = (nodes: PageItem[]) => {
    for (const p of nodes) {
      out.push(p);
      if (p.children) walk(p.children);
    }
  };
  walk(tree);
  return out;
}

/** Remove a page from the tree, returning it plus its former parent id. */
export function extractPage(
  tree: PageItem[],
  id: string
): { tree: PageItem[]; page: PageItem | null; parentId: string | null } {
  let found: PageItem | null = null;
  let parentId: string | null = null;
  const walk = (nodes: PageItem[], pid: string | null): PageItem[] =>
    nodes.flatMap((p) => {
      if (p.id === id) {
        found = p;
        parentId = pid;
        return [];
      }
      if (p.children?.length) return [{ ...p, children: walk(p.children, p.id) }];
      return [p];
    });
  return { tree: walk(tree, null), page: found, parentId };
}

/** Deep-clone a page subtree with fresh ids (for duplicate). */
export function clonePage(page: PageItem, titleSuffix = " copy"): PageItem {
  const cloneBlocks = (blocks: Block[]): Block[] =>
    blocks.map((x) => ({
      ...x,
      id: uid("b"),
      tableCells: x.tableCells?.map((r) => [...r]),
      children: x.children ? cloneBlocks(x.children) : undefined,
    }));
  const walk = (p: PageItem, top: boolean): PageItem => ({
    ...p,
    id: uid("pg"),
    title: top ? `${p.title || "Untitled"}${titleSuffix}` : p.title,
    favorite: false,
    updatedAt: "Just now",
    blocks: cloneBlocks(p.blocks),
    children: p.children?.map((c) => walk(c, false)),
  });
  return walk(page, true);
}

export type DropPosition = "before" | "after" | "inside";

/** Move dragId relative to targetId. No-op when dropped onto itself/descendant. */
export function movePage(
  tree: PageItem[],
  dragId: string,
  targetId: string,
  pos: DropPosition
): PageItem[] {
  if (dragId === targetId) return tree;
  const drag = findPage(tree, dragId);
  if (!drag) return tree;
  // Can't nest inside your own descendant.
  if (pos === "inside" && findPage(drag.children ?? [], targetId)) return tree;
  const { tree: rest } = extractPage(tree, dragId);
  if (pos === "inside") {
    const walk = (nodes: PageItem[]): PageItem[] =>
      nodes.map((p) =>
        p.id === targetId
          ? { ...p, children: [...(p.children ?? []), drag] }
          : p.children
            ? { ...p, children: walk(p.children) }
            : p
      );
    return walk(rest);
  }
  const insert = (nodes: PageItem[]): PageItem[] =>
    nodes.flatMap((p) => {
      if (p.id === targetId) {
        return pos === "before" ? [drag, p] : [p, drag];
      }
      if (p.children?.length) return [{ ...p, children: insert(p.children) }];
      return [p];
    });
  return insert(rest);
}

export function useBreadcrumbs(tree: PageItem[], id: string | null) {
  return useMemo(() => {
    if (!id) return [];
    const walk = (
      nodes: PageItem[],
      path: { id: string; title: string }[]
    ): { id: string; title: string }[] | null => {
      for (const p of nodes) {
        const cur = [...path, { id: p.id, title: p.title || "Untitled" }];
        if (p.id === id) return cur;
        if (p.children) {
          const r = walk(p.children, cur);
          if (r) return r;
        }
      }
      return null;
    };
    return walk(tree, []) ?? [];
  }, [tree, id]);
}
