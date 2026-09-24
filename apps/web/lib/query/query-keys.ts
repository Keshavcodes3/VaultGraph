/** Centralized TanStack Query keys. */
export const authKeys = {
  all: ["auth"] as const,
  me: ["auth", "me"] as const,
};

export const projectKeys = {
  all: ["projects"] as const,
  byWorkspace: (workspaceId: string) =>
    [...projectKeys.all, "workspace", workspaceId] as const,
  detail: (projectId: string) =>
    [...projectKeys.all, "detail", projectId] as const,
};
