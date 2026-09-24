import { db } from "../../../prisma/db";
import { HttpError } from "../../../Shared/httpError";
import { workspaceRepoClass } from "../../Workspace/Repostiary/workspace.repositary";
import { projectRepoClass } from "../../Projects/Repositary/project.repo";
import { pageRepositaryClass } from "../Repositary/pages.repo";
import { blockRepositoryClass } from "../Repositary/blocks.repo";
import {
  PageAccessDeniedError,
  PageHierarchyError,
  PageNotFoundError,
} from "../Utils/page.errors";
import {
  buildPageTree,
  normalizePageTitle,
} from "../Utils/page.utils";
import { apiBlockTypeToDb } from "@vaultgraph/shared/pages-types";
import type {
  CreatePageBody,
  DuplicatePageBody,
  ListPagesQuery,
  MovePageBody,
  ReorderPagesBody,
  UpdatePageBody,
} from "@vaultgraph/shared/pages-types";

type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

/**
 * Page service — authorization + hierarchy + ordering.
 *
 * Auth chain (reuses Workspace/Project modules, never trusts client ids):
 * Authentication -> Workspace access -> Project/Page access -> Role -> Operation.
 *
 * Roles (conceptual VIEWER / EDITOR / OWNER mapped onto MemberRole):
 * - VIEWER: read only.
 * - MEMBER (= EDITOR): create/read/update/delete content + reorder.
 * - ADMIN/OWNER: full permitted management.
 */
