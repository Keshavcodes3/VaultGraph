import { db } from "../../../prisma/db";
import { nowInstant } from "../../../prisma/timestamps";
import type { WorkspaceRole } from "@repo/shared/workspace-types";

export class memberRepoClass {
  constructor(
    private readonly memberDB: typeof db.orm.public.Member,
    private readonly userDB: typeof db.orm.public.User
  ) {}

  // GET BY ID
  findById = async (id: string) => {
    return await this.memberDB.first({
      id,
    });
  };

  // GET ONE MEMBERSHIP
  findByWorkspaceAndUser = async (
    workspaceId: string,
    userId: string
  ) => {
    return await this.memberDB
      .where({
        workspaceId,
        userId,
      })
      .first();
  };

  // LIST ALL MEMBERS OF A WORKSPACE (oldest first)
  findByWorkspace = async (workspaceId: string) => {
    return await this.memberDB
      .where({
        workspaceId,
      })
      .orderBy((m) => m.createdAt.asc())
      .all();
  };

  // LIST ALL MEMBERSHIPS OF A USER
  findByUser = async (userId: string) => {
    return await this.memberDB
      .where({
        userId,
      })
      .all();
  };

  // COUNT OWNERS OF A WORKSPACE
  countOwners = async (workspaceId: string) => {
    const result = await this.memberDB
      .where({
        workspaceId,
        role: "OWNER",
      })
      .aggregate((a) => ({
        total: a.count(),
      }));
    return result.total;
  };

  // BATCH USER LOOKUP (avoids N+1 when presenting member lists)
  findUsersByIds = async (userIds: string[]) => {
    if (userIds.length === 0) return [];
    return await this.userDB
      .where((u) => u.id.in(userIds))
      .all();
  };

  // CREATE
  create = async (data: {
    workspaceId: string;
    userId: string;
    role: WorkspaceRole;
  }) => {
    return await this.memberDB.create({
      workspaceId: data.workspaceId,
      userId: data.userId,
      role: data.role,
      // Prisma 8's timestamptz codec expects a Temporal.Instant, not a Date.
      updatedAt: nowInstant(),
    });
  };

  // UPDATE ROLE (then re-read; the ORM returns updated rows, so the
  // follow-up read keeps the return shape a single row-or-null)
  updateRole = async (id: string, role: WorkspaceRole) => {
    await this.memberDB
      .where({
        id,
      })
      .update({
        role,
        // Prisma 8's timestamptz codec expects a Temporal.Instant, not a Date.
        updatedAt: nowInstant(),
      });

    return await this.findById(id);
  };

  // DELETE BY MEMBER ID
  delete = async (id: string) => {
    await this.memberDB
      .where({
        id,
      })
      .delete();
  };

  // DELETE BY WORKSPACE + USER
  deleteByWorkspaceAndUser = async (
    workspaceId: string,
    userId: string
  ) => {
    await this.memberDB
      .where({
        workspaceId,
        userId,
      })
      .delete();
  };
}
