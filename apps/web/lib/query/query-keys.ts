/** Centralized TanStack Query keys. */
export const authKeys = {
  all: ["auth"] as const,
  me: ["auth", "me"] as const,
};

export const workspaceKeys = {
  all: ["workspaces"] as const,
  detail: (workspaceId: string) =>
    [...workspaceKeys.all, "detail", workspaceId] as const,
};

export const projectKeys = {
  all: ["projects"] as const,
  byWorkspace: (workspaceId: string) =>
    [...projectKeys.all, "workspace", workspaceId] as const,
  detail: (projectId: string) =>
    [...projectKeys.all, "detail", projectId] as const,
};

/** Page + Block query keys (Notion-style hierarchy, focused fetches). */
export const pageKeys = {
  all: ["pages"] as const,
  list: (filters: Record<string, string | undefined>) =>
    [...pageKeys.all, "list", filters] as const,
  detail: (pageId: string) => [...pageKeys.all, "detail", pageId] as const,
  tree: (scope: Record<string, string | undefined>) =>
    [...pageKeys.all, "tree", scope] as const,
};

export const blockKeys = {
  all: ["blocks"] as const,
  byPage: (pageId: string) => [...blockKeys.all, "page", pageId] as const,
  detail: (blockId: string) => [...blockKeys.all, "detail", blockId] as const,
};
