import { db } from "../../../prisma/db";
import { HttpError } from "../../../Shared/httpError";
import { workspaceRepoClass } from "../../Workspace/Repostiary/workspace.repositary";
import { pageRepositaryClass } from "../Repositary/pages.repo";
import { blockRepositoryClass } from "../Repositary/blocks.repo";
import {
  BlockAccessDeniedError,
  BlockHierarchyError,
  BlockNotFoundError,
  PageNotFoundError,
} from "../Utils/page.errors";
import { normalizeBlockContent } from "../Utils/page.utils";
import { apiBlockTypeToDb } from "@vaultgraph/shared/pages-types";
import type {
  CreateBlockInput,
  MoveBlockBody,
  ReorderBlocksBody,
  UpdateBlockInput,
} from "@vaultgraph/shared/pages-types";

type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

/**
 * Block service — page-scoped authorization + nesting + ordering.
 *
 * Every operation verifies page access first (workspace -> project/page ->
 * role -> operation), so blockIds can never escape their page.
 */
export class blockServiceClass {
  constructor(
    private readonly blockRepo: blockRepositoryClass,
    private readonly pageRepo: pageRepositaryClass,
    private readonly workspaceRepo: workspaceRepoClass
  ) {}

  private resolveRole = async (
    workspaceId: string,
    userId: string
  ): Promise<Role | null> => {
    const workspace = await this.workspaceRepo.getWorkspaceById(workspaceId);
    if (!workspace) return null;
    if ((workspace as any).ownerId === userId) return "OWNER";
    const membership = await (db.orm.public.Member as any).first({
      workspaceId,
      userId,
    });
    if (!membership) return null;
    return (membership as any).role as Role;
  };

  private assertPageReadable = async (pageId: string, userId: string) => {
    const page = (await this.pageRepo.findPageById(pageId)) as any;
    if (!page) throw new PageNotFoundError();
    const role = await this.resolveRole(page.workspaceId, userId);
    if (!role) throw new BlockAccessDeniedError();
    return page;
  };

  private assertPageWritable = async (pageId: string, userId: string) => {
    const page = await this.assertPageReadable(pageId, userId);
    const role = await this.resolveRole(page.workspaceId, userId);
    if (!role || role === "VIEWER") throw new BlockAccessDeniedError();
    return page;
  };

  private assertBlockAccess = async (blockId: string, userId: string) => {
    const block = (await this.blockRepo.findById(blockId)) as any;
    if (!block) throw new BlockNotFoundError();
    const page = await this.assertPageReadable(block.pageId, userId);
    return { block, page };
  };

  private assertBlockWriteAccess = async (blockId: string, userId: string) => {
    const { block, page } = await this.assertBlockAccess(blockId, userId);
    const role = await this.resolveRole(page.workspaceId, userId);
    if (!role || role === "VIEWER") throw new BlockAccessDeniedError();
    return { block, page };
  };

  private validateParent = async (
    pageId: string,
    blockId: string | null,
    parentId: string | null
  ) => {
    if (!parentId) return null;
    if (blockId && parentId === blockId) {
      throw new BlockHierarchyError("A block cannot parent itself");
    }
    const parent = (await this.blockRepo.findById(parentId)) as any;
    if (!parent) throw new BlockHierarchyError("Parent block does not exist");
    if (parent.pageId !== pageId) {
      throw new BlockHierarchyError("Parent must belong to the same page");
    }
    if (blockId) {
      const descendants = await this.blockRepo.findDescendantIds(blockId);
      if (descendants.includes(parentId)) {
        throw new BlockHierarchyError(
          "A block cannot become a descendant of itself"
        );
      }
    }
    return parent;
  };

  createBlock = async (
    pageId: string,
    data: CreateBlockInput,
    userId: string
  ) => {
    await this.assertPageWritable(pageId, userId);
    const parentId = data.parentId ?? null;
    await this.validateParent(pageId, null, parentId);
    const type = apiBlockTypeToDb(String((data as any).type ?? "paragraph"));
    return await this.blockRepo.create({
      pageId,
      type,
      content: normalizeBlockContent((data as any).content ?? {}),
      parentId,
      position: (data as any).position,
    });
  };

  listBlocks = async (pageId: string, userId: string) => {
    await this.assertPageReadable(pageId, userId);
    return await this.blockRepo.listByPage(pageId);
  };

  getBlock = async (blockId: string, userId: string) => {
    const { block } = await this.assertBlockAccess(blockId, userId);
    return block;
  };

  updateBlock = async (
    blockId: string,
    data: UpdateBlockInput,
    userId: string
  ) => {
    const { block } = await this.assertBlockWriteAccess(blockId, userId);
    if (!data || Object.keys(data).length === 0) {
      throw new HttpError("Nothing to update", 400);
    }
    const patch: Record<string, unknown> = {};
    if ((data as any).type !== undefined) {
      patch["type"] = apiBlockTypeToDb(String((data as any).type));
    }
    if ((data as any).content !== undefined) {
      patch["content"] = normalizeBlockContent((data as any).content);
    }
    if ((data as any).position !== undefined) {
      patch["position"] = (data as any).position;
    }
    if ((data as any).parentId !== undefined) {
      await this.validateParent(
        block.pageId,
        blockId,
        (data as any).parentId as string | null
      );
      patch["parentId"] = (data as any).parentId;
    }
    return await this.blockRepo.update(blockId, patch);
  };

  moveBlock = async (
    blockId: string,
    data: MoveBlockBody,
    userId: string
  ) => {
    const { block } = await this.assertBlockWriteAccess(blockId, userId);
    await this.validateParent(block.pageId, blockId, data.parentId ?? null);
    const updated = await this.blockRepo.update(blockId, {
      parentId: data.parentId ?? null,
      ...(data.position !== undefined ? { position: data.position } : {}),
    });
    if (data.position !== undefined) {
      const siblings = await this.blockRepo.listByPage(block.pageId);
      const sameScope = siblings.filter(
        (b: any) => (b.parentId ?? null) === (data.parentId ?? null)
      );
      const ids = sameScope
        .map((b: any) => b.id)
        .filter((id: string) => id !== blockId);
      const pos = Math.max(0, Math.min(data.position, ids.length));
      ids.splice(pos, 0, blockId);
      await this.blockRepo.reorder(ids);
    }
    return updated;
  };

  reorderBlocks = async (
    pageId: string,
    data: ReorderBlocksBody,
    userId: string
  ) => {
    await this.assertPageWritable(pageId, userId);
    if (!data.orderedIds || data.orderedIds.length === 0) {
      throw new HttpError("orderedIds is required", 400);
    }
    // Validate the whole set before persisting: same page + same parent.
    const rows: any[] = [];
    for (const id of data.orderedIds) {
      const row = (await this.blockRepo.findById(id)) as any;
      if (!row || row.pageId !== pageId) {
        throw new HttpError("All blocks must belong to the same page", 400);
      }
      rows.push(row);
    }
    const scope = (rows[0] as any).parentId ?? null;
    for (const row of rows) {
      if ((row.parentId ?? null) !== scope) {
        throw new HttpError(
          "All blocks must share the same parent to reorder",
          400
        );
      }
    }
    await this.blockRepo.reorder(data.orderedIds);
    return await this.blockRepo.listByPage(pageId);
  };

  deleteBlock = async (blockId: string, userId: string) => {
    await this.assertBlockWriteAccess(blockId, userId);
    await this.blockRepo.deleteBlock(blockId);
  };
}

export const BlockService = blockServiceClass;
export type BlockService = blockServiceClass;
