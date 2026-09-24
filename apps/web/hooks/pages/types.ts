import type { ApiBlock } from "@/lib/api/blocks";
import type { ApiPage, ApiPageTreeNode } from "@/lib/api/pages";

/** Page with its focused content (metadata + blocks + hierarchy context). */
export type PageWithBlocks = {
  page: ApiPage;
  blocks: ApiBlock[];
  ancestors: ApiPage[];
  children: ApiPage[];
};

export type { ApiBlock, ApiPage, ApiPageTreeNode };
