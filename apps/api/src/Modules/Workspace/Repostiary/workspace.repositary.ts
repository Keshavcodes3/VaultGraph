import { db } from "../../../prisma/db";
import { nowInstant } from "../../../prisma/timestamps";

export class workspaceRepoClass {
  constructor(
    private readonly workspaceRepo: typeof db.orm.public.Workspace
  ) {}

  // CREATE
  // Takes the normalized { name, slug } — the service generates the slug
  // when the client omits it, so the repo always receives both.
  create = async (
    data: { name: string; slug: string },
    ownerId: string
  ) => {
    const workspace = await this.workspaceRepo.create({
      name: data.name,
      slug: data.slug,
      ownerId,
      // Prisma 8's timestamptz codec expects a Temporal.Instant, not a Date.
      updatedAt: nowInstant(),
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
        // Prisma 8's timestamptz codec expects a Temporal.Instant, not a Date.
        updatedAt: nowInstant(),
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
