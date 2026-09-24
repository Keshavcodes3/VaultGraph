import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { projectKeys } from "@/lib/query/query-keys";
import type { Project } from "./types";

export type UpdateProjectInput = {
  projectId: string;
  workspaceId: string;
  patch: {
    name?: string;
    slug?: string;
  };
};

/** Rename / re-slug a project, then refresh its caches. */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProjectInput) =>
      api.patch<{ project: Project }>(
        `/api/projects/${encodeURIComponent(input.projectId)}`,
        input.patch
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.byWorkspace(variables.workspaceId),
      });
    },
  });
}
