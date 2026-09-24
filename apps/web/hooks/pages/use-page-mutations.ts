"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pagesApi, type CreatePageInput, type UpdatePageInput } from "@/lib/api/pages";
import { blockKeys, pageKeys } from "@/lib/query/query-keys";

/** Create a page, then refresh lists + trees. */
export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePageInput) => pagesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
    },
  });
}

/** Update page metadata (title/icon/cover/description/flags/position). */
export function useUpdatePage(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdatePageInput) => pagesApi.update(pageId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(pageId) });
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
    },
  });
}

/** Move page (new parent / root / reorder among siblings). */
export function useMovePage(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      parentId: string | null;
      projectId?: string;
      position?: number;
    }) => pagesApi.move(pageId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(pageId) });
    },
  });
}

/** Duplicate page (new ids, copied blocks + ordering). */
export function useDuplicatePage(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input?: { parentId?: string | null; title?: string }) =>
      pagesApi.duplicate(pageId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
    },
  });
}

/** Favorite / unfavorite (persisted flag). */
export function useFavoritePage(pageId: string) {
  const queryClient = useQueryClient();
  const favorite = useMutation({
    mutationFn: () => pagesApi.favorite(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(pageId) });
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
    },
  });
  const unfavorite = useMutation({
    mutationFn: () => pagesApi.unfavorite(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(pageId) });
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
    },
  });
  return { favorite, unfavorite };
}

/** Archive / restore (soft, retains blocks). */
export function useArchivePage(pageId: string) {
  const queryClient = useQueryClient();
  const archive = useMutation({
    mutationFn: () => pagesApi.archive(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(pageId) });
    },
  });
  const restore = useMutation({
    mutationFn: () => pagesApi.restore(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(pageId) });
    },
  });
  return { archive, restore };
}

/** Delete page (children + blocks cascade on the server). */
export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pageId: string) => pagesApi.remove(pageId),
    onSuccess: (_data, pageId) => {
      queryClient.removeQueries({ queryKey: pageKeys.detail(pageId) });
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
      queryClient.invalidateQueries({ queryKey: blockKeys.all });
    },
  });
}

/** Reorder siblings (persistent ordering). */
export function useReorderPages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => pagesApi.reorder(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
    },
  });
}
