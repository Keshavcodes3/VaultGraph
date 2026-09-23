"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Braces,
  ChevronDown,
  ChevronRight,
  Code2,
  Database,
  FileText,
  Hash,
  Inbox,
  Link2,
  MoreHorizontal,
  Network,
  Plus,
  Search,
  Sparkles,
  Star,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Reveal, SectionHeading, useCalm } from "./Reveal";

type PageId =
  | "engineering"
  | "backend"
  | "database"
  | "api"
  | "research"
  | "vaultgraph";

const PAGES = [
  {
    id: "engineering" as PageId,
    label: "Engineering",
    icon: BookOpen,
  },
  {
    id: "backend" as PageId,
    label: "Backend Architecture",
    icon: FileText,
  },
  {
    id: "database" as PageId,
    label: "Databases",
    icon: Database,
  },
  {
    id: "api" as PageId,
    label: "API Design",
    icon: Braces,
  },
  {
    id: "research" as PageId,
    label: "Research Notes",
    icon: FileText,
  },
  {
    id: "vaultgraph" as PageId,
    label: "VaultGraph",
    icon: Network,
  },
];

const CONNECTIONS = [
  "Authentication",
  "JWT",
  "Sessions",
  "PostgreSQL",
  "Prisma",
  "API Design",
];

const DATABASE_ROWS = [
  {
    project: "VaultGraph",
    status: "Building",
    pages: 24,
  },
  {
    project: "API Platform",
    status: "Done",
    pages: 18,
  },
  {
    project: "Research",
    status: "Active",
    pages: 31,
  },
];

const pageTransition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1] as const,
};

