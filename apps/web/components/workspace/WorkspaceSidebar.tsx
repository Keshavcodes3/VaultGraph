"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronsLeft,
  Clock3,
  FilePlus2,
  FolderKanban,
  Inbox,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import AskKira from "./AskKira";
import SidebarTree from "./SidebarTree";
import type { MoveTarget } from "./SidebarItem";
import Tooltip from "./Tooltip";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import { PageIcon } from "./PageIcon";
import { findPage, type PageItem } from "./data";

export interface SidebarWorkspace {
  id: string;
  name: string;
}

export interface SidebarProject {
  id: string;
  name: string;
}

interface SidebarProps {
  workspaces: SidebarWorkspace[];
  workspaceId: string | null;
  workspacesLoading: boolean;
  displayName: string | null;
  pages: PageItem[];
  pagesLoading: boolean;
  pagesError: boolean;
  projects: SidebarProject[];
  projectsLoading: boolean;
  activeProjectId: string | null;
  activeId: string | null;
  recentIds: string[];
  trashCount: number;
  collapsed: boolean;
  mobileOpen: boolean;
  theme: "light" | "dark";
  moveTargets: MoveTarget[];
  deletingIds?: Set<string>;
  onSwitchWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string) => void;
  onSelect: (id: string) => void;
  onNewPage: (parentId?: string | null) => void;
  onToggleFav: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCopyLink: (id: string) => void;
  onMoveTo: (pageId: string, parentId: string | null) => void;
  onMove: (dragId: string, targetId: string, pos: import("./data").DropPosition) => void;
  onRetryPages: () => void;
  onSelectProject: (id: string | null) => void;
  onNewProject: () => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
  onOpenSearch: () => void;
  onCollapse: () => void;
  onCloseMobile: () => void;
  onOpenTrash: () => void;
  onToggleTheme: () => void;
}

