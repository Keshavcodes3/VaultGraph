import { db } from "../../../prisma/db";

import type { CreateWorkspaceInput } from "@repo/shared/workspace-types";

export class workspaceRepoClass {
  constructor(
    private readonly workspaceRepo: typeof db.orm.public.Workspace
  ) {}

  // CREATE
  create = async (
    data: CreateWorkspaceInput,
    ownerId: string
  ) => {
    const workspace = await this.workspaceRepo.create({
      name: data.name,
      slug: data.slug,
      ownerId,
      updatedAt: new Date(),
    });

    return workspace;
  };

  // GET BY ID
  getWorkspaceById = async (id: string) => {
    return await this.workspaceRepo.first({
      id,
    });
  };

  // GET BY ID + OWNER
  getWorkspaceByIdAndOwner = async (
    id: string,
    ownerId: string
  ) => {
    return await this.workspaceRepo.first({
      id,
      ownerId,
    });
  };

  // GET BY SLUG
  getWorkspaceBySlug = async (slug: string) => {
    return await this.workspaceRepo.first({
      slug,
    });
  };

  // GET BY SLUG + OWNER
  getWorkspaceBySlugAndOwner = async (
    slug: string,
    ownerId: string
  ) => {
    return await this.workspaceRepo.first({
      slug,
      ownerId,
    });
  };

  // GET ALL WORKSPACES OF OWNER
  getAllWorkspaces = async (ownerId: string) => {
    return await this.workspaceRepo
      .where({
        ownerId,
      })
      .all();
  };

  // CHECK IF WORKSPACE EXISTS
  exists = async (id: string) => {
    const workspace = await this.workspaceRepo.first({
      id,
    });

    return !!workspace;
  };

  // CHECK IF OWNER OWNS WORKSPACE
  isOwner = async (
    workspaceId: string,
    ownerId: string
  ) => {
    const workspace = await this.workspaceRepo.first({
      id: workspaceId,
      ownerId,
    });

    return !!workspace;
  };

  // UPDATE
  update = async (
    id: string,
    ownerId: string,
    data: {
      name?: string;
      slug?: string;
    }
  ) => {
    const workspace = await this.workspaceRepo
      .where({
        id,
        ownerId,
      })
      .update({
        ...data,
        updatedAt: new Date(),
      })

    return workspace;
  };

  // DELETE
  delete = async (
    id: string,
    ownerId: string
  ) => {
    await this.workspaceRepo
      .where({
        id,
        ownerId,
      })
      .delete();
  };

  // COUNT OWNER'S WORKSPACES
  count = async (ownerId: string) => {
    return await this.workspaceRepo
      .where({
        ownerId,
      })
      .count();
  };
}
