"use client";

import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { pageKeys } from "@/lib/query/query-keys";
import type { ApiPage, ApiPageTreeNode } from "@/lib/api/pages";

function patchTreeTitles(
  nodes: ApiPageTreeNode[],
  id: string,
  title: string
): ApiPageTreeNode[] {
  let changed = false;
  const next = nodes.map((node) => {
    const self = node.id === id ? { ...node, title } : node;
    if (self !== node) changed = true;
    if (node.children?.length) {
      const children = patchTreeTitles(node.children, id, title);
      if (children !== node.children) return { ...self, children };
    }
    return self;
  });
  return changed ? next : nodes;
}

function patchPagesArray(
  pages: ApiPage[],
  id: string,
  title: string
): ApiPage[] {
  let changed = false;
  const next = pages.map((p) => {
    if (p.id !== id) return p;
    changed = true;
    return { ...p, title };
  });
  return changed ? next : pages;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function patchOne(value: unknown, id: string, title: string): unknown {
  if (!isRecord(value)) return value;

  // Tree shape: { tree: ApiPageTreeNode[] }
  if (Array.isArray(value["tree"])) {
    const tree = value["tree"] as ApiPageTreeNode[];
    const next = patchTreeTitles(tree, id, title);
    return next === tree ? value : { ...value, tree: next };
  }

  // Detail shape: { page, blocks, ancestors, children }
  if (isRecord(value["page"])) {
    const page = value["page"] as ApiPage;
    const ancestors = Array.isArray(value["ancestors"])
      ? (value["ancestors"] as ApiPage[])
      : null;
    const pageNext = page.id === id ? { ...page, title } : page;
    const ancestorsNext = ancestors
      ? patchPagesArray(ancestors, id, title)
      : ancestors;
    if (pageNext === page && ancestorsNext === ancestors) return value;
    return {
      ...value,
      page: pageNext,
      ...(ancestorsNext ? { ancestors: ancestorsNext } : null),
    };
  }

  // Flat list shape: { pages: ApiPage[], total }
  if (Array.isArray(value["pages"])) {
    const pages = value["pages"] as ApiPage[];
    const next = patchPagesArray(pages, id, title);
    return next === pages ? value : { ...value, pages: next };
  }

  return value;
}

/**
 * Instantly reflect a renamed title across every cached page shape
 * (tree, detail + ancestors, flat list) so the sidebar never shows
 * the previous name while the server + refetch settle.
 */
export function patchPageTitleInCache(
  queryClient: QueryClient,
  id: string,
  title: string
): void {
  const entries = queryClient.getQueriesData({
    queryKey: pageKeys.all,
  }) as Array<[QueryKey, unknown]>;
  for (const [key, data] of entries) {
    const next = patchOne(data, id, title);
    if (next !== data) queryClient.setQueryData(key, next);
  }
}
