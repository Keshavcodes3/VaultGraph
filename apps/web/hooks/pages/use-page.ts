"use client";

import { useQuery } from "@tanstack/react-query";
import { pagesApi } from "@/lib/api/pages";
import { pageKeys } from "@/lib/query/query-keys";

/**
 * Single page with blocks + hierarchy context.
 * Focused fetch: { page, blocks, ancestors, children } — never the whole
 * workspace, no N+1 (server issues two flat reads).
 */
export function usePage(pageId: string | null) {
  return useQuery({
    queryKey: pageId ? pageKeys.detail(pageId) : pageKeys.all,
    queryFn: () => pagesApi.get(pageId as string),
    enabled: Boolean(pageId),
  });
}
