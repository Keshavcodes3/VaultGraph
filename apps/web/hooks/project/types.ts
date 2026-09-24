/** Mirror of the API's public project shapes (dates arrive as ISO strings). */
export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectPage = {
  id: string;
  title: string;
  slug: string | null;
  icon: string | null;
  cover: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDetails = Project & {
  workspace: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
  };
  pages: ProjectPage[];
};
