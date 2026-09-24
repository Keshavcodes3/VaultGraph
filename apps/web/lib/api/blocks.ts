import { api } from "./client";

/** Mirror of the API's Block shapes (content is Json, dates are ISO strings). */
export type ApiBlock = {
  id: string;
  pageId: string;
  parentId: string | null;
  type: string;
  content: Record<string, unknown>;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateBlockInput = {
  type: string;
  content?: Record<string, unknown>;
  parentId?: string | null;
  position?: number;
};

export type UpdateBlockInput = {
  type?: string;
  content?: Record<string, unknown>;
  parentId?: string | null;
  position?: number;
};

const PAGES_BASE = "/api/v1/pages";
const BLOCKS_BASE = "/api/v1/blocks";

/** Block API — every call is page-scoped on the server (access verified). */
export const blocksApi = {
  create: (pageId: string, input: CreateBlockInput) =>
    api.postJson<{ block: ApiBlock }>(
      `${PAGES_BASE}/${encodeURIComponent(pageId)}/blocks`,
      input
    ),

  list: (pageId: string) =>
    api.get<{ blocks: ApiBlock[]; total: number }>(
      `${PAGES_BASE}/${encodeURIComponent(pageId)}/blocks`
    ),

  get: (blockId: string) =>
    api.get<{ block: ApiBlock }>(
      `${BLOCKS_BASE}/${encodeURIComponent(blockId)}`
    ),

  update: (blockId: string, patch: UpdateBlockInput) =>
    api.patchJson<{ block: ApiBlock }>(
      `${BLOCKS_BASE}/${encodeURIComponent(blockId)}`,
      patch
    ),

  move: (
    blockId: string,
    input: { parentId: string | null; position?: number }
  ) =>
    api.postJson<{ block: ApiBlock }>(
      `${BLOCKS_BASE}/${encodeURIComponent(blockId)}/move`,
      input
    ),

  reorder: (pageId: string, orderedIds: string[]) =>
    api.postJson<{ blocks: ApiBlock[] }>(
      `${PAGES_BASE}/${encodeURIComponent(pageId)}/blocks/reorder`,
      { orderedIds }
    ),

  remove: (blockId: string) =>
    api.remove<{ message: string; blockId: string }>(
      `${BLOCKS_BASE}/${encodeURIComponent(blockId)}`
    ),
};
