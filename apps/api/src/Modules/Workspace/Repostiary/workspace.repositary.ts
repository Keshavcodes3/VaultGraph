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

  // GET BY IDS (member-of workspaces for listing)
  findByIds = async (ids: string[]) => {
    if (ids.length === 0) return [];
    return await this.workspaceRepo
      .where((w) => w.id.in(ids))
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

  // UPDATE BY ID (no owner filter — callers authorize first, so
  // effective owners via membership can manage the workspace)
  updateById = async (
    id: string,
    data: {
      name?: string;
      slug?: string;
    }
  ) => {
    await this.workspaceRepo
      .where({
        id,
      })
      .update({
        ...data,
        // Prisma 8's timestamptz codec expects a Temporal.Instant, not a Date.
        updatedAt: nowInstant(),
      });

    return await this.getWorkspaceById(id);
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

  // SET OWNER (ownership transfer / owner-leave succession).
  // No owner filter by design: callers authorize before invoking.
  setOwner = async (
    id: string,
    ownerId: string
  ) => {
    await this.workspaceRepo
      .where({
        id,
      })
      .update({
        ownerId,
        // Prisma 8's timestamptz codec expects a Temporal.Instant, not a Date.
        updatedAt: nowInstant(),
      });

    return await this.getWorkspaceById(id);
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
