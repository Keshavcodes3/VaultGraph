import { db } from "../../../prisma/db";
import { nowInstant } from "../../../prisma/timestamps";
import type {
  InvitationStatus,
  WorkspaceRole,
} from "@repo/shared/workspace-types";

export class invitationRepoClass {
  constructor(
    private readonly inviteDB: typeof db.orm.public.Invite
  ) {}

  // GET BY ID
  findById = async (id: string) => {
    return await this.inviteDB.first({
      id,
    });
  };

  // GET BY TOKEN HASH (single-use token lookup)
  findByTokenHash = async (tokenHash: string) => {
    return await this.inviteDB
      .where({
        tokenHash,
      })
      .first();
  };

  // GET BY WORKSPACE + EMAIL
  findByWorkspaceAndEmail = async (
    workspaceId: string,
    email: string
  ) => {
    return await this.inviteDB
      .where({
        workspaceId,
        email,
      })
      .first();
  };

  // LIST INVITATIONS OF A WORKSPACE (newest first)
  findByWorkspace = async (workspaceId: string) => {
    return await this.inviteDB
      .where({
        workspaceId,
      })
      .orderBy((i) => i.createdAt.desc())
      .all();
  };

  // LIST INVITATIONS OF A WORKSPACE FILTERED BY STATUS
  findByWorkspaceAndStatus = async (
    workspaceId: string,
    status: InvitationStatus
  ) => {
    return await this.inviteDB
      .where({
        workspaceId,
        status,
      })
      .orderBy((i) => i.createdAt.desc())
      .all();
  };

  // CREATE
  create = async (data: {
    workspaceId: string;
    email: string;
    role: WorkspaceRole;
    invitedById: string;
    tokenHash: string;
    expiresAt: unknown;
  }) => {
    return await this.inviteDB.create({
      workspaceId: data.workspaceId,
      email: data.email,
      role: data.role,
      status: "PENDING",
      invitedById: data.invitedById,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt as never,
      // Prisma 8's timestamptz codec expects a Temporal.Instant, not a Date.
      updatedAt: nowInstant(),
    });
  };

  // MARK STATUS (then re-read so callers get a single row-or-null)
  updateStatus = async (
    id: string,
    data: {
      status: InvitationStatus;
      acceptedAt?: unknown;
      revokedAt?: unknown;
    }
  ) => {
    await this.inviteDB
      .where({
        id,
      })
      .update({
        status: data.status,
        ...(data.acceptedAt !== undefined && {
          acceptedAt: data.acceptedAt as never,
        }),
        ...(data.revokedAt !== undefined && {
          revokedAt: data.revokedAt as never,
        }),
        // Prisma 8's timestamptz codec expects a Temporal.Instant, not a Date.
        updatedAt: nowInstant(),
      });

    return await this.findById(id);
  };

  // ROTATE TOKEN + EXPIRY (resend)
  rotateToken = async (
    id: string,
    data: { tokenHash: string; expiresAt: unknown }
  ) => {
    await this.inviteDB
      .where({
        id,
      })
      .update({
        status: "PENDING",
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt as never,
        // Prisma 8's timestamptz codec expects a Temporal.Instant, not a Date.
        updatedAt: nowInstant(),
      });

    return await this.findById(id);
  };

  // DELETE (used to clear terminal invitations before a re-invite, so the
  // @@unique([workspaceId, email]) constraint keeps preventing duplicates
  // while removed-and-reinvited emails stay possible)
  delete = async (id: string) => {
    await this.inviteDB
      .where({
        id,
      })
      .delete();
  };
}
