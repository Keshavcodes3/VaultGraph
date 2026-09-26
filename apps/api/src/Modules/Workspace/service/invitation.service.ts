import type {
  CreateInvitationInput,
  CreateInvitationResponse,
  InvitationDetailsResponse,
  InvitationResponse,
  InvitationStatus,
  MemberResponse,
  WorkspaceRole,
} from "@repo/shared/workspace-types";
import { db } from "../../../prisma/db";
import { HttpError } from "../../../Shared/httpError";
import {
  daysFromNowInstant,
  instantToEpochMs,
  nowInstant,
  toISOStringSafe,
} from "../../../prisma/timestamps";
import { AuthRepository } from "../../auth/repositary/auth.repo";
import { workspaceRepoClass } from "../Repostiary/workspace.repositary";
import { memberRepoClass } from "../Repostiary/member.repositary";
import { invitationRepoClass } from "../Repostiary/invitation.repositary";
import {
  AlreadyWorkspaceMemberError,
  InvitationAlreadyAcceptedError,
  InvitationAlreadyExistsError,
  InvitationEmailMismatchError,
  InvitationExpiredError,
  InvitationNotFoundError,
  InvitationRejectedError,
  InvitationRevokedError,
  InvalidInvitationRoleError,
  WorkspaceAccessDeniedError,
  WorkspaceNotFoundError,
} from "../utils/workspace.errors";
import {
  INVITATION_EXPIRY_DAYS,
  INVITATION_RESEND_COOLDOWN_MS,
} from "../utils/workspace.constants";
import {
  canInviteAs,
  canManageWorkspace,
  generateInvitationToken,
  hashInvitationToken,
  isRevokedInvitationStatus,
  isTerminalInvitationStatus,
  normalizeInvitationEmail,
} from "../utils/invitation.utils";
import { sendWorkspaceInvitationEmail } from "./email.service";

const isUniqueViolation = (err: unknown) => {
  const e = err as { code?: string; sqlState?: string };
  return e?.code === "23505" || e?.sqlState === "23505";
};

type InviteRow = {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  invitedById: string | null;
  tokenHash: string | null;
  expiresAt: unknown;
  acceptedAt: unknown;
  revokedAt: unknown;
  createdAt: unknown;
  updatedAt: unknown;
};

type UserSummary = {
  id: string;
  username: string;
  email: string;
};

const toInvitationResponse = (
  invite: InviteRow,
  inviter: UserSummary | null
): InvitationResponse => ({
  id: invite.id,
  workspaceId: invite.workspaceId,
  email: invite.email,
  role: invite.role,
  status: invite.status,
  invitedById: invite.invitedById,
  invitedBy: inviter,
  expiresAt: toISOStringSafe(invite.expiresAt) as unknown as Date | null,
  acceptedAt: toISOStringSafe(invite.acceptedAt) as unknown as Date | null,
  revokedAt: toISOStringSafe(invite.revokedAt) as unknown as Date | null,
  createdAt: toISOStringSafe(invite.createdAt) as unknown as Date,
  updatedAt: toISOStringSafe(invite.updatedAt) as unknown as Date,
});

const acceptUrlFor = (token: string): string => {
  const origin =
    process.env["WEB_ORIGIN"] ?? "http://localhost:3000";
  return `${origin.replace(/\/$/, "")}/invitations/${token}`;
};

export class invitationServiceClass {
  constructor(
    private readonly invitationRepo: invitationRepoClass,
    private readonly memberRepo: memberRepoClass,
    private readonly workspaceRepo: workspaceRepoClass,
    private readonly authRepo: AuthRepository
  ) {}

