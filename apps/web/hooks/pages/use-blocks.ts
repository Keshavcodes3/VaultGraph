"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  blocksApi,
  type CreateBlockInput,
  type UpdateBlockInput,
} from "@/lib/api/blocks";
import { blockKeys, pageKeys } from "@/lib/query/query-keys";

/** Blocks of a page (ordered, single fetch). */
export function useBlocks(pageId: string | null) {
  return useQuery({
    queryKey: pageId ? blockKeys.byPage(pageId) : blockKeys.all,
    queryFn: () => blocksApi.list(pageId as string),
    enabled: Boolean(pageId),
  });
}

/** Create a block inside a page. */
export function useCreateBlock(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBlockInput) => blocksApi.create(pageId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.byPage(pageId) });
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(pageId) });
    },
  });
}

/** Update a block (type / content / parent / position). */
export function useUpdateBlock(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ blockId, patch }: { blockId: string; patch: UpdateBlockInput }) =>
      blocksApi.update(blockId, patch),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: blockKeys.byPage(pageId) });
      queryClient.invalidateQueries({
        queryKey: blockKeys.detail(variables.blockId),
      });
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(pageId) });
    },
  });
}

/** Move a block within its page (new parent + optional position). */
export function useMoveBlock(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      blockId,
      parentId,
      position,
    }: {
      blockId: string;
      parentId: string | null;
      position?: number;
    }) => blocksApi.move(blockId, { parentId, position }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.byPage(pageId) });
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(pageId) });
    },
  });
}

/** Persist block ordering (renumbers 0..n on the server). */
export function useReorderBlocks(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => blocksApi.reorder(pageId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.byPage(pageId) });
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(pageId) });
    },
  });
}

/** Delete a block (nested children cascade on the server). */
export function useDeleteBlock(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockId: string) => blocksApi.remove(blockId),
    onSuccess: (_data, blockId) => {
      queryClient.removeQueries({ queryKey: blockKeys.detail(blockId) });
      queryClient.invalidateQueries({ queryKey: blockKeys.byPage(pageId) });
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(pageId) });
    },
  });
}