export default function InteractiveEditor() {
  const calm = useCalm();

  const [activePage, setActivePage] =
    useState<PageId>("backend");

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [showCommand, setShowCommand] = useState(false);

  const [showAI, setShowAI] = useState(false);

  const [showConnections, setShowConnections] =
    useState(false);

  const [showSlash, setShowSlash] = useState(false);

  const [search, setSearch] = useState("");

  const [selectedLink, setSelectedLink] =
    useState<string | null>(null);

  useEffect(() => {
    if (calm) return;

    const sequence: PageId[] = [
      "backend",
      "api",
      "research",
      "backend",
    ];

    let index = 0;

    const timer = setInterval(() => {
      index = (index + 1) % sequence.length;
      setActivePage(sequence[index]);
    }, 4200);

    return () => clearInterval(timer);
  }, [calm]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setShowCommand(true);
      }

      if (event.key === "Escape") {
        setShowCommand(false);
        setShowAI(false);
        setShowConnections(false);
        setShowSlash(false);
        setSelectedLink(null);
      }

      if (event.key === "/") {
        setShowSlash(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openPage = (page: PageId) => {
    setActivePage(page);
    setShowCommand(false);
  };

  const filteredPages = PAGES.filter((page) =>
    page.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <section
      id="product"
      className="relative scroll-mt-[72px] py-[120px] max-md:py-[76px]"
    >
      <div className="mx-auto w-full max-w-[1180px] px-6">
        <SectionHeading
          eyebrow="Workspace"
          title={
            <>
              Knowledge shouldn&apos;t live
              <br />
              in disconnected tabs.
            </>
          }
          lede="Write, connect, organize and discover everything in one living workspace."
        />

        <Reveal>
          <div className="relative overflow-hidden rounded-[18px] border border-line bg-white shadow-pop">
            {/* Browser / app chrome */}
            <div className="flex h-[52px] items-center gap-3 border-b border-mist bg-[#fafafa] px-4">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f2b5b5]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#f1dfa8]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#a9dfbb]" />
              </div>

              <div className="mx-auto flex max-w-[360px] flex-1 items-center justify-center gap-2 rounded-lg border border-mist bg-white px-3 py-1.5 font-mono text-[11px] text-faint">
                <span className="truncate">
                  vaultgraph.app/engineering/backend
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowCommand(true)}
                className="hidden items-center gap-2 rounded-md border border-mist bg-white px-2.5 py-1.5 text-[11px] text-muted transition-colors hover:text-ink sm:flex"
              >
                <Search size={12} />

                <span>Search</span>

                <kbd className="rounded border border-mist px-1.5 py-0.5 font-mono text-[9px]">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Workspace */}
            <div className="grid min-h-[680px] grid-cols-[235px_1fr] max-[850px]:grid-cols-1">
              {/* Sidebar */}
              <aside
                className={`border-r border-mist bg-[#fafafa] px-3 py-3 max-[850px]:hidden ${
                  sidebarOpen ? "block" : "hidden"
                }`}
              >
                {/* Workspace identity */}
                <div className="mb-5 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2.5">
                    <motion.span
                      className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-ink text-xs font-bold text-white"
                      whileHover={
                        calm
                          ? undefined
                          : {
                              scale: 1.08,
                              rotate: -4,
                            }
                      }
                    >
                      V
                    </motion.span>

                    <div>
                      <p className="text-[13px] font-semibold">
                        VaultGraph
                      </p>

                      <p className="text-[10px] text-faint">
                        Engineering
                      </p>
                    </div>
                  </div>

                  <MoreHorizontal
                    size={15}
                    className="text-faint"
                  />
                </div>

                {/* Search */}
                <button
                  type="button"
                  onClick={() => setShowCommand(true)}
                  className="mb-4 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[12px] text-muted transition-colors hover:bg-white hover:text-ink"
                >
                  <Search size={14} />
                  Search
                  <span className="ml-auto font-mono text-[9px] text-faint">
                    ⌘K
                  </span>
                </button>

                {/* Main navigation */}
                <div className="space-y-0.5">
                  <SidebarItem
                    icon={Inbox}
                    label="Inbox"
                    active={false}
                  />

                  <SidebarItem
                    icon={Star}
                    label="Favorites"
                    active={false}
                  />
                </div>

                {/* Pages */}
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between px-2">
                    <span className="text-[9px] font-bold tracking-[0.12em] text-faint uppercase">
                      Workspace
                    </span>

                    <Plus
                      size={13}
                      className="text-faint"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <SidebarPage
                      label="Engineering"
                      icon={BookOpen}
                      active={activePage === "engineering"}
                      onClick={() =>
                        openPage("engineering")
                      }
                    />

                    <div className="ml-4 space-y-0.5 border-l border-mist pl-2">
                      <SidebarPage
                        label="Backend Architecture"
                        icon={FileText}
                        active={activePage === "backend"}
                        onClick={() =>
                          openPage("backend")
                        }
                      />

                      <SidebarPage
                        label="Databases"
                        icon={Database}
                        active={activePage === "database"}
                        onClick={() =>
                          openPage("database")
                        }
                      />

                      <SidebarPage
                        label="API Design"
                        icon={Braces}
                        active={activePage === "api"}
                        onClick={() => openPage("api")}
                      />

                      <SidebarPage
                        label="Research Notes"
                        icon={FileText}
                        active={activePage === "research"}
                        onClick={() =>
                          openPage("research")
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Projects */}
                <div className="mt-6">
                  <div className="mb-2 px-2 text-[9px] font-bold tracking-[0.12em] text-faint uppercase">
                    Projects
                  </div>

                  <SidebarPage
                    label="VaultGraph"
                    icon={Network}
                    active={activePage === "vaultgraph"}
                    onClick={() =>
                      openPage("vaultgraph")
                    }
                  />

                  <SidebarPage
                    label="Personal OS"
                    icon={FileText}
                    active={false}
                    onClick={() => {}}
                  />
                </div>

                {/* Bottom */}
                <div className="mt-8 border-t border-mist pt-3">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-[11px] font-medium text-muted transition-colors hover:bg-white hover:text-ink"
                  >
                    <Plus size={13} />
                    New page
                  </button>

                  <div className="mt-3 flex items-center gap-2 px-2 text-[10px] text-faint">
                    <span className="relative h-4 w-5">
                      <span className="absolute left-0 top-1 h-1.5 w-1.5 rounded-full bg-ink" />
                      <span className="absolute left-2.5 top-0 h-1.5 w-1.5 rounded-full bg-accent" />
                      <span className="absolute right-0 top-2 h-1.5 w-1.5 rounded-full bg-[#c8c8d0]" />
                    </span>

                    347 pages connected
                  </div>
                </div>
              </aside>

              {/* Editor */}
              <main className="relative min-w-0 overflow-hidden bg-white">
                {/* Top editor controls */}
                <div className="flex items-center justify-between px-7 pt-5 text-[11px] text-faint max-md:px-5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span>Engineering</span>
                    <ChevronRight size={11} />
                    <span className="truncate">
                      Backend Architecture
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setShowConnections(true)
                      }
                      className="flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-mist hover:text-ink"
                    >
                      <Network size={12} />
                      12 connections
                    </button>

                    <button
                      type="button"
                      className="rounded-md p-1.5 transition-colors hover:bg-mist"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.article
                    key={activePage}
                    className="mx-auto max-w-[720px] px-12 pb-20 pt-12 max-md:px-6 max-md:pt-9"
                    initial={
                      calm
                        ? false
                        : {
                            opacity: 0,
                            y: 10,
                          }
                    }
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={
                      calm
                        ? undefined
                        : {
                            opacity: 0,
                            y: -8,
                          }
                    }
                    transition={pageTransition}
                  >
                    {/* Page icon */}
                    <motion.div
                      className="mb-5 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#f5f5f7] text-[22px]"
                      whileHover={
                        calm
                          ? undefined
                          : {
                              scale: 1.05,
                              rotate: -3,
                            }
                      }
                    >
                      🧠
                    </motion.div>

                    <div className="mb-2 flex items-center gap-2 text-[10px] text-faint">
                      <span>Edited just now</span>

                      <span>·</span>

                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                        Saved
                      </span>
                    </div>

                    <h3 className="text-[clamp(34px,5vw,52px)] font-semibold leading-[1.05] tracking-[-0.045em] text-ink">
                      {getPageTitle(activePage)}
                    </h3>

                    <p className="mt-4 max-w-[580px] text-[16px] leading-7 text-muted">
                      {getPageDescription(activePage)}
                    </p>

                    {/* Divider */}
                    <div className="my-9 h-px bg-mist" />

                    {/* Editor content */}
                    <div className="space-y-7 text-[15px] leading-7">
                      <EditorSection
                        icon={<Hash size={15} />}
                        title="Authentication"
                      >
                        <p>
                          Authentication is how a system
                          knows{" "}
                          <InlineLink
                            label="who you are"
                            onClick={() =>
                              setSelectedLink(
                                "Authentication",
                              )
                            }
                          />{" "}
                          and what you&apos;re allowed to
                          do.
                        </p>

                        <p className="mt-3 text-muted">
                          This page connects to{" "}
                          <InlineLink
                            label="JWT"
                            onClick={() =>
                              setSelectedLink("JWT")
                            }
                          />
                          ,{" "}
                          <InlineLink
                            label="Sessions"
                            onClick={() =>
                              setSelectedLink(
                                "Sessions",
                              )
                            }
                          />
                          , and{" "}
                          <InlineLink
                            label="OAuth"
                            onClick={() =>
                              setSelectedLink("OAuth")
                            }
                          />
                          .
                        </p>
                      </EditorSection>

                      {/* AI toolbar */}
                      <div className="group/ai relative rounded-[10px] border border-transparent px-1 py-1 transition-colors hover:border-mist">
                        <p>
                          A good authentication system
                          should make identity explicit,
                          sessions predictable, and
                          authorization easy to reason about.
                        </p>

                        <motion.button
                          type="button"
                          onClick={() => setShowAI(true)}
                          className="absolute -right-2 -top-4 flex items-center gap-1.5 rounded-md border border-mist bg-white px-2.5 py-1.5 text-[10px] font-semibold text-muted opacity-0 shadow-sm transition-opacity group-hover/ai:opacity-100 hover:text-ink"
                          whileHover={
                            calm
                              ? undefined
                              : {
                                  y: -1,
                                }
                          }
                        >
                          <Sparkles
                            size={12}
                            className="text-accent"
                          />
                          Ask AI
                        </motion.button>
                      </div>

                      {/* Code block */}
                      <div className="overflow-hidden rounded-[10px] border border-[#e8e8eb] bg-[#fafafa]">
                        <div className="flex items-center justify-between border-b border-[#e8e8eb] px-3.5 py-2 text-[10px] text-faint">
                          <span className="flex items-center gap-1.5">
                            <Code2 size={12} />
                            typescript
                          </span>

                          <span>copy</span>
                        </div>

                        <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-6 text-[#444]">
{`const user = await db.user.findUnique({
  where: { id },
});

const token = createToken(user);`}
                        </pre>
                      </div>

                      {/* Database */}
                      <EditorSection
                        icon={<Database size={15} />}
                        title="Projects"
                      >
                        <div className="overflow-hidden rounded-[9px] border border-line">
                          <div className="grid grid-cols-[1.4fr_1fr_70px] border-b border-line bg-[#fafafa] px-3 py-2 text-[10px] font-semibold text-faint">
                            <span>Project</span>
                            <span>Status</span>
                            <span>Pages</span>
                          </div>

                          {DATABASE_ROWS.map((row) => (
                            <div
                              key={row.project}
                              className="grid grid-cols-[1.4fr_1fr_70px] px-3 py-2.5 text-[11px] transition-colors hover:bg-[#fafafa]"
                            >
                              <span className="font-medium">
                                {row.project}
                              </span>

                              <span className="text-muted">
                                {row.status}
                              </span>

                              <span className="text-muted">
                                {row.pages}
                              </span>
                            </div>
                          ))}
                        </div>
                      </EditorSection>

                      {/* Slash command */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setShowSlash((value) => !value)
                          }
                          className="flex w-full items-center gap-2 rounded-md border border-dashed border-transparent px-2 py-2 text-left text-[12px] text-faint transition-colors hover:border-mist hover:bg-[#fafafa]"
                        >
                          <span className="font-mono text-sm">
                            /
                          </span>

                          <span>
                            Type &quot;/&quot; to add a block
                          </span>
                        </button>

                        <AnimatePresence>
                          {showSlash && (
                            <SlashMenu
                              onClose={() =>
                                setShowSlash(false)
                              }
                            />
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Backlinks */}
                      <div className="border-t border-mist pt-6">
                        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] text-faint uppercase">
                          <Link2 size={12} />
                          Linked from
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {[
                            "API Design",
                            "Research Notes",
                            "Security",
                            "Project Atlas",
                          ].map((link) => (
                            <motion.button
                              key={link}
                              type="button"
                              onClick={() =>
                                setSelectedLink(link)
                              }
                              className="flex items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1.5 text-[11px] text-muted"
                              whileHover={
                                calm
                                  ? undefined
                                  : {
                                      y: -2,
                                      borderColor:
                                        "#d5d5dc",
                                      color: "#111",
                                    }
                              }
                            >
                              <FileText size={11} />
                              {link}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                </AnimatePresence>

                {/* AI popover */}
                <AnimatePresence>
                  {showAI && (
                    <AIPopover
                      onClose={() => setShowAI(false)}
                    />
                  )}
                </AnimatePresence>

                {/* Connection popover */}
                <AnimatePresence>
                  {showConnections && (
                    <ConnectionPopover
                      onClose={() =>
                        setShowConnections(false)
                      }
                    />
                  )}
                </AnimatePresence>

                {/* Link preview */}
                <AnimatePresence>
                  {selectedLink && (
                    <LinkPreview
                      label={selectedLink}
                      onClose={() =>
                        setSelectedLink(null)
                      }
                    />
                  )}
                </AnimatePresence>
              </main>
            </div>

            {/* Command palette */}
            <AnimatePresence>
              {showCommand && (
                <CommandPalette
                  search={search}
                  setSearch={setSearch}
                  pages={filteredPages}
                  onSelect={openPage}
                  onClose={() => {
                    setShowCommand(false);
                    setSearch("");
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                     */
/* -------------------------------------------------------------------------- */

function SidebarItem({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof Search;
  label: string;
  active: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] ${
        active
          ? "bg-white font-semibold text-ink shadow-sm"
          : "text-muted hover:bg-white hover:text-ink"
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function SidebarPage({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Search;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors ${
        active
          ? "font-semibold text-ink"
          : "font-medium text-muted hover:text-ink"
      }`}
      whileHover={{ x: 2 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
    >
      {active && (
        <motion.span
          layoutId="active-page"
          className="absolute inset-0 rounded-md bg-white shadow-sm"
          transition={{
            type: "spring",
            stiffness: 450,
            damping: 35,
          }}
        />
      )}

      <Icon
        size={13}
        className="relative z-10 shrink-0"
      />

      <span className="relative z-10 truncate">
        {label}
      </span>
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/* Editor                                                                      */
/* -------------------------------------------------------------------------- */

function EditorSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2 text-[18px] font-semibold tracking-[-0.025em]">
        <span className="text-faint">{icon}</span>
        {title}
      </div>

      <div className="text-muted">{children}</div>
    </section>
  );
}

function InlineLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="relative inline-flex items-center rounded-[4px] bg-[#f3f3f5] px-1.5 text-ink transition-colors hover:bg-accent-soft"
      whileHover={{
        y: -1,
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 25,
      }}
    >
      <Link2
        size={10}
        className="mr-1 text-faint"
      />

      {label}
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/* Slash menu                                                                  */
/* -------------------------------------------------------------------------- */

function SlashMenu({
  onClose,
}: {
  onClose: () => void;
}) {
  const items = [
    { icon: FileText, label: "Text" },
    { icon: Hash, label: "Heading" },
    { icon: Database, label: "Database" },
    { icon: Code2, label: "Code" },
    { icon: Link2, label: "Link" },
    { icon: Sparkles, label: "Ask AI" },
  ];

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
        scale: 0.97,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: 5,
        scale: 0.98,
      }}
      className="absolute bottom-full left-0 z-30 mb-2 w-[230px] overflow-hidden rounded-[10px] border border-line bg-white p-1.5 shadow-pop"
    >
      <div className="px-2.5 py-2 text-[9px] font-bold tracking-[0.1em] text-faint uppercase">
        Add a block
      </div>

      {items.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.label}
            type="button"
            onClick={onClose}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[11px] text-muted transition-colors hover:bg-[#f7f7f8] hover:text-ink"
          >
            <Icon size={14} />
            {item.label}
          </button>
        );
      })}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* AI                                                                          */
/* -------------------------------------------------------------------------- */

function AIPopover({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
        scale: 0.96,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: 8,
        scale: 0.97,
      }}
      className="absolute right-8 top-24 z-40 w-[270px] rounded-[12px] border border-line bg-white p-3 shadow-pop max-md:right-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink text-white">
            <Sparkles size={12} />
          </span>
          Ask VaultGraph
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-faint hover:text-ink"
        >
          <X size={14} />
        </button>
      </div>

      <div className="rounded-lg bg-[#f7f7f8] p-2.5 text-[11px] leading-5 text-muted">
        Explain this section in simpler terms...
      </div>

      <div className="mt-2 flex items-center justify-between text-[9px] text-faint">
        <span>⌘ ↵ to ask</span>

        <WandSparkles
          size={12}
          className="text-accent"
        />
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Connections                                                                 */
/* -------------------------------------------------------------------------- */

function ConnectionPopover({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
        scale: 0.97,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: 5,
      }}
      className="absolute right-8 top-14 z-40 w-[300px] rounded-[12px] border border-line bg-white p-4 shadow-pop"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold">
            Connected knowledge
          </p>

          <p className="mt-0.5 text-[10px] text-faint">
            12 pages are connected to this page.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-faint hover:text-ink"
        >
          <X size={14} />
        </button>
      </div>

      <div className="relative flex h-[170px] items-center justify-center overflow-hidden rounded-[9px] bg-[#fafafa]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 300 170"
          fill="none"
        >
          <motion.path
            d="M150 85 L65 45 M150 85 L235 42 M150 85 L70 130 M150 85 L235 130"
            stroke="#d9d9df"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 1,
              ease: "easeOut",
            }}
          />
        </svg>

        <GraphNode
          label="Backend"
          center
        />

        <GraphNode
          label="PostgreSQL"
          className="absolute left-5 top-7"
        />

        <GraphNode
          label="API Design"
          className="absolute right-5 top-5"
        />

        <GraphNode
          label="Authentication"
          className="absolute bottom-6 left-7"
        />

        <GraphNode
          label="Research"
          className="absolute right-8 bottom-7"
        />
      </div>
    </motion.div>
  );
}

function GraphNode({
  label,
  center = false,
  className = "",
}: {
  label: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      className={`z-10 rounded-md border bg-white px-2.5 py-1.5 text-[9px] font-medium shadow-sm ${
        center
          ? "border-ink bg-ink text-white"
          : "border-line text-muted"
      } ${className}`}
      animate={{
        y: [0, -2, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {label}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Link preview                                                                */
/* -------------------------------------------------------------------------- */

function LinkPreview({
  label,
  onClose,
}: {
  label: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
        scale: 0.97,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: 5,
      }}
      className="absolute bottom-7 left-7 z-40 w-[250px] rounded-[11px] border border-line bg-white p-3 shadow-pop"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f5f5f7]">
            <Link2 size={13} />
          </span>

          <div>
            <p className="text-[11px] font-semibold">
              {label}
            </p>

            <p className="text-[9px] text-faint">
              Connected page
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-faint hover:text-ink"
        >
          <X size={13} />
        </button>
      </div>

      <p className="mt-3 text-[10px] leading-5 text-muted">
        This page is part of your connected knowledge
        graph.
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-mist pt-2.5 text-[9px] text-faint">
        <span>14 backlinks</span>

        <span className="flex items-center gap-1 font-medium text-ink">
          Open page
          <ArrowRight size={10} />
        </span>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Command palette                                                             */
/* -------------------------------------------------------------------------- */

function CommandPalette({
  search,
  setSearch,
  pages,
  onSelect,
  onClose,
}: {
  search: string;
  setSearch: (value: string) => void;
  pages: typeof PAGES;
  onSelect: (page: PageId) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-start justify-center bg-black/10 px-5 pt-20 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{
          opacity: 0,
          y: -12,
          scale: 0.97,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: -8,
        }}
        className="w-full max-w-[430px] overflow-hidden rounded-[12px] border border-line bg-white shadow-pop"
      >
        <div className="flex items-center gap-2 border-b border-mist px-3.5 py-3">
          <Search
            size={15}
            className="text-faint"
          />

          <input
            autoFocus
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search your knowledge..."
            className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-faint"
          />

          <button
            type="button"
            onClick={onClose}
            className="text-faint hover:text-ink"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-1.5">
          <p className="px-2.5 py-2 text-[9px] font-bold tracking-[0.1em] text-faint uppercase">
            Pages
          </p>

          {pages.map((page) => {
            const Icon = page.icon;

            return (
              <button
                key={page.id}
                type="button"
                onClick={() => onSelect(page.id)}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left transition-colors hover:bg-[#f7f7f8]"
              >
                <Icon size={14} />

                <span className="text-[11px] font-medium">
                  {page.label}
                </span>

                <ArrowRight
                  size={12}
                  className="ml-auto text-faint"
                />
              </button>
            );
          })}

          {pages.length === 0 && (
            <div className="px-2.5 py-8 text-center text-[11px] text-faint">
              No pages found.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-mist px-3.5 py-2.5 text-[9px] text-faint">
          <span>Navigate with ↑ ↓</span>
          <span>ESC to close</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page content                                                                */
/* -------------------------------------------------------------------------- */

function getPageTitle(page: PageId) {
  switch (page) {
    case "engineering":
      return "Engineering";

    case "database":
      return "Databases";

    case "api":
      return "API Design";

    case "research":
      return "Research Notes";

    case "vaultgraph":
      return "VaultGraph";

    default:
      return "Backend Architecture";
  }
}

function getPageDescription(page: PageId) {
  switch (page) {
    case "engineering":
      return "Everything I'm learning, building and discovering while engineering software.";

    case "database":
      return "Notes about PostgreSQL, indexing, transactions, pooling and data architecture.";

    case "api":
      return "Patterns for designing APIs that stay predictable as systems grow.";

    case "research":
      return "Loose ideas, experiments and things worth coming back to.";

    case "vaultgraph":
      return "A connected workspace where ideas, projects and knowledge live together.";

    default:
      return "Everything I know about building reliable backend systems.";
  }
}