function QuickRow({
  icon,
  label,
  kbd,
  active,
  onClick,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  kbd?: string;
  active?: boolean;
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-[6px] text-[13.5px] transition-colors duration-120 ${
        active
          ? "bg-soft font-medium text-ink dark:bg-white/10 dark:text-[#F5F5F5]"
          : "text-ink-soft hover:bg-soft hover:text-ink dark:text-[#A1A1AA] dark:hover:bg-white/5 dark:hover:text-[#F5F5F5]"
      }`}
    >
      <span className="shrink-0 text-faint">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {trailing}
      {kbd ? (
        <kbd className="rounded border border-line bg-white px-1 font-mono text-[10px] text-faint dark:border-[#272727] dark:bg-transparent">
          {kbd}
        </kbd>
      ) : null}
    </button>
  );
}

/** Inline project row: select to filter, double-click to rename, × to delete. */
function ProjectRow({
  project,
  active,
  deleting,
  onSelect,
  onRename,
  onDelete,
}: {
  project: SidebarProject;
  active: boolean;
  deleting?: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(project.name);
  return (
    <div
      className={`group flex w-full items-center gap-2 rounded-md px-2 py-[6px] text-[13.5px] transition-colors duration-120 ${
        active
          ? "bg-soft font-medium text-ink dark:bg-white/10 dark:text-[#F5F5F5]"
          : "text-ink-soft hover:bg-soft hover:text-ink dark:text-[#A1A1AA] dark:hover:bg-white/5 dark:hover:text-[#F5F5F5]"
      }`}
    >
      <span className="shrink-0 text-faint">
        <FolderKanban size={15} />
      </span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            const name = draft.trim();
            if (name && name !== project.name) onRename(name);
            else setDraft(project.name);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setDraft(project.name);
              setEditing(false);
            }
          }}
          aria-label="Project name"
          className="min-w-0 flex-1 border-none bg-transparent p-0 text-left outline-none"
        />
      ) : (
        <button
          onClick={onSelect}
          onDoubleClick={() => {
            setDraft(project.name);
            setEditing(true);
          }}
          title="Filter pages by project (double-click to rename)"
          className="min-w-0 flex-1 truncate text-left"
        >
          {project.name || "Untitled"}
        </button>
      )}
      <button
        onClick={onDelete}
        disabled={deleting}
        aria-label={deleting ? `Deleting ${project.name || "Untitled"}` : `Delete ${project.name || "Untitled"}`}
        title={deleting ? "Deleting…" : `Delete ${project.name || "Untitled"}`}
        className="shrink-0 rounded p-0.5 text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:text-rosy focus-visible:opacity-100 disabled:opacity-100 max-md:opacity-100"
      >
        {deleting ? (
          <span
            aria-hidden
            className="block h-[13px] w-[13px] animate-spin rounded-full border-[2px] border-rosy/30 border-t-rosy"
          />
        ) : (
          <X size={13} />
        )}
      </button>
    </div>
  );
}

/** Compact, quiet navigation. 240–260px of hierarchy, nothing more. */
export default function WorkspaceSidebar(p: SidebarProps) {
  const [switcher, setSwitcher] = useState(false);
  const ws = p.workspaces.find((w) => w.id === p.workspaceId) ?? null;
  const wsName = ws?.name ?? (p.workspacesLoading ? "Loading…" : "No workspace");
  const wsInitial = (wsName.trim().charAt(0) || "V").toUpperCase();
  const favs = p.pages.filter((x) => x.favorite);
  const recent = p.recentIds
    .map((id) => findPage(p.pages, id))
    .filter((x): x is PageItem => x !== null)
    .slice(0, 5);
  const displayName = p.displayName ?? "You";
  const userInitial = (displayName.trim().charAt(0) || "Y").toUpperCase();

  const body = (
    <div className="flex h-full flex-col text-[13px]">
      {/* workspace switcher */}
      <div className="relative px-2 pt-2 pb-1">
        <button
          onClick={() => setSwitcher((v) => !v)}
          aria-expanded={switcher}
          aria-label="Switch workspace"
          className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-soft dark:hover:bg-white/5"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink text-[12px] font-bold text-white dark:bg-white dark:text-ink">
            {wsInitial}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold tracking-[-0.01em] text-ink dark:text-[#F5F5F5]">
            {wsName}
          </span>
          <ChevronDown size={14} className="shrink-0 text-faint" />
        </button>
        <WorkspaceSwitcher
          open={switcher}
          currentId={p.workspaceId}
          workspaces={p.workspaces}
          loading={p.workspacesLoading}
          onSelect={p.onSwitchWorkspace}
          onCreate={p.onCreateWorkspace}
          onClose={() => setSwitcher(false)}
        />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-2 pb-3">
        <div className="space-y-px pt-1">
          <QuickRow icon={<Search size={15} />} label="Search" kbd="⌘K" onClick={p.onOpenSearch} />
          <QuickRow icon={<Inbox size={15} />} label="Inbox" trailing={<span className="rounded-full bg-soft px-1.5 py-px font-mono text-[10px] text-faint dark:bg-white/10">3</span>} />
        </div>

        {favs.length > 0 ? (
          <div>
            <p className="px-2 pt-1 pb-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">
              Favorites
            </p>
            <div className="space-y-px">
              {favs.map((f) => (
                <QuickRow
                  key={f.id}
                  icon={<PageIcon icon={f.icon} size={15} />}
                  label={f.title || "Untitled"}
                  active={p.activeId === f.id}
                  onClick={() => p.onSelect(f.id)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {recent.length > 0 ? (
          <div>
            <p className="px-2 pt-1 pb-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">
              Recent
            </p>
            <div className="space-y-px">
              {recent.map((r) => (
                <QuickRow
                  key={r.id}
                  icon={<Clock3 size={14} />}
                  label={r.title || "Untitled"}
                  active={p.activeId === r.id}
                  onClick={() => p.onSelect(r.id)}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <div className="flex items-center justify-between px-2 pt-1 pb-1">
            <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">
              Projects
            </p>
            <button
              onClick={p.onNewProject}
              aria-label="New project"
              title="New project"
              className="rounded p-1 text-faint transition-colors hover:bg-soft hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Plus size={13} />
            </button>
          </div>
          {p.projectsLoading ? (
            <div className="space-y-1 px-1 py-1" aria-label="Loading projects">
              <div className="h-7 animate-pulse rounded-md bg-soft dark:bg-white/5" />
              <div className="h-7 animate-pulse rounded-md bg-soft dark:bg-white/5" />
            </div>
          ) : p.projects.length > 0 ? (
            <div className="space-y-px">
              <button
                onClick={() => p.onSelectProject(null)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-[6px] text-left text-[13.5px] transition-colors duration-120 ${
                  p.activeProjectId === null
                    ? "bg-soft font-medium text-ink dark:bg-white/10 dark:text-[#F5F5F5]"
                    : "text-ink-soft hover:bg-soft hover:text-ink dark:text-[#A1A1AA] dark:hover:bg-white/5 dark:hover:text-[#F5F5F5]"
                }`}
              >
                <span className="min-w-0 flex-1 truncate">All pages</span>
              </button>
              {p.projects.map((proj) => (
                <ProjectRow
                  key={proj.id}
                  project={proj}
                  active={p.activeProjectId === proj.id}
                  deleting={p.deletingIds?.has(proj.id) ?? false}
                  onSelect={() =>
                    p.onSelectProject(p.activeProjectId === proj.id ? null : proj.id)
                  }
                  onRename={(name) => p.onRenameProject(proj.id, name)}
                  onDelete={() => p.onDeleteProject(proj.id)}
                />
              ))}
            </div>
          ) : (
            <p className="px-2 py-1 text-[12.5px] text-faint">
              No projects yet. Press + to create one.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between px-2 pt-1 pb-1">
            <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">
              Private
            </p>
            <button
              onClick={() => p.onNewPage(null)}
              aria-label="New page"
              className="rounded p-1 text-faint transition-colors hover:bg-soft hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FilePlus2 size={13} />
            </button>
          </div>
          {p.pagesLoading ? (
            <div className="space-y-1 px-1 py-1" aria-label="Loading pages">
              <div className="h-7 animate-pulse rounded-md bg-soft dark:bg-white/5" />
              <div className="h-7 animate-pulse rounded-md bg-soft dark:bg-white/5" />
              <div className="h-7 animate-pulse rounded-md bg-soft dark:bg-white/5" />
            </div>
          ) : p.pagesError ? (
            <div className="px-2 py-2">
              <p className="text-[12.5px] text-ink-soft dark:text-[#A1A1AA]">
                Unable to load pages.
              </p>
              <button
                onClick={p.onRetryPages}
                className="mt-1.5 rounded-md bg-soft px-2.5 py-1.5 text-[12.5px] font-medium text-ink transition-colors hover:bg-line dark:bg-white/10 dark:text-white"
              >
                Retry
              </button>
            </div>
          ) : p.pages.length === 0 ? (
            <p className="px-2 py-1 text-[12.5px] text-faint">
              No pages yet. Create your first page below.
            </p>
          ) : (
            <SidebarTree
              pages={p.pages}
              activeId={p.activeId}
              moveTargets={p.moveTargets}
              deletingIds={p.deletingIds}
              onSelect={p.onSelect}
              onAddChild={(id) => p.onNewPage(id)}
              onFavorite={p.onToggleFav}
              onRename={p.onRename}
              onDuplicate={p.onDuplicate}
              onDelete={p.onDelete}
              onCopyLink={p.onCopyLink}
              onMoveTo={p.onMoveTo}
              onMove={p.onMove}
            />
          )}
        </div>

        <div className="space-y-px">
          <QuickRow icon={<Settings size={15} />} label="Settings" />
          <QuickRow
            icon={<Trash2 size={15} />}
            label="Trash"
            onClick={p.onOpenTrash}
            trailing={
              p.trashCount > 0 ? (
                <span className="rounded-full bg-soft px-1.5 py-px font-mono text-[10px] text-faint dark:bg-white/10">
                  {p.trashCount}
                </span>
              ) : null
            }
          />
        </div>

        <div className="pt-1">
          <AskKira />
        </div>
      </div>

      <div className="space-y-1 border-t border-line p-2 dark:border-[#272727]">
        <button
          onClick={() => p.onNewPage(null)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-ink py-[7px] text-[13px] font-semibold text-white transition-colors hover:bg-black dark:bg-white dark:text-ink dark:hover:bg-white/85"
        >
          <Plus size={14} /> New page
        </button>
        <div className="flex items-center gap-2 rounded-md px-1.5 py-1">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white dark:bg-white dark:text-ink">
            {userInitial}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-soft dark:text-[#A1A1AA]">
            {displayName}
          </span>
          <Tooltip label={p.theme === "light" ? "Dark mode" : "Light mode"}>
            <button
              onClick={p.onToggleTheme}
              aria-label="Toggle theme"
              className="rounded-md p-1.5 text-faint transition-colors hover:bg-soft hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
            >
              {p.theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </Tooltip>
          <Tooltip label="Collapse sidebar" kbd="⌘B">
            <button
              onClick={p.onCollapse}
              aria-label="Collapse sidebar"
              className="hidden rounded-md p-1.5 text-faint transition-colors hover:bg-soft hover:text-ink md:block dark:hover:bg-white/10 dark:hover:text-white"
            >
              <ChevronsLeft size={14} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden w-[248px] shrink-0 flex-col border-r border-line bg-white transition-all duration-200 dark:border-[#272727] dark:bg-[#111111] ${
          p.collapsed ? "" : "md:flex"
        }`}
      >
        <div className="h-screen overflow-hidden">{body}</div>
      </aside>
      <AnimatePresence>
        {p.mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={p.onCloseMobile}
              className="absolute inset-0 bg-ink/25"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute top-0 left-0 h-full w-[300px] border-r border-line bg-white shadow-pop dark:border-[#272727] dark:bg-[#111111]"
            >
              {body}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
