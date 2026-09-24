import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { projectKeys } from "@/lib/query/query-keys";

export type DeleteProjectInput = {
  projectId: string;
  workspaceId: string;
};

/** Delete a project, then refresh that workspace's list. */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId }: DeleteProjectInput) =>
      api.remove<{ message: string; projectId: string }>(
        `/api/projects/${encodeURIComponent(projectId)}`
      ),
    onSuccess: (_data, variables) => {
      queryClient.removeQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.byWorkspace(variables.workspaceId),
      });
    },
  });
}