export class pageServiceClass {
  constructor(
    private readonly pageRepo: pageRepositaryClass,
    private readonly blockRepo: blockRepositoryClass,
    private readonly workspaceRepo: workspaceRepoClass,
    private readonly projectRepo: projectRepoClass
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

  private assertReadable = async (workspaceId: string, userId: string) => {
    const role = await this.resolveRole(workspaceId, userId);
    if (!role) throw new PageAccessDeniedError();
    return role;
  };

  private assertWritable = async (workspaceId: string, userId: string) => {
    const role = await this.resolveRole(workspaceId, userId);
    if (!role) throw new PageAccessDeniedError();
    if (role === "VIEWER") throw new PageAccessDeniedError();
    return role;
  };

  private assertPageAccess = async (pageId: string, userId: string) => {
    const page = (await this.pageRepo.findPageById(pageId)) as any;
    if (!page) throw new PageNotFoundError();
    await this.assertReadable(page.workspaceId, userId);
    // Project scoping: if the page claims a project, it must belong to the
    // same workspace as the page (never trust client-provided ids alone).
    if (page.projectId) {
      const project = await this.projectRepo.findById(page.projectId);
      if (!project || project.workspaceId !== page.workspaceId) {
        throw new PageNotFoundError();
      }
    }
    return page;
  };

  private assertWriteAccess = async (pageId: string, userId: string) => {
    const page = await this.assertPageAccess(pageId, userId);
    await this.assertWritable(page.workspaceId, userId);
    return page;
  };

  private validateParent = async (
    pageId: string | null,
    parentId: string | null,
    workspaceId: string,
    projectId: string | null
  ) => {
    if (!parentId) return null;
    if (pageId && parentId === pageId) {
      throw new PageHierarchyError("A page cannot be its own parent");
    }
    const parent = (await this.pageRepo.findPageById(parentId)) as any;
    if (!parent) throw new PageHierarchyError("Parent page does not exist");
    if (parent.workspaceId !== workspaceId) {
      throw new PageHierarchyError(
        "Parent page belongs to another workspace"
      );
    }
    if (projectId && parent.projectId && parent.projectId !== projectId) {
      throw new PageHierarchyError(
        "Parent page belongs to another project"
      );
    }
    if (pageId) {
      const descendants = await this.pageRepo.findDescendantIds(pageId);
      if (descendants.includes(parentId)) {
        throw new PageHierarchyError(
          "A page cannot become a child of its own descendant"
        );
      }
    }
    return parent;
  };

  // CREATE
  createPage = async (data: CreatePageBody, userId: string) => {
    if (!data || typeof data.workspaceId !== "string") {
      throw new HttpError("workspaceId is required", 400);
    }
    await this.assertWritable(data.workspaceId, userId);

    let projectId: string | null = data.projectId ?? null;
    if (projectId) {
      const project = await this.projectRepo.findById(projectId);
      if (!project || project.workspaceId !== data.workspaceId) {
        throw new HttpError("Project does not belong to this workspace", 400);
      }
    }

    const parentId = data.parentId ?? null;
    if (parentId) {
      const parent = (await this.pageRepo.findPageById(parentId)) as any;
      if (!parent) throw new PageHierarchyError("Parent page does not exist");
      if (parent.workspaceId !== data.workspaceId) {
        throw new PageHierarchyError(
          "Parent page belongs to another workspace"
        );
      }
      if (!projectId && parent.projectId) {
        projectId = parent.projectId;
      }
      if (projectId && parent.projectId && parent.projectId !== projectId) {
        throw new PageHierarchyError(
          "Parent page belongs to another project"
        );
      }
    }

    const title = normalizePageTitle(data.title ?? "Untitled");

    return await this.pageRepo.create(
      {
        workspaceId: data.workspaceId,
        projectId,
        parentId,
        title,
        icon: data.icon ?? null,
        cover: data.cover ?? null,
        description: data.description ?? null,
      } as any,
      userId
    );
  };

  // READ (metadata + blocks + hierarchy context, no whole-workspace fetch)
  getPage = async (pageId: string, userId: string) => {
    const page = await this.assertPageAccess(pageId, userId);
    return page;
  };

  getPageWithBlocks = async (pageId: string, userId: string) => {
    const page = (await this.assertPageAccess(pageId, userId)) as any;
    // Two focused queries: blocks of this page + hierarchy context.
    // No whole-workspace load, no N+1 (children + ancestors are flat reads).
    const blocks = await this.blockRepo.listByPage(pageId);
    const ancestors = await this.pageRepo.findAncestors(pageId);
    const children = await this.pageRepo.findChildren(pageId, false);
    return { page, blocks, ancestors, children };
  };

  listPages = async (query: ListPagesQuery, userId: string) => {
    const workspaceId = query.workspaceId;
    if (query.projectId) {
      const project = await this.projectRepo.findById(query.projectId);
      if (!project) throw new PageNotFoundError();
      await this.assertReadable(project.workspaceId, userId);
      if (workspaceId && project.workspaceId !== workspaceId) {
        throw new HttpError("Project does not belong to this workspace", 400);
      }
      return await this.pageRepo.list({
        workspaceId: project.workspaceId,
        projectId: query.projectId,
        parentId:
          query.parentId === "__root" || query.parentId === "null"
            ? null
            : query.parentId === undefined
              ? undefined
              : query.parentId,
        includeArchived: query.archived === "true",
        favoritesOnly: query.favorites === "true",
      });
    }
    if (!workspaceId) {
      throw new HttpError("workspaceId or projectId is required", 400);
    }
    await this.assertReadable(workspaceId, userId);
    return await this.pageRepo.list({
      workspaceId,
      parentId:
        query.parentId === "__root" || query.parentId === "null"
          ? null
          : query.parentId === undefined
            ? undefined
            : query.parentId,
      includeArchived: query.archived === "true",
      favoritesOnly: query.favorites === "true",
    });
  };

  getPageTree = async (
    opts: { workspaceId?: string; projectId?: string },
    userId: string
  ) => {
    if (opts.projectId) {
      const project = await this.projectRepo.findById(opts.projectId);
      if (!project) throw new PageNotFoundError();
      await this.assertReadable(project.workspaceId, userId);
      const flat = (await this.pageRepo.list({
        workspaceId: project.workspaceId,
        projectId: opts.projectId,
      })) as any[];
      return buildPageTree(flat);
    }
    if (!opts.workspaceId) {
      throw new HttpError("workspaceId or projectId is required", 400);
    }
    await this.assertReadable(opts.workspaceId, userId);
    const flat = (await this.pageRepo.list({
      workspaceId: opts.workspaceId,
    })) as any[];
    return buildPageTree(flat);
  };

  // UPDATE
  updatePage = async (
    pageId: string,
    data: UpdatePageBody,
    userId: string
  ) => {
    const page = (await this.assertWriteAccess(pageId, userId)) as any;
    if (!data || Object.keys(data).length === 0) {
      throw new HttpError("Nothing to update", 400);
    }

    const patch: Record<string, unknown> = {};
    if (data.title !== undefined)
      patch["title"] = normalizePageTitle(data.title);
    if (data.icon !== undefined) patch["icon"] = data.icon;
    if (data.cover !== undefined) patch["cover"] = data.cover;
    if (data.description !== undefined) patch["description"] = data.description;
    if (data.position !== undefined) patch["position"] = data.position;
    if (data.isFavorite !== undefined) patch["isFavorite"] = data.isFavorite;
    if (data.isArchived !== undefined) patch["isArchived"] = data.isArchived;
    if (data.isPublic !== undefined) patch["isPublic"] = data.isPublic;
    if (data.isPublished !== undefined) patch["isPublished"] = data.isPublished;

    // Hierarchy-changing fields go through full validation first (atomic:
    // nothing is written until the entire new hierarchy is proven valid).
    let nextProjectId: string | null = page.projectId;
    if (data.projectId !== undefined) {
      if (data.projectId === null) {
        nextProjectId = null;
      } else {
        const project = await this.projectRepo.findById(data.projectId);
        if (!project || project.workspaceId !== page.workspaceId) {
          throw new HttpError(
            "Project does not belong to this workspace",
            400
          );
        }
        nextProjectId = project.id;
      }
      patch["projectId"] = nextProjectId;
    }
    if (data.parentId !== undefined) {
      await this.validateParent(
        pageId,
        data.parentId,
        page.workspaceId,
        nextProjectId
      );
      patch["parentId"] = data.parentId;
    }

    return await this.pageRepo.update(patch as any, pageId);
  };

  // MOVE (parent + reorder among siblings, validated before any write)
  movePage = async (pageId: string, data: MovePageBody, userId: string) => {
    const page = (await this.assertWriteAccess(pageId, userId)) as any;

    const nextParentId = data.parentId ?? null;
    let nextProjectId: string | null = page.projectId;
    if (data.projectId !== undefined) {
      if (data.projectId === null || data.projectId === undefined) {
        // keep current unless explicitly nulled via update endpoint
      } else {
        const project = await this.projectRepo.findById(data.projectId);
        if (!project || project.workspaceId !== page.workspaceId) {
          throw new HttpError(
            "Project does not belong to this workspace",
            400
          );
        }
        nextProjectId = project.id;
      }
    }

    // Validate entire hierarchy BEFORE changing anything.
    const parent = await this.validateParent(
      pageId,
      nextParentId,
      page.workspaceId,
      nextProjectId
    );
    const effectiveProjectId =
      nextProjectId ?? (parent ? parent.projectId : page.projectId) ?? null;

    const updated = await this.pageRepo.update(
      {
        parentId: nextParentId,
        projectId: effectiveProjectId,
      } as any,
      pageId
    );

    // Reorder among the new siblings when a position is supplied.
    if (data.position !== undefined) {
      const siblings = (await this.pageRepo.list({
        workspaceId: page.workspaceId,
        projectId: effectiveProjectId ?? undefined,
        parentId: nextParentId,
        includeArchived: true,
      })) as any[];
      const ids = siblings.map((s: any) => s.id).filter((id: string) => id !== pageId);
      const pos = Math.max(0, Math.min(data.position, ids.length));
      ids.splice(pos, 0, pageId);
      await this.pageRepo.reorderSiblings(ids);
    }

    return updated;
  };

  reorderPages = async (data: ReorderPagesBody, userId: string) => {
    if (!data.orderedIds || data.orderedIds.length === 0) {
      throw new HttpError("orderedIds is required", 400);
    }
    const first = (await this.pageRepo.findPageById(
      data.orderedIds[0] as string
    )) as any;
    if (!first) throw new PageNotFoundError();
    await this.assertWritable(first.workspaceId, userId);

    // Validate the whole sibling set before persisting (atomic intent):
    // every id must exist and share workspace + project + parent.
    const rows: any[] = [];
    for (const id of data.orderedIds) {
      const row = (await this.pageRepo.findPageById(id)) as any;
      if (!row) throw new PageNotFoundError();
      rows.push(row);
    }
    for (const row of rows) {
      if (
        row.workspaceId !== first.workspaceId ||
        (row.projectId ?? null) !== (first.projectId ?? null) ||
        (row.parentId ?? null) !== (first.parentId ?? null)
      ) {
        throw new HttpError(
          "All pages must share the same parent scope to reorder",
          400
        );
      }
    }
    await this.pageRepo.reorderSiblings(data.orderedIds);
    return await this.pageRepo.list({
      workspaceId: first.workspaceId,
      projectId: first.projectId ?? undefined,
      parentId: first.parentId ?? null,
      includeArchived: true,
    });
  };

  // DUPLICATE (new ids, preserved metadata/blocks/ordering, hierarchy-safe)
  duplicatePage = async (
    pageId: string,
    userId: string,
    opts?: DuplicatePageBody
  ) => {
    const source = (await this.assertWriteAccess(pageId, userId)) as any;
    const blocks = await this.blockRepo.listByPage(pageId);

    const parentId = opts?.parentId !== undefined ? opts.parentId : source.parentId;
    await this.validateParent(
      null,
      parentId ?? null,
      source.workspaceId,
      source.projectId
    );

    const title = opts?.title
      ? normalizePageTitle(opts.title)
      : `${source.title || "Untitled"} copy`;

    // Prisma 8 has no nested-write shortcut for this shape, so duplicate
    // with sequential flat writes: page first, then its blocks with new ids.
    const copy = await this.pageRepo.create(
      {
        workspaceId: source.workspaceId,
        projectId: source.projectId,
        parentId: parentId ?? null,
        title,
        icon: source.icon ?? null,
        cover: source.cover ?? null,
        description: source.description ?? null,
      } as any,
      userId
    );

    // Preserve block ordering + nesting. Old parent ids -> new parent ids.
    const blockIdMap = new Map<string, string>();
    const roots = blocks
      .filter((b: any) => !b.parentId)
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
    const nested = blocks.filter((b: any) => b.parentId);

    for (const b of [...roots, ...nested] as any[]) {
      const created = await this.blockRepo.create({
        pageId: (copy as any).id,
        type: b.type,
        content: b.content ?? {},
        parentId: b.parentId ? (blockIdMap.get(b.parentId) ?? null) : null,
        position: b.position ?? 0,
      });
      blockIdMap.set(b.id, (created as any).id);
    }

    // Recursively duplicate child pages so the hierarchy is preserved.
    const children = await this.pageRepo.findChildren(pageId, true);
    for (const child of children as any[]) {
      await this.duplicateInto(child.id, (copy as any).id, userId);
    }

    return copy;
  };

  private duplicateInto = async (
    sourcePageId: string,
    newParentId: string,
    userId: string
  ): Promise<void> => {
    const source = (await this.pageRepo.findPageById(sourcePageId)) as any;
    if (!source) return;
    const blocks = await this.blockRepo.listByPage(sourcePageId);
    const copy = await this.pageRepo.create(
      {
        workspaceId: source.workspaceId,
        projectId: source.projectId,
        parentId: newParentId,
        title: source.title || "Untitled",
        icon: source.icon ?? null,
        cover: source.cover ?? null,
        description: (source as any).description ?? null,
      } as any,
      userId
    );
    const blockIdMap = new Map<string, string>();
    for (const b of blocks as any[]) {
      const created = await this.blockRepo.create({
        pageId: (copy as any).id,
        type: b.type,
        content: b.content ?? {},
        parentId: b.parentId ? (blockIdMap.get(b.parentId) ?? null) : null,
        position: b.position ?? 0,
      });
      blockIdMap.set(b.id, (created as any).id);
    }
    const children = await this.pageRepo.findChildren(sourcePageId, true);
    for (const child of children as any[]) {
      await this.duplicateInto(child.id, (copy as any).id, userId);
    }
  };

  // FAVORITE (persisted flag)
  favoritePage = async (pageId: string, userId: string) => {
    await this.assertWriteAccess(pageId, userId);
    return await this.pageRepo.update({ isFavorite: true } as any, pageId);
  };

  unfavoritePage = async (pageId: string, userId: string) => {
    await this.assertWriteAccess(pageId, userId);
    return await this.pageRepo.update({ isFavorite: false } as any, pageId);
  };

  // ARCHIVE / RESTORE (soft, retains blocks + content, safe re-entry)
  archivePage = async (pageId: string, userId: string) => {
    await this.assertWriteAccess(pageId, userId);
    return await this.pageRepo.update({ isArchived: true } as any, pageId);
  };

  restorePage = async (pageId: string, userId: string) => {
    const page = (await this.assertWriteAccess(pageId, userId)) as any;
    // Restore safely: if the old parent is gone/archived/inaccessible,
    // restore to root instead of orphaning or resurrecting a bad hierarchy.
    let parentId: string | null = page.parentId;
    if (parentId) {
      const parent = (await this.pageRepo.findPageById(parentId)) as any;
      if (!parent || parent.isArchived || parent.workspaceId !== page.workspaceId) {
        parentId = null;
      } else {
        const descendants = await this.pageRepo.findDescendantIds(pageId);
        if (descendants.includes(parentId)) parentId = null;
      }
    }
    return await this.pageRepo.update(
      { isArchived: false, parentId } as any,
      pageId
    );
  };

  // DELETE (DB cascades children + blocks; never orphans)
  deletePage = async (pageId: string, userId: string) => {
    await this.assertWriteAccess(pageId, userId);
    await this.pageRepo.deletePage(pageId);
  };

  // Helper used by block service to avoid circular imports.
  resolveBlockType = (t: string) => apiBlockTypeToDb(t);
}

export const PageService = pageServiceClass;
export type PageService = pageServiceClass;
