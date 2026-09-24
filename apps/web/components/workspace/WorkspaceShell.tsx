"use client";

import { AnimatePresence } from "framer-motion";
import {
  ChevronsRight,
  FilePlus2,
  Moon,
  PanelRight,
  Settings,
  Star,
  Sun,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PaletteRoot, type PaletteAction } from "./CommandPalette";
import { EmptyPage, TrashView } from "./EmptyPage";
import PageCanvas from "./PageCanvas";
import PageHeader, { type SaveState } from "./PageHeader";
import PageProperties from "./PageProperties";
import WorkspaceSidebar from "./WorkspaceSidebar";
import {
  COVERS,
  INITIAL_ACTIVITY,
  INITIAL_DB,
  INITIAL_PAGES,
  clonePage,
  extractPage,
  findPage,
  flattenPages,
  movePage,
  uid,
  type ActivityItem,
  type Block,
  type DbRow,
  type DropPosition,
  type PageItem,
  type TrashItem,
} from "./data";

const BLANK_BLOCKS = (): Block[] => [{ id: uid("b"), type: "paragraph", content: "" }];

const blankPage = (): PageItem => ({
  id: uid("pg"),
  title: "",
  icon: "📄",
  description: "",
  cover: COVERS[Math.floor(Math.random() * COVERS.length)]?.id,
  updatedAt: "Just now",
  status: "draft",
  tags: [],
  backlinks: [],
  blocks: BLANK_BLOCKS(),
  children: [],
});

function findParent(tree: PageItem[], id: string): PageItem | null {
  for (const p of tree) {
    if (p.children?.some((c) => c.id === id)) return p;
    if (p.children) {
      const f = findParent(p.children, id);
      if (f) return f;
    }
  }
  return null;
}

function insertAfter(tree: PageItem[], afterId: string, node: PageItem): PageItem[] {
  return tree.flatMap((p) => {
    if (p.id === afterId) return [p, node];
    if (p.children?.length) return [{ ...p, children: insertAfter(p.children, afterId, node) }];
    return [p];
  });
}

function patchTree(
  tree: PageItem[],
  id: string,
  fn: (p: PageItem) => PageItem
): PageItem[] {
  return tree.map((p) =>
    p.id === id
      ? fn(p)
      : p.children?.length
        ? { ...p, children: patchTree(p.children, id, fn) }
        : p
  );
}

function isFreshPage(page: PageItem): boolean {
  return (
    !page.title &&
    page.blocks.every(
      (b) =>
        !b.content.trim() &&
        !b.url &&
        !b.tableCells?.some((r) => r.some((c) => c.trim()))
    )
  );
}

