import { db } from "../../../prisma/db";
import { nowInstant } from "../../../prisma/timestamps";

/**
 * Block repository — Prisma 8 query API only.
 *
 * Blocks are content units of a page with persistent `position` ordering
 * and optional `parentId` nesting (e.g. toggles). No legacy PrismaClient
 * APIs or nested writes are used; ordering is an explicit integer column
 * and hierarchy is validated in the service layer before writes.
 */
export class blockRepositoryClass {
  constructor(
    private readonly blockDB = db.orm.public.Block
  ) {}

  create = async (data: {
    pageId: string;
    type: string;
    content: Record<string, unknown>;
    parentId?: string | null;
    position?: number;
  }) => {
    const position =
      data.position ??
      (await this.nextPosition(data.pageId, data.parentId ?? null));
    const row = await (this.blockDB as any).create({
      pageId: data.pageId,
      type: data.type,
      content: data.content ?? {},
      parentId: data.parentId ?? null,
      position,
      updatedAt: nowInstant(),
    });
    return row;
  };

  findById = async (blockId: string) => {
    return await (this.blockDB as any).first({ id: blockId });
  };

  /** All blocks of a page, ordered by (parentId, position) — no N+1. */
  listByPage = async (pageId: string) => {
    const rows = (await (this.blockDB as any)
      .where({ pageId })
      .all()) as any[];
    rows.sort(
      (a, b) =>
        String(a.parentId ?? "").localeCompare(String(b.parentId ?? "")) ||
        (a.position ?? 0) - (b.position ?? 0)
    );
    return rows;
  };

  listChildren = async (parentId: string) => {
    const rows = (await (this.blockDB as any)
      .where({ parentId })
      .all()) as any[];
    rows.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return rows;
  };

  nextPosition = async (
    pageId: string,
    parentId: string | null
  ): Promise<number> => {
    const rows = (await (this.blockDB as any)
      .where({ pageId, parentId })
      .all()) as any[];
    if (rows.length === 0) return 0;
    return rows.reduce(
      (m: number, b: any) =>
        Math.max(m, typeof b.position === "number" ? b.position : 0),
      0
    ) + 1;
  };

  update = async (blockId: string, data: Record<string, unknown>) => {
    const patch: Record<string, unknown> = { ...(data as object) };
    delete patch["id"];
    delete patch["pageId"];
    delete patch["createdAt"];
    const row = await (this.blockDB as any)
      .where({ id: blockId })
      .update({ ...patch, updatedAt: nowInstant() } as any);
    return row;
  };

  deleteBlock = async (blockId: string) => {
    // Nested children cascade at the DB level (onDelete: Cascade).
    await (this.blockDB as any).where({ id: blockId }).delete();
  };

  /** Backwards-compatible alias. */
  delete = this.deleteBlock;

  deleteByPage = async (pageId: string) => {
    const rows = await this.listByPage(pageId);
    for (const row of rows) {
      await (this.blockDB as any).where({ id: row.id }).delete();
    }
  };

  /** Persist block ordering for the given ordered ids (renumbers 0..n). */
  reorder = async (orderedIds: string[]) => {
    for (let i = 0; i < orderedIds.length; i += 1) {
      await (this.blockDB as any)
        .where({ id: orderedIds[i] })
        .update({ position: i, updatedAt: nowInstant() } as any);
    }
  };

  /** All descendant block ids (BFS) — prevents circular nesting. */
  findDescendantIds = async (blockId: string): Promise<string[]> => {
    const ids: string[] = [];
    const queue: string[] = [blockId];
    const seen = new Set<string>([blockId]);
    let guard = 0;
    while (queue.length > 0 && guard < 5000) {
      guard += 1;
      const currentId = queue.shift() as string;
      const children = (await (this.blockDB as any)
        .where({ parentId: currentId })
        .all()) as any[];
      for (const child of children) {
        if (seen.has(child.id)) continue;
        seen.add(child.id);
        ids.push(child.id);
        queue.push(child.id);
      }
    }
    return ids;
  };
}

/** Conventional-casing alias. */
export const BlockRepository = blockRepositoryClass;
export type BlockRepository = blockRepositoryClass;
