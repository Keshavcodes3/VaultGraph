import { api } from "./client";

/** Mirror of the API's Page shapes (dates arrive as ISO strings). */
export type ApiPage = {
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
};

export type ApiPageTreeNode = ApiPage & {
  children: ApiPageTreeNode[];
};

export type CreatePageInput = {
  workspaceId: string;
  projectId?: string | null;
  parentId?: string | null;
  title?: string;
  icon?: string | null;
  cover?: string | null;
  description?: string | null;
};

export type UpdatePageInput = {
  title?: string;
  icon?: string | null;
  cover?: string | null;
  description?: string | null;
  parentId?: string | null;
  projectId?: string | null;
  position?: number;
  isFavorite?: boolean;
  isArchived?: boolean;
  isPublic?: boolean;
};

const BASE = "/api/v1/pages";

function qs(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, v);
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

/** Page API — versioned endpoints, focused fetches (no whole-workspace load). */
export const pagesApi = {
  create: (input: CreatePageInput) =>
    api.postJson<{ page: ApiPage }>(BASE, input),

  list: (filters: {
    workspaceId?: string;
    projectId?: string;
    parentId?: string;
    archived?: boolean;
    favorites?: boolean;
  }) =>
    api.get<{ pages: ApiPage[]; total: number }>(
      `${BASE}${qs({
        workspaceId: filters.workspaceId,
        projectId: filters.projectId,
        parentId: filters.parentId,
        archived: filters.archived ? "true" : undefined,
        favorites: filters.favorites ? "true" : undefined,
      })}`
    ),

  tree: (scope: { workspaceId?: string; projectId?: string }) =>
    api.get<{ tree: ApiPageTreeNode[] }>(
      `${BASE}/tree${qs({
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
      })}`
    ),

  get: (pageId: string) =>
    api.get<{
      page: ApiPage;
      blocks: import("./blocks").ApiBlock[];
      ancestors: ApiPage[];
      children: ApiPage[];
    }>(`${BASE}/${encodeURIComponent(pageId)}`),

  update: (pageId: string, patch: UpdatePageInput) =>
    api.patchJson<{ page: ApiPage }>(
      `${BASE}/${encodeURIComponent(pageId)}`,
      patch
    ),

  move: (
    pageId: string,
    input: { parentId: string | null; projectId?: string; position?: number }
  ) =>
    api.postJson<{ page: ApiPage }>(
      `${BASE}/${encodeURIComponent(pageId)}/move`,
      input
    ),

  reorder: (orderedIds: string[]) =>
    api.postJson<{ pages: ApiPage[] }>(`${BASE}/reorder`, { orderedIds }),

  duplicate: (pageId: string, input?: { parentId?: string | null; title?: string }) =>
    api.postJson<{ page: ApiPage }>(
      `${BASE}/${encodeURIComponent(pageId)}/duplicate`,
      input ?? {}
    ),

  favorite: (pageId: string) =>
    api.postJson<{ page: ApiPage }>(
      `${BASE}/${encodeURIComponent(pageId)}/favorite`,
      {}
    ),

  unfavorite: (pageId: string) =>
    api.remove<{ page: ApiPage }>(
      `${BASE}/${encodeURIComponent(pageId)}/favorite`
    ),

  archive: (pageId: string) =>
    api.postJson<{ page: ApiPage }>(
      `${BASE}/${encodeURIComponent(pageId)}/archive`,
      {}
    ),

  restore: (pageId: string) =>
    api.postJson<{ page: ApiPage }>(
      `${BASE}/${encodeURIComponent(pageId)}/restore`,
      {}
    ),

  remove: (pageId: string) =>
    api.remove<{ message: string; pageId: string }>(
      `${BASE}/${encodeURIComponent(pageId)}`
    ),
};
