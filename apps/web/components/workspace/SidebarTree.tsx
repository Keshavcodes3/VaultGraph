"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import SidebarItem, { type MoveTarget } from "./SidebarItem";
import type { DropPosition, PageItem } from "./data";
import { useCalm } from "../landing/Reveal";

interface TreeProps {
  pages: PageItem[];
  activeId: string | null;
  moveTargets: MoveTarget[];
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onFavorite: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCopyLink: (id: string) => void;
  onMoveTo: (pageId: string, parentId: string | null) => void;
  onMove: (dragId: string, targetId: string, pos: DropPosition) => void;
}

/** Recursive page tree with collapse + drag-and-drop reorder/nest. */
export default function SidebarTree(p: TreeProps) {
  const calm = useCalm();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{ id: string; pos: DropPosition } | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addChild = (parentId: string) => {
    setCollapsed((prev) => {
      if (!prev.has(parentId)) return prev;
      const next = new Set(prev);
      next.delete(parentId);
      return next;
    });
    p.onAddChild(parentId);
  };

  const renderNodes = (nodes: PageItem[], depth: number) =>
    nodes.map((pg) => {
      const open = !collapsed.has(pg.id);
      return (
        <div key={pg.id}>
          <SidebarItem
            page={pg}
            depth={depth}
            active={pg.id === p.activeId}
            open={open}
            onToggle={() => toggle(pg.id)}
            dropPos={dragId && over?.id === pg.id ? over.pos : null}
            moveTargets={p.moveTargets}
            onSelect={p.onSelect}
            onAddChild={addChild}
            onFavorite={p.onFavorite}
            onRename={p.onRename}
            onDuplicate={p.onDuplicate}
            onDelete={p.onDelete}
            onCopyLink={p.onCopyLink}
            onMoveTo={p.onMoveTo}
            onDragStart={(id) => setDragId(id)}
            onDragOver={(id, pos) => setOver({ id, pos })}
            onDragLeave={() => setOver(null)}
            onDrop={() => {
              if (dragId && over && dragId !== over.id) {
                p.onMove(dragId, over.id, over.pos);
              }
              setDragId(null);
              setOver(null);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOver(null);
            }}
          />
          <AnimatePresence initial={false}>
            {open && (pg.children?.length ?? 0) > 0 ? (
              <motion.div
                initial={calm ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="overflow-hidden"
              >
                {renderNodes(pg.children ?? [], depth + 1)}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      );
    });

  return (
    <div role="tree" aria-label="Pages">
      {renderNodes(p.pages, 0)}
    </div>
  );
}
