import { db } from "../../../prisma/db";
import { nowInstant } from "../../../prisma/timestamps";
import { workspaceRepoClass } from "../../Workspace/Repostiary/workspace.repositary";
import { projectRepoClass } from "../../Projects/Repositary/project.repo";
import { AuthRepository } from "../../auth/repositary/auth.repo";
import type {
  CreatePageInput,
  UpdatePageInput,
} from "@vaultgraph/shared/pages-types";

/**
 * Page repository — Prisma 8 query API only.
 *
 * Follows the existing VaultGraph repository conventions:
 * Route -> Controller -> Service -> Repository -> Prisma 8 -> PostgreSQL.
 *
 * Notes on Prisma 8:
 * - Uses `db.orm.public.Page` with `.create()`, `.first()`,
 *   `.where().all()`, `.where().update()`, `.where().delete()`.
 * - No legacy `@prisma/client` / `PrismaClient` / nested writes are used.
 *   Hierarchy operations (move/duplicate/reorder) validate first, then issue
 *   sequential flat writes. Child pages + blocks cascade at the database
 *   level (onDelete: Cascade in contract.prisma).
 * - `timestamptz` columns require `Temporal.Instant` via `nowInstant()`.
 * - New contract columns (description, position, isFavorite, isArchived,
 *   isPublic, createdBy) are written with `as any` casts so this file stays
 *   type-compatible until `prisma contract emit` regenerates
 *   contract.json / contract.d.ts (requires a CLI run, intentionally not
 *   executed here).
 */

export type PageRow = Awaited<
  ReturnType<typeof db.orm.public.Page.first>
> extends infer T
  ? T
  : never;

export type PageListFilter = {
  workspaceId?: string;
  projectId?: string | null;
  parentId?: string | null | undefined;
  includeArchived?: boolean;
  favoritesOnly?: boolean;
};

