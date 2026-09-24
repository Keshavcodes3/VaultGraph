import type {
  CreateProjectBody,
  ProjectDetails,
  UpdateProjectBody,
} from "@repo/shared/project-types";

import { HttpError } from "../../../Shared/httpError";
import { projectRepoClass } from "../Repositary/project.repo";

import {
  ProjectAccessDeniedError,
  ProjectNotFoundError,
  ProjectSlugAlreadyExistsError,
} from "../utils/project.errors";

import {
  generateProjectSlug,
  normalizeProjectName,
  normalizeProjectSlug,
} from "../utils/project.utils";

export class projectServiceClass {
  constructor(
    private readonly projectRepo: projectRepoClass
  ) {}

  // Ownership flows through the parent workspace: a project is visible
  // exactly when its workspace is visible to the caller.
  private assertWorkspaceAccess = async (
    workspaceId: string,
    ownerId: string
  ) => {
    const workspace =
      await this.projectRepo.findWorkspace(workspaceId);

    if (!workspace) {
      throw new ProjectNotFoundError();
    }

    if (workspace.ownerId !== ownerId) {
      throw new ProjectAccessDeniedError();
    }

    return workspace;
  };

  private assertProjectAccess = async (
    projectId: string,
    ownerId: string
  ) => {
    const project = await this.projectRepo.findById(projectId);

    if (!project) {
      throw new ProjectNotFoundError();
    }

    await this.assertWorkspaceAccess(project.workspaceId, ownerId);

    return project;
  };

  // CREATE PROJECT
  createProject = async (
    data: CreateProjectBody,
    ownerId: string
  ) => {
    // Defensive: routes validate the body, but a missing/unparsed JSON body
    // (e.g. no Content-Type: application/json) would otherwise crash with a
    // TypeError. Fail with a clear 400 instead.
    if (!data || typeof data.name !== "string" || typeof data.workspaceId !== "string") {
      throw new HttpError("Project name and workspaceId are required", 400);
    }

    await this.assertWorkspaceAccess(data.workspaceId, ownerId);

    const name = normalizeProjectName(data.name);

    const slug = normalizeProjectSlug(
      data.slug || generateProjectSlug(name)
    );

    if (!slug) {
      throw new HttpError(
        "Could not generate a valid slug from the project name",
        400
      );
    }

    const existingProject = await this.projectRepo.findBySlug(
      data.workspaceId,
      slug
    );

    if (existingProject) {
      throw new ProjectSlugAlreadyExistsError();
    }

    return await this.projectRepo.create({
      workspaceId: data.workspaceId,
      name,
      slug,
    });
  };

  // GET PROJECT
  getProject = async (
    projectId: string,
    ownerId: string
  ) => {
    return await this.assertProjectAccess(projectId, ownerId);
  };

  // GET PROJECT DETAILS (project + workspace + pages)
  getProjectDetails = async (
    projectId: string,
    ownerId: string
  ): Promise<ProjectDetails> => {
    const project = await this.assertProjectAccess(projectId, ownerId);

    const withPages = await this.projectRepo.findByIdWithPages(projectId);

    const workspace = await this.projectRepo.findWorkspace(
      project.workspaceId
    );

    if (!withPages || !workspace) {
      throw new ProjectNotFoundError();
    }

    return {
      id: withPages.id,
      workspaceId: withPages.workspaceId,
      name: withPages.name,
      slug: withPages.slug,
      createdAt: withPages.createdAt as unknown as Date,
      updatedAt: withPages.updatedAt as unknown as Date,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        ownerId: workspace.ownerId,
      },
      pages: withPages.pages.map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        icon: page.icon,
        cover: page.cover,
        isPublished: page.isPublished,
        createdAt: page.createdAt as unknown as Date,
        updatedAt: page.updatedAt as unknown as Date,
      })),
    };
  };

  // GET PROJECT BY SLUG WITHIN A WORKSPACE
  getProjectBySlug = async (
    workspaceId: string,
    slug: string,
    ownerId: string
  ) => {
    await this.assertWorkspaceAccess(workspaceId, ownerId);

    const project = await this.projectRepo.findBySlug(
      workspaceId,
      normalizeProjectSlug(slug)
    );

    if (!project) {
      throw new ProjectNotFoundError();
    }

    return project;
  };

  // GET ALL PROJECTS OF A WORKSPACE
  getWorkspaceProjects = async (
    workspaceId: string,
    ownerId: string
  ) => {
    await this.assertWorkspaceAccess(workspaceId, ownerId);

    return await this.projectRepo.findByWorkspace(workspaceId);
  };

  // UPDATE PROJECT
  updateProject = async (
    projectId: string,
    ownerId: string,
    data: UpdateProjectBody
  ) => {
    if (!data || (data.name === undefined && data.slug === undefined)) {
      throw new HttpError("Nothing to update", 400);
    }

    const project = await this.assertProjectAccess(projectId, ownerId);

    const updateData: {
      name?: string;
      slug?: string;
    } = {};

    if (data.name !== undefined) {
      updateData.name = normalizeProjectName(data.name);
    }

    if (data.slug !== undefined) {
      const slug = normalizeProjectSlug(data.slug);

      if (slug !== project.slug) {
        const existingProject = await this.projectRepo.findBySlug(
          project.workspaceId,
          slug
        );

        if (existingProject) {
          throw new ProjectSlugAlreadyExistsError();
        }
      }

      updateData.slug = slug;
    }

    return await this.projectRepo.update(projectId, updateData);
  };

  // DELETE PROJECT
  deleteProject = async (
    projectId: string,
    ownerId: string
  ) => {
    await this.assertProjectAccess(projectId, ownerId);

    await this.projectRepo.delete(projectId);
  };
}
