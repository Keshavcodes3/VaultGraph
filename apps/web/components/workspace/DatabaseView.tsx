"use client";

import {
  ArrowDownWideNarrow,
  KanbanSquare,
  LayoutGrid,
  List,
  Plus,
  Search,
  Table2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DB_STATUSES, uid, type DbRow, type DbStatus } from "./data";

type View = "table" | "board" | "list" | "gallery";

const DOT: Record<DbStatus, string> = {
  Planning: "bg-faint",
  Building: "bg-amberish",
  Active: "bg-mint",
  Paused: "bg-faint",
  Done: "bg-ink dark:bg-white",
};

function StatusPill({ status }: { status: DbStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-soft px-2 py-[3px] text-[12px] font-medium text-ink-soft dark:bg-white/10 dark:text-[#A1A1AA]">
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {status}
    </span>
  );
}

/**
 * First-class database: table, board, list and gallery views
 * with instant switching and a visually minimal toolbar.
 */
export default function DatabaseView({
  title = "Projects",
  rows,
  onChange,
  compact,
}: {
  title?: string;
  rows: DbRow[];
  onChange: (rows: DbRow[]) => void;
  compact?: boolean;
}) {
  const [view, setView] = useState<View>("table");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<DbStatus | "All">("All");
  const [sortNewest, setSortNewest] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter(
      (r) =>
        (!needle || r.name.toLowerCase().includes(needle)) &&
        (status === "All" || r.status === status)
    );
    if (sortNewest) out = [...out].reverse();
    return out;
  }, [rows, q, status, sortNewest]);

  const addRow = () =>
    onChange([
      ...rows,
      { id: uid("db"), name: "Untitled", status: "Planning", owner: "Keshav", updated: "Just now" },
    ]);

  const advance = (id: string) =>
    onChange(
      rows.map((r) => {
        if (r.id !== id) return r;
        const next = DB_STATUSES[(DB_STATUSES.indexOf(r.status) + 1) % DB_STATUSES.length];
        return { ...r, status: next ?? r.status, updated: "Just now" };
      })
    );

  const rename = (id: string, name: string) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, name, updated: "Just now" } : r)));

  const views: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: "table", label: "Table", icon: <Table2 size={13} /> },
    { id: "board", label: "Board", icon: <KanbanSquare size={13} /> },
    { id: "list", label: "List", icon: <List size={13} /> },
    { id: "gallery", label: "Gallery", icon: <LayoutGrid size={13} /> },
  ];

  return (
    <div className={`overflow-hidden rounded-xl border border-line bg-white dark:border-[#272727] dark:bg-[#111111] ${compact ? "" : "my-1"}`}>
      {/* header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2 dark:border-[#272727]">
        <span className="mr-1 text-[13px] font-semibold tracking-[-0.01em] text-ink dark:text-[#F5F5F5]">
          {title}
        </span>
        <div className="flex items-center gap-0.5 rounded-lg bg-soft p-0.5 dark:bg-white/5">
          {views.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              aria-pressed={view === v.id}
              title={v.label}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium transition-colors ${
                view === v.id
                  ? "bg-white text-ink shadow-mini dark:bg-white/15 dark:text-white"
                  : "text-faint hover:text-ink dark:hover:text-white"
              }`}
            >
              {v.icon}
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="relative">
            <Search size={13} className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter…"
              aria-label="Filter rows"
              className="h-7 w-28 rounded-md border border-transparent bg-transparent pr-1 pl-7 text-[12.5px] text-ink outline-none placeholder:text-faint hover:border-line focus:border-line focus:bg-white dark:text-white dark:hover:border-[#272727] dark:focus:bg-transparent"
            />
          </span>
          <span className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DbStatus | "All")}
              aria-label="Filter by status"
              className="h-7 cursor-pointer appearance-none rounded-md bg-transparent pr-6 pl-2 text-[12.5px] text-ink-soft outline-none hover:bg-soft dark:text-[#A1A1AA] dark:hover:bg-white/5"
            >
              <option value="All">All</option>
              {DB_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </span>
          <button
            onClick={() => setSortNewest((v) => !v)}
            aria-pressed={sortNewest}
            title="Reverse order"
            className={`rounded-md p-1.5 transition-colors ${sortNewest ? "bg-soft text-ink dark:bg-white/10 dark:text-white" : "text-faint hover:bg-soft hover:text-ink dark:hover:bg-white/5 dark:hover:text-white"}`}
          >
            <ArrowDownWideNarrow size={14} />
          </button>
          <button
            onClick={addRow}
            className="flex h-7 items-center gap-1 rounded-md bg-ink px-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-black dark:bg-white dark:text-ink dark:hover:bg-white/85"
          >
            <Plus size={13} /> New
          </button>
        </div>
      </div>

      {/* views */}
      {view === "table" ? (
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line text-faint dark:border-[#272727]">
              <th className="px-3 py-2 font-mono text-[10.5px] font-semibold tracking-[0.08em] uppercase">Name</th>
              <th className="hidden px-3 py-2 font-mono text-[10.5px] font-semibold tracking-[0.08em] uppercase sm:table-cell">Status</th>
              <th className="hidden px-3 py-2 font-mono text-[10.5px] font-semibold tracking-[0.08em] uppercase md:table-cell">Owner</th>
              <th className="px-3 py-2 text-right font-mono text-[10.5px] font-semibold tracking-[0.08em] uppercase">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-b border-line/70 transition-colors last:border-0 hover:bg-soft/70 dark:border-[#272727]/70 dark:hover:bg-white/5"
              >
                <td className="px-3 py-2">
                  <input
                    value={r.name}
                    onChange={(e) => rename(r.id, e.target.value)}
                    aria-label="Row name"
                    className="w-full border-none bg-transparent p-0 font-medium text-ink outline-none dark:text-[#F5F5F5]"
                  />
                </td>
                <td className="hidden px-3 py-2 sm:table-cell">
                  <button onClick={() => advance(r.id)} title="Advance status">
                    <StatusPill status={r.status} />
                  </button>
                </td>
                <td className="hidden px-3 py-2 text-ink-soft md:table-cell dark:text-[#A1A1AA]">{r.owner}</td>
                <td className="px-3 py-2 text-right text-faint">{r.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {view === "board" ? (
        <div className="grid auto-cols-[220px] grid-flow-col gap-2 overflow-x-auto p-3">
          {DB_STATUSES.map((s) => {
            const cards = filtered.filter((r) => r.status === s);
            return (
              <div key={s} className="rounded-lg bg-soft/70 p-2 dark:bg-white/5">
                <p className="flex items-center gap-1.5 px-1 pb-2 text-[12px] font-semibold text-ink-soft dark:text-[#A1A1AA]">
                  <span className={`h-1.5 w-1.5 rounded-full ${DOT[s]}`} />
                  {s}
                  <span className="font-mono text-[10.5px] text-faint">{cards.length}</span>
                </p>
                <div className="space-y-1.5">
                  {cards.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => advance(r.id)}
                      title="Advance status"
                      className="block w-full rounded-lg border border-line bg-white px-2.5 py-2 text-left shadow-mini transition-all hover:border-ink/30 dark:border-[#272727] dark:bg-[#181818] dark:hover:border-white/30"
                    >
                      <span className="block truncate text-[13px] font-medium text-ink dark:text-[#F5F5F5]">
                        {r.name}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-faint">
                        {r.owner} · {r.updated}
                      </span>
                    </button>
                  ))}
                  {cards.length === 0 ? (
                    <p className="px-1 py-2 text-[12px] text-faint">Empty.</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {view === "list" ? (
        <div className="p-1.5">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-[7px] transition-colors hover:bg-soft dark:hover:bg-white/5"
            >
              <input
                value={r.name}
                onChange={(e) => rename(r.id, e.target.value)}
                aria-label="Row name"
                className="min-w-0 flex-1 border-none bg-transparent p-0 text-[13px] font-medium text-ink outline-none dark:text-[#F5F5F5]"
              />
              <button onClick={() => advance(r.id)} title="Advance status">
                <StatusPill status={r.status} />
              </button>
              <span className="hidden text-[12px] text-faint sm:inline">{r.updated}</span>
            </div>
          ))}
        </div>
      ) : null}

      {view === "gallery" ? (
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
          {filtered.map((r, i) => (
            <button
              key={r.id}
              onClick={() => advance(r.id)}
              title="Advance status"
              className="overflow-hidden rounded-lg border border-line text-left transition-all hover:border-ink/30 dark:border-[#272727] dark:hover:border-white/30"
            >
              <span
                className={`block h-16 ${
                  ["bg-brand-soft", "bg-mist", "bg-soft", "bg-brand-faint"][i % 4]
                } dark:bg-white/5`}
              />
              <span className="block px-2.5 py-2">
                <span className="block truncate text-[13px] font-medium text-ink dark:text-[#F5F5F5]">
                  {r.name}
                </span>
                <span className="mt-1 block">
                  <StatusPill status={r.status} />
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="px-3 py-6 text-center text-[13px] text-faint">
          No rows match. Press New to add one.
        </p>
      ) : null}
    </div>
  );
}
