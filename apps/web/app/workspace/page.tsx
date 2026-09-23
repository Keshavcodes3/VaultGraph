"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  Settings,
  Trash2,
  Inbox,
  Menu,
  X,
  MoreHorizontal,
  ArrowLeft,
  Sparkles,
  Command,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  MessageSquare,
  Copy,
  Trash,
  ArrowUp,
  ArrowDown,
  Type,
  CornerDownLeft,
} from "lucide-react" // standard clean icons;

// ==========================================
// 1. TYPES & DATA MODEL (Backend-ready)
// ==========================================

export type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "number"
  | "quote"
  | "divider"
  | "code"
  | "checkbox"
  | "callout";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
}

export interface PageItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  blocks: Block[];
  children?: PageItem[];
  updatedAt: string;
}

// Initial Mock Data
const INITIAL_PAGES: PageItem[] = [
  {
    id: "projects",
    title: "Projects",
    description: "Active engineering & design initiatives",
    icon: "📁",
    parentId: null,
    updatedAt: "2m ago",
    blocks: [],
    children: [
      {
        id: "vaultgraph-arch",
        title: "VaultGraph",
        description: "Architecture & technical specifications for VaultGraph",
        icon: "⚡",
        parentId: "projects",
        updatedAt: "10m ago",
        blocks: [
          {
            id: "b1",
            type: "h1",
            content: "VaultGraph Core Architecture",
          },
          {
            id: "b2",
            type: "paragraph",
            content:
              "VaultGraph is designed as a calm, block-based workspace for personal and team knowledge graphs.",
          },
          {
            id: "b3",
            type: "callout",
            content:
              "💡 Key Principle: The workspace remains a pristine writing environment first. AI acts as a subtle context engine.",
          },
          {
            id: "b4",
            type: "h2",
            content: "System Design Goals",
          },
          {
            id: "b5",
            type: "bullet",
            content: "Ultra-fast local block operations with optimistic rendering",
          },
          {
            id: "b6",
            type: "bullet",
            content: "Nested markdown-compatible document structures",
          },
          {
            id: "b7",
            type: "checkbox",
            content: "Implement Command Palette (⌘K) search filter",
            checked: true,
          },
          {
            id: "b8",
            type: "checkbox",
            content: "Refine slash command keyboard navigation",
            checked: false,
          },
        ],
        children: [
          {
            id: "ideas",
            title: "Ideas & Explorations",
            description: "Brainstorming future workspace features",
            icon: "💡",
            parentId: "vaultgraph-arch",
            updatedAt: "1d ago",
            blocks: [
              {
                id: "bi1",
                type: "paragraph",
                content: "Exploring bi-directional linking and interactive graph visualization.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "research",
    title: "Research",
    description: "Deep dives on databases & distributed systems",
    icon: "🔬",
    parentId: null,
    updatedAt: "3d ago",
    blocks: [
      {
        id: "r1",
        type: "h1",
        content: "Distributed Vector Stores",
      },
      {
        id: "r2",
        type: "quote",
        content:
          "“Simplicity is prerequisite for reliability.” — Edsger W. Dijkstra",
      },
    ],
  },
];

// ==========================================
// 2. VAULTGRAPH MASCOT COMPONENT
// ==========================================

function VaultMascot({ celebratory = false }: { celebratory?: boolean }) {
  return (
    <motion.div
      className="relative flex items-center justify-center w-16 h-16"
      animate={
        celebratory
          ? { y: [0, -12, 0, -6, 0], scale: [1, 1.1, 1] }
          : { y: [0, -3, 0] }
      }
      transition={
        celebratory
          ? { duration: 0.6, ease: "easeOut" }
          : { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <svg
        width="56"
        height="56"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        {/* Soft Gem/Vault Body */}
        <rect
          x="12"
          y="12"
          width="40"
          height="40"
          rx="12"
          fill="#111116"
          stroke="#2E2E38"
          strokeWidth="2"
        />
        {/* Inner Graphic Lines */}
        <path
          d="M20 22L32 16L44 22V42L32 48L20 42V22Z"
          stroke="#40404F"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Animated Eyes */}
        <motion.circle
          cx="26"
          cy="30"
          r="2.5"
          fill="#FFFFFF"
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}
        />
        <motion.circle
          cx="38"
          cy="30"
          r="2.5"
          fill="#FFFFFF"
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}
        />
        {/* Minimal Mouth */}
        <path
          d="M30 36C30.5 37 31.2 37.5 32 37.5C32.8 37.5 33.5 37 34 36"
          stroke="#8E8E9A"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

// ==========================================
// 3. MAIN WORKSPACE PAGE CONTAINER
// ==========================================

export default function WorkspacePage() {
  const [pages, setPages] = useState<PageItem[]>(INITIAL_PAGES);
  const [activePageId, setActivePageId] = useState<string | null>(
    "vaultgraph-arch"
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Keyboard shortcut for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Find recursive helper
  const findPage = (tree: PageItem[], id: string): PageItem | null => {
    for (const page of tree) {
      if (page.id === id) return page;
      if (page.children) {
        const found = findPage(page.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const activePage = activePageId ? findPage(pages, activePageId) : null;

  // Create page action
  const handleCreatePage = (parentId: string | null = null) => {
    const newPage: PageItem = {
      id: `page-${Date.now()}`,
      title: "",
      description: "",
      parentId,
      updatedAt: "Just now",
      blocks: [
        {
          id: `block-${Date.now()}`,
          type: "paragraph",
          content: "",
        },
      ],
      children: [],
    };

    if (pages.length === 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }

    if (!parentId) {
      setPages((prev) => [...prev, newPage]);
    } else {
      const addChild = (items: PageItem[]): PageItem[] => {
        return items.map((item) => {
          if (item.id === parentId) {
            return {
              ...item,
              children: [...(item.children || []), newPage],
            };
          }
          if (item.children) {
            return { ...item, children: addChild(item.children) };
          }
          return item;
        });
      };
      setPages(addChild(pages));
    }

    setActivePageId(newPage.id);
    setIsMobileOpen(false);
  };

  // Update Page details
  const handleUpdatePage = (
    id: string,
    data: Partial<Pick<PageItem, "title" | "description" | "blocks">>
  ) => {
    const updateRecursive = (items: PageItem[]): PageItem[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, ...data, updatedAt: "Just now" };
        }
        if (item.children) {
          return { ...item, children: updateRecursive(item.children) };
        }
        return item;
      });
    };
    setPages(updateRecursive(pages));
  };

  // Delete Page action
  const handleDeletePage = (id: string) => {
    const deleteRecursive = (items: PageItem[]): PageItem[] => {
      return items
        .filter((item) => item.id !== id)
        .map((item) => ({
          ...item,
          children: item.children ? deleteRecursive(item.children) : [],
        }));
    };
    setPages(deleteRecursive(pages));
    if (activePageId === id) {
      setActivePageId(pages[0]?.id || null);
    }
  };

  // Build breadcrumbs path
  const getBreadcrumbs = (
    tree: PageItem[],
    targetId: string,
    path: { id: string; title: string }[] = []
  ): { id: string; title: string }[] | null => {
    for (const page of tree) {
      const currentPath = [...path, { id: page.id, title: page.title || "Untitled" }];
      if (page.id === targetId) return currentPath;
      if (page.children) {
        const result = getBreadcrumbs(page.children, targetId, currentPath);
        if (result) return result;
      }
    }
    return null;
  };

  const breadcrumbs = activePageId
    ? getBreadcrumbs(pages, activePageId) || []
    : [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAFAFA] text-[#111116] font-sans antialiased selection:bg-neutral-200">
      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <SearchModal
            pages={pages}
            onSelect={(id) => {
              setActivePageId(id);
              setIsSearchOpen(false);
            }}
            onClose={() => setIsSearchOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-neutral-200/80 bg-[#F7F7F8] transition-all duration-200 ease-in-out ${
          isSidebarOpen ? "w-[250px]" : "w-0 overflow-hidden"
        }`}
      >
        <SidebarContent
          pages={pages}
          activePageId={activePageId}
          onSelectPage={setActivePageId}
          onCreatePage={handleCreatePage}
          onDeletePage={handleDeletePage}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-[280px] h-full bg-[#F7F7F8] border-r border-neutral-200 z-10"
            >
              <SidebarContent
                pages={pages}
                activePageId={activePageId}
                onSelectPage={(id) => {
                  setActivePageId(id);
                  setIsMobileOpen(false);
                }}
                onCreatePage={handleCreatePage}
                onDeletePage={handleDeletePage}
                onOpenSearch={() => {
                  setIsMobileOpen(false);
                  setIsSearchOpen(true);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Workspace Area */}
      <main className="flex flex-1 flex-col h-full min-w-0 bg-[#FAFAFA] overflow-hidden">
        {/* Top Minimal Navigation Bar */}
        <header className="flex h-11 items-center justify-between border-b border-neutral-200/60 px-4 select-none">
          <div className="flex items-center gap-2 text-xs text-neutral-500 min-w-0">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-1 hover:bg-neutral-200/60 rounded text-neutral-600"
              title="Open Navigation"
            >
              <Menu size={15} />
            </button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex p-1 hover:bg-neutral-200/60 rounded text-neutral-500 hover:text-neutral-800 transition-colors"
              title="Toggle Sidebar"
            >
              <ArrowLeft
                size={14}
                className={`transform transition-transform ${
                  isSidebarOpen ? "" : "rotate-180"
                }`}
              />
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 overflow-hidden truncate">
              <span className="font-medium text-neutral-700">Personal</span>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id}>
                  <ChevronRight size={12} className="text-neutral-400 shrink-0" />
                  <button
                    onClick={() => setActivePageId(crumb.id)}
                    className={`truncate hover:text-neutral-900 transition-colors ${
                      idx === breadcrumbs.length - 1
                        ? "text-neutral-800 font-medium"
                        : "text-neutral-500"
                    }`}
                  >
                    {crumb.title}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-neutral-500 hover:bg-neutral-200/60 transition-colors"
            >
              <Search size={13} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline font-sans text-[10px] text-neutral-400 bg-neutral-100 border border-neutral-200 px-1 rounded">
                ⌘K
              </kbd>
            </button>
            <button className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded transition-colors">
              <MoreHorizontal size={15} />
            </button>
          </div>
        </header>

        {/* Editor Body or Empty Workspace State */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth">
          {showCelebration && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
              <VaultMascot celebratory />
            </div>
          )}

          {activePage ? (
            <Editor
              key={activePage.id}
              page={activePage}
              onUpdatePage={(data) => handleUpdatePage(activePage.id, data)}
            />
          ) : (
            <EmptyWorkspace onCreatePage={() => handleCreatePage(null)} />
          )}
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 4. SIDEBAR CONTENT COMPONENT
// ==========================================

function SidebarContent({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onOpenSearch,
}: {
  pages: PageItem[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  onCreatePage: (parentId?: string | null) => void;
  onDeletePage: (id: string) => void;
  onOpenSearch: () => void;
}) {
  return (
    <div className="flex flex-col h-full text-xs text-[#111116] select-none">
      {/* Workspace Selector */}
      <div className="p-3 pb-2 flex items-center justify-between border-b border-neutral-200/40">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#111116] text-white flex items-center justify-center font-bold text-[10px]">
            V
          </div>
          <span className="font-semibold text-neutral-900 tracking-tight text-sm">
            VaultGraph
          </span>
        </div>
        <span className="text-[11px] text-neutral-400 bg-neutral-200/50 px-1.5 py-0.5 rounded">
          Personal ˅
        </span>
      </div>

      {/* Main Navigation Actions */}
      <div className="p-2 space-y-0.5">
        <button
          onClick={() => onCreatePage(null)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-neutral-700 hover:bg-neutral-200/60 transition-colors font-medium"
        >
          <Plus size={14} className="text-neutral-500" />
          <span>New page</span>
        </button>

        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-200/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-neutral-400" />
            <span>Search</span>
          </div>
          <kbd className="text-[10px] text-neutral-400">⌘K</kbd>
        </button>

        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-200/60 transition-colors">
          <Inbox size={14} className="text-neutral-400" />
          <span>Inbox</span>
        </button>
      </div>

      {/* Pages Label */}
      <div className="px-3 pt-3 pb-1 text-[10px] font-medium tracking-wider text-neutral-400 uppercase">
        Pages
      </div>

      {/* Page Tree */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {pages.map((page) => (
          <PageTreeItem
            key={page.id}
            page={page}
            activePageId={activePageId}
            onSelectPage={onSelectPage}
            onCreateChild={(parentId) => onCreatePage(parentId)}
            onDeletePage={onDeletePage}
          />
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-neutral-200/60 space-y-0.5">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-200/60 transition-colors">
          <Settings size={14} className="text-neutral-400" />
          <span>Settings</span>
        </button>
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-200/60 transition-colors">
          <Trash2 size={14} className="text-neutral-400" />
          <span>Trash</span>
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 5. RECURSIVE PAGE TREE ITEM
// ==========================================

function PageTreeItem({
  page,
  activePageId,
  onSelectPage,
  onCreateChild,
  onDeletePage,
}: {
  page: PageItem;
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  onCreateChild: (parentId: string) => void;
  onDeletePage: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const isActive = page.id === activePageId;
  const hasChildren = page.children && page.children.length > 0;

  return (
    <div>
      <div
        className={`group relative flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors text-xs ${
          isActive
            ? "bg-neutral-200/80 text-neutral-900 font-medium"
            : "text-neutral-600 hover:bg-neutral-200/50 hover:text-neutral-900"
        }`}
        onClick={() => onSelectPage(page.id)}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`p-0.5 rounded hover:bg-neutral-300/50 text-neutral-400 ${
              hasChildren ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          <span className="text-xs shrink-0">{page.icon || "📄"}</span>
          <span className="truncate">{page.title || "Untitled"}</span>
        </div>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateChild(page.id);
              setIsOpen(true);
            }}
            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-300/50 rounded"
            title="Add subpage"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeletePage(page.id);
            }}
            className="p-1 text-neutral-400 hover:text-red-600 hover:bg-neutral-300/50 rounded"
            title="Delete page"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Nested Children Tree */}
      {isOpen && hasChildren && (
        <div className="ml-3 pl-1.5 border-l border-neutral-200/80 space-y-0.5 mt-0.5">
          {page.children!.map((child) => (
            <PageTreeItem
              key={child.id}
              page={child}
              activePageId={activePageId}
              onSelectPage={onSelectPage}
              onCreateChild={onCreateChild}
              onDeletePage={onDeletePage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 6. BLOCK EDITOR COMPONENT
// ==========================================

function Editor({
  page,
  onUpdatePage,
}: {
  page: PageItem;
  onUpdatePage: (data: Partial<Pick<PageItem, "title" | "description" | "blocks">>) => void;
}) {
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ x: number; y: number } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Handle Text Selection for Contextual AI
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(selection.toString().trim());
        setSelectionRange({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
      } else {
        setSelectedText("");
        setSelectionRange(null);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  // Update Page Title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdatePage({ title: e.target.value });
  };

  // Update Page Description
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdatePage({ description: e.target.value });
  };

  // Block Mutations
  const handleBlockChange = (blockId: string, content: string, checked?: boolean) => {
    const updated = page.blocks.map((b) =>
      b.id === blockId ? { ...b, content, checked: checked ?? b.checked } : b
    );
    onUpdatePage({ blocks: updated });
  };

  const handleAddBlockAfter = (blockId: string, type: BlockType = "paragraph") => {
    const index = page.blocks.findIndex((b) => b.id === blockId);
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: "",
    };
    const updated = [...page.blocks];
    updated.splice(index + 1, 0, newBlock);
    onUpdatePage({ blocks: updated });
  };

  const handleDeleteBlock = (blockId: string) => {
    if (page.blocks.length <= 1) return;
    const updated = page.blocks.filter((b) => b.id !== blockId);
    onUpdatePage({ blocks: updated });
  };

  const handleMoveBlock = (blockId: string, direction: "up" | "down") => {
    const index = page.blocks.findIndex((b) => b.id === blockId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === page.blocks.length - 1)
    )
      return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...page.blocks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onUpdatePage({ blocks: updated });
  };

  const handleDuplicateBlock = (blockId: string) => {
    const index = page.blocks.findIndex((b) => b.id === blockId);
    const original = page.blocks[index];
    const duplicated: Block = {
      ...original,
      id: `block-${Date.now()}`,
    };
    const updated = [...page.blocks];
    updated.splice(index + 1, 0, duplicated);
    onUpdatePage({ blocks: updated });
  };

  const handleChangeBlockType = (blockId: string, newType: BlockType) => {
    const updated = page.blocks.map((b) =>
      b.id === blockId ? { ...b, type: newType } : b
    );
    onUpdatePage({ blocks: updated });
  };

  // Contextual AI execution mock
  const handleAiAction = (action: string) => {
    setAiLoading(true);
    setTimeout(() => {
      const activeBlock = page.blocks[0];
      if (activeBlock) {
        handleBlockChange(
          activeBlock.id,
          `${activeBlock.content}\n\n✨ AI [${action}]: ${selectedText}`
        );
      }
      setAiLoading(false);
      setSelectedText("");
      setSelectionRange(null);
    }, 800);
  };

  return (
    <div className="relative py-12 px-6 sm:px-12 flex justify-center min-h-full">
      {/* Floating Contextual AI Bar */}
      <AnimatePresence>
        {selectionRange && selectedText && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            style={{
              position: "fixed",
              left: `${selectionRange.x}px`,
              top: `${selectionRange.y}px`,
              transform: "translate(-50%, -100%)",
            }}
            className="z-50 flex items-center gap-1 p-1 bg-[#111116] text-white rounded-lg shadow-xl text-xs border border-neutral-800"
          >
            <span className="flex items-center gap-1 px-2 py-1 font-medium text-neutral-300">
              <Sparkles size={12} className="text-amber-400" /> Ask VaultGraph:
            </span>
            <button
              onClick={() => handleAiAction("Summarize")}
              className="px-2 py-1 hover:bg-neutral-800 rounded transition-colors text-neutral-200"
            >
              Summarize
            </button>
            <button
              onClick={() => handleAiAction("Explain")}
              className="px-2 py-1 hover:bg-neutral-800 rounded transition-colors text-neutral-200"
            >
              Explain
            </button>
            <button
              onClick={() => handleAiAction("Improve writing")}
              className="px-2 py-1 hover:bg-neutral-800 rounded transition-colors text-neutral-200"
            >
              Improve writing
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Focused Content Area (680px - 760px width) */}
      <div className="w-full max-w-[720px] space-y-6">
        {/* Title & Description Header */}
        <div className="space-y-2">
          <input
            type="text"
            value={page.title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="w-full text-3xl sm:text-4xl font-bold tracking-tight text-[#111116] bg-transparent outline-none placeholder:text-neutral-300 border-none p-0 focus:ring-0"
          />
          <input
            type="text"
            value={page.description || ""}
            onChange={handleDescriptionChange}
            placeholder="Add a description..."
            className="w-full text-sm text-neutral-500 bg-transparent outline-none placeholder:text-neutral-300 border-none p-0 focus:ring-0"
          />
        </div>

        {/* Blocks List */}
        <div className="space-y-1 pt-2">
          {page.blocks.map((block) => (
            <EditorBlockItem
              key={block.id}
              block={block}
              onChange={(content, checked) => handleBlockChange(block.id, content, checked)}
              onAddAfter={(type) => handleAddBlockAfter(block.id, type)}
              onDelete={() => handleDeleteBlock(block.id)}
              onMove={(dir) => handleMoveBlock(block.id, dir)}
              onDuplicate={() => handleDuplicateBlock(block.id)}
              onChangeType={(type) => handleChangeBlockType(block.id, type)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. INDIVIDUAL EDITOR BLOCK & CONTROLS
// ==========================================

function EditorBlockItem({
  block,
  onChange,
  onAddAfter,
  onDelete,
  onMove,
  onDuplicate,
  onChangeType,
}: {
  block: Block;
  onChange: (content: string, checked?: boolean) => void;
  onAddAfter: (type?: BlockType) => void;
  onDelete: () => void;
  onMove: (dir: "up" | "down") => void;
  onDuplicate: () => void;
  onChangeType: (type: BlockType) => void;
}) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle Input Changes & Slash Trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    if (val.startsWith("/")) {
      setShowSlashMenu(true);
      setSlashFilter(val.slice(1));
    } else {
      setShowSlashMenu(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !showSlashMenu) {
      e.preventDefault();
      onAddAfter();
    } else if (e.key === "Backspace" && block.content === "") {
      e.preventDefault();
      onDelete();
    } else if (e.key === "Escape") {
      setShowSlashMenu(false);
    }
  };

  const selectSlashCommand = (type: BlockType) => {
    onChange("");
    onChangeType(type);
    setShowSlashMenu(false);
  };

  return (
    <div className="group relative flex items-start -ml-8 pl-8 py-0.5 rounded transition-colors">
      {/* Left Hover Handle (⋮⋮) */}
      <div className="absolute left-1 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
        <button
          onClick={() => setShowBlockMenu(!showBlockMenu)}
          className="p-0.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded"
        >
          <MoreHorizontal size={14} />
        </button>

        {/* Block Menu Dropdown */}
        {showBlockMenu && (
          <div className="absolute left-6 top-0 z-40 w-40 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 text-xs text-neutral-700">
            <button
              onClick={() => {
                onDuplicate();
                setShowBlockMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100"
            >
              <Copy size={12} /> Duplicate
            </button>
            <button
              onClick={() => {
                onMove("up");
                setShowBlockMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100"
            >
              <ArrowUp size={12} /> Move up
            </button>
            <button
              onClick={() => {
                onMove("down");
                setShowBlockMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100"
            >
              <ArrowDown size={12} /> Move down
            </button>
            <div className="my-1 border-t border-neutral-100" />
            <button
              onClick={() => {
                onDelete();
                setShowBlockMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-600"
            >
              <Trash size={12} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Render Block by Type */}
      <div className="w-full min-w-0">
        {block.type === "h1" && (
          <input
            type="text"
            value={block.content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Heading 1"
            className="w-full text-2xl font-bold tracking-tight text-[#111116] bg-transparent outline-none border-none p-0 focus:ring-0 placeholder:text-neutral-300"
          />
        )}

        {block.type === "h2" && (
          <input
            type="text"
            value={block.content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Heading 2"
            className="w-full text-xl font-semibold tracking-tight text-[#111116] bg-transparent outline-none border-none p-0 focus:ring-0 placeholder:text-neutral-300"
          />
        )}

        {block.type === "h3" && (
          <input
            type="text"
            value={block.content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Heading 3"
            className="w-full text-lg font-semibold text-[#111116] bg-transparent outline-none border-none p-0 focus:ring-0 placeholder:text-neutral-300"
          />
        )}

        {block.type === "bullet" && (
          <div className="flex items-start gap-2">
            <span className="text-neutral-400 select-none mt-1.5">•</span>
            <input
              type="text"
              value={block.content}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="List item"
              className="w-full text-sm text-[#111116] bg-transparent outline-none border-none p-0 focus:ring-0 placeholder:text-neutral-300"
            />
          </div>
        )}

        {block.type === "checkbox" && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={block.checked || false}
              onChange={(e) => onChange(block.content, e.target.checked)}
              className="rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
            />
            <input
              type="text"
              value={block.content}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="To-do item"
              className={`w-full text-sm bg-transparent outline-none border-none p-0 focus:ring-0 placeholder:text-neutral-300 ${
                block.checked ? "line-through text-neutral-400" : "text-[#111116]"
              }`}
            />
          </div>
        )}

        {block.type === "quote" && (
          <div className="border-l-2 border-neutral-900 pl-3 py-1 my-1">
            <input
              type="text"
              value={block.content}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Empty quote"
              className="w-full text-sm italic text-neutral-700 bg-transparent outline-none border-none p-0 focus:ring-0 placeholder:text-neutral-300"
            />
          </div>
        )}

        {block.type === "callout" && (
          <div className="p-3 bg-neutral-100/80 rounded-lg border border-neutral-200/60 my-1 text-sm text-neutral-800">
            <input
              type="text"
              value={block.content}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Callout note..."
              className="w-full bg-transparent outline-none border-none p-0 focus:ring-0 placeholder:text-neutral-400"
            />
          </div>
        )}

        {block.type === "code" && (
          <div className="p-3 bg-[#111116] text-neutral-200 rounded-lg font-mono text-xs my-1">
            <textarea
              rows={2}
              value={block.content}
              onChange={(e) => onChange(e.target.value)}
              placeholder="// Type code here..."
              className="w-full bg-transparent outline-none border-none p-0 focus:ring-0 resize-none placeholder:text-neutral-600"
            />
          </div>
        )}

        {block.type === "divider" && (
          <div className="py-2">
            <hr className="border-neutral-200" />
          </div>
        )}

        {block.type === "paragraph" && (
          <textarea
            ref={inputRef}
            rows={1}
            value={block.content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Start writing... or type '/' for commands"
            className="w-full text-sm text-[#111116] leading-relaxed bg-transparent outline-none border-none p-0 focus:ring-0 resize-none placeholder:text-neutral-300"
          />
        )}
      </div>

      {/* Slash Command Floating Menu */}
      {showSlashMenu && (
        <SlashCommandMenu
          filter={slashFilter}
          onSelect={selectSlashCommand}
          onClose={() => setShowSlashMenu(false)}
        />
      )}
    </div>
  );
}

// ==========================================
// 8. SLASH COMMAND MENU COMPONENT
// ==========================================

function SlashCommandMenu({
  filter,
  onSelect,
  onClose,
}: {
  filter: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}) {
  const items: { type: BlockType; label: string; icon: React.ReactNode }[] = [
    { type: "paragraph", label: "Text", icon: <Type size={14} /> },
    { type: "h1", label: "Heading 1", icon: <Heading1 size={14} /> },
    { type: "h2", label: "Heading 2", icon: <Heading2 size={14} /> },
    { type: "h3", label: "Heading 3", icon: <Heading3 size={14} /> },
    { type: "bullet", label: "Bullet List", icon: <List size={14} /> },
    { type: "checkbox", label: "Checklist", icon: <CheckSquare size={14} /> },
    { type: "quote", label: "Quote", icon: <Quote size={14} /> },
    { type: "code", label: "Code", icon: <Code size={14} /> },
    { type: "divider", label: "Divider", icon: <Minus size={14} /> },
  ];

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="absolute left-8 top-8 z-50 w-56 bg-white border border-neutral-200 rounded-xl shadow-xl p-1 text-xs">
      <div className="px-2 py-1 text-[10px] text-neutral-400 font-medium border-b border-neutral-100">
        Filter blocks...
      </div>
      <div className="max-h-48 overflow-y-auto py-1 space-y-0.5">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <button
              key={item.type}
              onClick={() => onSelect(item.type)}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-neutral-700 hover:bg-neutral-100 transition-colors text-left"
            >
              <span className="text-neutral-500">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))
        ) : (
          <div className="px-2 py-2 text-neutral-400 text-center">No blocks found</div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 9. SEARCH PALETTE MODAL (⌘K)
// ==========================================

function SearchModal({
  pages,
  onSelect,
  onClose,
}: {
  pages: PageItem[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const flattenPages = (items: PageItem[]): PageItem[] => {
    let list: PageItem[] = [];
    for (const item of items) {
      list.push(item);
      if (item.children) {
        list = [...list, ...flattenPages(item.children)];
      }
    }
    return list;
  };

  const allPages = flattenPages(pages);
  const results = allPages.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.description?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-xs" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-lg bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden z-10"
      >
        <div className="flex items-center gap-2 px-4 border-b border-neutral-200/80 py-3">
          <Search size={16} className="text-neutral-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your workspace..."
            className="w-full text-sm bg-transparent outline-none border-none p-0 focus:ring-0 placeholder:text-neutral-400"
          />
          <kbd className="text-[10px] text-neutral-400 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {results.length > 0 ? (
            results.map((page) => (
              <button
                key={page.id}
                onClick={() => onSelect(page.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-100 text-left transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">{page.icon || "📄"}</span>
                  <div>
                    <div className="text-xs font-medium text-neutral-800">
                      {page.title || "Untitled"}
                    </div>
                    {page.description && (
                      <div className="text-[11px] text-neutral-400 truncate">
                        {page.description}
                      </div>
                    )}
                  </div>
                </div>
                <CornerDownLeft size={12} className="text-neutral-300" />
              </button>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-neutral-400">
              No matching pages found
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 10. EMPTY WORKSPACE STATE COMPONENT
// ==========================================

function EmptyWorkspace({ onCreatePage }: { onCreatePage: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <VaultMascot />
      <h3 className="mt-4 text-base font-semibold text-neutral-800">
        Your workspace is empty
      </h3>
      <p className="mt-1 text-xs text-neutral-500 max-w-xs leading-relaxed">
        Create your first page and start building your knowledge corner.
      </p>
      <button
        onClick={onCreatePage}
        className="mt-5 flex items-center gap-2 px-3 py-2 bg-[#111116] text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
      >
        <Plus size={14} />
        New page
      </button>
    </div>
  );
}
