export const generateWorkspaceSlug = (name: string) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export const normalizeWorkspaceName = (name: string) => {
  return name.trim().replace(/\s+/g, " ");
};

export const normalizeWorkspaceSlug = (slug: string) => {
  return slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
};

export const isValidWorkspaceSlug = (slug: string) => {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
};