  private getRequesterRole = async (
    workspaceId: string,
    userId: string
  ) => {
    const workspace =
      await this.workspaceRepo.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new WorkspaceNotFoundError();
    }
    if (workspace.ownerId === userId) {
      return { workspace, role: "OWNER" as WorkspaceRole };
    }
    const membership =
      await this.memberRepo.findByWorkspaceAndUser(
        workspaceId,
        userId
      );
    return {
      workspace,
      role: (membership?.role as WorkspaceRole | undefined) ?? null,
    };
  };

  private requireManager = async (
    workspaceId: string,
    userId: string
  ) => {
    const { workspace, role } = await this.getRequesterRole(
      workspaceId,
      userId
    );
    if (!role || !canManageWorkspace(role)) {
      throw new WorkspaceAccessDeniedError();
    }
    return { workspace, role };
  };

  private inviterSummary = async (
    invitedById: string | null
  ): Promise<UserSummary | null> => {
    if (!invitedById) return null;
    const user = await this.authRepo.findById(invitedById);
    if (!user) return null;
    return {
      id: user.id as string,
      username: user.username as string,
      email: user.email as string,
    };
  };

  private inviterSummaries = async (
    ids: (string | null)[]
  ): Promise<Map<string, UserSummary>> => {
    const unique = [...new Set(ids.filter((id): id is string => !!id))];
    const map = new Map<string, UserSummary>();
    if (unique.length === 0) return map;
    const users = await this.memberRepo.findUsersByIds(unique);
    for (const u of users) {
      map.set(u.id as string, {
        id: u.id as string,
        username: u.username as string,
        email: u.email as string,
      });
    }
    return map;
  };

  // True when the invitation can no longer be accepted due to time.
  // Legacy rows without an expiry are treated as expired.
  private isExpired = (invite: InviteRow): boolean => {
    if (invite.expiresAt === null || invite.expiresAt === undefined) {
      return true;
    }
    const ms = instantToEpochMs(invite.expiresAt);
    if (ms === null) return true;
    return ms < Date.now();
  };

  // Lazily close out a stale PENDING invitation so lists and details
  // always report a truthful status without needing a background worker.
  private expireIfStale = async (
    invite: InviteRow
  ): Promise<InviteRow> => {
    if (invite.status !== "PENDING" || !this.isExpired(invite)) {
      return invite;
    }
    const updated = await this.invitationRepo.updateStatus(invite.id, {
      status: "EXPIRED",
    });
    return (updated as unknown as InviteRow) ?? invite;
  };

  // CREATE INVITATION — OWNER/ADMIN only. Persists first, then delivers.
  create = async (
    workspaceId: string,
    data: CreateInvitationInput,
    requesterId: string
  ): Promise<CreateInvitationResponse> => {
    const { workspace, role: requesterRole } =
      await this.requireManager(workspaceId, requesterId);

    const email = normalizeInvitationEmail(data.email);
    const role = data.role ?? "MEMBER";

    if (!canInviteAs(requesterRole, role)) {
      throw new InvalidInvitationRoleError();
    }

    // Already a member → clear conflict, no duplicate invite.
    const existingUser = await this.authRepo.findByEmail(email);
    if (existingUser) {
      const membership =
        await this.memberRepo.findByWorkspaceAndUser(
          workspaceId,
          existingUser.id as string
        );
      if (membership || (workspace.ownerId as string) === (existingUser.id as string)) {
        throw new AlreadyWorkspaceMemberError();
      }
    }

    // Duplicate-guard: one live invitation per workspace+email.
    const existing = (await this.invitationRepo.findByWorkspaceAndEmail(
      workspaceId,
      email
    )) as unknown as InviteRow | null;
    if (existing) {
      if (existing.status === "PENDING" && !this.isExpired(existing)) {
        throw new InvitationAlreadyExistsError();
      }
      // Terminal or stale rows are recycled so a removed member can be
      // re-invited without violating @@unique([workspaceId, email]).
      await this.invitationRepo.delete(existing.id);
    }

    const token = generateInvitationToken();
    const invite = (await (async () => {
      try {
        return await this.invitationRepo.create({
          workspaceId,
          email,
          role,
          invitedById: requesterId,
          tokenHash: hashInvitationToken(token),
          expiresAt: daysFromNowInstant(INVITATION_EXPIRY_DAYS),
        });
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new InvitationAlreadyExistsError();
        }
        throw err;
      }
    })()) as unknown as InviteRow;

    const acceptUrl = acceptUrlFor(token);
    const requester = await this.authRepo.findById(requesterId);
    const emailResult = await sendWorkspaceInvitationEmail({
      to: email,
      workspaceName: workspace.name as string,
      inviterName: (requester?.username as string) ?? "A teammate",
      role,
      acceptUrl,
      expiresAtISO: toISOStringSafe(invite.expiresAt),
    });

    return {
      invitation: toInvitationResponse(
        invite,
        await this.inviterSummary(invite.invitedById)
      ),
      token,
      acceptUrl,
      emailSent: emailResult.sent,
    };
  };

  // LIST INVITATIONS — OWNER/ADMIN only, optional status filter.
  list = async (
    workspaceId: string,
    requesterId: string,
    status?: InvitationStatus
  ): Promise<InvitationResponse[]> => {
    await this.requireManager(workspaceId, requesterId);

    const rows = (
      status
        ? await this.invitationRepo.findByWorkspaceAndStatus(
            workspaceId,
            status
          )
        : await this.invitationRepo.findByWorkspace(workspaceId)
    ) as unknown as InviteRow[];

    // Lazily close out stale rows so the list never shows a PENDING
    // invitation that can no longer be accepted.
    const fresh: InviteRow[] = [];
    for (const row of rows) {
      fresh.push(await this.expireIfStale(row));
    }

    const inviters = await this.inviterSummaries(
      fresh.map((r) => r.invitedById)
    );
    return fresh.map((r) =>
      toInvitationResponse(
        r,
        r.invitedById ? (inviters.get(r.invitedById) ?? null) : null
      )
    );
  };

  // INVITATION DETAILS — public (powers the accept page for guests).
  // Safe fields only: never the token hash or sensitive user data.
  details = async (
    token: string
  ): Promise<InvitationDetailsResponse> => {
    this.assertTokenShape(token);
    const invite = (await this.invitationRepo.findByTokenHash(
      hashInvitationToken(token)
    )) as unknown as InviteRow | null;
    if (!invite) {
      throw new InvitationNotFoundError();
    }

    const live = await this.expireIfStale(invite);
    const workspace = await this.workspaceRepo.getWorkspaceById(
      live.workspaceId
    );
    if (!workspace) {
      throw new InvitationNotFoundError();
    }
    const inviter = await this.inviterSummary(live.invitedById);

    return {
      workspace: {
        id: workspace.id as string,
        name: workspace.name as string,
      },
      invitedBy: inviter ? { name: inviter.username } : null,
      email: live.email,
      role: live.role,
      status: live.status,
      expiresAt: toISOStringSafe(
        live.expiresAt
      ) as unknown as Date | null,
    };
  };

  // ACCEPT INVITATION — atomic membership creation + status transition.
  accept = async (
    token: string,
    userId: string
  ): Promise<{ member: MemberResponse; workspace: { id: string; name: string; slug: string } }> => {
    this.assertTokenShape(token);
    const invite = (await this.invitationRepo.findByTokenHash(
      hashInvitationToken(token)
    )) as unknown as InviteRow | null;
    if (!invite) {
      throw new InvitationNotFoundError();
    }

    this.assertAcceptableState(invite);

    if (invite.status === "PENDING" && this.isExpired(invite)) {
      await this.invitationRepo.updateStatus(invite.id, {
        status: "EXPIRED",
      });
      throw new InvitationExpiredError();
    }

    const authUser = await this.authRepo.findById(userId);
    if (!authUser) {
      throw new HttpError("User not found", 401);
    }
    const user = {
      id: authUser.id as string,
      email: authUser.email as string,
    };

    if (
      normalizeInvitationEmail(user.email) !==
      normalizeInvitationEmail(invite.email)
    ) {
      throw new InvitationEmailMismatchError();
    }

    const workspace = await this.workspaceRepo.getWorkspaceById(
      invite.workspaceId
    );
    if (!workspace) {
      throw new InvitationNotFoundError();
    }

    try {
      await db.transaction(async (tx) => {
        const txInviteRepo = new invitationRepoClass(
          tx.orm.public.Invite
        );
        const txMemberRepo = new memberRepoClass(
          tx.orm.public.Member,
          tx.orm.public.User
        );

        // Re-read inside the transaction: a concurrent acceptance wins
        // here and the loser gets the precise "already accepted" error
        // instead of a misleading membership conflict.
        const fresh = (await txInviteRepo.findById(
          invite.id
        )) as unknown as InviteRow | null;
        if (!fresh) {
          throw new InvitationNotFoundError();
        }
        this.assertAcceptableState(fresh);
        if (this.isExpired(fresh)) {
          await txInviteRepo.updateStatus(fresh.id, {
            status: "EXPIRED",
          });
          throw new InvitationExpiredError();
        }

        const already =
          await txMemberRepo.findByWorkspaceAndUser(
            fresh.workspaceId,
            user.id
          );
        if (already) {
          throw new AlreadyWorkspaceMemberError();
        }

        await txMemberRepo.create({
          workspaceId: fresh.workspaceId,
          userId: user.id,
          role: fresh.role,
        });
        await txInviteRepo.updateStatus(fresh.id, {
          status: "ACCEPTED",
          acceptedAt: nowInstant(),
        });
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        // Lost a membership race with another writer: report precisely.
        const current = (await this.invitationRepo.findById(
          invite.id
        )) as unknown as InviteRow | null;
        if (current?.status === "ACCEPTED") {
          throw new InvitationAlreadyAcceptedError();
        }
        throw new AlreadyWorkspaceMemberError();
      }
      throw err;
    }

    const member = (await this.memberRepo.findByWorkspaceAndUser(
      invite.workspaceId,
      user.id
    )) as unknown as {
      id: string;
      workspaceId: string;
      userId: string;
      role: WorkspaceRole;
      createdAt: unknown;
      updatedAt: unknown;
    } | null;
    if (!member) {
      throw new InvitationNotFoundError();
    }
    const memberUser = (await this.authRepo.findById(user.id)) as unknown as
      | UserSummary
      | null;

    return {
      member: {
        id: member.id,
        workspaceId: member.workspaceId,
        userId: member.userId,
        role: member.role,
        createdAt: toISOStringSafe(
          member.createdAt
        ) as unknown as Date,
        updatedAt: toISOStringSafe(
          member.updatedAt
        ) as unknown as Date,
        user: memberUser
          ? {
              id: memberUser.id,
              username: memberUser.username,
              email: memberUser.email,
            }
          : { id: user.id, username: "", email: user.email },
      },
      workspace: {
        id: workspace.id as string,
        name: workspace.name as string,
        slug: workspace.slug as string,
      },
    };
  };

  // REJECT INVITATION — the invitee declines; the token dies with it.
  reject = async (
    token: string,
    userId: string
  ): Promise<InvitationResponse> => {
    this.assertTokenShape(token);
    const invite = (await this.invitationRepo.findByTokenHash(
      hashInvitationToken(token)
    )) as unknown as InviteRow | null;
    if (!invite) {
      throw new InvitationNotFoundError();
    }

    this.assertAcceptableState(invite);

    if (this.isExpired(invite)) {
      await this.invitationRepo.updateStatus(invite.id, {
        status: "EXPIRED",
      });
      throw new InvitationExpiredError();
    }

    const authUser = await this.authRepo.findById(userId);
    if (!authUser) {
      throw new HttpError("User not found", 401);
    }
    const user = {
      id: authUser.id as string,
      email: authUser.email as string,
    };

    if (
      normalizeInvitationEmail(user.email) !==
      normalizeInvitationEmail(invite.email)
    ) {
      throw new InvitationEmailMismatchError();
    }

    const updated = (await this.invitationRepo.updateStatus(invite.id, {
      status: "REJECTED",
    })) as unknown as InviteRow | null;
    if (!updated) {
      throw new InvitationNotFoundError();
    }
    return toInvitationResponse(
      updated,
      await this.inviterSummary(updated.invitedById)
    );
  };

  // REVOKE INVITATION — OWNER/ADMIN only; pending tokens die immediately.
  revoke = async (
    workspaceId: string,
    invitationId: string,
    requesterId: string
  ): Promise<InvitationResponse> => {
    await this.requireManager(workspaceId, requesterId);

    const invite = (await this.invitationRepo.findById(
      invitationId
    )) as unknown as InviteRow | null;
    if (!invite || invite.workspaceId !== workspaceId) {
      throw new InvitationNotFoundError();
    }

    if (invite.status === "ACCEPTED") {
      throw new InvitationAlreadyAcceptedError();
    }
    if (isRevokedInvitationStatus(invite.status)) {
      throw new InvitationRevokedError();
    }
    if (invite.status === "REJECTED") {
      throw new InvitationRejectedError();
    }
    if (invite.status === "EXPIRED" || this.isExpired(invite)) {
      if (invite.status === "PENDING") {
        await this.invitationRepo.updateStatus(invite.id, {
          status: "EXPIRED",
        });
      }
      throw new InvitationExpiredError();
    }

    const updated = (await this.invitationRepo.updateStatus(invite.id, {
      status: "REVOKED",
      revokedAt: nowInstant(),
    })) as unknown as InviteRow | null;
    if (!updated) {
      throw new InvitationNotFoundError();
    }
    return toInvitationResponse(
      updated,
      await this.inviterSummary(updated.invitedById)
    );
  };

  // RESEND INVITATION — OWNER/ADMIN only. Rotates the token, extends the
  // expiry, and re-delivers. No duplicate records; resends are cooled down.
  resend = async (
    workspaceId: string,
    invitationId: string,
    requesterId: string
  ): Promise<CreateInvitationResponse> => {
    const { workspace } = await this.requireManager(
      workspaceId,
      requesterId
    );

    const invite = (await this.invitationRepo.findById(
      invitationId
    )) as unknown as InviteRow | null;
    if (!invite || invite.workspaceId !== workspaceId) {
      throw new InvitationNotFoundError();
    }
    if (invite.status === "ACCEPTED") {
      throw new InvitationAlreadyAcceptedError();
    }
    if (
      isRevokedInvitationStatus(invite.status) ||
      invite.status === "REJECTED"
    ) {
      throw new InvitationRevokedError(
        "This invitation can no longer be resent."
      );
    }
    if (
      invite.status !== "PENDING" &&
      invite.status !== "EXPIRED"
    ) {
      throw new InvitationRevokedError(
        "This invitation can no longer be resent."
      );
    }

    // Abuse guard: at most one resend per cooldown window. updatedAt moves
    // on every resend, so it doubles as the last-sent marker.
    const lastSentMs = instantToEpochMs(invite.updatedAt) ?? 0;
    if (
      invite.tokenHash &&
      Date.now() - lastSentMs < INVITATION_RESEND_COOLDOWN_MS
    ) {
      throw new HttpError(
        "This invitation was just sent. Please wait a minute before resending.",
        429
      );
    }

    const token = generateInvitationToken();
    const updated = (await this.invitationRepo.rotateToken(invite.id, {
      tokenHash: hashInvitationToken(token),
      expiresAt: daysFromNowInstant(INVITATION_EXPIRY_DAYS),
    })) as unknown as InviteRow | null;
    if (!updated) {
      throw new InvitationNotFoundError();
    }

    const acceptUrl = acceptUrlFor(token);
    const requester = await this.authRepo.findById(requesterId);
    const emailResult = await sendWorkspaceInvitationEmail({
      to: updated.email,
      workspaceName: workspace.name as string,
      inviterName: (requester?.username as string) ?? "A teammate",
      role: updated.role,
      acceptUrl,
      expiresAtISO: toISOStringSafe(updated.expiresAt),
    });

    return {
      invitation: toInvitationResponse(
        updated,
        await this.inviterSummary(updated.invitedById)
      ),
      token,
      acceptUrl,
      emailSent: emailResult.sent,
    };
  };

  private assertTokenShape = (token: unknown): void => {
    // Raw tokens are 32 random bytes encoded as base64url (43 chars).
    // Reject malformed links with a clear 400 instead of a 404 lookup.
    if (
      typeof token !== "string" ||
      token.length < 20 ||
      token.length > 128 ||
      !/^[A-Za-z0-9_-]+$/.test(token)
    ) {
      throw new HttpError("This invitation link is invalid.", 400);
    }
  };

  private assertAcceptableState = (invite: InviteRow): void => {
    if (invite.status === "ACCEPTED") {
      throw new InvitationAlreadyAcceptedError();
    }
    if (invite.status === "REJECTED") {
      throw new InvitationRejectedError();
    }
    if (isRevokedInvitationStatus(invite.status)) {
      throw new InvitationRevokedError();
    }
    if (invite.status === "EXPIRED") {
      throw new InvitationExpiredError();
    }
    if (
      invite.status !== "PENDING" &&
      isTerminalInvitationStatus(invite.status)
    ) {
      throw new InvitationRevokedError();
    }
  };
}
