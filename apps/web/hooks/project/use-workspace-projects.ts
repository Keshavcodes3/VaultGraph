import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { projectKeys } from "@/lib/query/query-keys";
import type { Project } from "./types";

/**
 * All projects of a workspace. Enabled only once a workspace
 * is selected, so guests never fire the request.
 */
export function useWorkspaceProjects(workspaceId: string | null) {
  return useQuery({
    queryKey: workspaceId
      ? projectKeys.byWorkspace(workspaceId)
      : projectKeys.all,
    queryFn: async () => {
      const { projects } = await api.get<{ projects: Project[] }>(
        `/api/projects?workspaceId=${encodeURIComponent(workspaceId ?? "")}`
      );
      return projects;
    },
    enabled: Boolean(workspaceId),
  });
}
