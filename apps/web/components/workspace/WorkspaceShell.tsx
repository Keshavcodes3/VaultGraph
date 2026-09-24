"use client";

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
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PaletteRoot, type PaletteAction } from "./CommandPalette";
import { EmptyPage, TrashView } from "./EmptyPage";
import PageView from "./PageView";
import PageProperties from "./PageProperties";
import WorkspaceSidebar from "./WorkspaceSidebar";
import { ApiError } from "@/lib/api/client";
import { pagesApi } from "@/lib/api/pages";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { usePage } from "@/hooks/pages/use-page";
import { usePageTree, usePages } from "@/hooks/pages/use-pages";
import { useWorkspaceProjects } from "@/hooks/project/use-workspace-projects";
import { useCreateProject } from "@/hooks/project/use-create-project";
import { useUpdateProject } from "@/hooks/project/use-update-project";
import { useDeleteProject } from "@/hooks/project/use-delete-project";
import { useCreateWorkspace, useWorkspaces } from "@/hooks/workspace/use-workspaces";
import { blockKeys, pageKeys } from "@/lib/query/query-keys";
import {
  apiPageToEditor,
  apiPageToTrashItem,
  apiTreeToPageItems,
  findApiParent,
  findApiTreeNode,
  siblingIdsOfTree,
} from "@/lib/pages/mapping";
import {
  findPage,
  flattenPages,
  type DropPosition,
  type PageItem,
} from "./data";

/* ----- client preferences (not application data): selected workspace, ----- */
/* ----- last-opened page and recently visited page ids live in localStorage - */

const LS_WORKSPACE = "vg-workspace-id";
const recentKey = (ws: string) => `vg-recent:${ws}`;
const activeKey = (ws: string) => `vg-active:${ws}`;

function readStored(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readStoredList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function store(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — selection simply won't persist */
  }
}