export class pageRepositaryClass {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly projectRepo: projectRepoClass,
    private readonly workspaceRepo: workspaceRepoClass,
    private readonly pagesRepo = db.orm.public.Page
  ) {}

  create = async (
    data: CreatePageInput & {
      workspaceId: string;
      projectId?: string | null;
      parentPageId?: string | null;
      parentId?: string | null;
      title?: string;
      icon?: string | null;
      cover?: string | null;
      description?: string | null;
      position?: number;
      createdBy?: string;
    },
    createdById?: string
  ) => {
    const position =
      data.position ??
      (await this.nextSiblingPosition(
        data.workspaceId,
        (data.projectId as string | null | undefined) ?? null,
        (data.parentId ?? data.parentPageId ?? null) as string | null
      ));

    const page = await (this.pagesRepo as any).create({
      workspaceId: data.workspaceId,
      projectId: (data.projectId as string | null | undefined) ?? null,
      parentId:
        ((data.parentId ?? data.parentPageId ?? null) as string | null) ??
        null,
      title: (data.title as string | undefined) ?? "Untitled",
      icon: (data.icon as string | null | undefined) ?? null,
      cover: (data.cover as string | null | undefined) ?? null,
      description: (data.description as string | null | undefined) ?? null,
      position,
      isFavorite: false,
      isArchived: false,
      isPublic: false,
      isPublished: false,
      createdBy: createdById ?? (data.createdBy as string | undefined) ?? null,
      updatedAt: nowInstant(),
    });
    return page;
  };

  findPageById = async (id: string) => {
    return await this.pagesRepo.first({
      id: id,
    } as any);
  };

  /** Preserved legacy helper: pages of a project (excludes archived). */
  findPagesByProject = async (projectId: string) => {
    const pages = await (this.pagesRepo as any)
      .where({
        projectId: projectId,
      })
      .all();
    return (pages as any[]).filter((p) => !(p as any).isArchived);
  };

  findPagesBySlug = async (slug: string) => {
    return await this.pagesRepo.first({
      slug: slug,
    } as any);
  };

  /** Preserved legacy helper: direct children of a parent page. */
  findPagesByParent = async (parentPageId: string) => {
    const pages = await (this.pagesRepo as any)
      .where({
        parentId: parentPageId,
      })
      .all();
    return pages;
  };

  /** General filtered list. Normal navigation excludes archived pages. */
  list = async (filter: PageListFilter) => {
    const where: Record<string, unknown> = {};
    if (filter.workspaceId) where["workspaceId"] = filter.workspaceId;
    if (filter.projectId !== undefined)
      where["projectId"] = filter.projectId as string | null;
    if (filter.parentId !== undefined)
      where["parentId"] = filter.parentId as string | null;

    const rows = (await (this.pagesRepo as any).where(where).all()) as any[];

    let out = rows;
    if (!filter.includeArchived) {
      out = out.filter((p) => !p.isArchived);
    }
    if (filter.favoritesOnly) {
      out = out.filter((p) => p.isFavorite);
    }
    // Persistent sibling ordering. Never depend on insertion order.
    out.sort(
      (a, b) =>
        ((a.position as number | undefined) ?? 0) -
          ((b.position as number | undefined) ?? 0) ||
        String(a.createdAt).localeCompare(String(b.createdAt))
    );
    return out;
  };

  findRootPages = async (
    workspaceId: string,
    projectId?: string | null,
    includeArchived = false
  ) => {
    return await this.list({
      workspaceId,
      projectId: projectId ?? null,
      parentId: null,
      includeArchived,
    });
  };

  findChildren = async (parentId: string, includeArchived = false) => {
    const rows = (await (this.pagesRepo as any)
      .where({ parentId })
      .all()) as any[];
    const out = includeArchived
      ? rows
      : rows.filter((p) => !p.isArchived);
    out.sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );
    return out;
  };

  /** Ancestors from root -> direct parent. Used for breadcrumb context. */
  findAncestors = async (pageId: string) => {
    const chain: any[] = [];
    const seen = new Set<string>();
    let current = (await this.findPageById(pageId)) as any;
    let guard = 0;
    while (current?.parentId && guard < 100) {
      guard += 1;
      if (seen.has(current.parentId)) break;
      seen.add(current.parentId);
      const parent = (await this.findPageById(
        current.parentId
      )) as any;
      if (!parent) break;
      chain.unshift(parent);
      current = parent;
    }
    return chain;
  };

  findDescendantIds = async (pageId: string): Promise<string[]> => {
    const ids: string[] = [];
    const queue: string[] = [pageId];
    const seen = new Set<string>([pageId]);
    let guard = 0;
    while (queue.length > 0 && guard < 5000) {
      guard += 1;
      const currentId = queue.shift() as string;
      const children = (await (this.pagesRepo as any)
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

  nextSiblingPosition = async (
    workspaceId: string,
    projectId: string | null,
    parentId: string | null
  ): Promise<number> => {
    const where: Record<string, unknown> = { workspaceId, parentId };
    // projectId null vs set matters for scoping; only filter when set.
    if (projectId !== null && projectId !== undefined) {
      where["projectId"] = projectId;
    }
    const siblings = (await (this.pagesRepo as any)
      .where(where)
      .all()) as any[];
    if (siblings.length === 0) return 0;
    const max = siblings.reduce(
      (m: number, p: any) =>
        Math.max(m, typeof p.position === "number" ? p.position : 0),
      0
    );
    return max + 1;
  };

  /** Persist sibling ordering for the given ordered ids (renumbers 0..n). */
  reorderSiblings = async (orderedIds: string[]) => {
    for (let i = 0; i < orderedIds.length; i += 1) {
      await (this.pagesRepo as any)
        .where({ id: orderedIds[i] })
        .update({ position: i, updatedAt: nowInstant() } as any);
    }
  };

  update = async (data: UpdatePageInput & Record<string, unknown>, pageId: string) => {
    // Map legacy parentPageId -> parentId without dropping either.
    const patch: Record<string, unknown> = { ...(data as object) };
    if (
      (patch["parentPageId"] as string | null | undefined) !== undefined &&
      patch["parentId"] === undefined
    ) {
      patch["parentId"] = patch["parentPageId"];
    }
    delete patch["parentPageId"];
    delete patch["workspaceId"];
    delete patch["createdBy"];
    delete patch["id"];
    delete patch["createdAt"];

    const page = await (this.pagesRepo as any)
      .where({
        id: pageId,
      })
      .update({ ...patch, updatedAt: nowInstant() } as any);
    return page;
  };

  deletePage = async (pageId: string) => {
    // Children + blocks cascade at the DB level (onDelete: Cascade).
    await (this.pagesRepo as any)
      .where({
        id: pageId,
      })
      .delete();
  };

  /** Backwards-compatible alias. */
  delete = this.deletePage;

  countByWorkspace = async (workspaceId: string) => {
    return await (this.pagesRepo as any)
      .where({ workspaceId })
      .count();
  };

  private doPageExist = async (pageId: string) => {
    const page = await this.findPageById(pageId);
    if (page) return true;
    return false;
  };

  /** Public existence check (wraps the preserved private helper). */
  exists = async (pageId: string) => {
    return await this.doPageExist(pageId);
  };
}

/** Backwards-compatible alias with conventional casing. */
export const PageRepository = pageRepositaryClass;
export type PageRepository = pageRepositaryClass;
