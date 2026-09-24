import type {
  MemberResponse,
  WorkspaceRole,
} from "@repo/shared/workspace-types";
import { db } from "../../../prisma/db";
import { HttpError } from "../../../Shared/httpError";
import { toISOStringSafe } from "../../../prisma/timestamps";
import { AuthRepository } from "../../auth/repositary/auth.repo";
import { workspaceRepoClass } from "../Repostiary/workspace.repositary";
import { memberRepoClass } from "../Repostiary/member.repositary";
import {
  AlreadyWorkspaceMemberError,
  LastOwnerError,
  WorkspaceAccessDeniedError,
  WorkspaceMemberNotFoundError,
  WorkspaceNotFoundError,
} from "../utils/workspace.errors";
import {
  canChangeRole,
  canManageWorkspace,
  canRemoveMember,
} from "../utils/invitation.utils";

const isUniqueViolation = (err: unknown) => {
  const e = err as { code?: string; sqlState?: string };
  return e?.code === "23505" || e?.sqlState === "23505";
};

type MemberRow = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: unknown;
  updatedAt: unknown;
};

type UserRow = {
  id: string;
  username: string;
  email: string;
};

const toMemberResponse = (
  member: MemberRow,
  user: UserRow | null
): MemberResponse => {
  return {
    id: member.id,
    workspaceId: member.workspaceId,
    userId: member.userId,
    role: member.role,
    createdAt: toISOStringSafe(member.createdAt) as unknown as Date,
    updatedAt: toISOStringSafe(member.updatedAt) as unknown as Date,
    user: user
      ? { id: user.id, username: user.username, email: user.email }
      : {
          id: member.userId,
          username: "Unknown member",
          email: "",
        },
  };
};

export class memberServiceClass {
  constructor(
    private readonly memberRepo: memberRepoClass,
    private readonly workspaceRepo: workspaceRepoClass,
    private readonly authRepo: AuthRepository
  ) {}

  // Ensure the legacy workspace owner always holds an OWNER membership.
  // Tolerant: skips when the owner user row no longer exists.
  ensureOwnerMembership = async (workspace: {
    id: string;
    ownerId: string;
  }) => {
    const existing = await this.memberRepo.findByWorkspaceAndUser(
      workspace.id,
      workspace.ownerId
    );
    if (existing) return existing;

    const owner = await this.authRepo.findById(workspace.ownerId);
    if (!owner) return null;

    try {
      return await this.memberRepo.create({
        workspaceId: workspace.id,
        userId: workspace.ownerId,
        role: "OWNER",
      });
    } catch (err) {
      // Concurrent backfill — the unique constraint is the arbiter.
      if (isUniqueViolation(err)) {
        return await this.memberRepo.findByWorkspaceAndUser(
          workspace.id,
          workspace.ownerId
        );
      }
      throw err;
    }
  };

