import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { projectKeys } from "@/lib/query/query-keys";
import type { Project } from "./types";

export type CreateProjectInput = {
  workspaceId: string;
  name: string;
  slug?: string;
};

/**
 * Create a project inside a workspace, then refresh that
 * workspace's project list.
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      api.post<{ project: Project }>("/api/projects", input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.byWorkspace(variables.workspaceId),
      });
    },
  });
}
