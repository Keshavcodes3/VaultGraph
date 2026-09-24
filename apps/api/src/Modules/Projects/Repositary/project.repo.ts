import type { CreateProjectInput } from "@repo/shared/project-types";
import { db } from "../../../prisma/db";
import { nowInstant } from "../../../prisma/timestamps";
import { workspaceRepoClass } from "../../Workspace/Repostiary/workspace.repositary";

export class projectRepoClass {
  constructor(
    private readonly projectDB: typeof db.orm.public.Project,
    private readonly workspaceRepo: workspaceRepoClass,
    private readonly pageDB: typeof db.orm.public.Page
  ) {}

  // CREATE
  // Takes the normalized { workspaceId, name, slug } — the service
  // generates the slug when the client omits it, so the repo always
  // receives all three.
  create = async (data: CreateProjectInput) => {
    const project = await this.projectDB.create({
      workspaceId: data.workspaceId,
      name: data.name,
      slug: data.slug,
      // Prisma 8's timestamptz codec expects a Temporal.Instant, not a Date.
      updatedAt: nowInstant(),
    });

    return project;
  };

  // GET BY ID
  findById = async (projectId: string) => {
    return await this.projectDB.first({
      id: projectId,
    });
  };

  // GET BY SLUG WITHIN A WORKSPACE
  // Slugs are unique per workspace (@@unique([workspaceId, slug])).
  findBySlug = async (workspaceId: string, slug: string) => {
    return await this.projectDB.first({
      workspaceId,
      slug,
    });
  };

  // GET ALL PROJECTS OF A WORKSPACE
  findByWorkspace = async (workspaceId: string) => {
    return await this.projectDB
      .where({
        workspaceId,
      })
      .all();
  };

  // GET PROJECT WITH ITS PAGES
  findByIdWithPages = async (projectId: string) => {
    const project = await this.findById(projectId);

    if (!project) {
      return null;
    }

    const pages = await this.pageDB
      .where({
        projectId,
      })
      .all();

    return { ...project, pages };
  };

  // GET THE OWNING WORKSPACE (for access checks + details)
  findWorkspace = async (workspaceId: string) => {
    return await this.workspaceRepo.getWorkspaceById(workspaceId);
  };

  // UPDATE
  update = async (
    projectId: string,
    data: { name?: string; slug?: string }
  ) => {
    const project = await this.projectDB
      .where({
        id: projectId,
      })
      .update({
        ...data,
        // Prisma 8's timestamptz codec expects a Temporal.Instant, not a Date.
        updatedAt: nowInstant(),
      });

    return project;
  };

  // DELETE
  // Page rows cascade at the database level (onDelete: Cascade).
  delete = async (projectId: string) => {
    await this.projectDB
      .where({
        id: projectId,
      })
      .delete();
  };
}
