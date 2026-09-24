// pages.types.ts
import { z } from "zod";

export type PageId = string;
export type ProjectId = string;
export type WorkspaceId = string;
export type UserId = string;

export type PageIcon = string | null;

export type PageStatus =
  | "ACTIVE"
  | "ARCHIVED"
  | "DELETED";

export interface Page {
  id: PageId;

  workspaceId: WorkspaceId;
  projectId: ProjectId;
  ownerId:string,
  parentPageId: PageId | null;
  title: string;
  icon: PageIcon;

  status: PageStatus;

  createdBy: UserId;
  updatedBy: UserId | null;

  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

/* -------------------------------------------------------------------------- */
/* INPUTS                                                                     */
/* -------------------------------------------------------------------------- */

export interface CreatePageInput {
  workspaceId: WorkspaceId;
  projectId: ProjectId;

  parentPageId?: PageId | null;

  title?: string;
  icon?: PageIcon;
}

export interface UpdatePageInput {
  title?: string;
  icon?: PageIcon;

  parentPageId?: PageId | null;
}

export interface MovePageInput {
  parentPageId: PageId | null;
  projectId?: ProjectId;
}

/* -------------------------------------------------------------------------- */
/* QUERIES                                                                    */
/* -------------------------------------------------------------------------- */

export interface GetPageInput {
  pageId: PageId;
}

export interface ListPagesInput {
  workspaceId: WorkspaceId;
  projectId?: ProjectId;
  parentPageId?: PageId | null;

  status?: PageStatus;
}

export interface SearchPagesInput {
  workspaceId: WorkspaceId;

  query: string;

  projectId?: ProjectId;
  limit?: number;
  cursor?: string;
}

/* -------------------------------------------------------------------------- */
/* RESPONSES                                                                  */
/* -------------------------------------------------------------------------- */

export interface PageListItem {
  id: PageId;

  projectId: ProjectId;
  parentPageId: PageId | null;

  title: string;
  icon: PageIcon;

  status: PageStatus;

  createdAt: Date;
  updatedAt: Date;
}

export interface PageTreeItem extends PageListItem {
  children: PageTreeItem[];
}

export interface PageWithChildren extends Page {
  children: PageListItem[];
}

/* -------------------------------------------------------------------------- */
/* PAGINATION                                                                 */
/* -------------------------------------------------------------------------- */

export interface PagePagination {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginatedPages {
  pages: PageListItem[];
  pagination: PagePagination;
}

/* -------------------------------------------------------------------------- */
/* SERVICE / REPOSITORY CONTRACTS                                             */
/* -------------------------------------------------------------------------- */

export interface PageRepository {
  create(input: CreatePageInput, userId: UserId): Promise<Page>;

  findById(
    pageId: PageId,
    userId: UserId
  ): Promise<Page | null>;

  findByProject(
    projectId: ProjectId,
    userId: UserId
  ): Promise<PageListItem[]>;

  findChildren(
    parentPageId: PageId | null,
    projectId: ProjectId,
    userId: UserId
  ): Promise<PageListItem[]>;

  search(
    input: SearchPagesInput,
    userId: UserId
  ): Promise<PaginatedPages>;

  update(
    pageId: PageId,
    input: UpdatePageInput,
    userId: UserId
  ): Promise<Page>;

  move(
    pageId: PageId,
    input: MovePageInput,
    userId: UserId
  ): Promise<Page>;

  archive(
    pageId: PageId,
    userId: UserId
  ): Promise<Page>;

  delete(
    pageId: PageId,
    userId: UserId
  ): Promise<void>;
}

export interface PageService {
  createPage(
    input: CreatePageInput,
    userId: UserId
  ): Promise<Page>;

  getPage(
    pageId: PageId,
    userId: UserId
  ): Promise<Page>;

  getProjectPages(
    projectId: ProjectId,
    userId: UserId
  ): Promise<PageListItem[]>;

  getPageTree(
    projectId: ProjectId,
    userId: UserId
  ): Promise<PageTreeItem[]>;

  updatePage(
    pageId: PageId,
    input: UpdatePageInput,
    userId: UserId
  ): Promise<Page>;

