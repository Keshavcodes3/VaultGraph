import { z } from "zod";

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  workspaceId: string;
  name: string;
  slug: string;
}

export interface UpdateProjectInput {
  name?: string;
  slug?: string;
}

export interface ProjectParams {
  projectId: string;
}

export interface WorkspaceProjectParams {
  workspaceId: string;
}

export interface ProjectWithWorkspace extends Project {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ProjectWithPages extends Project {
  pages: {
    id: string;
    title: string;
    slug: string | null;
    icon: string | null;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

export interface ProjectDetails extends Project {
  workspace: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
  };
  pages: {
    id: string;
    title: string;
    slug: string | null;
    icon: string | null;
    cover: string | null;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
}

export interface ProjectResponse {
  project: Project;
}

export interface ProjectDetailsResponse {
  project: ProjectDetails;
}

export interface DeleteProjectResponse {
  message: string;
  projectId: string;
}

export interface ProjectRepositoryTypes {
  create(data: CreateProjectInput): Promise<Project>;
  findById(projectId: string): Promise<Project | null>;
  findBySlug(workspaceId: string, slug: string): Promise<Project | null>;
  findByWorkspace(workspaceId: string): Promise<Project[]>;
  findByIdWithPages(projectId: string): Promise<ProjectWithPages | null>;
  update(projectId: string, data: UpdateProjectInput): Promise<Project>;
  delete(projectId: string): Promise<void>;
}

export interface ProjectService {
  createProject(data: CreateProjectInput): Promise<Project>;
  getProject(projectId: string): Promise<Project>;
  getProjectDetails(projectId: string): Promise<ProjectDetails>;
  getWorkspaceProjects(workspaceId: string): Promise<Project[]>;
  updateProject(projectId: string, data: UpdateProjectInput): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*                            Validation (zod)                                */
/* -------------------------------------------------------------------------- */

const projectSlug = z
  .string()
  .min(1, "Project slug cannot be empty")
  .max(100, "Project slug is too long")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug can only contain lowercase letters, numbers and hyphens"
  );

export const createProjectSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),

  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name is too long"),

  // Optional: the server generates one from `name` when omitted.
  slug: projectSlug.optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name cannot be empty")
    .max(100, "Project name is too long")
    .optional(),

  slug: projectSlug.optional(),
});

export type CreateProjectBody = z.infer<typeof createProjectSchema>;

export type UpdateProjectBody = z.infer<typeof updateProjectSchema>;