/** Full-screen application shell. Owns pages, trash, theme and panels. */
export default function WorkspaceShell() {
  const [booted, setBooted] = useState(false);
  const [pages, setPages] = useState<PageItem[]>(INITIAL_PAGES);
  const [activeId, setActiveId] = useState<string | null>("backend");
  const [trashOpen, setTrashOpen] = useState(false);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>(["backend", "home"]);
  const [activity, setActivity] = useState<ActivityItem[]>(INITIAL_ACTIVITY);
  const [dbRows, setDbRows] = useState<DbRow[]>(INITIAL_DB);

  const [workspaceId, setWorkspaceId] = useState("vaultgraph");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");

  const saveTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(saveTimer.current), []);
  useEffect(() => {
    const t = window.setTimeout(() => setBooted(true), 650);
    return () => window.clearTimeout(t);
  }, []);

  const touchSaved = useCallback(() => {
    setSaveState("saving");
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaveState("saved"), 900);
  }, []);

  const log = useCallback((text: string) => {
    setActivity((a) => [{ id: uid("a"), text, time: "Just now" }, ...a].slice(0, 12));
  }, []);

  /* ----- selection ----- */

  const select = useCallback((id: string) => {
    setActiveId(id);
    setTrashOpen(false);
    setMobileNav(false);
    setRecentIds((r) => [id, ...r.filter((x) => x !== id)].slice(0, 8));
  }, []);

  /* ----- page ops ----- */

  const newPage = useCallback(
    (parentId: string | null = null) => {
      const pg = blankPage();
      setPages((prev) => {
        if (!parentId) return [...prev, pg];
        const walk = (nodes: PageItem[]): PageItem[] =>
          nodes.map((p) =>
            p.id === parentId
              ? { ...p, children: [...(p.children ?? []), pg] }
              : p.children
                ? { ...p, children: walk(p.children) }
                : p
          );
        return walk(prev);
      });
      log(`You created ${pg.title || "an untitled page"}`);
      select(pg.id);
      touchSaved();
    },
    [log, select, touchSaved]
  );

  const newProject = useCallback(() => {
    const pg: PageItem = {
      ...blankPage(),
      title: "",
      icon: "📊",
      blocks: [
        { id: uid("b"), type: "paragraph", content: "" },
        { id: uid("b"), type: "database", content: "Projects" },
      ],
    };
    setPages((prev) => [...prev, pg]);
    log("You created a new project database");
    select(pg.id);
    touchSaved();
  }, [log, select, touchSaved]);

  const rename = useCallback(
    (id: string, title: string) => {
      setPages((prev) => patchTree(prev, id, (p) => ({ ...p, title, updatedAt: "Just now" })));
      touchSaved();
    },
    [touchSaved]
  );

  const duplicate = useCallback(
    (id: string) => {
      const src = findPage(pages, id);
      if (!src) return;
      const copy = clonePage(src);
      setPages((prev) => insertAfter(prev, id, copy));
      log(`You duplicated ${src.title || "a page"}`);
      select(copy.id);
      touchSaved();
    },
    [pages, log, select, touchSaved]
  );

  const remove = useCallback(
    (id: string) => {
      const found = findPage(pages, id);
      if (!found) return;
      const { tree: rest, parentId } = extractPage(pages, id);
      setTrash((t) => [
        { page: found, parentId, deletedAt: "Just now" },
        ...t,
      ]);
      log(`You deleted ${found.title || "a page"}`);
      setPages(rest);
      touchSaved();
      if (id === activeId) {
        const parent = parentId ? findPage(rest, parentId) : null;
        const fallback =
          parent?.id ??
          rest.flatMap((p) => [p, ...(p.children ?? [])])[0]?.id ??
          null;
        setActiveId(fallback);
      }
    },
    [pages, activeId, log, touchSaved]
  );

  const restore = useCallback(
    (id: string) => {
      const item = trash.find((t) => t.page.id === id);
      if (!item) return;
      setTrash((t) => t.filter((x) => x.page.id !== id));
      setPages((prev) => {
        if (!item.parentId || !findPage(prev, item.parentId)) {
          return [...prev, item.page];
        }
        const walk = (nodes: PageItem[]): PageItem[] =>
          nodes.map((p) =>
            p.id === item.parentId
              ? { ...p, children: [...(p.children ?? []), item.page] }
              : p.children
                ? { ...p, children: walk(p.children) }
                : p
          );
        return walk(prev);
      });
      log(`You restored ${item.page.title || "a page"}`);
      touchSaved();
    },
    [trash, log, touchSaved]
  );

  const deleteForever = useCallback((id: string) => {
    setTrash((t) => t.filter((x) => x.page.id !== id));
  }, []);

  const toggleFav = useCallback(
    (id: string) => {
      setPages((prev) =>
        patchTree(prev, id, (p) => ({ ...p, favorite: !p.favorite }))
      );
      touchSaved();
    },
    [touchSaved]
  );

  const copyLink = useCallback((id: string) => {
    const url = `${window.location.origin}/workspace#${id}`;
    try {
      void navigator.clipboard.writeText(url);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  const moveTo = useCallback(
    (pageId: string, parentId: string | null) => {
      const node = findPage(pages, pageId);
      if (!node) return;
      if (parentId && (parentId === pageId || findPage(node.children ?? [], parentId))) return;
      const { tree: rest } = extractPage(pages, pageId);
      if (!parentId) {
        setPages([...rest, node]);
      } else {
        const walk = (nodes: PageItem[]): PageItem[] =>
          nodes.map((p) =>
            p.id === parentId
              ? { ...p, children: [...(p.children ?? []), node] }
              : p.children
                ? { ...p, children: walk(p.children) }
                : p
          );
        setPages(walk(rest));
      }
      touchSaved();
    },
    [pages, touchSaved]
  );

  const move = useCallback(
    (dragId: string, targetId: string, pos: DropPosition) => {
      setPages((prev) => movePage(prev, dragId, targetId, pos));
      touchSaved();
    },
    [touchSaved]
  );

  const patchBlocks = useCallback(
    (blocks: Block[]) => {
      if (!activeId) return;
      setPages((prev) =>
        patchTree(prev, activeId, (p) => ({ ...p, blocks, updatedAt: "Just now" }))
      );
      touchSaved();
    },
    [activeId, touchSaved]
  );

  const patchMeta = useCallback(
    (patch: Partial<PageItem>) => {
      if (!activeId) return;
      setPages((prev) =>
        patchTree(prev, activeId, (p) => ({ ...p, ...patch, updatedAt: "Just now" }))
      );
      touchSaved();
    },
    [activeId, touchSaved]
  );

  /* ----- keyboard ----- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const tag = (e.target as HTMLElement).tagName;
      const inField = tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT";
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      } else if (mod && e.key.toLowerCase() === "b" && !inField) {
        e.preventDefault();
        setCollapsed((v) => !v);
      } else if (mod && e.key.toLowerCase() === "i" && !inField) {
        e.preventDefault();
        setPropsOpen((v) => !v);
      } else if (e.key === "Escape" && !inField) {
        setPalette(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ----- derived ----- */

  const active = activeId ? findPage(pages, activeId) : null;
  const flat = useMemo(() => flattenPages(pages), [pages]);
  const crumbs = useMemo(() => {
    if (trashOpen) return [{ id: "__trash", title: "Trash" }];
    if (!activeId) return [];
    const walk = (
      nodes: PageItem[],
      path: { id: string; title: string }[]
    ): { id: string; title: string }[] | null => {
      for (const p of nodes) {
        const cur = [...path, { id: p.id, title: p.title || "Untitled" }];
        if (p.id === activeId) return cur;
        if (p.children) {
          const r = walk(p.children, cur);
          if (r) return r;
        }
      }
      return null;
    };
    return walk(pages, []) ?? [];
  }, [pages, activeId, trashOpen]);

  const moveTargets = useMemo(
    () => [
      { id: null as string | null, title: "Top level" },
      ...flat.map((p) => ({ id: p.id as string | null, title: p.title || "Untitled" })),
    ],
    [flat]
  );

  const paletteActions: PaletteAction[] = useMemo(
    () => [
      { id: "new-page", label: "Create page", hint: "", icon: <FilePlus2 size={14} />, run: () => newPage(null) },
      { id: "new-project", label: "Create project", hint: "", icon: <FilePlus2 size={14} />, run: newProject },
      {
        id: "theme",
        label: theme === "light" ? "Switch to dark mode" : "Switch to light mode",
        hint: "",
        icon: theme === "light" ? <Moon size={14} /> : <Sun size={14} />,
        run: () => setTheme((t) => (t === "light" ? "dark" : "light")),
      },
      { id: "trash", label: "Open trash", hint: "", icon: <Trash2 size={14} />, run: () => setTrashOpen(true) },
      { id: "favs", label: "Toggle sidebar", hint: "⌘B", icon: <PanelRight size={14} />, run: () => setCollapsed((v) => !v) },
      { id: "settings", label: "Settings", hint: "", icon: <Settings size={14} />, run: () => {} },
      { id: "star", label: "Favorite current page", hint: "", icon: <Star size={14} />, run: () => activeId && toggleFav(activeId) },
    ],
    [newPage, newProject, theme, activeId, toggleFav]
  );

  /* ----- skeleton ----- */

  if (!booted) {
    return (
      <div className={`flex h-screen w-screen overflow-hidden bg-white ${theme === "dark" ? "dark" : ""}`}>
        <div className="hidden w-[248px] shrink-0 flex-col gap-2 border-r border-line p-3 md:flex dark:border-[#272727] dark:bg-[#111111]">
          <div className="h-9 animate-pulse rounded-md bg-soft dark:bg-white/5" />
          <div className="h-7 animate-pulse rounded-md bg-soft dark:bg-white/5" />
          <div className="h-7 animate-pulse rounded-md bg-soft dark:bg-white/5" />
          <div className="mt-3 h-7 animate-pulse rounded-md bg-soft dark:bg-white/5" />
          <div className="h-7 animate-pulse rounded-md bg-soft dark:bg-white/5" />
          <div className="h-7 animate-pulse rounded-md bg-soft dark:bg-white/5" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="h-12 shrink-0 border-b border-line dark:border-[#272727]" />
          <div className="mx-auto w-full max-w-[850px] space-y-3 px-6 py-10 sm:px-12">
            <div className="h-10 w-2/3 animate-pulse rounded-lg bg-soft dark:bg-white/5" />
            <div className="h-4 w-full animate-pulse rounded bg-soft dark:bg-white/5" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-soft dark:bg-white/5" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-soft dark:bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  const parent = active ? findParent(pages, active.id) : null;

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="flex h-screen w-screen overflow-hidden bg-white font-sans text-ink antialiased dark:bg-[#111111] dark:text-[#F5F5F5]">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="absolute top-3 left-3 z-40 hidden rounded-lg border border-line bg-white p-2 text-ink-soft shadow-card transition-colors hover:text-ink md:block dark:border-[#272727] dark:bg-[#181818] dark:text-[#A1A1AA] dark:hover:text-white"
          >
            <ChevronsRight size={15} />
          </button>
        ) : null}

        <WorkspaceSidebar
          workspaceId={workspaceId}
          pages={pages}
          activeId={trashOpen ? null : activeId}
          recentIds={recentIds}
          trashCount={trash.length}
          collapsed={collapsed}
          mobileOpen={mobileNav}
          theme={theme}
          moveTargets={moveTargets}
          onSwitchWorkspace={(id) => setWorkspaceId(id)}
          onSelect={select}
          onNewPage={newPage}
          onToggleFav={toggleFav}
          onRename={rename}
          onDuplicate={duplicate}
          onDelete={remove}
          onCopyLink={copyLink}
          onMoveTo={moveTo}
          onMove={move}
          onOpenSearch={() => setPalette(true)}
          onCollapse={() => setCollapsed(true)}
          onCloseMobile={() => setMobileNav(false)}
          onOpenTrash={() => {
            setTrashOpen(true);
            setMobileNav(false);
          }}
          onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <PageHeader
            crumbs={trashOpen ? crumbs : crumbs.length ? crumbs : [{ id: "home", title: "VaultGraph" }]}
            status={trashOpen ? undefined : active?.status}
            isFavorite={active?.favorite}
            saveState={saveState}
            propsOpen={propsOpen}
            onSelectCrumb={(id) => {
              if (id === "__trash") setTrashOpen(true);
              else select(id);
            }}
            onToggleFav={() => active && toggleFav(active.id)}
            onCopyLink={() => active && copyLink(active.id)}
            onToggleProps={() => setPropsOpen((v) => !v)}
            onOpenSidebar={() => setMobileNav(true)}
          />

          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-y-auto bg-white dark:bg-[#111111]">
              {trashOpen ? (
                <TrashView
                  trash={trash}
                  onRestore={restore}
                  onDeleteForever={deleteForever}
                  onEmpty={() => setTrash([])}
                />
              ) : active ? (
                <AnimatePresence mode="wait" initial={false}>
                  <PageCanvas
                    key={active.id}
                    page={active}
                    dbRows={dbRows}
                    isFresh={isFreshPage(active)}
                    onPatchBlocks={patchBlocks}
                    onMeta={patchMeta}
                    onDbChange={(rows) => {
                      setDbRows(rows);
                      touchSaved();
                    }}
                  />
                </AnimatePresence>
              ) : (
                <EmptyPage
                  title="Nothing here yet."
                  hint="Create your first page and start building."
                  actionLabel="Create your first page"
                  onAction={() => newPage(null)}
                />
              )}
            </main>

            <PageProperties
              open={propsOpen}
              page={trashOpen ? null : active}
              parentTitle={parent?.title ?? null}
              activity={activity}
              onToggleFav={() => active && toggleFav(active.id)}
              onClose={() => setPropsOpen(false)}
            />
          </div>
        </div>

        <PaletteRoot
          open={palette}
          pages={flat}
          actions={paletteActions}
          onSelect={select}
          onClose={() => setPalette(false)}
        />
      </div>
    </div>
  );
}