  movePage(
    pageId: PageId,
    input: MovePageInput,
    userId: UserId
  ): Promise<Page>;

  archivePage(
    pageId: PageId,
    userId: UserId
  ): Promise<Page>;

  deletePage(
    pageId: PageId,
    userId: UserId
  ): Promise<void>;

  searchPages(
    input: SearchPagesInput,
    userId: UserId
  ): Promise<PaginatedPages>;
}

/* -------------------------------------------------------------------------- */
/* PRISMA 8 PAGE + BLOCK API CONTRACTS                                        */
/*                                                                            */
/* Aligned with apps/api/src/prisma/contract.prisma (Page/Block models).      */
/* Existing legacy types above are preserved for backwards compatibility.     */
/* New API types below use the Prisma field names: parentId (not             */
/* parentPageId), description, position, isFavorite, isArchived, isPublic,    */
/* createdBy. Block content is Json (flexible) with a shared BlockType.       */
/* -------------------------------------------------------------------------- */

/** Database-level block types (Prisma BlockType enum, extended, non-breaking). */
export const DB_BLOCK_TYPES = [
  "TEXT",
  "HEADING",
  "PARAGRAPH",
  "TODO",
  "BULLET",
  "BULLETED_LIST",
  "NUMBERED_LIST",
  "CODE",
  "QUOTE",
  "DIVIDER",
  "IMAGE",
  "FILE",
  "LINK",
  "BOOKMARK",
  "CALLOUT",
] as const;

export type DbBlockType = (typeof DB_BLOCK_TYPES)[number];

/**
 * API-level block types (lowercase, extensible). This is the shared
 * vocabulary used by frontend + backend instead of scattered literals.
 * Covers the required starter set: paragraph, heading, todo,
 * bulleted_list, numbered_list, quote, code, callout, divider, image,
 * bookmark. Extra frontend-only types (h1/h2/toggle/table/…) map onto
 * HEADING/PARAGRAPH/CALLOUT storage via the mapper below.
 */
export const API_BLOCK_TYPES = [
  "paragraph",
  "heading",
  "todo",
  "bulleted_list",
  "numbered_list",
  "quote",
  "code",
  "callout",
  "divider",
  "image",
  "bookmark",
] as const;

export type BlockType = (typeof API_BLOCK_TYPES)[number];

/** Loose content shape stored in Block.content (Json). */
export type BlockContent = {
  text?: string;
  checked?: boolean;
  language?: string;
  url?: string;
  fileName?: string;
  fileSize?: string;
  tableCells?: string[][];
  level?: number;
  [key: string]: unknown;
};

export interface Block {
  id: string;
  pageId: string;
  parentId: string | null;
  type: DbBlockType;
  content: BlockContent;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlockResponse {
  id: string;
  pageId: string;
  parentId: string | null;
  type: DbBlockType;
  apiType: BlockType;
  content: BlockContent;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse {
  id: string;
  workspaceId: string;
  projectId: string | null;
  parentId: string | null;
  title: string;
  slug: string | null;
  icon: string | null;
  cover: string | null;
  description: string | null;
  position: number;
  isPublished: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  isPublic: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageTreeNode extends PageResponse {
  children: PageTreeNode[];
}

export type PageTree = PageTreeNode[];

export interface PageWithBlocksResponse {
  page: PageResponse;
  blocks: BlockResponse[];
  ancestors: PageResponse[];
  children: PageResponse[];
}

const uuid = z.string().uuid("Invalid ID");

export const createPageSchema = z.object({
  workspaceId: uuid,
  projectId: uuid.nullish(),
  parentId: uuid.nullish(),
  title: z.string().trim().min(1).max(200).default("Untitled"),
  icon: z.string().max(50).nullish(),
  cover: z.string().max(500).nullish(),
  description: z.string().max(2000).nullish(),
});

export const updatePageSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  icon: z.string().max(50).nullable().optional(),
  cover: z.string().max(500).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  parentId: uuid.nullable().optional(),
  projectId: uuid.nullable().optional(),
  position: z.number().int().min(0).optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export const movePageSchema = z.object({
  parentId: uuid.nullable(),
  projectId: uuid.optional(),
  position: z.number().int().min(0).optional(),
});

export const duplicatePageSchema = z.object({
  parentId: uuid.nullish(),
  title: z.string().trim().min(1).max(200).optional(),
});

export const reorderPagesSchema = z.object({
  orderedIds: z.array(uuid).min(1).max(200),
});

export const listPagesQuerySchema = z.object({
  workspaceId: uuid.optional(),
  projectId: uuid.optional(),
  parentId: z.string().optional(),
  archived: z.enum(["true", "false"]).optional(),
  favorites: z.enum(["true", "false"]).optional(),
});

export const createBlockSchema = z.object({
  type: z.enum(DB_BLOCK_TYPES).or(z.enum(API_BLOCK_TYPES)),
  content: z.record(z.string(), z.unknown()).default({}),
  parentId: uuid.nullish(),
  position: z.number().int().min(0).optional(),
});

export const updateBlockSchema = z.object({
  type: z.enum(DB_BLOCK_TYPES).or(z.enum(API_BLOCK_TYPES)).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  parentId: uuid.nullable().optional(),
  position: z.number().int().min(0).optional(),
});

export const reorderBlocksSchema = z.object({
  orderedIds: z.array(uuid).min(1).max(500),
});

export const moveBlockSchema = z.object({
  parentId: uuid.nullable(),
  position: z.number().int().min(0).optional(),
});

export type CreatePageBody = z.infer<typeof createPageSchema>;
export type UpdatePageBody = z.infer<typeof updatePageSchema>;
export type MovePageBody = z.infer<typeof movePageSchema>;
export type DuplicatePageBody = z.infer<typeof duplicatePageSchema>;
export type ReorderPagesBody = z.infer<typeof reorderPagesSchema>;
export type ListPagesQuery = z.infer<typeof listPagesQuerySchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type ReorderBlocksBody = z.infer<typeof reorderBlocksSchema>;
export type MoveBlockBody = z.infer<typeof moveBlockSchema>;

/** Map API (lowercase) block type -> DB (uppercase) enum. Extensible. */
export const apiBlockTypeToDb = (t: string): DbBlockType => {
  const normalized = t.trim().toLowerCase();
  switch (normalized) {
    case "paragraph":
      return "PARAGRAPH";
    case "heading":
    case "h1":
    case "h2":
    case "h3":
      return "HEADING";
    case "todo":
    case "checkbox":
      return "TODO";
    case "bulleted_list":
    case "bullet":
      return "BULLETED_LIST";
    case "numbered_list":
    case "numbered":
      return "NUMBERED_LIST";
    case "quote":
      return "QUOTE";
    case "code":
      return "CODE";
    case "callout":
      return "CALLOUT";
    case "divider":
      return "DIVIDER";
    case "image":
      return "IMAGE";
    case "bookmark":
    case "link":
      return "BOOKMARK";
    case "file":
      return "FILE";
    case "toggle":
      return "CALLOUT";
    case "table":
    case "database":
    case "video":
      return "TEXT";
    default: {
      const upper = t.trim().toUpperCase();
      if ((DB_BLOCK_TYPES as readonly string[]).includes(upper)) {
        return upper as DbBlockType;
      }
      return "PARAGRAPH";
    }
  }
};

/** Map DB (uppercase) block type -> API (lowercase) type. */
export const dbBlockTypeToApi = (t: string): BlockType => {
  switch (t.toUpperCase()) {
    case "HEADING":
      return "heading";
    case "TODO":
      return "todo";
    case "BULLET":
    case "BULLETED_LIST":
      return "bulleted_list";
    case "NUMBERED_LIST":
      return "numbered_list";
    case "QUOTE":
      return "quote";
    case "CODE":
      return "code";
    case "CALLOUT":
      return "callout";
    case "DIVIDER":
      return "divider";
    case "IMAGE":
      return "image";
    case "BOOKMARK":
    case "LINK":
    case "FILE":
      return "bookmark";
    case "PARAGRAPH":
    case "TEXT":
    default:
      return "paragraph";
  }
};
