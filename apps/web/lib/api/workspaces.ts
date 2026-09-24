import { api } from "./client";

/** Mirror of the API's Workspace shape (dates arrive as ISO strings). */
export type ApiWorkspace = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkspaceInput = {
  name: string;
  slug?: string;
};

export type UpdateWorkspaceInput = {
  name?: string;
  slug?: string;
};

const BASE = "/api/workspaces";

/** Workspace API — the authenticated user's own workspaces. */
export const workspacesApi = {
  list: () => api.get<ApiWorkspace[]>(BASE),

  get: (workspaceId: string) =>
    api.get<ApiWorkspace>(`${BASE}/${encodeURIComponent(workspaceId)}`),

  create: (input: CreateWorkspaceInput) =>
    api.postJson<ApiWorkspace>(BASE, input),

  update: (workspaceId: string, patch: UpdateWorkspaceInput) =>
    api.patchJson<ApiWorkspace>(
      `${BASE}/${encodeURIComponent(workspaceId)}`,
      patch
    ),

  remove: (workspaceId: string) =>
    api.remove<{ message: string }>(
      `${BASE}/${encodeURIComponent(workspaceId)}`
    ),
};