function storeList(key: string, value: string[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — recents simply won't persist */
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session expired. Please sign in again.";
    if (error.status === 403) return "You don't have access to that. It may belong to another workspace.";
    if (error.status === 404) return "That page or project no longer exists. It may have been deleted.";
    if (error.status === 409) return "A page with that name already exists here.";
    if (error.status === 0) return "Can't reach your workspace right now. Check your connection and try again.";
    return error.message || "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

/** Full-screen application shell. Backend-backed: workspace, projects, pages. */
export default function WorkspaceShell() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [actionError, setActionError] = useState<{ message: string; retry: () => void } | null>(null);

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [workspaceDraft, setWorkspaceDraft] = useState("");
  const hydratedWorkspace = useRef(false);

  /* ----- session ----- */

  const { data: user, isLoading: userLoading } = useCurrentUser();

  useEffect(() => {
    if (!userLoading && !user) router.replace("/login");
  }, [userLoading, user, router]);

  /* ----- workspaces (real) ----- */

  const {
    data: workspaces,
    isLoading: workspacesLoading,
    isError: workspacesError,
    refetch: refetchWorkspaces,
  } = useWorkspaces(Boolean(user));

  // Pick the stored workspace (when it still exists), else the first one.
  useEffect(() => {
    if (hydratedWorkspace.current || !workspaces) return;
    hydratedWorkspace.current = true;
    const stored = readStored(LS_WORKSPACE);
    const pick =
      (stored && workspaces.some((w) => w.id === stored) ? stored : null) ??
      workspaces[0]?.id ??
      null;
    setWorkspaceId(pick);
    if (pick) {
      store(LS_WORKSPACE, pick);
      setRecentIds(readStoredList(recentKey(pick)));
      setActiveId(readStored(activeKey(pick)));
    }
  }, [workspaces]);

  const switchWorkspace = useCallback((id: string) => {
    setWorkspaceId(id);
    store(LS_WORKSPACE, id);
    setActiveId(readStored(activeKey(id)));
    setRecentIds(readStoredList(recentKey(id)));
    setActiveProjectId(null);
    setTrashOpen(false);
    setMobileNav(false);
    setActionError(null);
  }, []);

  const createWorkspace = useCreateWorkspace();
  const handleCreateWorkspace = useCallback(
    async (name: string) => {
      const run = async () => {
        const ws = await createWorkspace.mutateAsync({ name });
        switchWorkspace(ws.id);
      };
      try {
        setActionError(null);
        await run();
      } catch (error) {
        setActionError({ message: errorMessage(error), retry: () => void handleCreateWorkspace(name) });
      }
    },
    [createWorkspace, switchWorkspace]
  );

  /* ----- projects (real) ----- */

  const { data: projects, isLoading: projectsLoading } = useWorkspaceProjects(workspaceId);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const selectProject = useCallback((id: string | null) => {
    setActiveProjectId(id);
    setActiveId(null);
    setTrashOpen(false);
    setMobileNav(false);
  }, []);

  const handleNewProject = useCallback(async () => {
    if (!workspaceId) return;
    const run = async () => {
      const { project } = await createProject.mutateAsync({
        workspaceId,
        name: "Untitled project",
      });
      setActiveProjectId(project.id);
    };
    try {
      setActionError(null);
      await run();
    } catch (error) {
      setActionError({ message: errorMessage(error), retry: () => void handleNewProject() });
    }
  }, [workspaceId, createProject]);

  const handleRenameProject = useCallback(
    async (id: string, name: string) => {
      if (!workspaceId) return;
      try {
        setActionError(null);
        await updateProject.mutateAsync({ projectId: id, workspaceId, patch: { name } });
      } catch (error) {
        setActionError({ message: errorMessage(error), retry: () => void handleRenameProject(id, name) });
      }
    },
    [workspaceId, updateProject]
  );

  const handleDeleteProject = useCallback(
    async (id: string) => {
      if (!workspaceId) return;
      try {
        setActionError(null);
        await deleteProject.mutateAsync({ projectId: id, workspaceId });
        setActiveProjectId((cur) => (cur === id ? null : cur));
      } catch (error) {
        setActionError({ message: errorMessage(error), retry: () => void handleDeleteProject(id) });
      }
    },
    [workspaceId, deleteProject]
  );

  /* ----- page tree (real) ----- */

  const treeScope = useMemo(
    () =>
      activeProjectId
        ? { projectId: activeProjectId }
        : workspaceId
          ? { workspaceId }
          : {},
    [activeProjectId, workspaceId]
  );
  const {
    data: treeData,
    isLoading: treeLoading,
    isError: treeError,
    refetch: refetchTree,
  } = usePageTree(treeScope, Boolean(workspaceId));

  const tree = useMemo(() => treeData?.tree ?? [], [treeData]);
  const pages: PageItem[] = useMemo(() => apiTreeToPageItems(tree), [tree]);
  const flat = useMemo(() => flattenPages(pages), [pages]);

  // Drop a restored selection that no longer exists (deleted elsewhere).
  useEffect(() => {
    if (!treeData || !activeId) return;
    if (!findApiTreeNode(tree, activeId)) setActiveId(null);
  }, [treeData, tree, activeId]);

  /* ----- trash = archived pages (real) ----- */

  const { data: archivedData } = usePages(
    { workspaceId: workspaceId ?? undefined, archived: true },
    Boolean(workspaceId)
  );
  const trash = useMemo(
    () => (archivedData?.pages ?? []).map(apiPageToTrashItem),
    [archivedData]
  );

  /* ----- active page metadata for the properties panel (real) ----- */

  const { data: activeData } = usePage(trashOpen ? null : activeId);
  const propsPage: PageItem | null = useMemo(
    () => (activeData ? apiPageToEditor(activeData.page, activeData.blocks) : null),
    [activeData]
  );
  const parentTitle = activeData?.ancestors?.length
    ? (activeData.ancestors[activeData.ancestors.length - 1]?.title || "Untitled")
    : null;

  /* ----- selection ----- */

  const select = useCallback(
    (id: string) => {
      setActiveId(id);
      setTrashOpen(false);
      setMobileNav(false);
      setRecentIds((r) => {
        const next = [id, ...r.filter((x) => x !== id)].slice(0, 8);
        if (workspaceId) storeList(recentKey(workspaceId), next);
        return next;
      });
      if (workspaceId) store(activeKey(workspaceId), id);
    },
    [workspaceId]
  );

  /* ----- page ops (all hit the API, then invalidate) ----- */

  const refreshPages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: pageKeys.all });
    queryClient.invalidateQueries({ queryKey: blockKeys.all });
  }, [queryClient]);

  const newPage = useCallback(
    async (parentId: string | null = null) => {
      if (!workspaceId) return;
      const run = async () => {
        const { page } = await pagesApi.create({
          workspaceId,
          projectId: activeProjectId,
          parentId,
          title: "Untitled",
        });
        refreshPages();
        select(page.id);
      };
      try {
        setActionError(null);
        await run();
      } catch (error) {
        setActionError({ message: errorMessage(error), retry: () => void newPage(parentId) });
      }
    },
    [workspaceId, activeProjectId, refreshPages, select]
  );

  const rename = useCallback(
    async (id: string, title: string) => {
      const run = async () => {
        await pagesApi.update(id, { title });
        refreshPages();
      };
      try {
        setActionError(null);
        await run();
      } catch (error) {
        setActionError({ message: errorMessage(error), retry: () => void rename(id, title) });
      }
    },
    [refreshPages]
  );

  const duplicate = useCallback(
    async (id: string) => {
      const run = async () => {
        const { page } = await pagesApi.duplicate(id);
        refreshPages();
        select(page.id);
      };
      try {
        setActionError(null);
        await run();
      } catch (error) {
        setActionError({ message: errorMessage(error), retry: () => void duplicate(id) });
      }
    },
    [refreshPages, select]
  );

  const remove = useCallback(
    async (id: string) => {
      const run = async () => {
        await pagesApi.archive(id);
        refreshPages();
        if (id === activeId) {
          const parent = findApiParent(tree, id);
          const fallback =
            (parent ? parent.id : null) ??
            tree.filter((n) => n.id !== id)[0]?.id ??
            null;
          setActiveId(fallback);
        }
      };
      try {
        setActionError(null);
        await run();
      } catch (error) {
        setActionError({ message: errorMessage(error), retry: () => void remove(id) });
      }
    },
    [tree, activeId, refreshPages]
  );

  const restore = useCallback(
    async (id: string) => {
      const run = async () => {
        await pagesApi.restore(id);
        refreshPages();
      };
      try {
        setActionError(null);
        await run();
      } catch (error) {
        setActionError({ message: errorMessage(error), retry: () => void restore(id) });
      }
    },
    [refreshPages]
  );

  const deleteForever = useCallback(
    async (id: string) => {
      const run = async () => {
        await pagesApi.remove(id);
        queryClient.removeQueries({ queryKey: pageKeys.detail(id) });
        refreshPages();
      };
      try {
        setActionError(null);
        await run();
      } catch (error) {
        setActionError({ message: errorMessage(error), retry: () => void deleteForever(id) });
      }
    },
    [queryClient, refreshPages]
  );

  const emptyTrash = useCallback(async () => {
    const ids = trash.map((t) => t.page.id);
    const run = async () => {
      await Promise.all(ids.map((id) => pagesApi.remove(id)));
      for (const id of ids) queryClient.removeQueries({ queryKey: pageKeys.detail(id) });
      refreshPages();
    };
    try {
      setActionError(null);
      await run();
    } catch (error) {
      setActionError({ message: errorMessage(error), retry: () => void emptyTrash() });
    }
  }, [trash, queryClient, refreshPages]);

  const toggleFav = useCallback(
    async (id: string) => {
      const run = async () => {
        const node = findApiTreeNode(tree, id);
        if (node?.isFavorite) await pagesApi.unfavorite(id);
        else await pagesApi.favorite(id);
        refreshPages();
      };
      try {
        setActionError(null);
        await run();
      } catch (error) {
        setActionError({ message: errorMessage(error), retry: () => void toggleFav(id) });
      }
    },
    [tree, refreshPages]
  );

  const copyLink = useCallback((id: string) => {
    const url = `${window.location.origin}/workspace/${id}`;
    try {
      void navigator.clipboard.writeText(url);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  const moveTo = useCallback(
    async (pageId: string, parentId: string | null) => {
      const run = async () => {
        await pagesApi.move(pageId, { parentId });
        refreshPages();
      };
      try {
        setActionError(null);
        await run();
      } catch (error) {
        setActionError({ message: errorMessage(error), retry: () => void moveTo(pageId, parentId) });
      }
    },
    [refreshPages]
  );

  const move = useCallback(
    async (dragId: string, targetId: string, pos: DropPosition) => {
      if (dragId === targetId) return;
      const run = async () => {
        if (pos === "inside") {
          await pagesApi.move(dragId, { parentId: targetId });
        } else {
          const targetParent = findApiParent(tree, targetId);
          if (targetParent === undefined) return;
          const dragParent = findApiParent(tree, dragId);
          const sameScope =
            (dragParent?.id ?? null) === (targetParent?.id ?? null);
          if (!sameScope) {
            // Cross-parent drops re-parent first; precise ordering stays server-side.
            await pagesApi.move(dragId, { parentId: targetParent?.id ?? null });
          } else {
            const siblings = siblingIdsOfTree(tree, targetId);
            if (!siblings) return;
            const rest = siblings.filter((sid) => sid !== dragId);
            const at = rest.indexOf(targetId);
            const next = [...rest];
            next.splice(pos === "before" ? at : at + 1, 0, dragId);
            await pagesApi.reorder(next);
          }
        }
        refreshPages();
      };
      try {
        setActionError(null);
        await run();
      } catch (error) {
        setActionError({ message: errorMessage(error), retry: () => void move(dragId, targetId, pos) });
      }
    },
    [tree, refreshPages]
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

  const moveTargets = useMemo(
    () => [
      { id: null as string | null, title: "Top level" },
      ...flat.map((pg) => ({ id: pg.id as string | null, title: pg.title || "Untitled" })),
    ],
    [flat]
  );

  const paletteActions: PaletteAction[] = useMemo(
    () => [
      { id: "new-page", label: "Create page", hint: "", icon: <FilePlus2 size={14} />, run: () => void newPage(null) },
      { id: "new-project", label: "Create project", hint: "", icon: <FilePlus2 size={14} />, run: () => void handleNewProject() },
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
      { id: "star", label: "Favorite current page", hint: "", icon: <Star size={14} />, run: () => activeId && void toggleFav(activeId) },
    ],
    [newPage, handleNewProject, theme, activeId, toggleFav]
  );

  /* ----- loading / auth / error / empty states ----- */

  if (userLoading || workspacesLoading || !workspaces) {
    if (!userLoading && !workspacesLoading && workspacesError) {
      return (
        <div className={`flex h-screen w-screen overflow-hidden bg-white ${theme === "dark" ? "dark" : ""}`}>
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-6 text-center">
            <h1 className="text-[19px] font-semibold text-ink dark:text-white">
              Unable to load your workspaces.
            </h1>
            <p className="mt-1.5 max-w-[320px] text-[13.5px] text-ink-soft dark:text-[#A1A1AA]">
              Check your connection or permissions, then try again.
            </p>
            <button
              onClick={() => void refetchWorkspaces()}
              className="mt-5 rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-black dark:bg-white dark:text-ink dark:hover:bg-white/85"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
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
            <p className="sr-only" role="status">Loading workspace…</p>
          </div>
        </div>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className={`flex h-screen w-screen overflow-hidden bg-white ${theme === "dark" ? "dark" : ""}`}>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink dark:text-white">
            Create your first workspace.
          </h1>
          <p className="mt-1.5 max-w-[340px] text-[13.5px] leading-relaxed text-ink-soft dark:text-[#A1A1AA]">
            Workspaces hold your projects and pages. Give yours a name to get started.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (workspaceDraft.trim()) void handleCreateWorkspace(workspaceDraft.trim());
            }}
            className="mt-5 flex w-full max-w-[340px] items-center gap-2"
          >
            <input
              value={workspaceDraft}
              onChange={(e) => setWorkspaceDraft(e.target.value)}
              placeholder="Workspace name…"
              aria-label="Workspace name"
              className="h-10 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-[13.5px] text-ink outline-none placeholder:text-faint focus:border-ink/30 dark:border-[#272727] dark:bg-transparent dark:text-white"
            />
            <button
              type="submit"
              disabled={!workspaceDraft.trim() || createWorkspace.isPending}
              className="h-10 shrink-0 rounded-full bg-ink px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-black disabled:opacity-40 dark:bg-white dark:text-ink dark:hover:bg-white/85"
            >
              {createWorkspace.isPending ? "Creating…" : "Create"}
            </button>
          </form>
          {actionError ? (
            <div className="mt-4 flex max-w-[340px] items-center gap-3 rounded-lg border border-rosy/30 bg-rosy/10 px-3 py-2 text-left text-[13px]">
              <span className="min-w-0 flex-1">{actionError.message}</span>
              <button onClick={actionError.retry} className="shrink-0 font-semibold underline underline-offset-2">
                Retry
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className={`flex h-screen w-screen overflow-hidden bg-white ${theme === "dark" ? "dark" : ""}`}>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-[13.5px] text-ink-soft dark:text-[#A1A1AA]" role="status">
            Preparing your workspace…
          </p>
        </div>
      </div>
    );
  }

  const sidebarWorkspaces = workspaces.map((w) => ({ id: w.id, name: w.name }));
  const sidebarProjects = (projects ?? []).map((proj) => ({ id: proj.id, name: proj.name }));

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
          workspaces={sidebarWorkspaces}
          workspaceId={workspaceId}
          workspacesLoading={false}
          displayName={user?.username ?? null}
          pages={pages}
          pagesLoading={treeLoading}
          pagesError={treeError}
          projects={sidebarProjects}
          projectsLoading={projectsLoading}
          activeProjectId={activeProjectId}
          activeId={trashOpen ? null : activeId}
          recentIds={recentIds}
          trashCount={trash.length}
          collapsed={collapsed}
          mobileOpen={mobileNav}
          theme={theme}
          moveTargets={moveTargets}
          onSwitchWorkspace={switchWorkspace}
          onCreateWorkspace={(name) => void handleCreateWorkspace(name)}
          onSelect={select}
          onNewPage={(parentId) => void newPage(parentId ?? null)}
          onToggleFav={(id) => void toggleFav(id)}
          onRename={(id, title) => void rename(id, title)}
          onDuplicate={(id) => void duplicate(id)}
          onDelete={(id) => void remove(id)}
          onCopyLink={copyLink}
          onMoveTo={(pageId, parentId) => void moveTo(pageId, parentId)}
          onMove={(dragId, targetId, pos) => void move(dragId, targetId, pos)}
          onRetryPages={() => void refetchTree()}
          onSelectProject={selectProject}
          onNewProject={() => void handleNewProject()}
          onRenameProject={(id, name) => void handleRenameProject(id, name)}
          onDeleteProject={(id) => void handleDeleteProject(id)}
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
          {actionError ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-rosy/30 bg-rosy/10 px-4 py-2 text-[13px]">
              <span className="min-w-0 flex-1 truncate">{actionError.message}</span>
              <span className="flex shrink-0 items-center gap-2">
                <button
                  onClick={actionError.retry}
                  className="rounded-md bg-ink px-3 py-1 font-semibold text-white dark:bg-white dark:text-ink"
                >
                  Retry
                </button>
                <button
                  onClick={() => setActionError(null)}
                  aria-label="Dismiss error"
                  className="rounded-md px-2 py-1 text-ink-soft hover:bg-rosy/10 dark:text-[#A1A1AA]"
                >
                  Dismiss
                </button>
              </span>
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-x-clip overflow-y-auto bg-white dark:bg-[#111111]">
              {trashOpen ? (
                <TrashView
                  trash={trash}
                  onRestore={(id) => void restore(id)}
                  onDeleteForever={(id) => void deleteForever(id)}
                  onEmpty={() => void emptyTrash()}
                />
              ) : activeId ? (
                <PageView
                  key={activeId}
                  pageId={activeId}
                  propsOpen={propsOpen}
                  onToggleProps={() => setPropsOpen((v) => !v)}
                  onOpenSidebar={() => setMobileNav(true)}
                />
              ) : (
                <EmptyPage
                  title={treeLoading ? "Loading pages…" : "Nothing here yet."}
                  hint={
                    treeLoading
                      ? "Fetching your pages from the workspace."
                      : "Choose a page from the sidebar, or create your first page and start building."
                  }
                  actionLabel={treeLoading ? undefined : "Create your first page"}
                  onAction={treeLoading ? undefined : () => void newPage(null)}
                />
              )}
            </main>

            <PageProperties
              open={propsOpen}
              page={trashOpen ? null : (propsPage ?? active)}
              parentTitle={parentTitle}
              activity={[]}
              ownerName={user?.username ?? undefined}
              onToggleFav={() => activeId && void toggleFav(activeId)}
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
