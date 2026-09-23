import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@repo/shared/workspace-types";

import { workspaceRepoClass } from "../Repostiary/workspace.repositary";

import {
  WorkspaceAccessDeniedError,
  WorkspaceNotFoundError,
  WorkspaceSlugAlreadyExistsError,
} from "../utils/workspace.errors";

import {
  generateWorkspaceSlug,
  normalizeWorkspaceName,
  normalizeWorkspaceSlug,
} from "../utils/workspace.utils";

export class workspaceServiceClass {
  constructor(
    private readonly workspaceRepo: workspaceRepoClass
  ) {}

  // CREATE WORKSPACE
  create = async (
    data: CreateWorkspaceInput,
    ownerId: string
  ) => {
    const name = normalizeWorkspaceName(data.name);

    const slug = normalizeWorkspaceSlug(
      data.slug || generateWorkspaceSlug(name)
    );

    const existingWorkspace =
      await this.workspaceRepo.getWorkspaceBySlug(slug);

    if (existingWorkspace) {
      throw new WorkspaceSlugAlreadyExistsError();
    }

    return await this.workspaceRepo.create(
      {
        name,
        slug,
      },
      ownerId
    );
  };

  // GET WORKSPACE
  getById = async (
    workspaceId: string,
    ownerId: string
  ) => {
    const workspace =
      await this.workspaceRepo.getWorkspaceById(workspaceId);

    if (!workspace) {
      throw new WorkspaceNotFoundError();
    }

    if (workspace.ownerId !== ownerId) {
      throw new WorkspaceAccessDeniedError();
    }

    return workspace;
  };

  // GET ALL USER WORKSPACES
  getAll = async (ownerId: string) => {
    return await this.workspaceRepo.getAllWorkspaces(ownerId);
  };

  // GET WORKSPACE BY SLUG
  getBySlug = async (
    slug: string,
    ownerId: string
  ) => {
    const workspace =
      await this.workspaceRepo.getWorkspaceBySlugAndOwner(
        normalizeWorkspaceSlug(slug),
        ownerId
      );

    if (!workspace) {
      throw new WorkspaceNotFoundError();
    }

    return workspace;
  };

  // UPDATE WORKSPACE
  update = async (
    workspaceId: string,
    ownerId: string,
    data: UpdateWorkspaceInput
  ) => {
    const workspace =
      await this.workspaceRepo.getWorkspaceByIdAndOwner(
        workspaceId,
        ownerId
      );

    if (!workspace) {
      throw new WorkspaceNotFoundError();
    }

    const updateData: {
      name?: string;
      slug?: string;
    } = {};

    if (data.name !== undefined) {
      updateData.name = normalizeWorkspaceName(data.name);
    }

    if (data.slug !== undefined) {
      const slug = normalizeWorkspaceSlug(data.slug);

      if (slug !== workspace.slug) {
        const existingWorkspace =
          await this.workspaceRepo.getWorkspaceBySlug(slug);

        if (existingWorkspace) {
          throw new WorkspaceSlugAlreadyExistsError();
        }
      }

      updateData.slug = slug;
    }

    return await this.workspaceRepo.update(
      workspaceId,
      ownerId,
      updateData
    );
  };

  // DELETE WORKSPACE
  delete = async (
    workspaceId: string,
    ownerId: string
  ) => {
    const workspace =
      await this.workspaceRepo.getWorkspaceByIdAndOwner(
        workspaceId,
        ownerId
      );

    if (!workspace) {
      throw new WorkspaceNotFoundError();
    }

    await this.workspaceRepo.delete(
      workspaceId,
      ownerId
    );
  };

  // CHECK OWNERSHIP
  isOwner = async (
    workspaceId: string,
    ownerId: string
  ) => {
    return await this.workspaceRepo.isOwner(
      workspaceId,
      ownerId
    );
  };
}
