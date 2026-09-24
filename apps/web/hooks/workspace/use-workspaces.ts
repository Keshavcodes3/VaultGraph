"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  workspacesApi,
  type CreateWorkspaceInput,
  type UpdateWorkspaceInput,
} from "@/lib/api/workspaces";
import { workspaceKeys } from "@/lib/query/query-keys";

/** All workspaces the authenticated user can access. */
export function useWorkspaces(enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.all,
    queryFn: () => workspacesApi.list(),
    enabled,
  });
}

/** One workspace by id. */
export function useWorkspace(workspaceId: string | null) {
  return useQuery({
    queryKey: workspaceId ? workspaceKeys.detail(workspaceId) : workspaceKeys.all,
    queryFn: () => workspacesApi.get(workspaceId as string),
    enabled: Boolean(workspaceId),
  });
}

/** Create a workspace, then refresh the list. Returns the created workspace. */
export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) => workspacesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

/** Rename / update a workspace, then refresh. */
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      patch,
    }: {
      workspaceId: string;
      patch: UpdateWorkspaceInput;
    }) => workspacesApi.update(workspaceId, patch),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(variables.workspaceId),
      });
    },
  });
}

/** Delete a workspace, then refresh the list. */
export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => workspacesApi.remove(workspaceId),
    onSuccess: (_data, workspaceId) => {
      queryClient.removeQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}
