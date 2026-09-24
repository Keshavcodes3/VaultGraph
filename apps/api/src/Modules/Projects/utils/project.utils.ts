export const generateProjectSlug = (name: string) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export const normalizeProjectName = (name: string) => {
  return name.trim().replace(/\s+/g, " ");
};

export const normalizeProjectSlug = (slug: string) => {
  return slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
};

export const isValidProjectSlug = (slug: string) => {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
};
