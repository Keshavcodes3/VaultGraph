"use client";

import { useQuery } from "@tanstack/react-query";
import { pagesApi } from "@/lib/api/pages";
import { pageKeys } from "@/lib/query/query-keys";

export type PagesFilter = {
  workspaceId?: string;
  projectId?: string;
  parentId?: string;
  archived?: boolean;
  favorites?: boolean;
};

/** Filtered page list. Normal queries exclude archived pages. */
export function usePages(filters: PagesFilter, enabled = true) {
  const keyFilters: Record<string, string | undefined> = {
    workspaceId: filters.workspaceId,
    projectId: filters.projectId,
    parentId: filters.parentId,
    archived: filters.archived ? "true" : undefined,
    favorites: filters.favorites ? "true" : undefined,
  };
  return useQuery({
    queryKey: pageKeys.list(keyFilters),
    queryFn: () => pagesApi.list(filters),
    enabled: enabled && (Boolean(filters.workspaceId) || Boolean(filters.projectId)),
  });
}

/** Nested page tree (ordered siblings, single fetch). */
export function usePageTree(
  scope: { workspaceId?: string; projectId?: string },
  enabled = true
) {
  const keyScope: Record<string, string | undefined> = {
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
  };
  return useQuery({
    queryKey: pageKeys.tree(keyScope),
    queryFn: () => pagesApi.tree(scope),
    enabled: enabled && (Boolean(scope.workspaceId) || Boolean(scope.projectId)),
  });
}
