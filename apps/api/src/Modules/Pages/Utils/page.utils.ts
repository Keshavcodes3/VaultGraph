export const PAGE_LIMITS = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 2000,
  ICON_MAX_LENGTH: 50,
  COVER_MAX_LENGTH: 500,
} as const;

export const normalizePageTitle = (title: string) => {
  const t = title.trim().replace(/\s+/g, " ");
  return t.length === 0 ? "Untitled" : t;
};

export const generatePageSlug = (title: string) => {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  if (!base) return null;
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
};

export type PageTreeNode<T extends { id: string; parentId: string | null }> =
  T & {
    children: PageTreeNode<T>[];
  };

/** Build a nested tree from a flat ordered list (single pass, no N+1). */
export const buildPageTree = <
  T extends { id: string; parentId: string | null; position?: number | null },
>(
  flat: T[]
): PageTreeNode<T>[] => {
  const byId = new Map<string, PageTreeNode<T>>();
  const roots: PageTreeNode<T>[] = [];

  const sorted = [...flat].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );

  for (const row of sorted) {
    byId.set(row.id, { ...row, children: [] });
  }
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
};

/** Normalize a block content payload into a plain Json-safe object. */
export const normalizeBlockContent = (
  content: unknown
): Record<string, unknown> => {
  if (content === null || content === undefined) return {};
  if (typeof content === "string") return { text: content };
  if (typeof content === "object" && !Array.isArray(content)) {
    return { ...(content as Record<string, unknown>) };
  }
  return { value: content };
};

/** Extract display text from a Json block content (for search/word count). */
export const blockText = (content: unknown): string => {
  if (!content || typeof content !== "object") return "";
  const c = content as Record<string, unknown>;
  if (typeof c["text"] === "string") return c["text"] as string;
  return "";
};