  // Resolve the caller's effective role: legacy owner counts as OWNER,
  // otherwise the membership role, otherwise null (no access).
  getRequesterRole = async (
    workspaceId: string,
    userId: string
  ): Promise<{ workspace: { id: string; ownerId: string }; role: WorkspaceRole | null }> => {
    const workspace =
      await this.workspaceRepo.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new WorkspaceNotFoundError();
    }
    if (workspace.ownerId === userId) {
      return { workspace, role: "OWNER" };
    }
    const membership = await this.memberRepo.findByWorkspaceAndUser(
      workspaceId,
      userId
    );
    return {
      workspace,
      role: (membership?.role as WorkspaceRole | undefined) ?? null,
    };
  };

  requireWorkspaceAccess = async (
    workspaceId: string,
    userId: string
  ) => {
    const { workspace, role } = await this.getRequesterRole(
      workspaceId,
      userId
    );
    if (!role) {
      throw new WorkspaceAccessDeniedError();
    }
    return { workspace, role };
  };

  requireManager = async (workspaceId: string, userId: string) => {
    const { workspace, role } = await this.requireWorkspaceAccess(
      workspaceId,
      userId
    );
    if (!canManageWorkspace(role)) {
      throw new WorkspaceAccessDeniedError();
    }
    return { workspace, role };
  };

  // LIST MEMBERS — any workspace member; real rows with user summaries.
  list = async (
    workspaceId: string,
    requesterId: string
  ): Promise<MemberResponse[]> => {
    await this.requireWorkspaceAccess(workspaceId, requesterId);

    const members = await this.memberRepo.findByWorkspace(workspaceId);
    const users = await this.memberRepo.findUsersByIds(
      members.map((m) => m.userId as string)
    );
    const byId = new Map(users.map((u) => [u.id as string, u]));

    return (members as unknown as MemberRow[]).map((m) =>
      toMemberResponse(m, (byId.get(m.userId) as unknown as UserRow) ?? null)
    );
  };

  // CHANGE MEMBER ROLE — OWNER/ADMIN only, last-owner safe.
  changeRole = async (
    workspaceId: string,
    memberId: string,
    nextRole: WorkspaceRole,
    requesterId: string
  ): Promise<MemberResponse> => {
    const { role: requesterRole } = await this.requireManager(
      workspaceId,
      requesterId
    );

    const target = (await this.memberRepo.findById(
      memberId
    )) as unknown as MemberRow | null;
    if (!target || target.workspaceId !== workspaceId) {
      throw new WorkspaceMemberNotFoundError();
    }

    if (!canChangeRole(requesterRole, target.role, nextRole)) {
      throw new WorkspaceAccessDeniedError();
    }

    if (
      target.role === "OWNER" &&
      nextRole !== "OWNER" &&
      (await this.memberRepo.countOwners(workspaceId)) <= 1
    ) {
      throw new LastOwnerError();
    }

    const updated = (await this.memberRepo.updateRole(
      memberId,
      nextRole
    )) as unknown as MemberRow | null;
    if (!updated) {
      throw new WorkspaceMemberNotFoundError();
    }

    const user = (await this.authRepo.findById(
      updated.userId
    )) as unknown as UserRow | null;
    return toMemberResponse(updated, user);
  };

  // REMOVE MEMBER — OWNER/ADMIN only, last-owner safe, real deletion.
  remove = async (
    workspaceId: string,
    memberId: string,
    requesterId: string
  ): Promise<void> => {
    const { role: requesterRole } = await this.requireManager(
      workspaceId,
      requesterId
    );

    const target = (await this.memberRepo.findById(
      memberId
    )) as unknown as MemberRow | null;
    if (!target || target.workspaceId !== workspaceId) {
      throw new WorkspaceMemberNotFoundError();
    }

    if (!canRemoveMember(requesterRole, target.role)) {
      throw new WorkspaceAccessDeniedError();
    }

    if (
      target.role === "OWNER" &&
      (await this.memberRepo.countOwners(workspaceId)) <= 1
    ) {
      throw new LastOwnerError();
    }

    await this.memberRepo.delete(memberId);
  };

  // LEAVE WORKSPACE — any member; owners need a successor owner first.
  leave = async (
    workspaceId: string,
    userId: string
  ): Promise<void> => {
    const { workspace, role } = await this.getRequesterRole(
      workspaceId,
      userId
    );
    if (!role) {
      throw new WorkspaceAccessDeniedError();
    }

    const isOwner =
      role === "OWNER" || workspace.ownerId === userId;

    if (!isOwner) {
      await this.memberRepo.deleteByWorkspaceAndUser(
        workspaceId,
        userId
      );
      return;
    }

    // Owner path: never leave the workspace without a valid owner.
    const owners = (
      (await this.memberRepo.findByWorkspace(
        workspaceId
      )) as unknown as MemberRow[]
    ).filter((m) => m.role === "OWNER" && m.userId !== userId);

    if (owners.length === 0) {
      throw new LastOwnerError();
    }

    const successor = owners[0] as MemberRow;
    await db.transaction(async (tx) => {
      const txWorkspaceRepo = new workspaceRepoClass(
        tx.orm.public.Workspace
      );
      const txMemberRepo = new memberRepoClass(
        tx.orm.public.Member,
        tx.orm.public.User
      );
      await txWorkspaceRepo.setOwner(workspaceId, successor.userId);
      await txMemberRepo.deleteByWorkspaceAndUser(
        workspaceId,
        userId
      );
    });
  };

  // TRANSFER OWNERSHIP — current owner only, atomic role transition.
  transferOwnership = async (
    workspaceId: string,
    targetUserId: string,
    requesterId: string
  ): Promise<MemberResponse> => {
    const { workspace, role } = await this.getRequesterRole(
      workspaceId,
      requesterId
    );
    if (role !== "OWNER") {
      throw new WorkspaceAccessDeniedError();
    }
    if (targetUserId === requesterId) {
      throw new HttpError(
        "Ownership is already yours.",
        400
      );
    }

    const target = (await this.memberRepo.findByWorkspaceAndUser(
      workspaceId,
      targetUserId
    )) as unknown as MemberRow | null;
    if (!target) {
      throw new WorkspaceMemberNotFoundError();
    }

    await this.ensureOwnerMembership(workspace);

    await db.transaction(async (tx) => {
      const txWorkspaceRepo = new workspaceRepoClass(
        tx.orm.public.Workspace
      );
      const txMemberRepo = new memberRepoClass(
        tx.orm.public.Member,
        tx.orm.public.User
      );
      await txWorkspaceRepo.setOwner(workspaceId, targetUserId);
      await txMemberRepo.updateRole(target.id, "OWNER");
      const requesterMembership =
        await txMemberRepo.findByWorkspaceAndUser(
          workspaceId,
          requesterId
        );
      if (requesterMembership) {
        await txMemberRepo.updateRole(
          (requesterMembership as unknown as MemberRow).id,
          "ADMIN"
        );
      }
    });

    const updated = (await this.memberRepo.findByWorkspaceAndUser(
      workspaceId,
      targetUserId
    )) as unknown as MemberRow | null;
    if (!updated) {
      throw new WorkspaceMemberNotFoundError();
    }
    const user = (await this.authRepo.findById(
      targetUserId
    )) as unknown as UserRow | null;
    return toMemberResponse(updated, user);
  };

  // ADD MEMBER (used by the invitation acceptance flow after its own
  // checks; guards the unique constraint precisely).
  addMember = async (
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ) => {
    try {
      return await this.memberRepo.create({
        workspaceId,
        userId,
        role,
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AlreadyWorkspaceMemberError();
      }
      throw err;
    }
  };
}
